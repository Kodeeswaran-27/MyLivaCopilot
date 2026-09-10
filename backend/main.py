import os
import re
import sys
import uuid
import base64
import httpx
import asyncio
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os
import traceback
from dotenv import load_dotenv, find_dotenv

# Load secrets from .env file (automatically finds it in the parent directory)
# load_dotenv(find_dotenv())
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
# Fix Windows console encoding for emoji/unicode characters
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def clean_text(text: str) -> str:
    """Remove HTML tags and encode-safe the text before sending to ServiceNow."""
    if not text:
        return ""
    # Remove HTML tags (bot responses often contain <b>, <br>, etc)
    text = re.sub(r'<[^>]+>', '', text)
    # Remove markdown bold/italic
    text = re.sub(r'[*_]{1,2}([^*_]+)[*_]{1,2}', r'\1', text)
    # Encode to ascii replacing un-encodable chars (emoji) with '?'
    text = text.encode('ascii', errors='replace').decode('ascii')
    return text.strip()

app = FastAPI()

# FIXED: allow_credentials=True combined with allow_origins=["*"] causes a CORS crash in FastAPI.
# Setting allow_credentials=False fixes the "Failed to fetch" error in the frontend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False, 
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for session states
# Map of sessionId -> { "mode": "bot" | "agent", "conversationId": str, "watermark": str, "history": list, "agent_messages": list }
sessions = {}

class ChatRequest(BaseModel):
    sessionId: str
    text: str
    config: Optional[Dict[str, Any]] = None
    history: Optional[list] = None

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    session_id = request.sessionId
    text = request.text
    config = request.config or {}
    
    # Merge secrets from .env if the frontend did not provide them
    config["directLineSecret"] = config.get("directLineSecret") or os.getenv("COPILOT_SECRET", "")
    config["instanceName"] = config.get("instanceName") or os.getenv("SN_INSTANCE", "")
    config["botId"] = config.get("botId") or os.getenv("SN_BOT_ID", "")
    config["username"] = config.get("username") or os.getenv("SN_USERNAME", "")
    config["password"] = config.get("password") or os.getenv("SN_PASSWORD", "")
    config["queueSysId"] = config.get("queueSysId") or os.getenv("SN_QUEUE", "")
    config["groupSysId"] = config.get("groupSysId") or os.getenv("SN_GROUP", "")
    config["requesterEmail"] = config.get("requesterEmail") or os.getenv("SN_REQUESTER_EMAIL", "guest@example.com")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="sessionId is required")
        
    if session_id not in sessions:
        sessions[session_id] = {
            "mode": "bot",
            "conversationId": None,
            "watermark": None,
            "history": [],
            "agent_messages": [],
            "config": {}
        }
    
    session = sessions[session_id]
    # Always update config so latest credentials are used
    if config:
        session["config"] = config
    
    # If Node.js provided history from SQLite, override the local memory history
    if request.history:
        session["history"] = request.history
    else:
        session["history"].append({"sender": "user", "text": text})
    
    # Check if user is requesting handoff
    handoff_keywords = ['agent', 'human', 'handoff', 'speak to live agent', 'liveagent']
    is_handoff_req = text and any(kw in text.lower() for kw in handoff_keywords)
    
    if is_handoff_req and session["mode"] != "agent":
        print(f"[Session {session_id}] Triggering handoff to ServiceNow...")
        session["mode"] = "agent"
        
        try:
            sn_response = await trigger_servicenow_handoff(session_id, session["conversationId"], session["history"], config)
            if sn_response.get("sn_session_id"):
                session["sn_session_id"] = sn_response["sn_session_id"]
            sys_msg = "✅ Remote handoff intercepted. ServiceNow Live Agent request created. Please wait for an agent to connect..."
            
            if sn_response.get("interaction_number"):
                sys_msg += f"\n**Interaction Number:** {sn_response['interaction_number']}"
                
            if sn_response.get("interaction_sys_id"):
                session["interaction_sys_id"] = sn_response["interaction_sys_id"]
                
            session["history"].append({"sender": "system", "text": sys_msg})
            return {
                "success": True,
                "mode": "agent",
                "messages": [{"text": sys_msg, "sender": "system"}],
                "snData": sn_response
            }
        except Exception as e:
            print(f"\n[CRITICAL ERROR] ServiceNow Handoff Failed:")
            print(traceback.format_exc())
            print(f"[END CRITICAL ERROR]\n")
            # If handoff fails, revert mode back to bot so they aren't stuck
            session["mode"] = "bot"
            raise HTTPException(status_code=500, detail=f"Failed to contact ServiceNow: {str(e)}")
    
    if session["mode"] == "bot":
        dl_secret = config.get("directLineSecret")
        if not dl_secret:
            await asyncio.sleep(1.5)
            mock_text = "Hello there! I'm operating in mock mode because no Direct Line Secret was provided! You can ask for a handoff anytime by saying 'speak to live agent'."
            session["history"].append({"sender": "bot", "text": mock_text})
            return {
                "success": True,
                "mode": "bot",
                "messages": [{"text": mock_text, "sender": "bot"}]
            }

        # Otherwise do actual direct line flow
        if not session["conversationId"]:
            try:
                init_bot_res = await start_copilot_conversation(dl_secret)
                if not init_bot_res or "conversationId" not in init_bot_res:
                    raise HTTPException(status_code=500, detail="Failed to connect to Microsoft Copilot")
                session["conversationId"] = init_bot_res["conversationId"]
            except httpx.HTTPStatusError as exc:
                print(f"Copilot Auth Error: {exc}")
                raise HTTPException(status_code=401, detail="Invalid Microsoft Copilot Direct Line Secret.")
            
        try:
            await send_copilot_message(session["conversationId"], dl_secret, text)
            
            # Robust Polling: loop up to 4 times (6 seconds max) to wait for a reply
            bot_messages = []
            for _ in range(4):
                await asyncio.sleep(1.5)
                replies = await poll_copilot_replies(session["conversationId"], dl_secret, session["watermark"])
                if "watermark" in replies:
                    session["watermark"] = replies["watermark"]
                    
                new_msgs = [
                    {"text": a["text"], "sender": "bot"} 
                    for a in replies.get("activities", []) 
                    if a.get("from", {}).get("role") == "bot" and a.get("type") == "message" and "text" in a
                ]
                if new_msgs:
                    bot_messages.extend(new_msgs)
                    break # Got the reply, stop polling!
            
            for m in bot_messages:
                session["history"].append(m)
                
            return {
                "success": True,
                "mode": "bot",
                "messages": bot_messages
            }
        except Exception as e:
            print(f"Copilot Error: {e}")
            raise HTTPException(status_code=500, detail="Failed to send/receive message from Copilot.")
            
    elif session["mode"] == "agent":
        # User sent a message to the agent after handoff
        print(f"[Session {session_id}] Sending message to live agent (Webhook/REST required)...")
        try:
            sn_session_id = session.get("sn_session_id", session_id)
            await send_message_to_servicenow_agent(sn_session_id, session["conversationId"], text, config)
            return {
                "success": True,
                "mode": "agent",
                "messages": [] # We don't return mock message anymore, we wait for agent webhook!
            }
        except Exception as e:
            print(f"SN Agent Msg Error: {e}")
            raise HTTPException(status_code=500, detail="Failed to send message to SN Agent")


@app.get("/api/poll/{session_id}")
async def poll_agent_messages(session_id: str):
    if session_id not in sessions:
        return {"success": False, "messages": []}
        
    session = sessions[session_id]
    queued = session["agent_messages"]
    session["agent_messages"] = [] # Clear the queue
    
    # --- DATABASE API POLLING ARCHITECTURE ---
    if session["mode"] == "agent" and session.get("interaction_sys_id") and not queued:
        config = session.get("config", {})
        sn_instance = config.get("instanceName")
        username = config.get("username")
        password = config.get("password")
        requester_email = config.get("requesterEmail", "guest@example.com").lower()
        
        if sn_instance and username and password:
            credentials = f"{username}:{password}"
            base64_credentials = base64.b64encode(credentials.encode('utf-8')).decode('ascii')
            headers = {"Authorization": f"Basic {base64_credentials}", "Accept": "application/json"}
            
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    # 1. Fetch conversation ID from the interaction
                    if "sn_conversation_id" not in session:
                        int_url = f"https://{sn_instance}.service-now.com/api/now/table/interaction/{session['interaction_sys_id']}"
                        int_res = await client.get(int_url, headers=headers)
                        print(f"[POLL] Interaction Fetch Status: {int_res.status_code}")
                        if int_res.is_success:
                            cmd = int_res.json().get("result", {}).get("channel_metadata_document")
                            if cmd:
                                if isinstance(cmd, dict):
                                    session["sn_conversation_id"] = cmd.get("value")
                                else:
                                    session["sn_conversation_id"] = str(cmd)
                                print(f"[POLL] Found Conversation ID: {session['sn_conversation_id']}")
                            else:
                                print("[POLL] channel_metadata_document is empty!")
                        else:
                            print(f"[POLL] Error fetching interaction: {int_res.text}")
                                
                    # 2. Fetch messages for this conversation
                    if session.get("sn_conversation_id"):
                        msg_url = f"https://{sn_instance}.service-now.com/api/now/table/sys_cs_message?sysparm_query=conversation={session['sn_conversation_id']}^ORDERBYsys_created_on"
                        msg_res = await client.get(msg_url, headers=headers)
                        if msg_res.is_success:
                            msgs = msg_res.json().get("result", [])
                            print(f"[POLL] Found {len(msgs)} messages in sys_cs_message.")
                            
                            seen_msgs = session.get("seen_sn_messages", set())
                            if "seen_sn_messages" not in session:
                                session["seen_sn_messages"] = seen_msgs
                                
                            for m in msgs:
                                msg_sys_id = m.get("sys_id")
                                created_by = str(m.get("sys_created_by", "")).lower()
                                
                                # Skip messages we've already processed
                                if msg_sys_id not in seen_msgs:
                                    seen_msgs.add(msg_sys_id)
                                    print(f"[POLL] New message from: {created_by}")
                                    
                                    # Skip our own messages (from the bot/guest side)
                                    if created_by not in [requester_email, "guest", "system"]:
                                        payload_str = m.get("payload", "{}")
                                        text = ""
                                        
                                        # Use robust JSON parsing to extract the text
                                        import json
                                        try:
                                            p_json = json.loads(payload_str)
                                            if "message" in p_json and "text" in p_json["message"]:
                                                text = p_json["message"]["text"]
                                            elif "text" in p_json:
                                                text = p_json["text"]
                                            elif "typedText" in p_json:
                                                text = p_json["typedText"]
                                        except Exception:
                                            # If it's not JSON, it is the raw literal text typed by the agent!
                                            if not payload_str.strip().startswith("{"):
                                                text = payload_str
                                            else:
                                                # Fallback regex just in case it is malformed JSON
                                                import re
                                                match = re.search(r'"text"\s*:\s*"([^"]+)"', payload_str)
                                                if match:
                                                    text = match.group(1)
                                                
                                        if text:
                                            # Clean escaped newlines
                                            text = text.replace("\\n", "\n")
                                            print(f"[POLL] Extracted text: {text}")
                                            queued.append({"sender": "agent", "text": text})
                                            session["history"].append({"sender": "agent", "text": text})
                                        else:
                                            print(f"[POLL] Could not extract text from payload (probably a system event): {payload_str}")
                        else:
                            print(f"[POLL] Error fetching messages: {msg_res.text}")
            except Exception as e:
                print(f"[Polling Error] {e}")

    return {
        "success": True,
        "messages": queued
    }


@app.post("/api/sn-webhook")
async def servicenow_webhook(request: Request):
    payload = await request.json()
    print("Received Webhook from SN:", payload)
    
    # Extract clientSessionId which maps to our session_id
    session_id = payload.get("clientSessionId")
    if not session_id:
        return {"status": "ignored"}
    
    # Strip handoff suffix if present
    if "_handoff_" in session_id:
        session_id = session_id.split("_handoff_")[0]
        
    if session_id not in sessions:
        return {"status": "ignored"}
        
    msg_obj = payload.get("message", {})
    text = msg_obj.get("text", "")
    
    if text:
        sessions[session_id]["agent_messages"].append({
            "text": text,
            "sender": "agent"
        })
        sessions[session_id]["history"].append({"sender": "agent", "text": text})
        
    return {"status": "ok"}


@app.get("/api/debug-config/{session_id}")
async def debug_config(session_id: str):
    """Debug endpoint to check what config is stored for a session."""
    if session_id not in sessions:
        return {"error": "Session not found", "available_sessions": list(sessions.keys())}
    s = sessions[session_id]
    cfg = s.get("config", {})
    return {
        "mode": s.get("mode"),
        "conversationId": s.get("conversationId"),
        "config_keys_present": list(cfg.keys()),
        "instanceName": cfg.get("instanceName"),
        "botId": cfg.get("botId"),
        "username": cfg.get("username"),
        "password_length": len(cfg.get("password", "")),
        "queueSysId": cfg.get("queueSysId"),
        "groupSysId": cfg.get("groupSysId"),
    }


async def start_copilot_conversation(secret):
    url = "https://directline.botframework.com/v3/directline/conversations"
    headers = {"Authorization": f"Bearer {secret}"}
    async with httpx.AsyncClient() as client:
        res = await client.post(url, headers=headers)
        res.raise_for_status()
        return res.json()


async def send_copilot_message(conversation_id, secret, text):
    url = f"https://directline.botframework.com/v3/directline/conversations/{conversation_id}/activities"
    headers = {
        "Authorization": f"Bearer {secret}",
        "Content-Type": "application/json"
    }
    payload = {
        "type": "message",
        "from": {"id": f"user_{uuid.uuid4()}"},
        "text": text
    }
    async with httpx.AsyncClient() as client:
        res = await client.post(url, headers=headers, json=payload)
        res.raise_for_status()


async def poll_copilot_replies(conversation_id, secret, watermark=None):
    url = f"https://directline.botframework.com/v3/directline/conversations/{conversation_id}/activities"
    if watermark:
        url += f"?watermark={watermark}"
    headers = {"Authorization": f"Bearer {secret}"}
    
    async with httpx.AsyncClient() as client:
        res = await client.get(url, headers=headers)
        res.raise_for_status()
        return res.json()


async def trigger_servicenow_handoff(session_id, copilot_session_id, history, config):
    sn_instance = config.get("instanceName", "").strip()
    bot_id = config.get("botId", "").strip()
    username = config.get("username", "").strip()
    password = config.get("password", "").strip()
    
    if not sn_instance or not bot_id or not username or not password:
        raise Exception("Missing ServiceNow credentials.")
    
    bot_id = bot_id.rstrip('.').strip()
    url = f"https://{sn_instance}.service-now.com/api/sn_va_as_service/bot/integration"
    credentials = f"{username}:{password}"
    base64_credentials = base64.b64encode(credentials.encode('utf-8')).decode('ascii')
    
    headers = {
        "Authorization": f"Basic {base64_credentials}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    history_lines = []
    for m in history:
        # Support both 'sender' (Python format) and 'role' (Node.js/SQLite format)
        sender_val = m.get('sender') or m.get('role', 'user')
        sender_name = "User" if sender_val == 'user' else "Bot"
        clean = clean_text(m.get('text', ''))
        if clean:
            history_lines.append(f"{sender_name}: {clean}")
    
    history_str = "\n".join(history_lines) if history_lines else "No prior conversation."
    handoff_text = f"User requested a live agent.\n\n--- Chat History ---\n{history_str}\n--- End ---"
    
    requester_email = config.get("requesterEmail", "guest@example.com").strip()
    sn_session_id = f"{session_id}_handoff_{uuid.uuid4().hex[:8]}"
    
    # Use START_CONVERSATION and bundle the history message directly inside it!
    start_payload = {
        "requestId": str(uuid.uuid4()),
        "clientSessionId": sn_session_id,
        "clientMessageId": str(uuid.uuid4()),
        "appInboundId": bot_id,
        "userId": requester_email,
        "emailId": requester_email,
        "firstName": requester_email.split("@")[0].capitalize(),
        "action": "START_CONVERSATION",
        "message": {
            "text": handoff_text,
            "typed": True
        }
    }
    
    has_queue = config.get("queueSysId", "").strip()
    
    start_payload["contextVariables"] = {
        "live_agent_only": "true"
    }
    if has_queue:
        start_payload["contextVariables"]["LiveAgent_queue"] = has_queue
        
    print(f"[SN Handoff] Starting VA Conversation: {url} with Session ID: {sn_session_id}")
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Step 1: Start Conversation & Pass History simultaneously
        res1 = await client.post(url, headers=headers, json=start_payload)
        res1_data = res1.json() if res1.is_success else {}
        if not res1.is_success or res1_data.get("status") == "failure":
            err_msg = res1.text
            print(f"[SN Handoff] START failed: {err_msg}")
            if "Failed to add request to queue" in err_msg:
                raise Exception(f"ServiceNow AWA Error: No agents available OR Requester is the same as the Agent. You cannot route a chat to yourself. Make sure an agent is 'Available' in ServiceNow Agent Workspace. SN Response: {err_msg}")
            raise Exception(f"ServiceNow rejected request: {err_msg}")
            
        interaction_number = None
        interaction_sys_id = None
        try:
            # Wait 5 seconds to ensure ServiceNow AWA creates the interaction
            await asyncio.sleep(5)
            # Fetch the Chat interaction we just created
            interaction_url = f"https://{sn_instance}.service-now.com/api/now/table/interaction?sysparm_limit=1&sysparm_query=type=chat^ORDERBYDESCsys_created_on"
            res_int = await client.get(interaction_url, headers=headers)
            if res_int.is_success:
                interactions = res_int.json().get("result", [])
                if interactions:
                    interaction_number = interactions[0].get("number")
                    interaction_sys_id = interactions[0].get("sys_id")
                    print(f"[SN Handoff] Fetched latest Interaction: {interaction_number} ({interaction_sys_id})")
        except Exception as e:
            print(f"[SN Handoff] Could not fetch interaction: {e}")
            
        return {"status": "success", "interaction_number": interaction_number, "interaction_sys_id": interaction_sys_id, "sn_session_id": sn_session_id}

async def send_message_to_servicenow_agent(sn_session_id, copilot_session_id, text, config):
    sn_instance = config.get("instanceName", "")
    url = f"https://{sn_instance}.service-now.com/api/sn_va_as_service/bot/integration"
    
    import base64
    credentials = f"{config.get('username')}:{config.get('password')}"
    base64_credentials = base64.b64encode(credentials.encode()).decode()
    
    headers = {
        "Authorization": f"Basic {base64_credentials}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    payload = {
        "requestId": str(uuid.uuid4()),
        "clientSessionId": sn_session_id,
        "clientMessageId": str(uuid.uuid4()),
        "appInboundId": config.get("botId"),
        "userId": config.get("requesterEmail", "guest@example.com").strip(),
        "emailId": config.get("requesterEmail", "guest@example.com").strip(),
        "message": {
            "text": text,
            "typed": True
        }
    }
    
    async with httpx.AsyncClient() as client:
        res = await client.post(url, headers=headers, json=payload)
        if not res.is_success:
            err_text = res.text
            raise Exception(f"SN Error {res.status_code}: {err_text}")
        return res.json()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// In-memory store for session states
// Map of sessionId -> { mode: 'bot' | 'agent', conversationId: string, watermark: string }
const sessions = {};

// POST endpoint to handle incoming chat messages from our Custom UI
app.post('/api/chat', async (req, res) => {
    const { sessionId, text } = req.body;
    
    if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
    }

    // Initialize session if it doesn't exist
    if (!sessions[sessionId]) {
        sessions[sessionId] = {
            mode: 'bot',
            conversationId: null,
            watermark: null
        };
    }

    const session = sessions[sessionId];

    // Check if the user is requesting handoff
    const handoffKeywords = ['agent', 'human', 'handoff', 'speak to live agent'];
    const isHandoffReq = text && handoffKeywords.some(kw => text.toLowerCase().includes(kw));

    if (isHandoffReq && session.mode === 'bot') {
        // TRIGGER SERVICENOW HANDOFF
        console.log(`[Session ${sessionId}] Triggering handoff to ServiceNow...`);
        session.mode = 'agent';
        
        try {
            const snResponse = await triggerServiceNowHandoff(sessionId, session.conversationId);
            return res.json({
                success: true,
                mode: 'agent',
                messages: [{
                    text: '✅ Ticket created in ServiceNow Queue! Please wait for a live agent to accept the chat.',
                    sender: 'system'
                }],
                snData: snResponse
            });
        } catch (error) {
            console.error('ServiceNow Handoff Error:', error);
            return res.status(500).json({ error: 'Failed to contact ServiceNow' });
        }
    }

    // We only reach here if normal routing
    if (session.mode === 'bot') {
        // Route to Copilot
        if (!session.conversationId) {
            // Start a new bot conversation
            const initBotRes = await startCopilotConversation();
            if (!initBotRes || !initBotRes.conversationId) {
                return res.status(500).json({ error: 'Failed to connect to Microsoft Copilot' });
            }
            session.conversationId = initBotRes.conversationId;
        }

        try {
            await sendCopilotMessage(session.conversationId, text);
            // We wait a brief moment for the bot to generate a reply
            await new Promise(r => setTimeout(r, 1500)); 
            
            const replies = await pollCopilotReplies(session.conversationId, session.watermark);
            session.watermark = replies.watermark;
            
            const botMessages = replies.activities
                .filter(a => a.from.role === 'bot' && a.type === 'message' && a.text)
                .map(a => ({ text: a.text, sender: 'bot' }));

            return res.json({
                success: true,
                mode: 'bot',
                messages: botMessages
                // Note: The UI can also implement long-polling independently if preferred,
                // but for this starter, we return the immediate synchronous replies here.
            });
        } catch (error) {
            console.error('Copilot Error:', error);
            return res.status(500).json({ error: 'Failed to send message to Copilot' });
        }

    } else if (session.mode === 'agent') {
        // User is currently chatting with a live agent.
        // Send message to ServiceNow Live Agent. Wait for webhook response...
        console.log(`[Session ${sessionId}] Sending message to live agent...`);
        // Normally you'd send this to the specific ServiceNow async message endpoint
        // For starter code, we will mock the agent response to prove the UI works.
        const mockAgentReply = "Support Agent (Mock Response): I received your message: " + text;

        return res.json({
            success: true,
            mode: 'agent',
            messages: [{ text: mockAgentReply, sender: 'agent' }]
        });
    }
});


// HELPER: Start Copilot direct line conversation
async function startCopilotConversation() {
    const url = 'https://directline.botframework.com/v3/directline/conversations';
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.COPILOT_SECRET}`
        }
    });
    return await res.json();
}

// HELPER: Send message to Copilot
async function sendCopilotMessage(conversationId, text) {
    const url = `https://directline.botframework.com/v3/directline/conversations/${conversationId}/activities`;
    await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.COPILOT_SECRET}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            type: 'message',
            from: { id: 'user_' + uuidv4() },
            text: text
        })
    });
}

// HELPER: Poll replies from Copilot
async function pollCopilotReplies(conversationId, watermark) {
    let url = `https://directline.botframework.com/v3/directline/conversations/${conversationId}/activities`;
    if (watermark) {
        url += `?watermark=${watermark}`;
    }
    const res = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${process.env.COPILOT_SECRET}`
        }
    });
    return await res.json();
}

// HELPER: Trigger ServiceNow Custom Chat API
async function triggerServiceNowHandoff(sessionId, copilotSessionId) {
    const snInstance = process.env.SN_INSTANCE;
    const url = `https://${snInstance}.service-now.com/api/sn_va_as_service/bot/integration`;
    const credentials = Buffer.from(`${process.env.SN_USERNAME}:${process.env.SN_PASSWORD}`).toString('base64');

    const payload = {
        requestId: uuidv4(),
        clientSessionId: copilotSessionId || sessionId || uuidv4(), // Link the bot session
        clientMessageId: uuidv4(),
        appInboundId: process.env.SN_BOT_ID,
        userId: "guest_user", // Adjust logic for auth users
        emailId: "guest@example.com",
        action: "System_Action_Transfer_To_Agent",
        message: {
            text: "User requested live agent handoff",
            typed: true
        },
        contextVariables: {
            skip_va: "true",
            LiveAgent_assignment_group: process.env.SN_GROUP || '',
            LiveAgent_queue: process.env.SN_QUEUE || ''
        }
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`SN Error ${res.status}: ${errText}`);
    }
    return await res.json();
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend Middleware listening at http://localhost:${PORT}`);
});

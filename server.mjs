try { process.loadEnvFile(); } catch { }
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

mkdirSync('data', { recursive: true });
const db = new DatabaseSync('data/enterprise-gpt.sqlite');
db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    category TEXT NOT NULL DEFAULT 'General',
    icon TEXT NOT NULL DEFAULT 'message-circle',
    icon_bg TEXT NOT NULL DEFAULT 'bg-violet-100 text-violet-600'
    ,pinned INTEGER NOT NULL DEFAULT 0
    ,archived INTEGER NOT NULL DEFAULT 0
    ,sources_json TEXT NOT NULL DEFAULT '[]'
  );
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user','assistant')),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
  );
`);

// Migrate databases created by an earlier app version.
for (const statement of [
  "ALTER TABLE sessions ADD COLUMN category TEXT NOT NULL DEFAULT 'General'",
  "ALTER TABLE sessions ADD COLUMN icon TEXT NOT NULL DEFAULT 'message-circle'",
  "ALTER TABLE sessions ADD COLUMN icon_bg TEXT NOT NULL DEFAULT 'bg-violet-100 text-violet-600'",
  "ALTER TABLE sessions ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE sessions ADD COLUMN archived INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE sessions ADD COLUMN copilot_token TEXT",
  "ALTER TABLE sessions ADD COLUMN copilot_conversation_id TEXT",
  "ALTER TABLE sessions ADD COLUMN copilot_domain TEXT",
  "ALTER TABLE sessions ADD COLUMN sources_json TEXT NOT NULL DEFAULT '[]'",
  "ALTER TABLE messages ADD COLUMN activity_id TEXT",
  "ALTER TABLE sessions ADD COLUMN mode TEXT NOT NULL DEFAULT 'bot'",
  "ALTER TABLE sessions ADD COLUMN sn_session_id TEXT",
  "ALTER TABLE sessions ADD COLUMN sn_interaction_sys_id TEXT",
  "ALTER TABLE sessions ADD COLUMN sn_conversation_id TEXT",
  "ALTER TABLE sessions ADD COLUMN sn_seen_messages_json TEXT NOT NULL DEFAULT '[]'",
]) { try { db.exec(statement); } catch { /* column already exists */ } }

const classify = (text = '') => {
  const value = text.toLowerCase();
  if (/leave|policy|benefit|employee|hr|onboard/.test(value)) return { category: 'HR Agent', icon: 'users', iconBg: 'bg-violet-100 text-violet-600' };
  if (/vpn|password|computer|device|network|login|it /.test(value)) return { category: 'IT Support', icon: 'monitor', iconBg: 'bg-blue-100 text-blue-600' };
  if (/expense|invoice|budget|finance|payment|cost/.test(value)) return { category: 'Finance', icon: 'dollar-sign', iconBg: 'bg-emerald-100 text-emerald-600' };
  if (/sales|proposal|customer|lead|deal/.test(value)) return { category: 'Sales', icon: 'briefcase', iconBg: 'bg-orange-100 text-orange-600' };
  return { category: 'General', icon: 'message-circle', iconBg: 'bg-slate-100 text-slate-600' };
};

const sanitizeMessageText = (text) => {
  if (!text || typeof text !== 'string') return text;

  if (text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text);
      if (parsed.text) {
        parsed.text = sanitizeMessageText(parsed.text);
      }
      return JSON.stringify(parsed);
    } catch (e) {
      // Fall back to plain string sanitization
    }
  }

  let cleaned = text;

  // Replace raw HTML greeting tags with a professional markdown greeting
  cleaned = cleaned.replace(/<b>\s*Hi\s+Adarsh\s*👋?\s*<\/b>\s*/gi, '**Hello!** 👋 ');
  cleaned = cleaned.replace(/<b>\s*Hello\s+Adarsh\s*👋?\s*<\/b>\s*/gi, '**Hello!** 👋 ');

  // Handle other references to Adarsh (if any)
  cleaned = cleaned.replace(/\bHi\s+Adarsh\b/gi, 'Hello');
  cleaned = cleaned.replace(/\bHello\s+Adarsh\b/gi, 'Hello');
  cleaned = cleaned.replace(/\bAdarsh\b/gi, 'there');

  // Replace other potential bold/italic tags with Markdown equivalents
  cleaned = cleaned.replace(/<\/?b>/gi, '**');
  cleaned = cleaned.replace(/<\/?strong>/gi, '**');
  cleaned = cleaned.replace(/<\/?i>/gi, '*');
  cleaned = cleaned.replace(/<\/?em>/gi, '*');

  // Collapse newlines between consecutive image markdowns (e.g. rating smileys)
  cleaned = cleaned.replace(/(!\[[^\]]*\]\([^)]+\))\s*\n\s*(?=!\[[^\]]*\]\([^)]+\))/g, '$1 ');

  return cleaned;
};

const generateAssistantReply = (message) => {
  const value = message.toLowerCase();
  if (/leave|parental/.test(value)) return 'Primary caregivers receive 16 weeks of paid leave, while secondary caregivers receive 6 weeks. Submit the request through Workday at least 30 days in advance.';
  if (/vpn|network/.test(value)) return 'Start by reconnecting after resetting the network profile. If that does not work, reinstall the managed VPN configuration and sign in again.';
  if (/expense|invoice/.test(value)) return 'I can help review the expense status, approval stage, and expected payment cycle. Please provide the report or invoice reference number.';
  if (/password|login/.test(value)) return 'Use the company password-reset page first. If your account remains locked, I can prepare an IT support request for identity verification.';
  return `I can help with “${message}”. This response was returned by the conversation API and stored with this session.`;
};

if (db.prepare('SELECT COUNT(*) AS count FROM sessions').get().count === 0) {
  const samples = [
    ['Leave policy for parental leave', 'Can you explain our parental leave policy?', 'Primary caregivers receive 16 weeks of paid leave. Requests should be submitted at least 30 days in advance.'],
    ['VPN not connecting on macOS', 'My VPN is not connecting on my Mac.', 'Try reconnecting after resetting the network profile. I can also guide you through reinstalling the VPN configuration.'],
    ['Q3 expense report status', 'What is the status of my Q3 expense report?', 'Your Q3 expense report has been approved and is scheduled for the next payment cycle.'],
    ['Draft proposal for Acme Corp', 'Help me draft a proposal for Acme Corp.', 'I can prepare a proposal covering objectives, solution scope, timeline, and commercial terms.'],
    ['Employee onboarding checklist', 'Give me the employee onboarding checklist.', 'The checklist includes account setup, policy acknowledgement, payroll details, equipment, and manager introductions.'],
  ];
  const insertSession = db.prepare('INSERT INTO sessions (title, category, icon, icon_bg) VALUES (?, ?, ?, ?)');
  const insertMessage = db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)');
  for (const [title, question, answer] of samples) {
    const meta = classify(question); const result = insertSession.run(title, meta.category, meta.icon, meta.iconBg); const id = Number(result.lastInsertRowid);
    insertMessage.run(id, 'user', question); insertMessage.run(id, 'assistant', answer);
  }
}

// Clean up existing messages containing Adarsh or raw HTML bold tags in the database
try {
  const messages = db.prepare("SELECT id, content FROM messages WHERE role = 'assistant'").all();
  const updateStmt = db.prepare("UPDATE messages SET content = ? WHERE id = ?");
  let cleanedCount = 0;
  for (const msg of messages) {
    const sanitized = sanitizeMessageText(msg.content);
    if (sanitized !== msg.content) {
      updateStmt.run(sanitized, msg.id);
      cleanedCount++;
    }
  }
  if (cleanedCount > 0) {
    console.log(`Successfully migrated and sanitized ${cleanedCount} existing database messages.`);
  }
} catch (err) {
  console.error("Failed to run database migration/sanitization:", err);
}

const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' });
  res.end(JSON.stringify(body));
};
const readBody = async (req) => {
  let body = '';
  for await (const chunk of req) body += chunk;
  return body ? JSON.parse(body) : {};
};
const serializeSession = (row, withMessages = false) => {
  if (!row) return null;
  let sources = [];
  try { sources = JSON.parse(row.sources_json || '[]'); } catch { sources = []; }

  const ensureUTC = (d) => (d && !d.endsWith('Z')) ? d.replace(' ', 'T') + 'Z' : d;

  const result = { id: row.id, title: row.title, category: row.category, icon: row.icon, iconBg: row.icon_bg, pinned: Boolean(row.pinned), archived: Boolean(row.archived), createdAt: ensureUTC(row.created_at), updatedAt: ensureUTC(row.updated_at), sources, mode: row.mode || 'bot' };

  if (withMessages) {
    result.messages = db.prepare('SELECT id, role, content AS text, created_at AS createdAt FROM messages WHERE session_id = ? ORDER BY datetime(created_at) ASC, id ASC').all(row.id).map(msg => {
      if (msg.role === 'assistant' && msg.text && msg.text.startsWith('{')) {
        try {
          const parsed = JSON.parse(msg.text);
          msg.text = parsed.text ?? msg.text;
          if (parsed.quickActions) msg.quickActions = parsed.quickActions;
        } catch (e) { }
      }
      msg.createdAt = ensureUTC(msg.createdAt);
      return msg;
    });
  }
  return result;
};

const bootstrapData = {
  currentUser: { name: 'Sriram', email: 'sriram@enterprise.com', avatar: '/images/avatars/user-avatar.png', fallbackAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sriram&backgroundColor=b6e3f4' },
  navigation: [
    { key: 'agent-analytics', label: 'Agent Analytics', icon: 'bar-chart-2' }, { key: 'conversations', label: 'Conversations', icon: 'message-circle' },
    { key: 'copilot-agent', label: 'Copilot Agent', icon: 'message-square' },
    { key: 'agents', label: 'Agents', icon: 'sparkles' }, { key: 'users', label: 'Users', icon: 'users' }, { key: 'settings', label: 'Settings', icon: 'settings' },
  ],
  conversationFilters: ['All', 'HR Agent', 'IT Support', 'Sales', 'Finance'],
  suggestedPrompts: ['Password Reset', 'View my Incidents', 'Slow Computer', 'Apply Leave'],
  referencedDocuments: [],
  relatedAgents: [
    { id: 1, name: 'Benefits Assistant', desc: 'Benefits & Insurance', color: 'bg-violet-100 text-violet-600', online: true },
    { id: 2, name: 'Payroll Assistant', desc: 'Compensation & Payroll', color: 'bg-emerald-100 text-emerald-600', online: true },
  ],
  agents: [
    { id: 1, name: 'HR Policy Assistant', image: '/images/agents/hr-agent.png', category: 'People', description: 'Answers policy, leave and benefits questions.', status: 'Active', conversations: 482, color: 'bg-violet-100 text-violet-700' },
    { id: 2, name: 'IT Support Agent', image: '/images/agents/it-agent.png', category: 'Technology', description: 'Troubleshoots access, devices and internal tools.', status: 'Active', conversations: 316, color: 'bg-blue-100 text-blue-700' },
    { id: 3, name: 'Finance Assistant', image: '/images/agents/finance-agent.png', category: 'Finance', description: 'Helps with expenses, invoices and purchasing.', status: 'Active', conversations: 208, color: 'bg-emerald-100 text-emerald-700' },
    { id: 4, name: 'Sales Copilot', image: '/images/agents/sales-agent.png', category: 'Revenue', description: 'Drafts proposals and summarizes customer context.', status: 'Draft', conversations: 94, color: 'bg-amber-100 text-amber-700' },
  ],
  users: [
    { id: 1, name: 'Anna Carmina', email: 'anna@enterprise.com', department: 'Leadership', role: 'Manager', status: 'Active' },
    { id: 2, name: 'Sriram Kumar', email: 'sriram@enterprise.com', department: 'Engineering', role: 'Member', status: 'Active' },
    { id: 3, name: 'Maya Chen', email: 'maya@enterprise.com', department: 'People', role: 'Admin', status: 'Active' },
    { id: 4, name: 'Daniel Ortiz', email: 'daniel@enterprise.com', department: 'Sales', role: 'Member', status: 'Away' },
    { id: 5, name: 'Noah Williams', email: 'noah@enterprise.com', department: 'Finance', role: 'Member', status: 'Active' },
  ],
};
const extractAdaptiveCardContent = (card) => {
  const textList = [];
  const actions = [];

  const walk = (node) => {
    if (!node) return;
    if (typeof node !== 'object') return;

    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }

    if (node.type === 'TextBlock' && typeof node.text === 'string') {
      textList.push(node.text);
    }

    if (node.type === 'Image' && typeof node.url === 'string') {
      textList.push(`![image](${node.url})`);
    }

    if (node.selectAction && (node.selectAction.type === 'Action.Submit' || node.selectAction.type === 'Action.Execute')) {
      const selectAct = node.selectAction;
      const dataVal = selectAct.verb || selectAct.data;
      if (typeof dataVal === 'string') {
        actions.push({ title: dataVal, value: dataVal });
      } else if (dataVal && typeof dataVal === 'object') {
        const values = Object.values(dataVal).filter(v => typeof v === 'string' || typeof v === 'number');
        if (values.length > 0) {
          actions.push({ title: String(values[0]), value: dataVal });
        }
      }
    }

    if (node.type === 'Action.Submit' || node.type === 'Action.Execute') {
      const dataVal = node.verb || node.data;
      if (typeof dataVal === 'string') {
        actions.push({ title: node.title || dataVal, value: dataVal });
      } else if (dataVal && typeof dataVal === 'object') {
        const values = Object.values(dataVal).filter(v => typeof v === 'string' || typeof v === 'number');
        if (values.length > 0) {
          actions.push({ title: node.title || String(values[0]), value: dataVal });
        }
      }
    }

    if (node.type === 'ColumnSet' && Array.isArray(node.columns)) {
      const colTexts = [];
      node.columns.forEach(col => {
        const colContent = extractAdaptiveCardContent(col);
        if (colContent.text) {
          colTexts.push(colContent.text);
        }
        if (colContent.actions) {
          actions.push(...colContent.actions);
        }
      });

      if (colTexts.length > 1 && colTexts[0].startsWith('![') && !colTexts[0].includes('\n')) {
        const imgMarkdown = colTexts[0];
        const nextColText = colTexts[1];
        const nextColLines = nextColText.split('\n');
        nextColLines[0] = `${imgMarkdown} ${nextColLines[0]}`;

        textList.push(nextColLines.join('\n'));
        for (let i = 2; i < colTexts.length; i++) {
          textList.push(colTexts[i]);
        }
      } else {
        textList.push(colTexts.join('\n'));
      }
      return; // Do not walk columns normally
    }

    if (node.body) walk(node.body);
    if (node.items) walk(node.items);
    if (node.columns) walk(node.columns);
    if (node.actions) walk(node.actions);
  };

  walk(card);
  return { text: textList.join('\n'), actions };
};

const extractActivitySources = (activity = {}) => {
  const candidates = [
    ...(Array.isArray(activity.attachments) ? activity.attachments : []),
    ...(Array.isArray(activity.entities) ? activity.entities : []),
    ...(Array.isArray(activity.channelData?.citations) ? activity.channelData.citations : []),
    ...(Array.isArray(activity.channelData?.knowledgeSources) ? activity.channelData.knowledgeSources : []),
    ...(Array.isArray(activity.value?.citations) ? activity.value.citations : []),
  ];
  const sources = candidates.map((item, index) => {
    const content = item.content || item;
    const url = item.contentUrl || item.url || content.url || content.link || content.uri;
    const name = item.name || content.name || content.title || content.displayName || (url ? new URL(url, 'http://localhost').pathname.split('/').pop() : 'Referenced source');
    return { id: content.id || item.id || `${activity.id || 'source'}-${index}`, name, meta: content.snippet || content.description || content.section || 'Referenced by assistant', type: String(name).toLowerCase().endsWith('.pdf') ? 'pdf' : 'doc', url };
  }).filter((source) => source.url);
  const markdownLinks = [...String(activity.text || '').matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)].map((match, index) => ({ id: `${activity.id || 'link'}-${index}`, name: match[1], meta: 'Reference link from assistant response', type: 'link', url: match[2] }));
  const knownUrls = new Set(markdownLinks.map((source) => source.url));
  const bareLinks = [...String(activity.text || '').matchAll(/https?:\/\/[^\s<>)]+/g)].map((match) => match[0].replace(/[.,;!?]+$/, '')).filter((url) => !knownUrls.has(url)).map((url, index) => ({ id: `${activity.id || 'url'}-${index}`, name: new URL(url).hostname, meta: 'Reference link from assistant response', type: 'link', url }));
  return [...new Map([...sources, ...markdownLinks, ...bareLinks].map((source) => [source.url, source])).values()];
};

const triggerServiceNowHandoff = async (sessionId, historyText) => {
  const snInstance = (process.env.SN_INSTANCE || "").trim();
  const botId = (process.env.SN_BOT_ID || "").replace(/\.$/, "").trim();
  const username = (process.env.SN_USERNAME || "").trim();
  const password = (process.env.SN_PASSWORD || "").trim();

  if (!snInstance || !botId || !username || !password) {
    throw new Error("Missing ServiceNow credentials in .env");
  }

  const url = `https://${snInstance}.service-now.com/api/sn_va_as_service/bot/integration`;
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');

  const requesterEmail = (process.env.SN_REQUESTER_EMAIL || "guest@example.com").trim();
  const snSessionId = `${sessionId}_handoff_${randomUUID().substring(0, 8)}`;

  const handoffText = `User requested a live agent.\n\n--- Chat History ---\n${historyText}\n--- End ---`;

  const payload = {
    requestId: randomUUID(),
    clientSessionId: snSessionId,
    clientMessageId: randomUUID(),
    appInboundId: botId,
    userId: requesterEmail,
    emailId: requesterEmail,
    firstName: requesterEmail.split("@")[0],
    action: "START_CONVERSATION",
    message: { text: handoffText, typed: true }
  };

  payload.contextVariables = { live_agent_only: "true" };
  if (process.env.SN_QUEUE) payload.contextVariables.LiveAgent_queue = process.env.SN_QUEUE.trim();

  console.log(`[SN Handoff] Starting VA Conversation: ${url} with Session ID: ${snSessionId}`);

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
    throw new Error(`ServiceNow rejected request: ${errText}`);
  }

  const resData = await res.json();
  if (resData.status === "failure") throw new Error(`ServiceNow START failed: ${JSON.stringify(resData)}`);

  let interactionNumber = null;
  let interactionSysId = null;

  for (let i = 0; i < 5; i++) {
    await new Promise(r => setTimeout(r, 1000));
    // First find the conversation for this specific session
    const convUrl = `https://${snInstance}.service-now.com/api/now/table/sys_cs_conversation?sysparm_limit=1&sysparm_query=session.device_id=${snSessionId}^ORDERBYDESCsys_created_on`;
    const convRes = await fetch(convUrl, { headers: { 'Authorization': `Basic ${credentials}`, 'Accept': 'application/json' } });
    if (convRes.ok) {
      const convData = await convRes.json();
      if (convData.result && convData.result.length > 0) {
        const conv = convData.result[0];
        const convSysId = conv.sys_id;

        // Now fetch the interaction pointing to this conversation
        const intUrl = `https://${snInstance}.service-now.com/api/now/table/interaction?sysparm_limit=1&sysparm_query=channel_metadata_document=${convSysId}`;
        const intRes = await fetch(intUrl, { headers: { 'Authorization': `Basic ${credentials}`, 'Accept': 'application/json' } });
        if (intRes.ok) {
          const intData = await intRes.json();
          if (intData.result && intData.result.length > 0) {
            interactionSysId = intData.result[0].sys_id;
            interactionNumber = intData.result[0].number;
            console.log(`[SN Handoff] Fetched Interaction: ${interactionNumber} (${interactionSysId})`);
            break;
          }
        }
      }
    }
  }

  return { status: "success", interaction_number: interactionNumber, interaction_sys_id: interactionSysId, sn_session_id: snSessionId };
};

const sendServiceNowAgentMessage = async (snSessionId, text) => {
  const snInstance = (process.env.SN_INSTANCE || "").trim();
  const botId = (process.env.SN_BOT_ID || "").replace(/\.$/, "").trim();
  const username = (process.env.SN_USERNAME || "").trim();
  const password = (process.env.SN_PASSWORD || "").trim();
  const url = `https://${snInstance}.service-now.com/api/sn_va_as_service/bot/integration`;
  const credentials = Buffer.from(`${username}:${password}`).toString('base64');
  const requesterEmail = (process.env.SN_REQUESTER_EMAIL || "guest@example.com").trim();

  const payload = {
    requestId: randomUUID(),
    clientSessionId: snSessionId,
    clientMessageId: randomUUID(),
    appInboundId: botId,
    userId: requesterEmail,
    emailId: requesterEmail,
    message: { text: text, typed: true }
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
  if (!res.ok) throw new Error(`SN Error ${res.status}: ${await res.text()}`);
  return await res.json();
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'OPTIONS') return json(res, 204, {});
    if (url.pathname === '/api/health') return json(res, 200, { ok: true, database: 'sqlite' });
    if (url.pathname === '/api/copilot/token' && req.method === 'POST') {
      const body = await readBody(req);
      const secret = String(body.secret || process.env.DIRECT_LINE_SECRET || process.env.COPILOT_SECRET || '').trim();
      if (!secret) return json(res, 400, { error: 'secret is required' });

      const endpoints = [
        'https://directline.botframework.com/v3/directline/tokens/generate',
        'https://india.directline.botframework.com/v3/directline/tokens/generate',
        'https://europe.directline.botframework.com/v3/directline/tokens/generate'
      ];

      let lastError = '';
      let tokenData = null;

      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${secret}`,
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            tokenData = await response.json();
            break;
          } else {
            const errText = await response.text();
            lastError = `Endpoint ${endpoint} failed (${response.status}): ${errText}`;
          }
        } catch (err) {
          lastError = `Endpoint ${endpoint} failed: ${err.message}`;
        }
      }

      if (tokenData) {
        return json(res, 200, tokenData);
      } else {
        return json(res, 400, { error: `All regional endpoints failed. Last error: ${lastError}` });
      }
    }
    if (url.pathname === '/api/bootstrap' && req.method === 'GET') return json(res, 200, bootstrapData);
    if (url.pathname === '/api/search' && req.method === 'GET') {
      const query = String(url.searchParams.get('q') || '').trim().toLowerCase();
      if (query.length < 2) return json(res, 200, { conversations: [], agents: [], users: [] });
      const pattern = `%${query}%`;
      const conversations = db.prepare(`SELECT s.*,
        (SELECT content FROM messages WHERE session_id = s.id ORDER BY id DESC LIMIT 1) AS preview
        FROM sessions s WHERE lower(s.title) LIKE ? OR EXISTS (
          SELECT 1 FROM messages m WHERE m.session_id = s.id AND lower(m.content) LIKE ?
        ) ORDER BY s.updated_at DESC LIMIT 6`).all(pattern, pattern).map((row) => ({ ...serializeSession(row), preview: row.preview, type: 'conversation' }));
      const agents = bootstrapData.agents.filter((agent) => `${agent.name} ${agent.category} ${agent.description}`.toLowerCase().includes(query)).slice(0, 4).map((agent) => ({ ...agent, type: 'agent' }));
      const users = bootstrapData.users.filter((user) => `${user.name} ${user.email} ${user.department} ${user.role}`.toLowerCase().includes(query)).slice(0, 4).map((user) => ({ ...user, type: 'user' }));
      return json(res, 200, { conversations, agents, users });
    }
    if (url.pathname === '/api/sessions' && req.method === 'GET') {
      const rows = db.prepare(`SELECT s.*,
        (SELECT content FROM messages WHERE session_id = s.id ORDER BY id DESC LIMIT 1) AS preview,
        (SELECT COUNT(*) FROM messages WHERE session_id = s.id) AS message_count
        FROM sessions s ORDER BY updated_at DESC, id DESC`).all();
      return json(res, 200, rows.map((row) => ({ ...serializeSession(row), preview: row.preview, messageCount: row.message_count })));
    }
    async function getOrCreateConversation(sessionId, forceRefresh = false) {
      // Query database for stored token, conversationId, and domain
      if (!forceRefresh) {
        const session = db.prepare('SELECT copilot_token, copilot_conversation_id, copilot_domain FROM sessions WHERE id = ?').get(sessionId);
        if (session && session.copilot_token && session.copilot_conversation_id) {
          return {
            token: session.copilot_token,
            conversationId: session.copilot_conversation_id,
            domain: session.copilot_domain || 'https://directline.botframework.com'
          };
        }
      }

      const secret = String(process.env.DIRECT_LINE_SECRET || process.env.COPILOT_SECRET || '').trim();
      console.log('Secret length:', secret.length);
      const endpoints = [
        'https://directline.botframework.com/v3/directline/tokens/generate',
        'https://india.directline.botframework.com/v3/directline/tokens/generate',
        'https://europe.directline.botframework.com/v3/directline/tokens/generate'
      ];

      let token = null;
      let lastError = '';
      let successfulDomain = 'https://directline.botframework.com';

      for (const endpoint of endpoints) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${secret}`,
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const tokenData = await response.json();
            token = tokenData.token;
            successfulDomain = endpoint.replace(/\/v3\/directline\/tokens\/generate$/, '');
            break;
          } else {
            const errText = await response.text();
            lastError = `Endpoint ${endpoint} failed (${response.status}): ${errText}`;
          }
        } catch (err) {
          lastError = `Endpoint ${endpoint} failed: ${err.message}`;
        }
      }

      if (!token) {
        throw new Error(`Direct Line authentication failed: ${lastError}`);
      }

      const convoRes = await fetch(`${successfulDomain}/v3/directline/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!convoRes.ok) {
        throw new Error(`Failed to start Direct Line conversation: ${await convoRes.text()}`);
      }

      const convoData = await convoRes.json();
      const conversationId = convoData.conversationId;

      // Save to database
      db.prepare('UPDATE sessions SET copilot_token = ?, copilot_conversation_id = ?, copilot_domain = ? WHERE id = ?').run(token, conversationId, successfulDomain, sessionId);

      return { token, conversationId, domain: successfulDomain };
    }

    async function getBotResponse(token, conversationId, domain = 'https://directline.botframework.com') {
      const url = `${domain}/v3/directline/conversations/${conversationId}/activities`;

      let botMessages = [];
      let consecutiveNoChange = 0;

      for (let attempt = 0; attempt < 35; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 800));

        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          const activities = data.activities || [];

          const lastUserIndex = activities.map(act => act?.from?.id).lastIndexOf('user-123');
          const newBotActivities = activities.slice(lastUserIndex + 1);

          const botMessagesFiltered = newBotActivities.filter(act => act.type === 'message' && act?.from?.id !== 'user-123');
          const hasTyping = newBotActivities.some(act => act.type === 'typing');
          const newBotMessagesCount = botMessagesFiltered.length;

          console.log(`[DirectLine Poll] Attempt ${attempt + 1}: Received ${activities.length} activities (${newBotMessagesCount} bot messages, previously had ${botMessages.length}).`);

          if (newBotMessagesCount > 0) {
            if (newBotMessagesCount > botMessages.length) {
              consecutiveNoChange = 0;
              botMessages = botMessagesFiltered;
            } else {
              if (!hasTyping) {
                consecutiveNoChange++;
              }
            }

            // Wait for 4 consecutive polls with no changes and no typing activity (approx 3.2s of absolute silence)
            // to ensure delayed multi-part dialogs fully arrive.
            if (consecutiveNoChange >= 4) {
              console.log(`[DirectLine Poll] Response stabilized with ${botMessages.length} messages after ${attempt + 1} attempts.`);
              break;
            }
          }
        } else {
          console.error(`[DirectLine Poll] Error fetching activities:`, res.status);
        }
      }

      if (botMessages.length > 0) {
        const textParts = [];
        const quickActions = [];

        botMessages.forEach(act => {
          if (act.text) {
            textParts.push(act.text);
          }

          // Extract Adaptive Card content
          if (act.attachments && Array.isArray(act.attachments)) {
            act.attachments.forEach(attachment => {
              if (attachment.contentType === 'application/vnd.microsoft.card.adaptive' && attachment.content) {
                const cardContent = extractAdaptiveCardContent(attachment.content);
                if (cardContent.text) {
                  textParts.push(cardContent.text);
                }
                if (cardContent.actions && cardContent.actions.length > 0) {
                  quickActions.push(...cardContent.actions);
                }
              }
            });
          }

          // Extract suggested actions (standard Quick Actions)
          if (act.suggestedActions && act.suggestedActions.actions) {
            act.suggestedActions.actions.forEach(btn => {
              if (btn.title) {
                quickActions.push({ title: btn.title, value: btn.value || btn.title });
              }
            });
          }
        });

        const combinedText = textParts.join('\n\n');
        const uniqueQuickActions = [];
        const actionTitles = new Set();
        quickActions.forEach(act => {
          const title = typeof act === 'object' && act !== null ? act.title : String(act);
          const key = title.trim().toLowerCase();
          if (!actionTitles.has(key)) {
            actionTitles.add(key);
            uniqueQuickActions.push(act);
          }
        });
        const sources = [...new Map(botMessages.flatMap(extractActivitySources).map((source) => [source.url, source])).values()];

        console.log(`  Combined new bot response: "${combinedText}"`);
        if (uniqueQuickActions.length > 0) console.log(`  Found quick actions:`, uniqueQuickActions);

        return { text: combinedText, quickActions: uniqueQuickActions, sources, activityIds: botMessages.map(act => act.id) };
      }

      return {
        text: "The Copilot Studio agent did not respond in time. Please try sending your message again.",
        quickActions: [],
        sources: [],
        activityIds: []
      };
    }

    async function syncDirectLineActivities(sessionId, token, conversationId, domain = 'https://directline.botframework.com') {
      const url = `${domain}/v3/directline/conversations/${conversationId}/activities`;

      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) return;

      const data = await res.json();
      const activities = data.activities || [];
      const messageActivities = activities.filter(act => act.type === 'message');
      if (messageActivities.length === 0) return;

      // Get stored activity IDs for this session
      const stored = db.prepare("SELECT activity_id FROM messages WHERE session_id = ? AND activity_id IS NOT NULL").all(sessionId);
      const storedIds = new Set();
      stored.forEach(s => {
        if (s.activity_id) {
          s.activity_id.split(',').forEach(id => storedIds.add(id));
        }
      });

      const unstoredActivities = messageActivities.filter(act => !storedIds.has(act.id));
      if (unstoredActivities.length === 0) return;

      const turnsToStore = [];
      let currentTurn = null;

      unstoredActivities.forEach(act => {
        const isUser = act?.from?.id === 'user-123' || act?.from?.role === 'user';
        if (isUser) {
          if (currentTurn) {
            turnsToStore.push(currentTurn);
            currentTurn = null;
          }
          const userText = act.text || (typeof act.value === 'string' ? act.value : act.value?.text) || 'User action';
          turnsToStore.push({
            role: 'user',
            activityId: act.id,
            content: userText,
            createdAt: act.timestamp || null,
            sources: []
          });
        } else {
          if (!currentTurn) {
            currentTurn = {
              role: 'assistant',
              activityIds: [],
              textParts: [],
              quickActions: [],
              createdAt: act.timestamp || null,
              sources: []
            };
          }
          currentTurn.activityIds.push(act.id);
          if (act.text) currentTurn.textParts.push(act.text);
          if (act.attachments && Array.isArray(act.attachments)) {
            act.attachments.forEach(attachment => {
              if (attachment.contentType === 'application/vnd.microsoft.card.adaptive' && attachment.content) {
                const cardContent = extractAdaptiveCardContent(attachment.content);
                if (cardContent.text) currentTurn.textParts.push(cardContent.text);
                if (cardContent.actions) currentTurn.quickActions.push(...cardContent.actions);
              }
            });
          }
          if (act.suggestedActions && act.suggestedActions.actions) {
            act.suggestedActions.actions.forEach(btn => {
              if (btn.title) {
                currentTurn.quickActions.push({ title: btn.title, value: btn.value || btn.title });
              }
            });
          }
          currentTurn.sources.push(...extractActivitySources(act));
        }
      });

      if (currentTurn) {
        turnsToStore.push(currentTurn);
      }

      if (turnsToStore.length > 0) {
        console.log(`[DirectLine Sync] Found ${turnsToStore.length} message turns to sync.`);
        db.exec('BEGIN');
        try {
          turnsToStore.forEach(turn => {
            if (turn.role === 'user') {
              const existingUser = db.prepare("SELECT id FROM messages WHERE session_id = ? AND role = 'user' AND (activity_id IS NULL OR activity_id = '') AND lower(trim(content)) = lower(trim(?))").get(sessionId, turn.content);
              if (existingUser) {
                db.prepare('UPDATE messages SET activity_id = ? WHERE id = ?').run(turn.activityId, existingUser.id);
              } else {
                db.prepare('INSERT INTO messages (session_id, role, content, activity_id) VALUES (?, ?, ?, ?)').run(sessionId, 'user', turn.content, turn.activityId);
              }
            }
            else {
              const combinedText = sanitizeMessageText(turn.textParts.join('\n\n'));
              const uniqueActions = [];
              const actionTitles = new Set();
              turn.quickActions.forEach(act => {
                const title = typeof act === 'object' && act !== null ? act.title : String(act);
                const key = title.trim().toLowerCase();
                if (!actionTitles.has(key)) {
                  actionTitles.add(key);
                  uniqueActions.push(act);
                }
              });
              if (combinedText.trim()) {
                const dbContent = uniqueActions.length > 0
                  ? JSON.stringify({ text: combinedText, quickActions: uniqueActions })
                  : combinedText;
                const activityIdStr = turn.activityIds.join(',');
                db.prepare('INSERT INTO messages (session_id, role, content, activity_id) VALUES (?, ?, ?, ?)').run(sessionId, 'assistant', dbContent, activityIdStr);
                if (turn.sources && turn.sources.length > 0) {
                  db.prepare('UPDATE sessions SET sources_json = ? WHERE id = ?').run(JSON.stringify(turn.sources), sessionId);
                }
              }
            }
          });
          db.exec('COMMIT');
          console.log(`[DirectLine Sync] Synced ${turnsToStore.length} message turns.`);
        } catch (e) {
          try { db.exec('ROLLBACK'); } catch { }
          console.error("Direct Line sync DB error:", e);
        }
      }
    }

    if (url.pathname === '/api/chat/respond' && req.method === 'POST') {
      const body = await readBody(req);
      const message = String(body.message || '').trim();
      const value = body.value || null;
      if (!message) return json(res, 400, { error: 'message is required' });
      let sessionId = Number(body.sessionId || 0);
      if (!sessionId) {
        const title = message.slice(0, 52); const meta = classify(message);
        sessionId = Number(db.prepare('INSERT INTO sessions (title, category, icon, icon_bg) VALUES (?, ?, ?, ?)').run(title, meta.category, meta.icon, meta.iconBg).lastInsertRowid);
      } else if (!db.prepare('SELECT id FROM sessions WHERE id = ?').get(sessionId)) return json(res, 404, { error: 'Session not found' });

      // Insert user message immediately to prevent race conditions with background sync
      const userResult = db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)').run(sessionId, 'user', message);
      const insertedUserId = Number(userResult.lastInsertRowid);

      let botData;
      let handoffSysMsg = null;
      const sessionRow = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
      const handoffKeywords = ['agent', 'human', 'handoff', 'speak to live agent', 'liveagent', 'live support', 'live chat'];
      const isHandoffReq = message && handoffKeywords.some(kw => message.toLowerCase().includes(kw));

      if (isHandoffReq && sessionRow.mode !== 'agent') {
        console.log(`[Session ${sessionId}] Triggering handoff to ServiceNow...`);
        try {
          const historyRows = db.prepare('SELECT role, content FROM messages WHERE session_id = ? ORDER BY id ASC').all(sessionId);
          let historyText = historyRows.map(r => {
            let text = r.content;
            if (r.role === 'assistant' && text.startsWith('{')) {
              try { text = JSON.parse(text).text || text; } catch (e) { }
            }
            return `${r.role === 'user' ? 'User' : 'Bot'}: ${text}`;
          }).join('\n');
          historyText += `\nUser: ${message}`;
          const snRes = await triggerServiceNowHandoff(sessionId, historyText);
          db.prepare('UPDATE sessions SET mode = ?, sn_session_id = ?, sn_interaction_sys_id = ? WHERE id = ?').run('agent', snRes.sn_session_id, snRes.interaction_sys_id, sessionId);
          handoffSysMsg = `✅ ServiceNow Agent Connected.`;
          if (snRes.interaction_number) handoffSysMsg += ` (Interaction: ${snRes.interaction_number})`;
        } catch (e) {
          console.error("SN Handoff Error:", e);
          return json(res, 500, { error: `Failed to contact ServiceNow: ${e.message}` });
        }
      } else if (sessionRow.mode === 'agent') {
        console.log(`[Session ${sessionId}] Sending message to live agent...`);
        try {
          await sendServiceNowAgentMessage(sessionRow.sn_session_id, message);
          handoffSysMsg = ''; // Just to skip copilot
        } catch (e) {
          console.error("SN Agent Msg Error:", e);
          return json(res, 500, { error: `Failed to send message to SN Agent: ${e.message}` });
        }
      }

      if (handoffSysMsg !== null) {
        let ids = { userId: null, assistantId: null };
        db.exec('BEGIN');
        try {
          ids.userId = insertedUserId;
          if (handoffSysMsg) {
            const assistant = db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)').run(sessionId, 'assistant', handoffSysMsg);
            ids.assistantId = Number(assistant.lastInsertRowid);
          }
          db.prepare('UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(sessionId);
          db.exec('COMMIT');
        } catch (e) { db.exec('ROLLBACK'); throw e; }

        const updatedSession = serializeSession(db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId), true);
        const reply = {
          session: updatedSession,
          userMessage: { id: ids.userId, role: 'user', text: message },
          sources: []
        };
        if (handoffSysMsg) reply.assistantMessage = { id: ids.assistantId, role: 'assistant', text: handoffSysMsg };
        return json(res, 201, reply);
      }

      try {
        let { token, conversationId, domain } = await getOrCreateConversation(sessionId);

        // Send message to Copilot
        let sendRes = await fetch(`${domain || 'https://directline.botframework.com'}/v3/directline/conversations/${conversationId}/activities`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'message',
            from: { id: 'user-123', name: 'User' },
            text: message,
            value: value && typeof value === 'object' ? value : { text: message, verb: message, action: message }
          })
        });

        if (!sendRes.ok) {
          const errText = await sendRes.text();
          // Check if token is invalid or expired
          if (sendRes.status === 403 || sendRes.status === 401 || errText.includes('Invalid token or secret')) {
            console.log(`Token expired or invalid for session ${sessionId}. Regenerating new token and conversation...`);
            const refreshed = await getOrCreateConversation(sessionId, true);
            token = refreshed.token;
            conversationId = refreshed.conversationId;
            domain = refreshed.domain;

            // Retry sending message with new token and conversation
            sendRes = await fetch(`${domain || 'https://directline.botframework.com'}/v3/directline/conversations/${conversationId}/activities`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                type: 'message',
                from: { id: 'user-123', name: 'User' },
                text: message,
                value: value && typeof value === 'object' ? value : { text: message, verb: message, action: message }
              })
            });

            if (!sendRes.ok) {
              throw new Error(`Copilot API error after retry: ${await sendRes.text()}`);
            }
          } else {
            throw new Error(`Copilot API error: ${errText}`);
          }
        }

        // Poll for bot response
        botData = await getBotResponse(token, conversationId, domain);
      } catch (err) {
        console.error('Direct Line conversation error:', err);
        botData = {
          text: `I encountered an issue communicating with the Copilot bot: ${err.message}`,
          quickActions: [],
          sources: []
        };
      }

      // Sanitize bot response text
      botData.text = sanitizeMessageText(botData.text);

      const dbContent = botData.quickActions && botData.quickActions.length > 0
        ? JSON.stringify({ text: botData.text, quickActions: botData.quickActions })
        : botData.text;

      let ids;
      db.exec('BEGIN');
      try {
        const activityId = botData.activityIds && botData.activityIds.length > 0 ? botData.activityIds.join(',') : null;

        let existing = null;
        if (botData.activityIds && botData.activityIds.length > 0) {
          for (const id of botData.activityIds) {
            existing = db.prepare("SELECT id FROM messages WHERE session_id = ? AND (activity_id = ? OR activity_id LIKE ? OR activity_id LIKE ? OR activity_id LIKE ?)").get(
              sessionId,
              id,
              `%,${id}`,
              `${id},%`,
              `%,${id},%`
            );
            if (existing) break;
          }
        }

        if (!existing) {
          const assistant = db.prepare('INSERT INTO messages (session_id, role, content, activity_id) VALUES (?, ?, ?, ?)').run(sessionId, 'assistant', dbContent, activityId);
          ids = { userId: insertedUserId, assistantId: Number(assistant.lastInsertRowid) };
        } else {
          ids = { userId: insertedUserId, assistantId: Number(existing.id) };
        }

        db.prepare('UPDATE sessions SET updated_at = CURRENT_TIMESTAMP, sources_json = ? WHERE id = ?').run(JSON.stringify(botData.sources || []), sessionId);
        db.exec('COMMIT');
      } catch (error) { try { db.exec('ROLLBACK'); } catch { } throw error; }

      const session = serializeSession(db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId), true);

      return json(res, 201, {
        session,
        userMessage: { id: ids.userId, role: 'user', text: message },
        assistantMessage: {
          id: ids.assistantId,
          role: 'assistant',
          text: botData.text,
          quickActions: botData.quickActions,
          sources: botData.sources || []
        },
        sources: botData.sources || []
      });
    }
    if (url.pathname === '/api/sessions' && req.method === 'POST') {
      const body = await readBody(req);
      const title = String(body.title || 'New conversation').slice(0, 80);
      const meta = classify(body.message || title);
      const result = db.prepare('INSERT INTO sessions (title, category, icon, icon_bg) VALUES (?, ?, ?, ?)').run(title, meta.category, meta.icon, meta.iconBg);
      const sessionId = Number(result.lastInsertRowid);
      if (body.message) db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)').run(sessionId, 'user', String(body.message));
      return json(res, 201, serializeSession(db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId), true));
    }
    const match = url.pathname.match(/^\/api\/sessions\/(\d+)(?:\/messages)?$/);
    if (match) {
      const id = Number(match[1]);
      const isMessages = url.pathname.endsWith('/messages');
      if (req.method === 'GET') {
        if (isMessages) {
          const messages = db.prepare('SELECT id, role, content AS text, created_at AS createdAt FROM messages WHERE session_id = ? ORDER BY created_at ASC, id ASC').all(id).map(msg => {
            if (msg.role === 'assistant' && msg.text && msg.text.startsWith('{')) {
              try {
                const parsed = JSON.parse(msg.text);
                return { ...msg, text: parsed.text ?? msg.text, quickActions: parsed.quickActions };
              } catch (e) { }
            }
            return msg;
          });
          return json(res, 200, messages);
        }
        const sessionRow = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id);
        if (sessionRow && sessionRow.mode === 'agent') {
          try {
            const snInstance = (process.env.SN_INSTANCE || "").trim();
            const username = (process.env.SN_USERNAME || "").trim();
            const password = (process.env.SN_PASSWORD || "").trim();
            const requesterEmail = (process.env.SN_REQUESTER_EMAIL || "guest@example.com").toLowerCase().trim();

            if (snInstance && username && password) {
              const credentials = Buffer.from(`${username}:${password}`).toString('base64');
              const headers = { 'Authorization': `Basic ${credentials}`, 'Accept': 'application/json' };

              let snConvId = sessionRow.sn_conversation_id;
              let interactionSysId = sessionRow.sn_interaction_sys_id;
              let chatEnded = false;

              const convUrl = `https://${snInstance}.service-now.com/api/now/table/sys_cs_conversation?sysparm_limit=1&sysparm_query=session.device_id=${sessionRow.sn_session_id}^ORDERBYDESCsys_created_on`;
              const convRes = await fetch(convUrl, { headers });
              if (convRes.ok) {
                const convData = await convRes.json();
                if (convData.result && convData.result.length > 0) {
                  const conv = convData.result[0];
                  const newConvId = conv.sys_id;

                  if (newConvId !== snConvId) {
                    snConvId = newConvId;
                    db.prepare('UPDATE sessions SET sn_conversation_id = ? WHERE id = ?').run(snConvId, id);
                  }

                  const state = String(conv.state).toLowerCase();
                  if (state === 'completed' || state === 'canceled' || state === 'faulted') {
                    chatEnded = true;
                  }
                }
              }

              if (snConvId) {
                const msgRes = await fetch(`https://${snInstance}.service-now.com/api/now/table/sys_cs_message?sysparm_query=conversation=${snConvId}^ORDERBYsys_created_on`, { headers });
                if (msgRes.ok) {
                  const msgData = await msgRes.json();
                  let seen = [];
                  try { seen = JSON.parse(sessionRow.sn_seen_messages_json || '[]'); } catch (e) { }
                  const seenSet = new Set(seen);

                  let hasNew = false;
                  let lastInsertedText = '';
                  db.exec('BEGIN');
                  try {
                    for (const m of (msgData.result || [])) {
                      const msgSysId = m.sys_id;
                      const createdBy = String(m.sys_created_by || '').toLowerCase();
                      if (!seenSet.has(msgSysId)) {
                        seen.push(msgSysId);
                        hasNew = true;

                        const isAgentMessage = String(m.is_agent) === 'true';
                        const isSystemMessage = createdBy === 'system';

                        if (isAgentMessage || isSystemMessage) {
                          let text = '';
                          let isSysEvent = isSystemMessage;
                          try {
                            const payloadStr = m.payload || '{}';
                            const pJson = JSON.parse(payloadStr);
                            isSysEvent = isSysEvent || pJson.type === 'System';
                            if (pJson.message) {
                              if (typeof pJson.message === 'object' && pJson.message.text) text = pJson.message.text;
                              else if (typeof pJson.message === 'string') text = pJson.message;
                            } else if (pJson.text) { text = pJson.text; }
                            else if (pJson.typedText) { text = pJson.typedText; }
                            else if (pJson.agent_translated_msg) { text = pJson.agent_translated_msg; }
                          } catch (e) {
                            text = m.payload || '';
                            const textMatch = text.match(/"text"\s*:\s*"([^"]+)"/);
                            if (textMatch) text = textMatch[1];
                          }

                          // Also check m.agent_translated_msg if text is empty
                          if (!text && m.agent_translated_msg) text = m.agent_translated_msg;

                          if (text && !text.includes('--- Chat History ---')) {
                            text = text.replace(/\\n/g, '\n');
                            if (text !== lastInsertedText) {
                              db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)').run(id, 'assistant', text);
                              lastInsertedText = text;
                            }
                          }
                        }
                      }
                    }
                    if (hasNew) {
                      db.prepare('UPDATE sessions SET sn_seen_messages_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(JSON.stringify(seen), id);
                    }
                    if (chatEnded) {
                      db.prepare('UPDATE sessions SET mode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('bot', id);
                    }
                    db.exec('COMMIT');
                  } catch (e) { db.exec('ROLLBACK'); console.error('SN Polling DB Error', e); }
                }
              }
            }
          } catch (err) {
            console.error('SN Polling error:', err);
          }
        } else {
          // Sync any new activities from Direct Line in the background
          try {
            const { token, conversationId, domain } = await getOrCreateConversation(id);
            if (token && conversationId) {
              await syncDirectLineActivities(id, token, conversationId, domain);
            }
          } catch (err) {
            console.error("Direct Line sync error during GET:", err.message);
          }
        }

        const session = serializeSession(db.prepare('SELECT * FROM sessions WHERE id = ?').get(id), true);
        return session ? json(res, 200, session) : json(res, 404, { error: 'Session not found' });
      }
      if (req.method === 'PATCH' && !isMessages) {
        const body = await readBody(req); const updates = []; const values = [];
        if (typeof body.pinned === 'boolean') { updates.push('pinned = ?'); values.push(body.pinned ? 1 : 0); }
        if (typeof body.archived === 'boolean') { updates.push('archived = ?'); values.push(body.archived ? 1 : 0); }
        if (typeof body.title === 'string' && body.title.trim()) { updates.push('title = ?'); values.push(body.title.trim().slice(0, 80)); }
        if (!updates.length) return json(res, 400, { error: 'No supported fields supplied' });
        values.push(id); db.prepare(`UPDATE sessions SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...values);
        const session = serializeSession(db.prepare('SELECT * FROM sessions WHERE id = ?').get(id), true);
        return session ? json(res, 200, session) : json(res, 404, { error: 'Session not found' });
      }
      if (req.method === 'POST' && isMessages) {
        const body = await readBody(req);
        if (!['user', 'assistant'].includes(body.role) || !String(body.text || '').trim()) return json(res, 400, { error: 'role and text are required' });
        let textToSave = String(body.text).trim();
        if (body.role === 'assistant') {
          textToSave = sanitizeMessageText(textToSave);
        }
        const result = db.prepare('INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)').run(id, body.role, textToSave);
        db.prepare('UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);
        return json(res, 201, { id: Number(result.lastInsertRowid), sessionId: id, role: body.role, text: textToSave });
      }
      if (req.method === 'DELETE' && !isMessages) {
        db.prepare('DELETE FROM messages WHERE session_id = ?').run(id); db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
        return json(res, 200, { deleted: true });
      }
    }
    json(res, 404, { error: 'Not found' });
  } catch (error) { json(res, 500, { error: error.message }); }
});

const port = Number(process.env.API_PORT || 3001);
server.listen(port, () => console.log(`MyLiva API running at http://localhost:${port}`));
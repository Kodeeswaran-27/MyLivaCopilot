import { DatabaseSync } from 'node:sqlite';
const db = new DatabaseSync('data/enterprise-gpt.sqlite');
console.log(db.prepare("SELECT id, session_id, role, content, activity_id FROM messages WHERE role = 'user' ORDER BY id DESC LIMIT 5").all());

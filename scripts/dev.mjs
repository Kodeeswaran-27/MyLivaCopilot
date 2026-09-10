import '../server.mjs';
import { createServer } from 'vite';

for (let attempt = 0; attempt < 30; attempt += 1) {
  try {
    const response = await fetch('http://127.0.0.1:3001/api/health');
    if (response.ok) break;
  } catch { /* SQLite API is still starting */ }
  await new Promise((resolve) => setTimeout(resolve, 100));
}

const vite = await createServer();
await vite.listen();
vite.printUrls();

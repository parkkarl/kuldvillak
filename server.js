import express from 'express';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { listTasks, readTask } from './src/fileReader.js';
import { getQuestionsForTask, getBankSize } from './src/questionStore.js';

await loadEnv();

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json({ limit: '1mb' }));

// Cloudflare aggressively caches static .js/.css for 4h regardless of the
// origin Cache-Control header (it overrides). HTML is served as 'dynamic' so
// it stays fresh. So: rewrite /app.js and /style.css references in HTML to
// include ?v=<startupId> on the way out — every container restart forces a
// fresh URL, which CF treats as a brand-new asset.
const startupId = Date.now().toString(36);

app.get(['/', '/index.html'], async (req, res, next) => {
  try {
    let html = await fs.readFile(path.resolve('public', 'index.html'), 'utf8');
    html = html
      .replace('href="/style.css"', `href="/style.css?v=${startupId}"`)
      .replace('src="/app.js"', `src="/app.js?v=${startupId}"`);
    res.type('html').setHeader('Cache-Control', 'no-cache').send(html);
  } catch (err) {
    next(err);
  }
});

app.use(express.static(path.resolve('public'), {
  setHeaders: (res, filePath) => {
    if (/\.(html|js|css)$/.test(filePath)) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await listTasks();
    const withBankSize = await Promise.all(
      tasks.map(async (t) => ({ ...t, bankSize: await getBankSize(t.id) })),
    );
    res.json({ tasks: withBankSize });
  } catch (err) {
    console.error('GET /api/tasks failed:', err);
    res.status(500).json({ error: 'Ülesannete loend ei avanenud' });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
  try {
    const task = await readTask(req.params.id);
    const bankSize = await getBankSize(task.id);
    res.json({ ...task, bankSize });
  } catch (err) {
    console.warn('GET /api/tasks/:id failed:', err.message);
    res.status(404).json({ error: err.message });
  }
});

app.post('/api/tasks/:id/questions', async (req, res) => {
  try {
    const task = await readTask(req.params.id);
    const { questions, bankSize } = await getQuestionsForTask(task.id);
    const withIds = questions.map((q, i) => ({
      ...q,
      id: `${task.id}-${Date.now()}-${i}`,
    }));
    res.json({
      questions: withIds,
      taskId: task.id,
      taskTitle: task.title,
      bankSize,
    });
  } catch (err) {
    console.error('POST /api/tasks/:id/questions failed:', err);
    res.status(500).json({ error: `Küsimuste laadimine ebaõnnestus: ${err.message}` });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Mitteleitud' });
});

app.listen(PORT, () => {
  console.log(`Miljonimäng kuulab: http://localhost:${PORT}`);
});

async function loadEnv() {
  try {
    const raw = await fs.readFile('.env', 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^"|"$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn('.env lugemine ebaõnnestus:', err.message);
  }
}

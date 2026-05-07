import express from 'express';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { listTasks, readTask } from './src/fileReader.js';
import { generateQuestions, generateHint, isAiEnabled } from './src/aiClient.js';

await loadEnv();

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.resolve('public')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, ai: isAiEnabled() });
});

app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await listTasks();
    res.json({ tasks, ai: isAiEnabled() });
  } catch (err) {
    console.error('GET /api/tasks failed:', err);
    res.status(500).json({ error: 'Ulesannete loend ei avanenud' });
  }
});

app.get('/api/tasks/:id', async (req, res) => {
  try {
    const task = await readTask(req.params.id);
    res.json(task);
  } catch (err) {
    console.warn('GET /api/tasks/:id failed:', err.message);
    res.status(404).json({ error: err.message });
  }
});

app.post('/api/tasks/:id/questions', async (req, res) => {
  try {
    const task = await readTask(req.params.id);
    const result = await generateQuestions(task);
    const questions = result.questions.map((q, i) => ({
      ...q,
      id: `${task.id}-${Date.now()}-${i}`,
    }));
    res.json({ questions, source: result.source, taskId: task.id, taskTitle: task.title });
  } catch (err) {
    console.error('POST /api/tasks/:id/questions failed:', err);
    res.status(500).json({ error: `Kusimuste genereerimine ebaonnestus: ${err.message}` });
  }
});

app.post('/api/tasks/:id/hint', async (req, res) => {
  try {
    const { question } = req.body || {};
    if (!question || !Array.isArray(question.options)) {
      return res.status(400).json({ error: 'Korrektne kusimus puudub' });
    }
    const task = await readTask(req.params.id);
    const hint = await generateHint(task, question);
    res.json({ hint });
  } catch (err) {
    console.error('POST /api/tasks/:id/hint failed:', err);
    res.status(500).json({ error: `Vihje ei saadud: ${err.message}` });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Mitteleitud' });
});

app.listen(PORT, () => {
  const aiNote = isAiEnabled() ? 'paris AI uhendus aktiivne' : 'mock-kusimused (ANTHROPIC_API_KEY puudub)';
  console.log(`Miljonimang kuulab: http://localhost:${PORT}  [${aiNote}]`);
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
    if (err.code !== 'ENOENT') console.warn('.env lugemine ebaonnestus:', err.message);
  }
}

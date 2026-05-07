import { promises as fs } from 'node:fs';
import path from 'node:path';

const INPUT_DIR = path.resolve('input');

const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'vendor', 'dist', 'build',
  '__pycache__', '.venv', '.idea', '.vscode', '.cache',
]);

const TEXT_EXTENSIONS = new Set([
  '.md', '.html', '.htm', '.css', '.scss', '.js', '.mjs', '.cjs',
  '.ts', '.tsx', '.jsx', '.json', '.py', '.rb', '.php', '.java',
  '.kt', '.go', '.rs', '.c', '.h', '.cpp', '.hpp', '.cs', '.sql',
  '.yml', '.yaml', '.toml', '.ini', '.txt', '.xml', '.svg', '.vue',
  '.svelte', '.sh', '.bash', '.zsh', '.fish',
]);

const MAX_FILE_BYTES = 200 * 1024;
const MAX_TOTAL_BYTES = 800 * 1024;

function isNumericDir(name) {
  return /^\d+$/.test(name);
}

async function listTaskDirs() {
  try {
    const entries = await fs.readdir(INPUT_DIR, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && isNumericDir(e.name))
      .map((e) => e.name)
      .sort();
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function readAssignmentTitle(taskId) {
  const assignmentPath = path.join(INPUT_DIR, taskId, 'assignment.md');
  try {
    const content = await fs.readFile(assignmentPath, 'utf8');
    const firstHeading = content.match(/^#\s+(.+)$/m);
    return firstHeading ? firstHeading[1].trim() : `Ulesanne ${taskId}`;
  } catch {
    return `Ulesanne ${taskId} (assignment.md puudub)`;
  }
}

export async function listTasks() {
  const ids = await listTaskDirs();
  const tasks = await Promise.all(
    ids.map(async (id) => ({ id, title: await readAssignmentTitle(id) })),
  );
  return tasks;
}

async function walkDir(dir, basePath, collected) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(basePath, full);
    if (entry.isDirectory()) {
      await walkDir(full, basePath, collected);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!TEXT_EXTENSIONS.has(ext) && entry.name !== 'README') continue;
      const stat = await fs.stat(full);
      if (stat.size > MAX_FILE_BYTES) {
        collected.push({ path: rel, content: `[fail liiga suur (${stat.size} baiti) — sisu jaeti vahele]`, truncated: true });
        continue;
      }
      const content = await fs.readFile(full, 'utf8');
      collected.push({ path: rel, content, truncated: false });
    }
  }
}

function trimToBudget(files, budget) {
  let used = 0;
  const out = [];
  for (const f of files) {
    const size = Buffer.byteLength(f.content, 'utf8');
    if (used + size > budget) {
      const remaining = Math.max(0, budget - used);
      if (remaining > 200) {
        out.push({ ...f, content: f.content.slice(0, remaining) + '\n... [kärbitud konteksti pikkuse tõttu]', truncated: true });
        used = budget;
      }
      break;
    }
    out.push(f);
    used += size;
  }
  return out;
}

export async function readTask(taskId) {
  if (!isNumericDir(taskId)) {
    throw new Error(`Vigane ülesande ID: ${taskId}`);
  }
  const taskDir = path.join(INPUT_DIR, taskId);
  try {
    await fs.access(taskDir);
  } catch {
    throw new Error(`Ülesannet ${taskId} ei leitud`);
  }

  const allFiles = [];
  await walkDir(taskDir, taskDir, allFiles);

  const assignmentFile = allFiles.find((f) => f.path === 'assignment.md');
  const otherFiles = allFiles.filter((f) => f.path !== 'assignment.md');
  otherFiles.sort((a, b) => a.path.localeCompare(b.path));

  const ordered = assignmentFile ? [assignmentFile, ...otherFiles] : otherFiles;
  const trimmed = trimToBudget(ordered, MAX_TOTAL_BYTES);

  const title = await readAssignmentTitle(taskId);

  return {
    id: taskId,
    title,
    assignment: assignmentFile?.content ?? '',
    files: trimmed,
  };
}

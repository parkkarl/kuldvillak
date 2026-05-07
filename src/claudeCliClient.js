import { spawn } from 'node:child_process';

const BIN = () => process.env.CLAUDE_CLI_BIN || 'claude';
const MODEL = () => process.env.CLAUDE_CLI_MODEL || 'claude-sonnet-4-6';
const TIMEOUT_MS = () => Number(process.env.CLAUDE_CLI_TIMEOUT_MS) || 240_000;
const FORCE_OFF = () => process.env.USE_CLAUDE_CLI === 'false';

let availableCache = { value: null, until: 0 };

export function getCliInfo() {
  return { bin: BIN(), model: MODEL() };
}

export async function isClaudeCliAvailable() {
  if (FORCE_OFF()) return false;
  const now = Date.now();
  if (availableCache.value !== null && now < availableCache.until) {
    return availableCache.value;
  }
  const ok = await checkBinary();
  availableCache = { value: ok, until: now + 30_000 };
  return ok;
}

function checkBinary() {
  return new Promise((resolve) => {
    let done = false;
    let proc;
    const finish = (v) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { proc?.kill(); } catch { /* ignore */ }
      resolve(v);
    };
    const timer = setTimeout(() => finish(false), 3000);
    try {
      proc = spawn(BIN(), ['--version'], { stdio: 'ignore' });
      proc.on('error', () => finish(false));
      proc.on('exit', (code) => finish(code === 0));
    } catch {
      finish(false);
    }
  });
}

function runCli({ systemPrompt, userMessage }) {
  return new Promise((resolve, reject) => {
    const args = [
      '-p', userMessage,
      '--append-system-prompt', systemPrompt,
      '--model', MODEL(),
      '--output-format', 'text',
    ];

    let proc;
    try {
      proc = spawn(BIN(), args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env },
      });
    } catch (err) {
      reject(new Error(`Claude CLI kaivitamine ebaonnestus: ${err.message}`));
      return;
    }

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (c) => { stdout += c.toString('utf8'); });
    proc.stderr.on('data', (c) => { stderr += c.toString('utf8'); });

    const timer = setTimeout(() => {
      try { proc.kill('SIGTERM'); } catch { /* ignore */ }
      reject(new Error(`Claude CLI aegus ${TIMEOUT_MS()} ms parast — kontrolli, kas oled sisse logitud (claude /login)`));
    }, TIMEOUT_MS());

    proc.on('error', (err) => {
      clearTimeout(timer);
      if (err.code === 'ENOENT') {
        reject(new Error(`Claude CLI binaarit '${BIN()}' ei leitud — kas claude on PATH-il?`));
      } else {
        reject(new Error(`Claude CLI: ${err.message}`));
      }
    });

    proc.on('exit', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve(stdout);
        return;
      }
      const tail = (stderr || stdout).slice(-500).trim();
      reject(new Error(`Claude CLI lopetas koodiga ${code}: ${tail || '(tuhi valjund)'}`));
    });
  });
}

export async function claudeCliQuestions({ systemPrompt, userMessage }) {
  return runCli({ systemPrompt, userMessage });
}

export async function claudeCliHint({ systemPrompt, userMessage }) {
  const text = await runCli({ systemPrompt, userMessage });
  return text.trim();
}

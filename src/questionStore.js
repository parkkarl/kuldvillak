import { promises as fs } from 'node:fs';
import path from 'node:path';

const INPUT_DIR = path.resolve('input');

function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function shuffleQuestionOptions(question) {
  const indices = [0, 1, 2, 3];
  const shuffled = shuffle(indices);
  const newOptions = shuffled.map((origIdx) => question.options[origIdx]);
  const newCorrectIndex = shuffled.indexOf(question.correctIndex);
  return { ...question, options: newOptions, correctIndex: newCorrectIndex };
}

function validateBank(bank, taskId) {
  if (!Array.isArray(bank)) {
    throw new Error(`questions.json (${taskId}) ei ole massiiv`);
  }
  for (let i = 0; i < bank.length; i++) {
    const q = bank[i];
    if (typeof q.question !== 'string') throw new Error(`Küsimus #${i} (${taskId}): puudub question`);
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error(`Küsimus #${i} (${taskId}): vajab 4 vastusevarianti`);
    }
    if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3) {
      throw new Error(`Küsimus #${i} (${taskId}): vigane correctIndex`);
    }
    if (typeof q.level !== 'number' || q.level < 1 || q.level > 15) {
      throw new Error(`Küsimus #${i} (${taskId}): level peab olema 1-15`);
    }
  }
}

export async function loadBank(taskId) {
  const file = path.join(INPUT_DIR, taskId, 'questions.json');
  const raw = await fs.readFile(file, 'utf8');
  const bank = JSON.parse(raw);
  validateBank(bank, taskId);
  return bank;
}

/**
 * Pick exactly 15 questions — one per level (1..15) — from the bank.
 * If a level has multiple candidates, randomize within the level.
 * If a level has none, throw (the bank is incomplete).
 */
export function pickFifteen(bank) {
  const byLevel = new Map();
  for (const q of bank) {
    if (!byLevel.has(q.level)) byLevel.set(q.level, []);
    byLevel.get(q.level).push(q);
  }
  const picked = [];
  for (let level = 1; level <= 15; level++) {
    const candidates = byLevel.get(level);
    if (!candidates || candidates.length === 0) {
      throw new Error(`Küsimustepank ei sisalda ühtegi küsimust raskusele ${level}`);
    }
    const choice = candidates[Math.floor(Math.random() * candidates.length)];
    picked.push(shuffleQuestionOptions(choice));
  }
  return picked;
}

export async function getQuestionsForTask(taskId) {
  const bank = await loadBank(taskId);
  return { questions: pickFifteen(bank), bankSize: bank.length };
}

export async function getBankSize(taskId) {
  try {
    const bank = await loadBank(taskId);
    return bank.length;
  } catch {
    return 0;
  }
}

import Anthropic from '@anthropic-ai/sdk';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const PROMPT_PATH = path.resolve('prompts', 'question-generation.md');
const HINT_PROMPT_PATH = path.resolve('prompts', 'hint-generation.md');

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

let cachedSystemPrompt = null;
let cachedHintPrompt = null;

async function loadSystemPrompt() {
  if (cachedSystemPrompt) return cachedSystemPrompt;
  cachedSystemPrompt = await fs.readFile(PROMPT_PATH, 'utf8');
  return cachedSystemPrompt;
}

async function loadHintPrompt() {
  if (cachedHintPrompt) return cachedHintPrompt;
  cachedHintPrompt = await fs.readFile(HINT_PROMPT_PATH, 'utf8');
  return cachedHintPrompt;
}

export function isAiEnabled() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function buildContext(task) {
  const parts = [];
  parts.push(`# Ulesande pealkiri\n${task.title}`);
  parts.push(`# assignment.md\n${task.assignment || '[puudub]'}`);
  if (task.files.length === 0) {
    parts.push('# Lahendusfailid\n[puudub]');
  } else {
    parts.push('# Lahendusfailid');
    for (const f of task.files) {
      if (f.path === 'assignment.md') continue;
      parts.push(`\n## ${f.path}\n\`\`\`\n${f.content}\n\`\`\``);
    }
  }
  return parts.join('\n\n');
}

function extractJson(text) {
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenceMatch ? fenceMatch[1] : text;
  const start = candidate.indexOf('[');
  const end = candidate.lastIndexOf(']');
  if (start === -1 || end === -1) {
    throw new Error('AI vastusest ei leitud JSON-massiivi');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function validateQuestions(questions) {
  if (!Array.isArray(questions)) throw new Error('Oodatud massiiv');
  if (questions.length < 15) {
    throw new Error(`Oodatud vahemalt 15 kusimust, saadi ${questions.length}`);
  }
  return questions.slice(0, 15).map((q, i) => {
    if (typeof q.question !== 'string') throw new Error(`Kusimus ${i}: puudub question`);
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      throw new Error(`Kusimus ${i}: vajab 4 vastusevarianti`);
    }
    const correctIndex = Number(q.correctIndex);
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      throw new Error(`Kusimus ${i}: vigane correctIndex`);
    }
    return {
      level: Number(q.level) || i + 1,
      question: q.question,
      options: q.options.map(String),
      correctIndex,
      explanation: typeof q.explanation === 'string' ? q.explanation : '',
    };
  });
}

export async function generateQuestions(task) {
  if (!isAiEnabled()) {
    return { questions: generateMockQuestions(task), source: 'mock' };
  }

  const systemPrompt = await loadSystemPrompt();
  const userMessage = buildContext(task);

  const client = getClient();
  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');

  const parsed = extractJson(text);
  const questions = validateQuestions(parsed);
  return { questions, source: 'anthropic' };
}

export async function generateHint(task, question) {
  if (!isAiEnabled()) {
    return generateMockHint(question);
  }
  const systemPrompt = await loadHintPrompt();
  const client = getClient();
  const response = await client.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 200,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Ulesanne: ${task.title}\n\nKusimus: ${question.question}\n\nVastusevariandid:\n${question.options
          .map((o, i) => `${'ABCD'[i]}) ${o}`)
          .join('\n')}\n\nAnna lyhike vihje (1-2 lauset), mis suunab oige vastuse poole, kuid ei utle seda otse.`,
      },
    ],
  });
  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  return text || generateMockHint(question);
}

function generateMockHint(question) {
  const correct = question.options[question.correctIndex];
  const firstWord = String(correct).split(/\s+/)[0];
  return `Vihje: motle hoolega — oige vastus algab tahega "${firstWord[0]}" ja seostub kontseptsiooniga, mis on ulesande lahenduse keskmes.`;
}

function generateMockQuestions(task) {
  const fileNames = task.files.map((f) => f.path).filter((p) => p !== 'assignment.md');
  const primary = fileNames[0] || 'index.html';
  const hasJs = fileNames.some((n) => n.endsWith('.js'));
  const hasCss = fileNames.some((n) => n.endsWith('.css'));
  const hasHtml = fileNames.some((n) => n.endsWith('.html'));
  const hasJson = fileNames.some((n) => n.endsWith('.json'));
  const titleSlug = task.title.toLowerCase();

  const bank = [
    {
      level: 1,
      question: `Mis on selle ulesande pohieesmark?`,
      options: [
        `Luua lahendus, mis vastab ulesande "${task.title}" nouetele`,
        'Eemaldada koik failid kaustast',
        'Kompileerida operatsioonisusteem',
        'Joonistada raster-pilti',
      ],
      correctIndex: 0,
      explanation: 'assignment.md kirjeldab ulesande eesmarki ja noudeid.',
    },
    {
      level: 2,
      question: `Milline fail (${primary}) sisaldab lahenduse pohilist sisu?`,
      options: ['random.bin', primary, 'unknown.xyz', 'placeholder.tmp'],
      correctIndex: 1,
      explanation: `Fail ${primary} on lahenduse osa.`,
    },
    {
      level: 3,
      question: hasHtml
        ? 'Milleks kasutatakse HTML-faili veebirakenduses?'
        : 'Milleks kasutatakse pohifaili selles lahenduses?',
      options: [
        'Ainult kommentaaride kirjutamiseks',
        'Lehe struktuuri ja sisu kirjeldamiseks',
        'Andmebaasi kaivitamiseks',
        'Operatsioonisusteemi uuendamiseks',
      ],
      correctIndex: 1,
      explanation: 'HTML kirjeldab veebilehe struktuuri ja sisu.',
    },
    {
      level: 4,
      question: hasCss
        ? 'Mida teeb CSS-fail?'
        : 'Mida teevad ulesande tugifailid?',
      options: [
        'Toetavad lahenduse esitlust voi loogikat',
        'Saadavad e-kirju',
        'Lahevad otse andmebaasi',
        'Loovad uue programmeerimiskeele',
      ],
      correctIndex: 0,
      explanation: 'Tugifailid (CSS, abifailid) toetavad lahenduse esitlust voi loogikat.',
    },
    {
      level: 5,
      question: 'Miks on ulesande sonastus (assignment.md) lahenduse hindamisel oluline?',
      options: [
        'See on lihtsalt dekoratsioon',
        'See defineerib, milline lahendus loetakse oigeks',
        'See kustutatakse enne hindamist',
        'See on automaatselt loodud ja seda ei loeta',
      ],
      correctIndex: 1,
      explanation: 'Sonastus maarab nouded, mille alusel lahendust hinnatakse.',
    },
    {
      level: 6,
      question: hasJs
        ? 'Mis on ja-funktsioonide pohiline ulesanne brauseris?'
        : 'Kuidas korraldada lahenduse loogikat?',
      options: [
        'Reageerida sundmustele ja muuta lehe sisu',
        'Asendada operatsioonisusteem',
        'Rakendada CSS otse serveris',
        'Saata HTTP-paringuid juhuslikult',
      ],
      correctIndex: 0,
      explanation: 'JavaScript kaitleb sundmusi ja muudab DOMi.',
    },
    {
      level: 7,
      question: 'Miks tuleb kasutaja sisendit valideerida?',
      options: [
        'Et vahendada vigu ja turvaprobleeme',
        'Et lahendus oleks aeglasem',
        'Et CSS toleks paremini',
        'See pole kunagi vajalik',
      ],
      correctIndex: 0,
      explanation: 'Valideerimine ennetab vigu ja turvaprobleeme nagu XSS.',
    },
    {
      level: 8,
      question: 'Mis juhtub, kui koodis viidatakse elemendile, mida HTML-is ei ole?',
      options: [
        'Brauser parandab vea automaatselt',
        'querySelector tagastab null ja jargnev kood voib visata vea',
        'Lehte ei kuvata uldse',
        'Server taaskaivitub',
      ],
      correctIndex: 1,
      explanation: 'querySelector tagastab puuduva elemendi puhul null.',
    },
    {
      level: 9,
      question: hasJson
        ? 'Milleks kasutatakse JSON-i andmevahetuses?'
        : 'Kuidas hoida andmeid struktureeritud kujul?',
      options: [
        'Struktureeritud andmete vahetuseks ja salvestamiseks',
        'Pildi tihendamiseks',
        'Heli muundamiseks',
        'CSS-i asendamiseks',
      ],
      correctIndex: 0,
      explanation: 'JSON on standardne struktureeritud andmevorming.',
    },
    {
      level: 10,
      question: `Mis on lahenduse "${task.title}" puhul kasutaja peamine interaktsioon?`,
      options: [
        'Kasutaja annab sisendi ja saab tulemuse',
        'Kasutaja peab failid kompileerima ise',
        'Kasutaja kirjutab oma serveri',
        'Kasutaja peab paigaldama uue brauseri',
      ],
      correctIndex: 0,
      explanation: 'Lahendus on disainitud kasutaja sisendi tootlemiseks.',
    },
    {
      level: 11,
      question: 'Milline turvarisk tekib, kui kasutaja sisend lisatakse otse innerHTML kaudu?',
      options: [
        'Pole mingit riski',
        'XSS — pahatahtlik skript voib jouda lehele',
        'Brauser uuendab end automaatselt',
        'CSS-i kasutamine muutub voimatuks',
      ],
      correctIndex: 1,
      explanation: 'innerHTML koos valideerimata sisendiga voimaldab XSS-rundeid.',
    },
    {
      level: 12,
      question: 'Kuidas teha lahendust paremini hooldatavaks?',
      options: [
        'Jagada loogika kontseptuaalselt funktsioonideks ja moodulitesse',
        'Kirjutada koik uhte faili kommentaarideta',
        'Eemaldada koik muutujate nimed',
        'Vahetada keelt iga 10 rea jarel',
      ],
      correctIndex: 0,
      explanation: 'Modulaarsus ja selged nimed parandavad hooldatavust.',
    },
    {
      level: 13,
      question: 'Milline lahenduse osa voib muutuda probleemiks, kui andmehulk kasvab oluliselt?',
      options: [
        'Kogu DOM-i taastamine iga muudatuse korral',
        'CSS-i kommentaaride hulk',
        'Faili nimi',
        'Kasutaja ekraani heledus',
      ],
      correctIndex: 0,
      explanation: 'Suurte andmemahtude juures muutub naiivne DOM-i taasrendamine kitsaskohaks.',
    },
    {
      level: 14,
      question: 'Kuidas muuta lahendust nii, et see toetaks mitut sarnast ulesannet?',
      options: [
        'Eraldada konfiguratsioon ja andmed loogikast, parametriseerida funktsioonid',
        'Kopeerida fail viis korda erineva nimega',
        'Eemaldada koik andmed',
        'Kirjutada loogika ainult HTML-i sisse',
      ],
      correctIndex: 0,
      explanation: 'Konfiguratsiooni ja loogika eraldamine voimaldab taaskasutust.',
    },
    {
      level: 15,
      question: `Milline alternatiivne lahendus voiks olla "${titleSlug}" probleemile?`,
      options: [
        'Sama probleemi lahendamine teises arhitektuuris (raamistik, server-side, jne)',
        'Probleemi ignoreerimine',
        'Kasutaja palumine ise lahendada',
        'Kogu interneti taaskaivitamine',
      ],
      correctIndex: 0,
      explanation: 'Sama probleemi saab tihti lahendada erinevate arhitektuuriliste valikutega.',
    },
  ];

  return bank;
}

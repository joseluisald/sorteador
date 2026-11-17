export interface ParsedPlayerEntry {
  name: string;
  isGoalkeeper: boolean;
  skill?: number;
}

export interface ParseListResult {
  title: string;
  players: ParsedPlayerEntry[];
}

export const SAMPLE_WHATSAPP_LIST = `Lista treino dia 17 terça , churrasco @~Maicon Denzer :
1 benhur 
2 Josué 
3 Ricardo 
4 Luiz 
5 Bicudo 
6 Gugu
7 bigodi
8 japa 
9 Joaninhas 
10 Hilário 
11 Zé 
12 Adriano 
13 Vaner 🤦‍♂️
14 Tiago 
15 Guilherme 
16 Mateus 
17 Everton 
18 Eduardo 
19 jobeto 
20 Dionatan`;

const LOWERCASE_CONNECTORS = new Set(['da', 'de', 'do', 'das', 'dos', 'e']);

function formatPlayerName(raw: string): string {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';

  return cleaned
    .split(' ')
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && LOWERCASE_CONNECTORS.has(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

function stripEmojisAndArtifacts(text: string): string {
  return text
    // Remove WhatsApp formatting wrappers
    .replace(/[*_~`]/g, '')
    // Remove @mentions like @~Maicon Denzer or @551199999999
    .replace(/@~?[\p{L}\p{N}_.-]+(?:\s+[\p{L}\p{N}_.-]+)?/gu, (match) => {
      // Only strip full mention tokens when prefixed by @
      return match.startsWith('@') ? '' : match;
    })
    // Remove ZWJ, variation selectors, skin tone modifiers, and pictographic emojis
    .replace(/[\u200D\uFE0E\uFE0F]/g, '')
    .replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[♂♀⚧]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function looksLikeHeaderLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (/^\d+\s*[-.)\]]/.test(trimmed) || /^\d+\s+\p{L}/u.test(trimmed)) {
    return false;
  }
  const lower = trimmed.toLowerCase();
  if (trimmed.endsWith(':')) return true;
  if (
    /^(lista|treino|pelada|racha|jogo|fut|futebol|society|confirmados|suplentes|espera|data|horário|horario|local|quadra)\b/i.test(
      lower
    )
  ) {
    return true;
  }
  if (/^[-_=*•·]{3,}$/.test(trimmed)) return true;
  return false;
}

export function parseWhatsAppList(rawText: string): ParseListResult {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { title: '', players: [] };
  }

  let title = '';
  const hasNumberedLines = lines.some((l) =>
    /^\s*(?:\d{1,2}|[-•*])\s*[-.):\]]?\s*\p{L}/u.test(l)
  );

  const players: ParsedPlayerEntry[] = [];
  const seenNames = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];

    // Capture first header line as match title if applicable
    if (i === 0 && looksLikeHeaderLine(rawLine)) {
      const cleanedTitle = stripEmojisAndArtifacts(rawLine)
        .replace(/\s*[:\-–]+\s*$/, '')
        .replace(/\s*,\s*$/, '')
        .trim();
      if (cleanedTitle) {
        title = cleanedTitle;
      }
      continue;
    }

    // Skip section dividers or secondary headers like "Suplentes:" or "Lista:"
    if (looksLikeHeaderLine(rawLine)) {
      continue;
    }

    // Check if numbered/bulleted line when the list is predominantly numbered
    const numberedMatch = rawLine.match(
      /^(?:[*_]*\d{1,2}[*_]*\s*[-.):\]]?\s*|[-•*+]\s+)(.*)$/
    );

    let working = numberedMatch ? numberedMatch[1] : rawLine;

    // If list has numbered lines and a random non-numbered chatter line appears without a name pattern, skip obvious chatter
    if (hasNumberedLines && !numberedMatch && rawLine.split(' ').length > 5) {
      continue;
    }

    // Detect goalkeeper tags before stripping emojis
    const hasGloveEmoji = /🧤/.test(working);
    const hasGkTag =
      /\((?:g|gk|gol|goleiro)\)|\[(?:g|gk|gol|goleiro)\]|\b(?:goleiro|gk)\b/i.test(
        working
      );
    const isGoalkeeper = hasGloveEmoji || hasGkTag;

    // Remove GK tags cleanly
    working = working
      .replace(/\((?:g|gk|gol|goleiro)\)/gi, '')
      .replace(/\[(?:g|gk|gol|goleiro)\]/gi, '')
      .replace(/[-–/|]*\s*\b(?:goleiro|gk)\b/gi, '');

    // Detect optional trailing skill like "Benhur - 8" or "Benhur (8)"
    let detectedSkill: number | undefined;
    const trailingSkillMatch = working.match(
      /(?:\s*[-–|]\s*|\s*\()(\b(?:10|[1-9])\b)\)?\s*$/
    );
    if (trailingSkillMatch) {
      const parsedNum = Number(trailingSkillMatch[1]);
      if (parsedNum >= 1 && parsedNum <= 10) {
        detectedSkill = parsedNum;
        working = working.slice(0, trailingSkillMatch.index).trim();
      }
    }

    working = stripEmojisAndArtifacts(working);

    // Skip empty placeholder slots like "19 ____" or "20 -"
    working = working.replace(/^[-–_.\s]+|[-–_.\s]+$/g, '').trim();
    if (!working || !/\p{L}/u.test(working)) {
      continue;
    }

    const formattedName = formatPlayerName(working);
    const dedupeKey = formattedName.toLowerCase();

    if (!seenNames.has(dedupeKey)) {
      seenNames.add(dedupeKey);
      players.push({
        name: formattedName,
        isGoalkeeper,
        skill: detectedSkill,
      });
    }
  }

  return { title, players };
}

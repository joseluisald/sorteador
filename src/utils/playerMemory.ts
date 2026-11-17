import { Player } from '../types/pelada';

const MEMORY_KEY = 'pelada_certa_player_memory_v1';
const DRAFT_KEY = 'pelada_certa_current_draft_v1';

export interface SavedPlayerProfile {
  skill: number;
  isGoalkeeper: boolean;
  updatedAt: number;
}

export interface DraftSession {
  rawListText: string;
  matchTitle: string;
  players: Player[];
  teamCount: number;
}

export function normalizePlayerKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function loadPlayerMemory(): Record<string, SavedPlayerProfile> {
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, SavedPlayerProfile>;
  } catch {
    return {};
  }
}

export function savePlayersToMemory(players: Player[]): void {
  try {
    const current = loadPlayerMemory();
    const now = Date.now();
    for (const player of players) {
      const key = normalizePlayerKey(player.name);
      if (!key) continue;
      current[key] = {
        skill: Math.min(10, Math.max(1, Math.round(player.skill))),
        isGoalkeeper: Boolean(player.isGoalkeeper),
        updatedAt: now,
      };
    }
    localStorage.setItem(MEMORY_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadDraftSession(): DraftSession | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftSession;
  } catch {
    return null;
  }
}

export function saveDraftSession(draft: DraftSession): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Ignore storage errors
  }
}

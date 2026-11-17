export interface Player {
  id: string;
  name: string;
  skill: number; // 1 to 10
  isGoalkeeper: boolean;
  fromMemory?: boolean;
}

export interface TeamPalette {
  id: string;
  label: string;
  swatchHex: string;
  textClass: string;
  softBgClass: string;
  borderClass: string;
}

export interface Team {
  index: number;
  name: string;
  color: TeamPalette;
  players: Player[];
  totalSkill: number;
  averageSkill: number;
  goalkeeperCount: number;
}

export interface SortResult {
  teams: Team[];
  overallAverage: number;
  maxAverageDiff: number;
  totalPlayers: number;
  totalGoalkeepers: number;
  generatedAt: number;
}

export type AppStep = 'paste' | 'roster' | 'teams';

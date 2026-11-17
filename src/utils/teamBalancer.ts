import { Player, SortResult, Team, TeamPalette } from '../types/pelada';

export const TEAM_PALETTES: TeamPalette[] = [
  {
    id: 'emerald',
    label: 'Colete Verde',
    swatchHex: '#15803D',
    textClass: 'text-emerald-800',
    softBgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
  },
  {
    id: 'sky',
    label: 'Colete Azul',
    swatchHex: '#0369A1',
    textClass: 'text-sky-800',
    softBgClass: 'bg-sky-50',
    borderClass: 'border-sky-200',
  },
  {
    id: 'amber',
    label: 'Colete Amarelo',
    swatchHex: '#B45309',
    textClass: 'text-amber-800',
    softBgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
  },
  {
    id: 'rose',
    label: 'Colete Vermelho',
    swatchHex: '#BE123C',
    textClass: 'text-rose-800',
    softBgClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
  },
  {
    id: 'slate',
    label: 'Colete Preto',
    swatchHex: '#1E293B',
    textClass: 'text-slate-800',
    softBgClass: 'bg-slate-100',
    borderClass: 'border-slate-300',
  },
  {
    id: 'violet',
    label: 'Colete Roxo',
    swatchHex: '#6D28D9',
    textClass: 'text-violet-800',
    softBgClass: 'bg-violet-50',
    borderClass: 'border-violet-200',
  },
];

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sortBySkillDescWithTieShuffle(players: Player[], jitter = 0): Player[] {
  // Shuffle first so equal skills get randomized order each draw
  const shuffled = shuffleArray(players);
  if (jitter === 0) {
    return shuffled.sort((a, b) => b.skill - a.skill);
  }
  const scored = shuffled.map((p) => ({
    player: p,
    sortKey: p.skill + (Math.random() * 2 - 1) * jitter,
  }));
  scored.sort((a, b) => b.sortKey - a.sortKey);
  return scored.map((item) => item.player);
}

function computeTeamStats(
  buckets: Player[][],
  globalAverage: number
): number {
  let varianceSum = 0;
  for (const team of buckets) {
    if (team.length === 0) continue;
    const sum = team.reduce((acc, p) => acc + p.skill, 0);
    const avg = sum / team.length;
    const diff = avg - globalAverage;
    varianceSum += diff * diff;
  }
  return varianceSum;
}

function sortPlayersInsideTeam(players: Player[]): Player[] {
  return [...players].sort((a, b) => {
    if (a.isGoalkeeper !== b.isGoalkeeper) {
      return a.isGoalkeeper ? -1 : 1;
    }
    if (b.skill !== a.skill) {
      return b.skill - a.skill;
    }
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}

export function buildTeamObject(
  index: number,
  players: Player[]
): Team {
  const palette = TEAM_PALETTES[index % TEAM_PALETTES.length];
  const ordered = sortPlayersInsideTeam(players);
  const totalSkill = ordered.reduce((acc, p) => acc + p.skill, 0);
  const averageSkill = ordered.length > 0 ? totalSkill / ordered.length : 0;
  const goalkeeperCount = ordered.filter((p) => p.isGoalkeeper).length;

  return {
    index,
    name: `Time ${index + 1}`,
    color: palette,
    players: ordered,
    totalSkill,
    averageSkill,
    goalkeeperCount,
  };
}

export function summarizeTeams(teams: Team[]): SortResult {
  const allPlayers = teams.flatMap((t) => t.players);
  const totalPlayers = allPlayers.length;
  const totalGoalkeepers = allPlayers.filter((p) => p.isGoalkeeper).length;
  const overallAverage =
    totalPlayers > 0
      ? allPlayers.reduce((acc, p) => acc + p.skill, 0) / totalPlayers
      : 0;

  const activeAverages = teams
    .filter((t) => t.players.length > 0)
    .map((t) => t.averageSkill);
  const maxAverageDiff =
    activeAverages.length > 1
      ? Math.max(...activeAverages) - Math.min(...activeAverages)
      : 0;

  return {
    teams,
    overallAverage,
    maxAverageDiff,
    totalPlayers,
    totalGoalkeepers,
    generatedAt: Date.now(),
  };
}

export function generateBalancedTeams(
  players: Player[],
  requestedTeamCount: number,
  variationJitter = 0.25
): SortResult {
  const teamCount = Math.max(2, Math.min(requestedTeamCount, Math.max(2, players.length)));
  const buckets: Player[][] = Array.from({ length: teamCount }, () => []);

  if (players.length === 0) {
    return summarizeTeams(
      buckets.map((bucket, idx) => buildTeamObject(idx, bucket))
    );
  }

  // Target total players per team (difference <= 1)
  const baseSize = Math.floor(players.length / teamCount);
  const remainder = players.length % teamCount;
  // Randomize which teams get the extra player when players don't divide evenly
  const extraSlotOrder = shuffleArray(
    Array.from({ length: teamCount }, (_, i) => i)
  );
  const targetSizes = Array.from({ length: teamCount }, () => baseSize);
  for (let i = 0; i < remainder; i++) {
    targetSizes[extraSlotOrder[i]] += 1;
  }

  const goalkeepers = sortBySkillDescWithTieShuffle(
    players.filter((p) => p.isGoalkeeper),
    0
  );
  const outfielders = sortBySkillDescWithTieShuffle(
    players.filter((p) => !p.isGoalkeeper),
    variationJitter
  );

  // 1. Distribute goalkeepers evenly across teams first (snake order)
  const teamOrderForGKs = shuffleArray(
    Array.from({ length: teamCount }, (_, i) => i)
  );
  goalkeepers.forEach((gk, idx) => {
    const cycle = Math.floor(idx / teamCount);
    const pos = idx % teamCount;
    const orderIdx = cycle % 2 === 0 ? pos : teamCount - 1 - pos;
    let chosenTeam = teamOrderForGKs[orderIdx];

    // Safety check: ensure chosen team hasn't exceeded its target size
    if (buckets[chosenTeam].length >= targetSizes[chosenTeam]) {
      const fallback = buckets.findIndex(
        (b, tIdx) => b.length < targetSizes[tIdx]
      );
      if (fallback !== -1) chosenTeam = fallback;
    }
    buckets[chosenTeam].push(gk);
  });

  // 2. Assign outfield players greedily to eligible team with lowest current average/total
  for (const player of outfielders) {
    const eligibleIndices: number[] = [];
    for (let t = 0; t < teamCount; t++) {
      if (buckets[t].length < targetSizes[t]) {
        eligibleIndices.push(t);
      }
    }

    if (eligibleIndices.length === 0) break;

    eligibleIndices.sort((a, b) => {
      const sumA = buckets[a].reduce((acc, p) => acc + p.skill, 0);
      const sumB = buckets[b].reduce((acc, p) => acc + p.skill, 0);
      // Compare projected average impact when sizes differ slightly
      const avgA = buckets[a].length > 0 ? sumA / buckets[a].length : 0;
      const avgB = buckets[b].length > 0 ? sumB / buckets[b].length : 0;
      if (Math.abs(sumA - sumB) > 0.01) return sumA - sumB;
      return avgA - avgB;
    });

    buckets[eligibleIndices[0]].push(player);
  }

  // 3. Local pairwise swap optimization among outfield players (keeps GK distribution intact)
  const globalAverage =
    players.reduce((acc, p) => acc + p.skill, 0) / players.length;

  let currentCost = computeTeamStats(buckets, globalAverage);
  const maxPasses = 120;

  for (let pass = 0; pass < maxPasses; pass++) {
    let improved = false;

    for (let t1 = 0; t1 < teamCount; t1++) {
      for (let t2 = t1 + 1; t2 < teamCount; t2++) {
        for (let i = 0; i < buckets[t1].length; i++) {
          const p1 = buckets[t1][i];
          if (p1.isGoalkeeper) continue;

          for (let j = 0; j < buckets[t2].length; j++) {
            const p2 = buckets[t2][j];
            if (p2.isGoalkeeper) continue;
            if (p1.skill === p2.skill) continue;

            // Try swap
            buckets[t1][i] = p2;
            buckets[t2][j] = p1;

            const nextCost = computeTeamStats(buckets, globalAverage);
            if (nextCost < currentCost - 1e-6) {
              currentCost = nextCost;
              improved = true;
            } else {
              // Revert swap
              buckets[t1][i] = p1;
              buckets[t2][j] = p2;
            }
          }
        }
      }
    }

    if (!improved) break;
  }

  const builtTeams = buckets.map((bucket, idx) => buildTeamObject(idx, bucket));
  return summarizeTeams(builtTeams);
}

export function swapPlayersBetweenTeams(
  currentResult: SortResult,
  first: { teamIndex: number; playerId: string },
  second: { teamIndex: number; playerId: string }
): SortResult {
  if (first.teamIndex === second.teamIndex && first.playerId === second.playerId) {
    return currentResult;
  }

  const nextBuckets = currentResult.teams.map((t) => [...t.players]);
  const p1Idx = nextBuckets[first.teamIndex]?.findIndex(
    (p) => p.id === first.playerId
  );
  const p2Idx = nextBuckets[second.teamIndex]?.findIndex(
    (p) => p.id === second.playerId
  );

  if (p1Idx === -1 || p2Idx === -1 || p1Idx === undefined || p2Idx === undefined) {
    return currentResult;
  }

  const p1 = nextBuckets[first.teamIndex][p1Idx];
  const p2 = nextBuckets[second.teamIndex][p2Idx];
  nextBuckets[first.teamIndex][p1Idx] = p2;
  nextBuckets[second.teamIndex][p2Idx] = p1;

  const builtTeams = nextBuckets.map((bucket, idx) =>
    buildTeamObject(idx, bucket)
  );
  return summarizeTeams(builtTeams);
}

export function formatTeamsForWhatsApp(
  result: SortResult,
  matchTitle: string,
  includeRatings: boolean
): string {
  const header = matchTitle.trim()
    ? `⚽ *${matchTitle.trim()}*`
    : '⚽ *Times Sorteados*';

  const sections = result.teams.map((team) => {
    const avgPart = includeRatings
      ? ` (Média ${team.averageSkill.toFixed(1)})`
      : '';
    const teamHeader = `*${team.name} — ${team.color.label}*${avgPart}`;
    const lines = team.players.map((p, idx) => {
      const gkPrefix = p.isGoalkeeper ? '🧤 ' : '';
      const gkSuffix = p.isGoalkeeper ? ' (GOL)' : '';
      const ratingSuffix = includeRatings ? ` [${p.skill}]` : '';
      return `${idx + 1}. ${gkPrefix}${p.name}${gkSuffix}${ratingSuffix}`;
    });
    return `${teamHeader}\n${lines.join('\n')}`;
  });

  return `${header}\n\n${sections.join('\n\n')}`;
}

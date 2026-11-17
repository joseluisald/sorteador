import { useEffect, useMemo, useState } from 'react';
import { AppStep, Player, SortResult } from './types/pelada';
import {
  parseWhatsAppList,
  SAMPLE_WHATSAPP_LIST,
} from './utils/listParser';
import {
  loadDraftSession,
  loadPlayerMemory,
  normalizePlayerKey,
  saveDraftSession,
  savePlayersToMemory,
} from './utils/playerMemory';
import {
  generateBalancedTeams,
  swapPlayersBetweenTeams,
} from './utils/teamBalancer';
import { PasteListStep } from './components/PasteListStep';
import { RosterEditorStep } from './components/RosterEditorStep';
import { TeamsResultStep } from './components/TeamsResultStep';

function suggestTeamCount(playerCount: number): number {
  if (playerCount <= 13) return 2;
  if (playerCount <= 17) return 3;
  if (playerCount <= 23) return 4;
  return 5;
}

function makePlayerId(name: string, index: number): string {
  return `p_${Date.now()}_${index}_${normalizePlayerKey(name).replace(/\s+/g, '_')}`;
}

export default function App() {
  const initialDraft = useMemo(() => loadDraftSession(), []);

  const [step, setStep] = useState<AppStep>('paste');
  const [rawText, setRawText] = useState<string>(
    initialDraft?.rawListText ?? ''
  );
  const [matchTitle, setMatchTitle] = useState<string>(
    initialDraft?.matchTitle ?? ''
  );
  const [players, setPlayers] = useState<Player[]>(
    initialDraft?.players ?? []
  );
  const [teamCount, setTeamCount] = useState<number>(
    initialDraft?.teamCount ?? 4
  );
  const [sortResult, setSortResult] = useState<SortResult | null>(null);

  const parsedPreview = useMemo(() => parseWhatsAppList(rawText), [rawText]);

  // Persist current draft automatically
  useEffect(() => {
    saveDraftSession({
      rawListText: rawText,
      matchTitle,
      players,
      teamCount,
    });
  }, [rawText, matchTitle, players, teamCount]);

  // Persist player skill & goalkeeper memory whenever players change
  useEffect(() => {
    if (players.length > 0) {
      savePlayersToMemory(players);
    }
  }, [players]);

  const handleRawTextChange = (text: string) => {
    setRawText(text);
    const parsed = parseWhatsAppList(text);
    if (parsed.title && (!matchTitle.trim() || matchTitle === parsedPreview.title)) {
      setMatchTitle(parsed.title);
    }
  };

  const handleLoadSample = () => {
    setRawText(SAMPLE_WHATSAPP_LIST);
    const parsed = parseWhatsAppList(SAMPLE_WHATSAPP_LIST);
    setMatchTitle(parsed.title);
  };

  const handleClearPaste = () => {
    setRawText('');
    setMatchTitle('');
  };

  const handleProceedToRoster = () => {
    const parsed = parseWhatsAppList(rawText);
    if (parsed.players.length === 0) return;

    const memory = loadPlayerMemory();
    const existingByKey = new Map<string, Player>();
    for (const p of players) {
      existingByKey.set(normalizePlayerKey(p.name), p);
    }

    const hydratedPlayers: Player[] = parsed.players.map((entry, idx) => {
      const key = normalizePlayerKey(entry.name);
      const current = existingByKey.get(key);
      if (current) {
        return {
          ...current,
          name: entry.name,
          isGoalkeeper: entry.isGoalkeeper || current.isGoalkeeper,
          skill: entry.skill ?? current.skill,
        };
      }
      const remembered = memory[key];
      if (remembered) {
        return {
          id: makePlayerId(entry.name, idx),
          name: entry.name,
          skill: entry.skill ?? remembered.skill,
          isGoalkeeper: entry.isGoalkeeper || remembered.isGoalkeeper,
          fromMemory: true,
        };
      }
      return {
        id: makePlayerId(entry.name, idx),
        name: entry.name,
        skill: entry.skill ?? 5,
        isGoalkeeper: entry.isGoalkeeper,
      };
    });

    if (parsed.title && !matchTitle.trim()) {
      setMatchTitle(parsed.title);
    }

    setPlayers(hydratedPlayers);
    setTeamCount(suggestTeamCount(hydratedPlayers.length));
    setStep('roster');
  };

  const handleUpdatePlayer = (id: string, patch: Partial<Player>) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
  };

  const handleAddPlayer = (name: string) => {
    const memory = loadPlayerMemory();
    const remembered = memory[normalizePlayerKey(name)];
    const formatted =
      name.trim().charAt(0).toUpperCase() + name.trim().slice(1);

    const newPlayer: Player = {
      id: makePlayerId(formatted, players.length + 1),
      name: formatted,
      skill: remembered?.skill ?? 5,
      isGoalkeeper: remembered?.isGoalkeeper ?? false,
      fromMemory: Boolean(remembered),
    };
    setPlayers((prev) => [...prev, newPlayer]);
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleResetAllSkills = (value: number) => {
    setPlayers((prev) => prev.map((p) => ({ ...p, skill: value })));
  };

  const handleGenerateTeams = (customCount?: number) => {
    const activeCount = customCount ?? teamCount;
    const validPlayers = players.filter((p) => p.name.trim().length > 0);
    if (validPlayers.length < 2) return;

    savePlayersToMemory(validPlayers);
    const result = generateBalancedTeams(validPlayers, activeCount, 0.25);
    setSortResult(result);
    setStep('teams');
  };

  const handleReshuffle = () => {
    const validPlayers = players.filter((p) => p.name.trim().length > 0);
    if (validPlayers.length < 2) return;
    const result = generateBalancedTeams(validPlayers, teamCount, 0.45);
    setSortResult(result);
  };

  const handleTeamCountChangeInResults = (count: number) => {
    setTeamCount(count);
    handleGenerateTeams(count);
  };

  const handleSwapPlayers = (
    first: { teamIndex: number; playerId: string },
    second: { teamIndex: number; playerId: string }
  ) => {
    if (!sortResult) return;
    setSortResult(swapPlayersBetweenTeams(sortResult, first, second));
  };

  const handleTopAction = () => {
    if (step === 'paste') {
      if (parsedPreview.players.length >= 2) {
        handleProceedToRoster();
      } else {
        handleLoadSample();
      }
      return;
    }
    if (step === 'roster') {
      handleGenerateTeams();
      return;
    }
    // On teams step -> quick reshuffle
    handleReshuffle();
  };

  const topActionLabel =
    step === 'paste'
      ? parsedPreview.players.length >= 2
        ? 'Avaliar Lista'
        : 'Testar Exemplo'
      : step === 'roster'
        ? 'Sortear Times'
        : 'Sortear de Novo';

  const canGoRoster = players.length >= 2 || parsedPreview.players.length >= 2;
  const canGoTeams = sortResult !== null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F6] text-slate-900">
      {/* 3-Zone Top Bar */}
      <header className="md:sticky md:top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setStep('paste')}
            className="text-lg font-display font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Pelada Certa
          </button>

          {/* Zone 2: Clean Single-Line Navigation Steps */}
          <nav
            aria-label="Etapas do sorteio"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            <button
              type="button"
              onClick={() => setStep('paste')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                step === 'paste'
                  ? 'border-emerald-800 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              1. Colar Lista
            </button>
            <button
              type="button"
              disabled={!canGoRoster}
              onClick={() => {
                if (players.length < 2 && parsedPreview.players.length >= 2) {
                  handleProceedToRoster();
                } else if (players.length >= 2) {
                  setStep('roster');
                }
              }}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                step === 'roster'
                  ? 'border-emerald-800 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              2. Notas e Goleiros
            </button>
            <button
              type="button"
              disabled={!canGoTeams}
              onClick={() => setStep('teams')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                step === 'teams'
                  ? 'border-emerald-800 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              3. Times Sorteados
            </button>
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={handleTopAction}
              className="px-4 py-2 min-h-[40px] text-xs sm:text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {topActionLabel}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Compact Step Switcher (below top bar) */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2">
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setStep('paste')}
            className={`py-2 px-2 rounded-md text-center truncate cursor-pointer ${
              step === 'paste'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600'
            }`}
          >
            1. Lista
          </button>
          <button
            type="button"
            disabled={!canGoRoster}
            onClick={() => {
              if (players.length < 2 && parsedPreview.players.length >= 2) {
                handleProceedToRoster();
              } else if (players.length >= 2) {
                setStep('roster');
              }
            }}
            className={`py-2 px-2 rounded-md text-center truncate cursor-pointer disabled:opacity-40 ${
              step === 'roster'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600'
            }`}
          >
            2. Notas
          </button>
          <button
            type="button"
            disabled={!canGoTeams}
            onClick={() => setStep('teams')}
            className={`py-2 px-2 rounded-md text-center truncate cursor-pointer disabled:opacity-40 ${
              step === 'teams'
                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600'
            }`}
          >
            3. Times
          </button>
        </div>
      </div>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {step === 'paste' && (
          <PasteListStep
            rawText={rawText}
            matchTitle={matchTitle}
            parsedPlayers={parsedPreview.players}
            onRawTextChange={handleRawTextChange}
            onMatchTitleChange={setMatchTitle}
            onLoadSample={handleLoadSample}
            onClear={handleClearPaste}
            onProceed={handleProceedToRoster}
          />
        )}

        {step === 'roster' && (
          <RosterEditorStep
            matchTitle={matchTitle}
            players={players}
            teamCount={teamCount}
            onTeamCountChange={setTeamCount}
            onUpdatePlayer={handleUpdatePlayer}
            onAddPlayer={handleAddPlayer}
            onRemovePlayer={handleRemovePlayer}
            onResetAllSkills={handleResetAllSkills}
            onBack={() => setStep('paste')}
            onGenerateTeams={() => handleGenerateTeams()}
          />
        )}

        {step === 'teams' && sortResult && (
          <TeamsResultStep
            matchTitle={matchTitle}
            result={sortResult}
            teamCount={teamCount}
            onTeamCountChange={handleTeamCountChangeInResults}
            onReshuffle={handleReshuffle}
            onSwapPlayers={handleSwapPlayers}
            onBackToRoster={() => setStep('roster')}
          />
        )}
      </main>
    </div>
  );
}

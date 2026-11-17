import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  Check,
  Copy,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { SortResult } from '../types/pelada';
import { formatTeamsForWhatsApp } from '../utils/teamBalancer';

interface TeamsResultStepProps {
  matchTitle: string;
  result: SortResult;
  teamCount: number;
  onTeamCountChange: (count: number) => void;
  onReshuffle: () => void;
  onSwapPlayers: (
    first: { teamIndex: number; playerId: string },
    second: { teamIndex: number; playerId: string }
  ) => void;
  onBackToRoster: () => void;
}

export const TeamsResultStep: React.FC<TeamsResultStepProps> = ({
  matchTitle,
  result,
  teamCount,
  onTeamCountChange,
  onReshuffle,
  onSwapPlayers,
  onBackToRoster,
}) => {
  const [selectedForSwap, setSelectedForSwap] = useState<{
    teamIndex: number;
    playerId: string;
    playerName: string;
  } | null>(null);
  const [includeRatingsInCopy, setIncludeRatingsInCopy] = useState(false);
  const [copied, setCopied] = useState(false);

  const handlePlayerClick = (
    teamIndex: number,
    playerId: string,
    playerName: string
  ) => {
    if (!selectedForSwap) {
      setSelectedForSwap({ teamIndex, playerId, playerName });
      return;
    }

    if (
      selectedForSwap.teamIndex === teamIndex &&
      selectedForSwap.playerId === playerId
    ) {
      setSelectedForSwap(null);
      return;
    }

    onSwapPlayers(
      { teamIndex: selectedForSwap.teamIndex, playerId: selectedForSwap.playerId },
      { teamIndex, playerId }
    );
    setSelectedForSwap(null);
  };

  const handleCopyWhatsApp = async () => {
    const text = formatTeamsForWhatsApp(
      result,
      matchTitle,
      includeRatingsInCopy
    );
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback textarea copy
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      document.body.removeChild(area);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const gridColsClass =
    result.teams.length === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : result.teams.length === 3
        ? 'grid-cols-1 md:grid-cols-3'
        : result.teams.length === 4
          ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
          : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';

  return (
    <div className="space-y-6 pb-8">
      {/* Top Summary & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={onBackToRoster}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Editar notas e goleiros
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
            {matchTitle.trim() || 'Times Sorteados'}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600">
            <span className="font-mono tabular-nums font-semibold text-slate-900">
              {result.teams.length}
            </span>
            <span>times</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums font-semibold text-slate-900">
              {result.totalPlayers}
            </span>
            <span>jogadores</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums font-semibold text-amber-800">
              {result.totalGoalkeepers}
            </span>
            <span>
              {result.totalGoalkeepers === 1 ? 'goleiro' : 'goleiros'}
            </span>
            <span aria-hidden="true">·</span>
            <span>Diferença máx. de média:</span>
            <span className="font-mono tabular-nums font-semibold text-emerald-800">
              {result.maxAverageDiff.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg"
            role="group"
            aria-label="Mudar quantidade de times"
          >
            {[2, 3, 4, 5, 6].map((count) => {
              const disabled = count > result.totalPlayers;
              const active = teamCount === count;
              return (
                <button
                  key={count}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setSelectedForSwap(null);
                    onTeamCountChange(count);
                  }}
                  className={`min-w-[36px] min-h-[36px] px-2.5 text-xs font-mono tabular-nums font-semibold rounded-md transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {count}T
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedForSwap(null);
              onReshuffle();
            }}
            className="inline-flex items-center gap-2 h-11 px-4 text-sm font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sortear Novamente</span>
          </button>

          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className="inline-flex items-center gap-2 h-11 px-5 text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copiado para WhatsApp</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar para WhatsApp</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Swap & Copy Options Strip */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <ArrowLeftRight className="w-4 h-4 text-slate-400 shrink-0" />
          {selectedForSwap ? (
            <span>
              Troca ativa:{' '}
              <strong className="text-slate-900">
                {selectedForSwap.playerName}
              </strong>{' '}
              selecionado. Clique em outro jogador para trocar de time, ou{' '}
              <button
                type="button"
                onClick={() => setSelectedForSwap(null)}
                className="underline font-medium text-slate-800 cursor-pointer"
              >
                cancelar
              </button>
              .
            </span>
          ) : (
            <span>
              Quer ajustar manualmente? Clique em dois jogadores de times diferentes para trocá-los.
            </span>
          )}
        </div>

        <label className="inline-flex items-center gap-2 text-slate-700 font-medium cursor-pointer select-none shrink-0">
          <input
            type="checkbox"
            checked={includeRatingsInCopy}
            onChange={(e) => setIncludeRatingsInCopy(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 accent-emerald-800 cursor-pointer"
          />
          <span>Incluir notas ao copiar</span>
        </label>
      </div>

      {/* Teams Grid */}
      <div className={`grid ${gridColsClass} gap-5 items-start`}>
        {result.teams.map((team) => (
          <div
            key={team.index}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            {/* Subtle top colete color accent */}
            <div
              className="h-1.5 w-full"
              style={{ backgroundColor: team.color.swatchHex }}
            />

            <div className="p-5 space-y-4">
              {/* Team Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: team.color.swatchHex }}
                      aria-hidden="true"
                    />
                    <h2 className="text-lg font-bold text-slate-900 truncate">
                      {team.name}
                    </h2>
                  </div>
                  <div className="text-xs text-slate-500">
                    {team.color.label} · {team.players.length}{' '}
                    {team.players.length === 1 ? 'atleta' : 'atletas'}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-mono tabular-nums text-lg font-bold text-slate-900 leading-tight">
                    {team.averageSkill.toFixed(1)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                    Média · Soma {team.totalSkill}
                  </div>
                </div>
              </div>

              {/* Players List */}
              <div className="divide-y divide-slate-100">
                {team.players.map((player, pIdx) => {
                  const isSelected =
                    selectedForSwap?.playerId === player.id &&
                    selectedForSwap?.teamIndex === team.index;

                  return (
                    <button
                      key={player.id}
                      type="button"
                      onClick={() =>
                        handlePlayerClick(team.index, player.id, player.name)
                      }
                      className={`w-full py-2.5 px-2 -mx-2 flex items-center justify-between gap-2 text-left rounded-lg transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 ring-1 ring-emerald-700'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 text-right font-mono tabular-nums text-xs text-slate-400 shrink-0">
                          {pIdx + 1}
                        </span>
                        <span className="text-sm font-medium text-slate-900 truncate">
                          {player.name}
                        </span>
                        {player.isGoalkeeper && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-200 rounded shrink-0">
                            <Shield className="w-3 h-3" />
                            GOL
                          </span>
                        )}
                      </div>

                      <span className="font-mono tabular-nums text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                        {player.skill}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

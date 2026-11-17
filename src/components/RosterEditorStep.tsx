import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  Shield,
  Trash2,
  UserPlus,
  Shuffle,
} from 'lucide-react';
import { Player } from '../types/pelada';

interface RosterEditorStepProps {
  matchTitle: string;
  players: Player[];
  teamCount: number;
  onTeamCountChange: (count: number) => void;
  onUpdatePlayer: (id: string, patch: Partial<Player>) => void;
  onAddPlayer: (name: string) => void;
  onRemovePlayer: (id: string) => void;
  onResetAllSkills: (value: number) => void;
  onBack: () => void;
  onGenerateTeams: () => void;
}

const SKILL_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function getSkillLabel(skill: number): string {
  if (skill <= 2) return 'Iniciante';
  if (skill <= 4) return 'Básico';
  if (skill <= 6) return 'Médio';
  if (skill <= 8) return 'Bom';
  return 'Craque';
}

export const RosterEditorStep: React.FC<RosterEditorStepProps> = ({
  matchTitle,
  players,
  teamCount,
  onTeamCountChange,
  onUpdatePlayer,
  onAddPlayer,
  onRemovePlayer,
  onResetAllSkills,
  onBack,
  onGenerateTeams,
}) => {
  const [newPlayerName, setNewPlayerName] = useState('');

  const goalkeeperCount = players.filter((p) => p.isGoalkeeper).length;
  const averageSkill =
    players.length > 0
      ? players.reduce((acc, p) => acc + p.skill, 0) / players.length
      : 0;

  const basePerTeam = players.length > 0 ? Math.floor(players.length / teamCount) : 0;
  const remainder = players.length > 0 ? players.length % teamCount : 0;
  const formationText =
    remainder === 0
      ? `${basePerTeam} por time`
      : `${basePerTeam} a ${basePerTeam + 1} por time`;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;
    onAddPlayer(trimmed);
    setNewPlayerName('');
  };

  const availableTeamCounts = [2, 3, 4, 5, 6];

  return (
    <div className="space-y-6 pb-24 sm:pb-6">
      {/* Header & Summary */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar e editar texto da lista
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
            {matchTitle.trim() || 'Avaliar Habilidades e Goleiros'}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600">
            <span className="font-mono tabular-nums font-semibold text-slate-900">
              {players.length}
            </span>
            <span>jogadores</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums font-semibold text-amber-800">
              {goalkeeperCount}
            </span>
            <span>{goalkeeperCount === 1 ? 'goleiro' : 'goleiros'}</span>
            <span aria-hidden="true">·</span>
            <span>Média geral</span>
            <span className="font-mono tabular-nums font-semibold text-slate-900">
              {averageSkill.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Team Count Control */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-slate-700">
              Dividir em quantos times?
            </div>
            <div className="text-xs text-slate-500 font-mono tabular-nums">
              {formationText}
            </div>
          </div>
          <div
            className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
            role="group"
            aria-label="Quantidade de times"
          >
            {availableTeamCounts.map((count) => {
              const disabled = players.length > 0 && count > players.length;
              const active = teamCount === count;
              return (
                <button
                  key={count}
                  type="button"
                  disabled={disabled}
                  onClick={() => onTeamCountChange(count)}
                  className={`min-w-[40px] min-h-[40px] px-3 text-sm font-mono tabular-nums font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    active
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
                  }`}
                >
                  {count}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Player & Quick Actions Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <form
          onSubmit={handleAddSubmit}
          className="flex items-center gap-2 w-full md:max-w-md"
        >
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Adicionar jogador que faltou na lista..."
            className="flex-1 h-11 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
          />
          <button
            type="submit"
            disabled={!newPlayerName.trim()}
            className="inline-flex items-center gap-1.5 h-11 px-4 text-xs sm:text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <UserPlus className="w-4 h-4" />
            <span>Adicionar</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 text-xs">
          <button
            type="button"
            onClick={() => onResetAllSkills(5)}
            className="px-3 py-2 min-h-[38px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Zerar notas para 5
          </button>
          <button
            type="button"
            onClick={onGenerateTeams}
            disabled={players.length < 2}
            className="hidden sm:inline-flex items-center gap-2 h-11 px-5 text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-200 disabled:text-slate-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <Shuffle className="w-4 h-4" />
            <span>Sortear {teamCount} Times</span>
          </button>
        </div>
      </div>

      {/* Editable Roster Grid */}
      {players.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
          <p className="text-base font-semibold text-slate-800">
            Nenhum jogador na lista
          </p>
          <p className="text-sm text-slate-500">
            Adicione jogadores acima ou volte para colar a lista do WhatsApp.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Colar Lista
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Desktop Table Header */}
          <div className="hidden md:grid md:grid-cols-[44px_minmax(160px,1.2fr)_130px_minmax(320px,1.8fr)_52px] items-center gap-4 px-5 py-3 bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500">
            <span className="text-right font-mono">#</span>
            <span>Jogador</span>
            <span>Posição</span>
            <div className="flex items-center justify-between">
              <span>Habilidade (1 a 10)</span>
              <span className="font-normal text-slate-400">
                1 Iniciante · 10 Craque
              </span>
            </div>
            <span className="text-right">Remover</span>
          </div>

          <div className="divide-y divide-slate-100">
            {players.map((player, index) => (
              <div
                key={player.id}
                className={`px-4 py-3.5 md:px-5 md:py-2.5 transition-colors hover:bg-slate-50/70 ${
                  player.isGoalkeeper ? 'bg-amber-50/30' : ''
                }`}
              >
                <div className="flex flex-col gap-3 md:grid md:grid-cols-[44px_minmax(160px,1.2fr)_130px_minmax(320px,1.8fr)_52px] md:items-center md:gap-4">
                  {/* Index + Mobile Delete */}
                  <div className="flex items-center justify-between md:justify-end">
                    <div className="flex items-center gap-2">
                      <span className="w-7 text-right font-mono tabular-nums text-xs font-medium text-slate-400">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="md:hidden text-xs font-medium text-slate-400">
                        {player.fromMemory ? 'Nota salva' : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemovePlayer(player.id)}
                      aria-label={`Remover ${player.name}`}
                      className="md:hidden min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Editable Name */}
                  <div className="min-w-0">
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) =>
                        onUpdatePlayer(player.id, { name: e.target.value })
                      }
                      aria-label={`Nome do jogador ${index + 1}`}
                      className="w-full h-10 px-2.5 -mx-2.5 md:mx-0 text-sm font-medium text-slate-900 bg-transparent hover:bg-slate-100/70 focus:bg-white border border-transparent focus:border-emerald-700 rounded-md focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Goalkeeper Toggle */}
                  <div>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdatePlayer(player.id, {
                          isGoalkeeper: !player.isGoalkeeper,
                        })
                      }
                      aria-pressed={player.isGoalkeeper}
                      className={`w-full md:w-auto min-h-[40px] px-3 inline-flex items-center justify-center gap-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        player.isGoalkeeper
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{player.isGoalkeeper ? 'Goleiro' : 'Linha'}</span>
                    </button>
                  </div>

                  {/* Skill 1..10 Rating Control */}
                  <div>
                    {/* Desktop: 1-10 Quick Click Scale */}
                    <div className="hidden md:flex items-center gap-2">
                      <div
                        className="grid grid-cols-10 gap-1 flex-1"
                        role="radiogroup"
                        aria-label={`Habilidade de ${player.name}`}
                      >
                        {SKILL_VALUES.map((val) => {
                          const isSelected = player.skill === val;
                          const isFilled = val < player.skill;
                          return (
                            <button
                              key={val}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              onClick={() =>
                                onUpdatePlayer(player.id, { skill: val })
                              }
                              className={`h-9 rounded text-xs font-mono tabular-nums font-semibold transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-800 text-white'
                                  : isFilled
                                    ? 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800'
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                      <span className="w-16 text-right text-xs text-slate-500 whitespace-nowrap shrink-0">
                        {getSkillLabel(player.skill)}
                      </span>
                    </div>

                    {/* Mobile: Touch Stepper + Slider */}
                    <div className="md:hidden flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdatePlayer(player.id, {
                            skill: Math.max(1, player.skill - 1),
                          })
                        }
                        disabled={player.skill <= 1}
                        aria-label={`Diminuir nota de ${player.name}`}
                        className="w-11 h-11 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 active:bg-slate-200 disabled:opacity-40 shrink-0 cursor-pointer"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">
                            {getSkillLabel(player.skill)}
                          </span>
                          <span className="font-mono tabular-nums font-bold text-slate-900">
                            {player.skill} / 10
                          </span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={10}
                          step={1}
                          value={player.skill}
                          onChange={(e) =>
                            onUpdatePlayer(player.id, {
                              skill: Number(e.target.value),
                            })
                          }
                          aria-label={`Nota de ${player.name}`}
                          className="w-full accent-emerald-800 h-2 cursor-pointer"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onUpdatePlayer(player.id, {
                            skill: Math.min(10, player.skill + 1),
                          })
                        }
                        disabled={player.skill >= 10}
                        aria-label={`Aumentar nota de ${player.name}`}
                        className="w-11 h-11 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 active:bg-slate-200 disabled:opacity-40 shrink-0 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Desktop Delete */}
                  <div className="hidden md:flex justify-end">
                    <button
                      type="button"
                      onClick={() => onRemovePlayer(player.id)}
                      aria-label={`Remover ${player.name}`}
                      className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desktop Bottom Action Bar */}
      {players.length >= 2 && (
        <div className="hidden sm:flex items-center justify-between gap-4 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Lista
          </button>
          <button
            type="button"
            onClick={onGenerateTeams}
            className="inline-flex items-center gap-2 px-6 py-3 min-h-[46px] text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer"
          >
            <span>Gerar {teamCount} Times Equilibrados</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile Sticky Bottom CTA (within 15% height cap) */}
      {players.length >= 2 && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-30 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200">
          <button
            type="button"
            onClick={onGenerateTeams}
            className="w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-emerald-800 active:bg-emerald-900 rounded-xl cursor-pointer"
          >
            <Shuffle className="w-4 h-4" />
            <span>Sortear {teamCount} Times ({players.length} jog.)</span>
          </button>
        </div>
      )}
    </div>
  );
};

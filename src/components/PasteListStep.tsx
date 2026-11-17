import React from 'react';
import { ClipboardPaste, ArrowRight, RotateCcw, Users, Shield } from 'lucide-react';
import { ParsedPlayerEntry, SAMPLE_WHATSAPP_LIST } from '../utils/listParser';

interface PasteListStepProps {
  rawText: string;
  matchTitle: string;
  parsedPlayers: ParsedPlayerEntry[];
  onRawTextChange: (value: string) => void;
  onMatchTitleChange: (value: string) => void;
  onLoadSample: () => void;
  onClear: () => void;
  onProceed: () => void;
}

export const PasteListStep: React.FC<PasteListStepProps> = ({
  rawText,
  matchTitle,
  parsedPlayers,
  onRawTextChange,
  onMatchTitleChange,
  onLoadSample,
  onClear,
  onProceed,
}) => {
  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onRawTextChange(text);
      }
    } catch {
      // Fallback: focus textarea if clipboard permission is denied
      const el = document.getElementById('whatsapp-list-input');
      el?.focus();
    }
  };

  const detectedGKs = parsedPlayers.filter((p) => p.isGoalkeeper).length;

  return (
    <div className="space-y-6">
      <div className="max-w-2xl space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
          Cole a lista do WhatsApp e equilibre os times na hora
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          O sistema limpa numerações, emojis e menções automaticamente. Em seguida, você define a nota de 1 a 10 e marca quem é goleiro.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Input Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-5">
          <div className="space-y-1.5">
            <label
              htmlFor="match-title-input"
              className="block text-sm font-medium text-slate-700"
            >
              Título do jogo ou treino (opcional)
            </label>
            <input
              id="match-title-input"
              type="text"
              value={matchTitle}
              onChange={(e) => onMatchTitleChange(e.target.value)}
              placeholder="Ex: Lista treino dia 17 terça, churrasco"
              className="w-full h-11 px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="whatsapp-list-input"
                className="block text-sm font-medium text-slate-700"
              >
                Lista de jogadores
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  Colar
                </button>
                <button
                  type="button"
                  onClick={onLoadSample}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Exemplo (20 nomes)
                </button>
                {rawText.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={onClear}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Limpar
                  </button>
                )}
              </div>
            </div>

            <textarea
              id="whatsapp-list-input"
              value={rawText}
              onChange={(e) => onRawTextChange(e.target.value)}
              rows={13}
              placeholder={`Cole aqui a mensagem do grupo...\n\nExemplo:\n${SAMPLE_WHATSAPP_LIST.split('\n').slice(0, 8).join('\n')}\n...`}
              className="w-full p-4 text-sm leading-relaxed bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 font-mono focus:outline-none focus:bg-white focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 transition-colors resize-y"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="font-mono tabular-nums font-semibold text-slate-800">
                {parsedPlayers.length}
              </span>
              <span>
                {parsedPlayers.length === 1
                  ? 'jogador identificado'
                  : 'jogadores identificados'}
              </span>
              {detectedGKs > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums font-semibold text-amber-800">
                    {detectedGKs}
                  </span>
                  <span>{detectedGKs === 1 ? 'goleiro' : 'goleiros'}</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={onProceed}
              disabled={parsedPlayers.length < 2}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px] text-sm font-semibold text-white bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-200 disabled:text-slate-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Editar Notas e Goleiros</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Live Parsed Preview */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Prévia da leitura
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nomes limpos prontos para avaliação
              </p>
            </div>
            <div className="text-right font-mono tabular-nums text-sm font-semibold text-slate-800">
              {parsedPlayers.length} atletas
            </div>
          </div>

          {parsedPlayers.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-1 max-w-xs mx-auto">
                <p className="text-sm font-medium text-slate-700">
                  Aguardando sua lista
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Aceita listas numeradas (1 Benhur), com emojis (13 Vaner 🤦‍♂️) ou marcação de goleiro como (g) ou 🧤.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-h-[380px] overflow-y-auto pr-1 divide-y divide-slate-100">
              {parsedPlayers.map((player, index) => (
                <div
                  key={`${player.name}-${index}`}
                  className="py-2 flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-right font-mono tabular-nums text-xs text-slate-400 shrink-0">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-medium text-slate-800 truncate">
                      {player.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {player.isGoalkeeper && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        <Shield className="w-3 h-3" />
                        Goleiro
                      </span>
                    )}
                    {player.skill !== undefined && (
                      <span className="font-mono tabular-nums text-xs text-slate-500">
                        Nota {player.skill}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 leading-relaxed">
            Dica: se já usou o app antes, as notas de jogadores conhecidos são lembradas automaticamente no navegador.
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Calculator,
  Clock,
  Compass,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GameMode, PlayerStats } from '../types/game';
import { PuzzlePieceSvg } from './PuzzlePieceSvg';
import { InteractiveHandPointer } from './InteractiveHandPointer';
import { BackgroundScene } from './BackgroundScene';
import { soundEngine } from '../utils/sound';

interface TitleScreenProps {
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onStartGame: (mode: GameMode) => void;
  onOpenCustom: () => void;
  onOpenCurriculum: () => void;
  onOpenAchievements: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  stats: PlayerStats;
  unlockedCount: number;
  totalAchievements: number;
  onResetGame: () => void;
}

const DEMO_PIECES = [
  { place: 'MILHAR' as const, label: 'Milhar', shortLabel: 'UM', digit: 1, value: 1000, q: 500 },
  { place: 'CENTENA' as const, label: 'Centena', shortLabel: 'C', digit: 2, value: 200, q: 100 },
  { place: 'DEZENA' as const, label: 'Dezena', shortLabel: 'D', digit: 3, value: 30, q: 15 },
  { place: 'UNIDADE' as const, label: 'Unidade', shortLabel: 'U', digit: 4, value: 4, q: 2 },
];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  selectedMode,
  onSelectMode,
  onStartGame,
  onOpenCustom,
  onOpenCurriculum,
  onOpenAchievements,
  isMuted,
  onToggleMute,
  stats,
  unlockedCount,
  totalAchievements,
  onResetGame,
}) => {
  const [demoAssembled, setDemoAssembled] = useState(true);
  const [demoActiveIdx, setDemoActiveIdx] = useState(0);

  // Live animated demonstration on the Title Screen
  useEffect(() => {
    const cycle = setInterval(() => {
      setDemoAssembled((prev) => {
        if (prev) {
          setDemoActiveIdx(0);
          return false;
        }
        return true;
      });
    }, 4500);
    return () => clearInterval(cycle);
  }, []);

  useEffect(() => {
    if (demoAssembled) return;
    const stepTimer = setInterval(() => {
      setDemoActiveIdx((prev) => (prev + 1) % DEMO_PIECES.length);
    }, 950);
    return () => clearInterval(stepTimer);
  }, [demoAssembled]);

  // Enter / Space starts game cleanly
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON')) {
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        soundEngine.playClick();
        onStartGame(selectedMode);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onStartGame, selectedMode]);

  return (
    <div className="relative min-h-screen w-full drafting-grid flex flex-col justify-between px-6 py-6 lg:px-12 lg:py-8">
      <BackgroundScene opacityClass="opacity-[0.18]" />

      {/* Minimal Top Utility Row inside Game Shell */}
      <div className="relative z-10 max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
        <div className="text-xs font-medium text-slate-500 flex items-center gap-2">
          <span>Ensino Fundamental · 6º ao 9º Ano</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">Pontos: {stats.totalScore}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              soundEngine.playClick();
              onResetGame();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 transition-colors cursor-pointer whitespace-nowrap"
            title="Zerar pontuação e reiniciar progresso"
          >
            <RotateCcw className="w-4 h-4" />
            Reiniciar Jogo
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenCurriculum();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            BNCC e SAEB
          </button>

          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenAchievements();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer whitespace-nowrap tabular-nums"
          >
            <Trophy className="w-4 h-4 text-amber-600" />
            Conquistas ({unlockedCount}/{totalAchievements})
          </button>

          <button
            onClick={onToggleMute}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            aria-label={isMuted ? 'Ativar som' : 'Silenciar som'}
            title={isMuted ? 'Ativar som' : 'Silenciar som'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Two-Column Hero & Live Board Showcase */}
      <main className="relative z-10 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center my-auto py-8">
        {/* Left: Bespoke SVG Lockup, Mode Selection, Start CTA */}
        <div className="lg:col-span-5 space-y-7">
          <div className="space-y-4">
            {/* Bespoke inline SVG Title Emblem */}
            <svg
              width="210"
              height="38"
              viewBox="0 0 210 38"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect x="2" y="4" width="32" height="30" rx="6" fill="#DBEAFE" stroke="#2563EB" strokeWidth="2" />
              <text x="18" y="24" textAnchor="middle" fill="#1E3A8A" fontSize="13" fontWeight="800" fontFamily="Bricolage Grotesque, sans-serif">
                Um
              </text>
              <rect x="42" y="4" width="32" height="30" rx="6" fill="#D1FAE5" stroke="#059669" strokeWidth="2" />
              <text x="58" y="24" textAnchor="middle" fill="#064E3B" fontSize="13" fontWeight="800" fontFamily="Bricolage Grotesque, sans-serif">
                C
              </text>
              <rect x="82" y="4" width="32" height="30" rx="6" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
              <text x="98" y="24" textAnchor="middle" fill="#78350F" fontSize="13" fontWeight="800" fontFamily="Bricolage Grotesque, sans-serif">
                D
              </text>
              <rect x="122" y="4" width="32" height="30" rx="6" fill="#FFE4E6" stroke="#E11D48" strokeWidth="2" />
              <text x="138" y="24" textAnchor="middle" fill="#881337" fontSize="13" fontWeight="800" fontFamily="Bricolage Grotesque, sans-serif">
                U
              </text>
              <text x="178" y="25" textAnchor="middle" fill="#0F172A" fontSize="17" fontWeight="800" fontFamily="JetBrains Mono, monospace">
                ÷ d
              </text>
            </svg>

            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-slate-900 leading-[1.08] tracking-tight text-balance">
              Quebre o número para não quebrar a cabeça
            </h1>

            <p className="text-base text-slate-600 leading-relaxed max-w-lg">
              Transforme qualquer divisão em peças de quebra-cabeça por valor posicional, divida parte por parte com
              apoio visual e some os resultados sem complicação.
            </p>
          </div>

          {/* Mode Selector */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-slate-500">Escolha como deseja jogar</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onSelectMode('GUIDED');
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer min-h-[44px] ${
                  selectedMode === 'GUIDED'
                    ? 'bg-white border-blue-600 ring-2 ring-blue-600/15 shadow-sm'
                    : 'bg-white/70 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-display font-bold text-sm text-slate-900">
                    Aprendizado Guiado
                  </span>
                  <Compass className={`w-4 h-4 shrink-0 ${selectedMode === 'GUIDED' ? 'text-blue-600' : 'text-slate-400'}`} />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Passo a passo com alternativas, correção de erros na decomposição e zero pressa.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onSelectMode('CHALLENGE');
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer min-h-[44px] ${
                  selectedMode === 'CHALLENGE'
                    ? 'bg-white border-amber-600 ring-2 ring-amber-600/15 shadow-sm'
                    : 'bg-white/70 border-slate-200 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-display font-bold text-sm text-slate-900">
                    Desafio Cronometrado
                  </span>
                  <Clock className={`w-4 h-4 shrink-0 ${selectedMode === 'CHALLENGE' ? 'text-amber-600' : 'text-slate-400'}`} />
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Níveis crescentes e autonomia total digitando os cálculos contra o relógio.
                </p>
              </button>
            </div>
          </div>

          {/* Primary Start CTA + Custom Number Action */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                soundEngine.playSnap();
                onStartGame(selectedMode);
              }}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 min-h-[48px] rounded-xl bg-blue-600 text-white font-display font-bold text-base hover:bg-blue-700 active:scale-[0.99] transition-all shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              Iniciar Jogo
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onOpenCustom();
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 min-h-[48px] rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Calculator className="w-4 h-4 text-slate-600" />
              Digitar Outro Número
            </button>
          </div>
        </div>

        {/* Right: Live Interactive Puzzle Workbench Preview */}
        <div className="lg:col-span-7">
          <div className="bg-white/95 border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="text-xs font-medium text-slate-500">Demonstração visual do método</div>
                <div className="font-display text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                  1234 ÷ 2 = 617
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (demoAssembled) soundEngine.playSplit();
                  else soundEngine.playSnap();
                  setDemoAssembled((prev) => !prev);
                }}
                className="px-3.5 py-2 min-h-[40px] rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                {demoAssembled ? 'Separar Peças' : 'Montar Número'}
              </button>
            </div>

            {/* Interactive Puzzle Stage */}
            <div className="relative min-h-[215px] flex flex-col items-center justify-center py-4 overflow-x-auto">
              {/* Hand Pointer tracking active piece when separated */}
              <div
                className="h-14 flex items-end justify-center mb-1 transition-opacity duration-200"
                style={{ opacity: demoAssembled ? 0 : 1 }}
              >
                <div
                  className="transition-transform duration-300 ease-out"
                  style={{
                    transform: `translateX(${(demoActiveIdx - 1.5) * 145}px)`,
                  }}
                >
                  <InteractiveHandPointer label={`Dividindo ${DEMO_PIECES[demoActiveIdx].value}`} />
                </div>
              </div>

              <div
                className={`flex items-center justify-center transition-all duration-300 ${
                  demoAssembled ? 'gap-0' : 'gap-2 sm:gap-3 flex-wrap'
                }`}
              >
                {DEMO_PIECES.map((piece, idx) => (
                  <PuzzlePieceSvg
                    key={piece.place}
                    place={piece.place}
                    label={piece.label}
                    shortLabel={piece.shortLabel}
                    value={piece.value}
                    digit={piece.digit}
                    isFirst={idx === 0}
                    isLast={idx === DEMO_PIECES.length - 1}
                    assembled={demoAssembled}
                    isActive={!demoAssembled && demoActiveIdx === idx}
                    isDone={!demoAssembled && idx < demoActiveIdx}
                    partialQuotient={piece.q}
                    partialRemainder={0}
                    divisor={2}
                    onClick={() => {
                      if (!demoAssembled) {
                        soundEngine.playClick();
                        setDemoActiveIdx(idx);
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Step Breakdown Bar */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-sm tabular-nums">
              <div className="font-mono text-slate-700">
                <span className="font-bold text-blue-700">500</span> +{' '}
                <span className="font-bold text-emerald-700">100</span> +{' '}
                <span className="font-bold text-amber-700">15</span> +{' '}
                <span className="font-bold text-rose-700">2</span>
              </div>
              <div className="font-display font-bold text-slate-900">
                Quociente: <span className="text-blue-700">617</span> · Resto: 0
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Single Flat Control-Hint Line */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto text-center text-xs text-slate-500 pt-2">
        Clique ou use Enter para iniciar · Teclas 1–4 selecionam alternativas no Modo Guiado · M silencia o áudio
      </footer>
    </div>
  );
};

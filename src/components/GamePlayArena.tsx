import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Clock,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  Achievement,
  DivisionPlan,
  FeedbackMessage,
  GameMode,
  GameState,
  LevelPreset,
  PlayPhase,
  PuzzlePieceData,
} from '../types/game';
import {
  buildDivisionPlan,
  DivisionResultValue,
  generateDecompositionOptions,
  generateDivisionOptions,
  generateFinalSumOptions,
} from '../utils/decompositionMath';
import { ENCOURAGEMENT_CORRECT, ENCOURAGEMENT_RETRY } from '../data/curriculumAndLevels';
import { PuzzlePieceSvg } from './PuzzlePieceSvg';
import { InteractiveHandPointer } from './InteractiveHandPointer';
import { DigitalKeypad } from './DigitalKeypad';
import { BackgroundScene } from './BackgroundScene';
import { soundEngine } from '../utils/sound';

interface GamePlayArenaProps {
  gameState: GameState;
  mode: GameMode;
  levelIndex: number;
  levels: LevelPreset[];
  customProblem: { dividend: number; divisor: number } | null;
  score: number;
  streak: number;
  isMuted: boolean;
  unlockedCount: number;
  totalAchievements: number;
  recentAchievement: Achievement | null;
  onToggleMute: () => void;
  onPauseToggle: () => void;
  onExitToMenu: () => void;
  onOpenCustom: () => void;
  onOpenAchievements: () => void;
  onRoundComplete: (result: {
    dividend: number;
    divisor: number;
    elapsedSeconds: number;
    mistakesCount: number;
    decompositionMistakes: number;
    pointsEarned: number;
    isCustom: boolean;
  }) => void;
  onNextLevel: () => void;
  onReplayRound: () => void;
  onResetGame: () => void;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const GamePlayArena: React.FC<GamePlayArenaProps> = ({
  gameState,
  mode,
  levelIndex,
  levels,
  customProblem,
  score,
  streak,
  isMuted,
  unlockedCount,
  totalAchievements,
  recentAchievement,
  onToggleMute,
  onPauseToggle,
  onExitToMenu,
  onOpenCustom,
  onOpenAchievements,
  onRoundComplete,
  onNextLevel,
  onReplayRound,
  onResetGame,
}) => {
  const activePreset = levels[levelIndex % levels.length];
  const dividend = customProblem ? customProblem.dividend : activePreset.dividend;
  const divisor = customProblem ? customProblem.divisor : activePreset.divisor;

  const plan: DivisionPlan = useMemo(
    () => buildDivisionPlan(dividend, divisor),
    [dividend, divisor]
  );

  const [phase, setPhase] = useState<PlayPhase>('ASSEMBLED');
  const [piecesState, setPiecesState] = useState<PuzzlePieceData[]>(plan.pieces);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>({
    type: 'info',
    text: 'Veja o número montado como um quebra-cabeça! Vamos separá-lo em partes.',
  });
  const [mistakesCount, setMistakesCount] = useState(0);
  const [decompositionMistakes, setDecompositionMistakes] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastPointsEarned, setLastPointsEarned] = useState(0);

  // Challenge Mode inputs & on-demand digital keypad state
  const [decompInput, setDecompInput] = useState('');
  const [quotientInput, setQuotientInput] = useState('');
  const [remainderInput, setRemainderInput] = useState('');
  const [finalSumInput, setFinalSumInput] = useState('');
  const [activeKeypadField, setActiveKeypadField] = useState<
    'decomp' | 'quotient' | 'remainder' | 'finalSum' | null
  >(null);

  const pieceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const workbenchRef = useRef<HTMLDivElement | null>(null);
  const bonusTrayRef = useRef<HTMLDivElement | null>(null);
  const [pointerX, setPointerX] = useState<number>(0);

  // Reset round state whenever problem or mode changes
  useEffect(() => {
    setPiecesState(plan.pieces);
    setPhase('ASSEMBLED');
    setActiveIndex(0);
    setMistakesCount(0);
    setDecompositionMistakes(0);
    setElapsedSeconds(0);
    setDecompInput('');
    setQuotientInput('');
    setRemainderInput('');
    setFinalSumInput('');
    setActiveKeypadField(null);
    setFeedback({
      type: 'info',
      text: `Quebra-cabeça de ${plan.dividend} montado! Separando as peças por valor posicional...`,
    });
    soundEngine.playSnap();

    const timer = setTimeout(() => {
      soundEngine.playSplit();
      setPhase('VERIFY_DECOMPOSITION');
      setFeedback({
        type: 'info',
        text:
          mode === 'GUIDED'
            ? 'Vamos confirmar o valor de cada peça antes de dividir!'
            : 'Clique no campo para digitar o valor posicional da peça destacada pela mão.',
      });
    }, 1150);

    return () => clearTimeout(timer);
  }, [plan, mode]);

  // Challenge timer (runs only while PLAYING and past ASSEMBLED)
  useEffect(() => {
    if (gameState !== 'PLAYING' || mode !== 'CHALLENGE' || phase === 'ASSEMBLED') return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, mode, phase]);

  // Ensure digital keypad closes whenever step/phase advances
  useEffect(() => {
    setActiveKeypadField(null);
  }, [phase, activeIndex, mode]);

  // Compute hand pointer horizontal position accurately relative to workbench container
  const updatePointerPosition = useCallback(() => {
    const container = workbenchRef.current;
    if (!container) return;

    let targetEl: HTMLElement | null = null;
    if (phase === 'VERIFY_DECOMPOSITION' || phase === 'DIVIDE_PIECES') {
      targetEl = pieceRefs.current[activeIndex] ?? null;
    } else if (phase === 'BONUS_REMAINDER') {
      targetEl = bonusTrayRef.current;
    }

    if (!targetEl) {
      setPointerX(0);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    const targetCenter = targetRect.left + targetRect.width / 2;
    setPointerX(targetCenter - containerCenter);
  }, [phase, activeIndex]);

  useEffect(() => {
    updatePointerPosition();
    window.addEventListener('resize', updatePointerPosition);
    return () => window.removeEventListener('resize', updatePointerPosition);
  }, [updatePointerPosition, piecesState.length]);

  const activePiece = piecesState[activeIndex];

  // Memoized guided options so they don't reshuffle on unrelated re-renders
  const decompOptions = useMemo(() => {
    if (!activePiece || phase !== 'VERIFY_DECOMPOSITION') return [];
    return generateDecompositionOptions(activePiece, plan.dividend);
  }, [activePiece, phase, plan.dividend]);

  const divisionOptions = useMemo(() => {
    if (phase === 'DIVIDE_PIECES' && activePiece) {
      return generateDivisionOptions(activePiece.value, plan.divisor);
    }
    if (phase === 'BONUS_REMAINDER') {
      return generateDivisionOptions(plan.sumPartialRemainders, plan.divisor);
    }
    return [];
  }, [phase, activePiece, plan.divisor, plan.sumPartialRemainders]);

  const finalSumOptions = useMemo(() => {
    if (phase !== 'SUM_QUOTIENTS') return [];
    return generateFinalSumOptions(plan);
  }, [phase, plan]);

  const finishRound = useCallback(
    (finalMistakes: number, finalDecompMistakes: number) => {
      const basePoints = 100 + plan.pieces.length * 25;
      const accuracyBonus = finalMistakes === 0 ? 60 : Math.max(0, 40 - finalMistakes * 10);
      const timeBonus =
        mode === 'CHALLENGE' ? Math.max(10, 90 - elapsedSeconds) : 0;
      const earned = basePoints + accuracyBonus + timeBonus;

      setLastPointsEarned(earned);
      soundEngine.playVictory();
      onRoundComplete({
        dividend: plan.dividend,
        divisor: plan.divisor,
        elapsedSeconds,
        mistakesCount: finalMistakes,
        decompositionMistakes: finalDecompMistakes,
        pointsEarned: earned,
        isCustom: Boolean(customProblem),
      });
    },
    [plan, mode, elapsedSeconds, customProblem, onRoundComplete]
  );

  // Handlers for VERIFY_DECOMPOSITION
  const handleVerifyDecomposition = useCallback(
    (selectedValue: number, diagnosticText?: string) => {
      if (!activePiece) return;
      if (selectedValue === activePiece.value) {
        soundEngine.playCorrect();
        const updated = piecesState.map((p, idx) =>
          idx === activeIndex ? { ...p, decomposedVerified: true } : p
        );
        setPiecesState(updated);
        setDecompInput('');

        if (activeIndex + 1 < updated.length) {
          setActiveIndex(activeIndex + 1);
          setFeedback({
            type: 'success',
            text: `${pickRandom(ENCOURAGEMENT_CORRECT)} Peça ${activePiece.value} confirmada!`,
          });
        } else {
          setActiveIndex(0);
          setPhase('DIVIDE_PIECES');
          setFeedback({
            type: 'success',
            text: `Decomposição completa: ${plan.dividend} = ${plan.pieces
              .map((p) => p.value)
              .join(' + ')}. Agora vamos dividir cada peça por ${plan.divisor}!`,
          });
        }
      } else {
        soundEngine.playWrong();
        setMistakesCount((m) => m + 1);
        setDecompositionMistakes((m) => m + 1);
        setFeedback({
          type: 'retry',
          text:
            diagnosticText ||
            `Atenção! O algarismo ${activePiece.digit} está na casa da ${activePiece.label.toLowerCase()} (${activePiece.digit} × ${activePiece.multiplier}). Tente novamente!`,
        });
      }
    },
    [activePiece, piecesState, activeIndex, plan]
  );

  // Handlers for DIVIDE_PIECES
  const handleSolvePieceDivision = useCallback(
    (qVal: number, rVal: number, diagnosticText?: string) => {
      if (!activePiece) return;
      if (qVal === activePiece.partialQuotient && rVal === activePiece.partialRemainder) {
        soundEngine.playCorrect();
        const updated = piecesState.map((p, idx) =>
          idx === activeIndex ? { ...p, dividedDone: true } : p
        );
        setPiecesState(updated);
        setQuotientInput('');
        setRemainderInput('');

        if (activeIndex + 1 < updated.length) {
          setActiveIndex(activeIndex + 1);
          setFeedback({
            type: 'success',
            text: `${pickRandom(ENCOURAGEMENT_CORRECT)} ${activePiece.value} ÷ ${plan.divisor} = ${qVal}${
              rVal > 0 ? ` (sobra ${rVal})` : ''
            }.`,
          });
        } else if (plan.needsBonusRemainderStep) {
          setPhase('BONUS_REMAINDER');
          setFeedback({
            type: 'info',
            text: `Todas as peças divididas! Mas as sobras somaram ${plan.sumPartialRemainders}, que ainda dá para dividir por ${plan.divisor}!`,
          });
        } else {
          setPhase('SUM_QUOTIENTS');
          setFeedback({
            type: 'success',
            text: 'Todas as peças foram divididas! Agora some os quocientes parciais para descobrir o resultado final.',
          });
        }
      } else {
        soundEngine.playWrong();
        setMistakesCount((m) => m + 1);

        let message = diagnosticText;
        if (!message) {
          if (qVal === activePiece.partialQuotient && rVal !== activePiece.partialRemainder) {
            message = `O quociente ${qVal} está certinho! Mas confira a sobra: ${qVal} × ${plan.divisor} = ${
              qVal * plan.divisor
            }. Quanto falta para ${activePiece.value}?`;
          } else {
            message = `${pickRandom(ENCOURAGEMENT_RETRY)} Lembre-se: quantas vezes ${plan.divisor} cabe em ${activePiece.value}?`;
          }
        }
        setFeedback({ type: 'retry', text: message });
      }
    },
    [activePiece, piecesState, activeIndex, plan]
  );

  // Handlers for BONUS_REMAINDER
  const handleSolveBonusRemainder = useCallback(
    (qVal: number, rVal: number, diagnosticText?: string) => {
      if (qVal === plan.bonusQuotient && rVal === plan.finalRemainder) {
        soundEngine.playCorrect();
        setQuotientInput('');
        setRemainderInput('');
        setPhase('SUM_QUOTIENTS');
        setFeedback({
          type: 'success',
          text: `Brilhante! ${plan.sumPartialRemainders} ÷ ${plan.divisor} = ${qVal} com resto final ${rVal}. Agora some os quocientes!`,
        });
      } else {
        soundEngine.playWrong();
        setMistakesCount((m) => m + 1);
        setFeedback({
          type: 'retry',
          text:
            diagnosticText ||
            `Confira a divisão das sobras: ${plan.sumPartialRemainders} ÷ ${plan.divisor}. Quanto cabe e quanto sobra no final?`,
        });
      }
    },
    [plan]
  );

  // Handlers for SUM_QUOTIENTS
  const handleSolveFinalSum = useCallback(
    (sumVal: number, diagnosticText?: string) => {
      if (sumVal === plan.finalQuotient) {
        finishRound(mistakesCount, decompositionMistakes);
      } else {
        soundEngine.playWrong();
        setMistakesCount((m) => m + 1);
        setFeedback({
          type: 'retry',
          text:
            diagnosticText ||
            `Quase lá! Some com calma todos os quocientes parciais na bandeja acima.`,
        });
      }
    },
    [plan.finalQuotient, finishRound, mistakesCount, decompositionMistakes]
  );

  // Keyboard shortcuts 1-4 for Guided Mode
  useEffect(() => {
    if (gameState !== 'PLAYING' || mode !== 'GUIDED') return;
    const handleKey = (e: KeyboardEvent) => {
      const idx = ['1', '2', '3', '4'].indexOf(e.key);
      if (idx === -1) return;

      if (phase === 'VERIFY_DECOMPOSITION' && decompOptions[idx]) {
        handleVerifyDecomposition(decompOptions[idx].value, decompOptions[idx].diagnosticFeedback);
      } else if (phase === 'DIVIDE_PIECES' && divisionOptions[idx]) {
        const val = divisionOptions[idx].value as DivisionResultValue;
        handleSolvePieceDivision(val.quotient, val.remainder, divisionOptions[idx].diagnosticFeedback);
      } else if (phase === 'BONUS_REMAINDER' && divisionOptions[idx]) {
        const val = divisionOptions[idx].value as DivisionResultValue;
        handleSolveBonusRemainder(val.quotient, val.remainder, divisionOptions[idx].diagnosticFeedback);
      } else if (phase === 'SUM_QUOTIENTS' && finalSumOptions[idx]) {
        handleSolveFinalSum(finalSumOptions[idx].value, finalSumOptions[idx].diagnosticFeedback);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [
    gameState,
    mode,
    phase,
    decompOptions,
    divisionOptions,
    finalSumOptions,
    handleVerifyDecomposition,
    handleSolvePieceDivision,
    handleSolveBonusRemainder,
    handleSolveFinalSum,
  ]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const dividedPieces = piecesState.filter((p) => p.dividedDone);
  const currentRemainderSum = dividedPieces.reduce((acc, p) => acc + p.partialRemainder, 0);

  const keypadFieldLabels: Record<NonNullable<typeof activeKeypadField>, string> = {
    decomp: 'Valor da peça',
    quotient: phase === 'BONUS_REMAINDER' ? 'Quociente Extra' : 'Resultado (Quociente)',
    remainder: phase === 'BONUS_REMAINDER' ? 'Resto Final' : 'Sobra (Resto)',
    finalSum: 'Soma total',
  };

  const handleKeypadDigit = (digit: string) => {
    if (activeKeypadField === 'decomp') {
      setDecompInput((prev) => (prev.length >= 4 ? prev : `${prev}${digit}`));
    } else if (activeKeypadField === 'quotient') {
      setQuotientInput((prev) => (prev.length >= 4 ? prev : `${prev}${digit}`));
    } else if (activeKeypadField === 'remainder') {
      setRemainderInput((prev) => (prev.length >= 3 ? prev : `${prev}${digit}`));
    } else if (activeKeypadField === 'finalSum') {
      setFinalSumInput((prev) => (prev.length >= 4 ? prev : `${prev}${digit}`));
    }
  };

  const handleKeypadBackspace = () => {
    if (activeKeypadField === 'decomp') {
      setDecompInput((prev) => prev.slice(0, -1));
    } else if (activeKeypadField === 'quotient') {
      setQuotientInput((prev) => prev.slice(0, -1));
    } else if (activeKeypadField === 'remainder') {
      setRemainderInput((prev) => prev.slice(0, -1));
    } else if (activeKeypadField === 'finalSum') {
      setFinalSumInput((prev) => prev.slice(0, -1));
    }
  };

  const handleKeypadClear = () => {
    if (activeKeypadField === 'decomp') setDecompInput('');
    else if (activeKeypadField === 'quotient') setQuotientInput('');
    else if (activeKeypadField === 'remainder') setRemainderInput('');
    else if (activeKeypadField === 'finalSum') setFinalSumInput('');
  };

  const handleKeypadConfirm = () => {
    if (phase === 'VERIFY_DECOMPOSITION') {
      const num = Number(decompInput);
      if (!decompInput.trim() || Number.isNaN(num)) return;
      handleVerifyDecomposition(num);
    } else if (phase === 'DIVIDE_PIECES') {
      if (!quotientInput.trim()) return;
      const q = Number(quotientInput);
      const r = remainderInput.trim() === '' ? 0 : Number(remainderInput);
      if (Number.isNaN(q) || Number.isNaN(r)) return;
      handleSolvePieceDivision(q, r);
    } else if (phase === 'BONUS_REMAINDER') {
      if (!quotientInput.trim()) return;
      const q = Number(quotientInput);
      const r = remainderInput.trim() === '' ? 0 : Number(remainderInput);
      if (Number.isNaN(q) || Number.isNaN(r)) return;
      handleSolveBonusRemainder(q, r);
    } else if (phase === 'SUM_QUOTIENTS') {
      if (!finalSumInput.trim()) return;
      const sum = Number(finalSumInput);
      if (Number.isNaN(sum)) return;
      handleSolveFinalSum(sum);
    }
  };

  return (
    <div className="relative min-h-screen w-full drafting-grid flex flex-col justify-between px-4 py-4 sm:px-8 sm:py-6">
      <BackgroundScene opacityClass="opacity-[0.13]" />

      {/* Unobtrusive Top HUD */}
      <header className="relative z-10 max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 bg-white/95 border border-slate-200 rounded-2xl px-4 py-2.5 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onPauseToggle();
            }}
            className="min-w-[44px] min-h-[44px] px-3 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
            aria-label="Pausar jogo"
          >
            <Pause className="w-4 h-4" />
            <span className="hidden sm:inline">Pausa</span>
          </button>

          <div className="text-xs sm:text-sm text-slate-600 flex items-center gap-2">
            <span className="font-display font-bold text-slate-900">
              {mode === 'GUIDED' ? 'Modo Guiado' : 'Desafio Cronometrado'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate max-w-[180px] sm:max-w-none">
              {customProblem ? 'Número Personalizado' : activePreset.title}
            </span>
          </div>
        </div>

        {/* Clean Tabular Metrics + Utility Buttons */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-600 tabular-nums">
            <span>
              Pontos: <strong className="text-slate-900 font-bold">{score}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Sequência: <strong className="text-slate-900 font-bold">{streak}</strong>
            </span>
            {mode === 'CHALLENGE' && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-700">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTimer(elapsedSeconds)}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onResetGame();
              }}
              className="min-w-[44px] min-h-[44px] px-3 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-xs font-semibold text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
              title="Reiniciar jogo e zerar pontuação"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden md:inline">Reiniciar Jogo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onOpenCustom();
              }}
              className="min-w-[44px] min-h-[44px] px-3 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
              title="Inserir outro dividendo e divisor"
            >
              <Calculator className="w-4 h-4 text-blue-600" />
              <span className="hidden md:inline">Outro Número</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onOpenAchievements();
              }}
              className="min-w-[44px] min-h-[44px] px-3 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer tabular-nums whitespace-nowrap"
              title="Conquistas"
            >
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>{unlockedCount}/{totalAchievements}</span>
            </button>

            <button
              type="button"
              onClick={onToggleMute}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              aria-label={isMuted ? 'Ativar som' : 'Silenciar som'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Play Workbench */}
      <main className="relative z-10 max-w-6xl w-full mx-auto my-auto py-4 space-y-5">
        {/* Operation Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-2">
          <div>
            <div className="text-xs font-medium text-slate-500">
              {phase === 'ASSEMBLED' && 'Etapa 1 de 3 · Montagem do Quebra-Cabeça'}
              {phase === 'VERIFY_DECOMPOSITION' && 'Etapa 1 de 3 · Decomposição por Valor Posicional'}
              {phase === 'DIVIDE_PIECES' && 'Etapa 2 de 3 · Divisão Peça por Peça'}
              {phase === 'BONUS_REMAINDER' && 'Etapa Extra · Dividindo as Sobras Acumuladas'}
              {phase === 'SUM_QUOTIENTS' && 'Etapa 3 de 3 · Soma dos Resultados Obtidos'}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums mt-0.5">
              {plan.dividend} ÷ {plan.divisor}
            </h2>
          </div>

          {!customProblem && (
            <div className="text-xs text-slate-600 max-w-md">
              Dica: {activePreset.hint}
            </div>
          )}
        </div>

        {/* Puzzle Stage with Interactive Hand Pointer */}
        <section
          ref={workbenchRef}
          className="bg-white/95 border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-sm relative overflow-hidden"
        >
          {/* Hand Pointer Row */}
          <div className="h-16 flex items-end justify-center mb-1">
            {(phase === 'VERIFY_DECOMPOSITION' || phase === 'DIVIDE_PIECES') && (
              <div
                className="transition-transform duration-300 ease-out"
                style={{ transform: `translateX(${pointerX}px)` }}
              >
                <InteractiveHandPointer
                  label={
                    phase === 'VERIFY_DECOMPOSITION'
                      ? `Ordem: ${activePiece?.label}`
                      : `Dividindo ${activePiece?.value}`
                  }
                />
              </div>
            )}
          </div>

          {/* Puzzle Pieces Row */}
          <div
            className={`flex items-center justify-center min-h-[146px] transition-all duration-300 ${
              phase === 'ASSEMBLED'
                ? 'gap-0'
                : 'gap-3 sm:gap-5 flex-wrap'
            }`}
          >
            {piecesState.map((piece, idx) => {
              const isAssembled = phase === 'ASSEMBLED';
              const isMasked =
                phase === 'VERIFY_DECOMPOSITION' && !piece.decomposedVerified;
              const isActive =
                (phase === 'VERIFY_DECOMPOSITION' || phase === 'DIVIDE_PIECES') &&
                idx === activeIndex;

              return (
                <div
                  key={piece.id}
                  ref={(el) => {
                    pieceRefs.current[idx] = el;
                  }}
                >
                  <PuzzlePieceSvg
                    place={piece.place}
                    label={piece.label}
                    shortLabel={piece.shortLabel}
                    value={piece.value}
                    digit={piece.digit}
                    isFirst={idx === 0}
                    isLast={idx === piecesState.length - 1}
                    assembled={isAssembled}
                    isMasked={isMasked}
                    isActive={isActive}
                    isDone={piece.dividedDone}
                    partialQuotient={piece.partialQuotient}
                    partialRemainder={piece.partialRemainder}
                    divisor={plan.divisor}
                  />
                </div>
              );
            })}

            {phase === 'ASSEMBLED' && (
              <div className="ml-4 font-display text-3xl font-extrabold text-slate-900 tabular-nums">
                ÷ {plan.divisor}
              </div>
            )}
          </div>

          {/* Partial Quotients & Remainders Accumulation Trays */}
          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Partial Quotients Tray */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="text-xs font-semibold text-slate-500 mb-2">
                Resultados das peças (Quocientes Parciais)
              </div>
              <div className="flex flex-wrap items-center gap-2 min-h-[36px] font-mono text-base font-bold text-slate-900 tabular-nums">
                {dividedPieces.length === 0 ? (
                  <span className="text-xs font-sans font-normal text-slate-400">
                    Os resultados de cada peça aparecerão aqui...
                  </span>
                ) : (
                  <>
                    {dividedPieces.map((p, i) => (
                      <React.Fragment key={p.id}>
                        {i > 0 && <span className="text-slate-400">+</span>}
                        <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-blue-700">
                          {p.partialQuotient}
                        </span>
                      </React.Fragment>
                    ))}
                    {plan.needsBonusRemainderStep && phase === 'SUM_QUOTIENTS' && (
                      <>
                        <span className="text-slate-400">+</span>
                        <span className="px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-300 text-violet-700">
                          {plan.bonusQuotient} (das sobras)
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Partial Remainders Tray */}
            <div
              ref={bonusTrayRef}
              className={`p-4 rounded-2xl border transition-colors ${
                phase === 'BONUS_REMAINDER'
                  ? 'bg-violet-50 border-violet-400 ring-2 ring-violet-500/20'
                  : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-500">
                  Bandeja das Sobras (Resto)
                </span>
                {phase === 'BONUS_REMAINDER' && (
                  <span className="text-xs font-bold text-violet-700">
                    Sobra acumulada em foco!
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 min-h-[36px] font-mono text-base font-bold text-slate-900 tabular-nums">
                {dividedPieces.length === 0 ? (
                  <span className="text-xs font-sans font-normal text-slate-400">
                    Nenhuma sobra registrada ainda.
                  </span>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span>
                      {dividedPieces.map((p) => p.partialRemainder).join(' + ')} ={' '}
                      <strong className="text-rose-700">{currentRemainderSum}</strong>
                    </span>
                    {phase === 'SUM_QUOTIENTS' && (
                      <span className="text-xs font-sans font-semibold text-slate-600">
                        Resto final: <strong className="text-slate-900">{plan.finalRemainder}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Action Panel (Question / Options / Challenge Input) */}
        <section className="bg-white/95 border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          {/* Immediate Feedback Banner */}
          {feedback && (
            <div
              className={`px-4 py-3 rounded-xl border text-sm font-medium flex items-start gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : feedback.type === 'retry'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Phase-specific prompt & controls */}
          {phase === 'ASSEMBLED' && (
            <div className="flex items-center justify-between gap-4 py-2">
              <p className="text-sm text-slate-600">
                Preparando as peças do quebra-cabeça de <strong>{plan.dividend}</strong>...
              </p>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSplit();
                  setPhase('VERIFY_DECOMPOSITION');
                }}
                className="px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
              >
                Separar Agora
              </button>
            </div>
          )}

          {/* VERIFY_DECOMPOSITION Controls */}
          {phase === 'VERIFY_DECOMPOSITION' && activePiece && (
            <div className="space-y-4">
              <div className="font-display text-lg font-bold text-slate-900">
                Em <span className="tabular-nums">{plan.dividend}</span>, qual é o valor relativo da peça do algarismo{' '}
                <span className="text-blue-700">{activePiece.digit}</span> ({activePiece.label})?
              </div>

              {mode === 'GUIDED' ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {decompOptions.map((opt, idx) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleVerifyDecomposition(opt.value, opt.diagnosticFeedback)}
                      className="min-h-[52px] px-4 py-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-500 font-mono text-lg font-bold text-slate-900 tabular-nums transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span className="text-xs font-sans font-semibold text-slate-400">{idx + 1}.</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const num = Number(decompInput);
                      if (!decompInput.trim() || Number.isNaN(num)) return;
                      handleVerifyDecomposition(num);
                    }}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <input
                      type="text"
                      inputMode="none"
                      placeholder="Clique para digitar"
                      value={decompInput}
                      onClick={() => setActiveKeypadField('decomp')}
                      onChange={(e) => setDecompInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className={`w-56 px-4 py-3 min-h-[48px] rounded-xl border font-mono text-lg font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                        activeKeypadField === 'decomp' ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-300'
                      }`}
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-6 py-3 min-h-[48px] rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Confirmar Peça
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                  {activeKeypadField === 'decomp' && (
                    <DigitalKeypad
                      fieldLabel={keypadFieldLabels.decomp}
                      onDigit={handleKeypadDigit}
                      onBackspace={handleKeypadBackspace}
                      onClear={handleKeypadClear}
                      onConfirm={handleKeypadConfirm}
                      onClose={() => setActiveKeypadField(null)}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* DIVIDE_PIECES Controls */}
          {phase === 'DIVIDE_PIECES' && activePiece && (
            <div className="space-y-4">
              <div className="font-display text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
                Quanto dá <span className="text-blue-700">{activePiece.value} ÷ {plan.divisor}</span>?
              </div>

              {mode === 'GUIDED' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {divisionOptions.map((opt, idx) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        handleSolvePieceDivision(
                          opt.value.quotient,
                          opt.value.remainder,
                          opt.diagnosticFeedback
                        )
                      }
                      className="min-h-[52px] px-4 py-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-500 font-mono text-base font-bold text-slate-900 tabular-nums transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span className="text-xs font-sans font-semibold text-slate-400">{idx + 1}.</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!quotientInput.trim()) return;
                      const q = Number(quotientInput);
                      const r = remainderInput.trim() === '' ? 0 : Number(remainderInput);
                      if (Number.isNaN(q) || Number.isNaN(r)) return;
                      handleSolvePieceDivision(q, r);
                    }}
                    className="flex flex-wrap items-end gap-3"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Resultado (Quociente)
                      </label>
                      <input
                        type="text"
                        inputMode="none"
                        placeholder="Ex: 500"
                        value={quotientInput}
                        onClick={() => setActiveKeypadField('quotient')}
                        onChange={(e) => setQuotientInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className={`w-40 px-4 py-2.5 min-h-[48px] rounded-xl border font-mono text-lg font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                          activeKeypadField === 'quotient' ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Sobra (Resto)
                      </label>
                      <input
                        type="text"
                        inputMode="none"
                        placeholder="0"
                        value={remainderInput}
                        onClick={() => setActiveKeypadField('remainder')}
                        onChange={(e) => setRemainderInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        className={`w-32 px-4 py-2.5 min-h-[48px] rounded-xl border font-mono text-lg font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                          activeKeypadField === 'remainder' ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-6 py-3 min-h-[48px] rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Dividir Peça
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                  {(activeKeypadField === 'quotient' || activeKeypadField === 'remainder') && (
                    <DigitalKeypad
                      fieldLabel={keypadFieldLabels[activeKeypadField]}
                      onDigit={handleKeypadDigit}
                      onBackspace={handleKeypadBackspace}
                      onClear={handleKeypadClear}
                      onConfirm={handleKeypadConfirm}
                      onClose={() => setActiveKeypadField(null)}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* BONUS_REMAINDER Controls */}
          {phase === 'BONUS_REMAINDER' && (
            <div className="space-y-4">
              <div className="font-display text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
                Dividindo as sobras acumuladas: <span className="text-violet-700">{plan.sumPartialRemainders} ÷ {plan.divisor}</span>
              </div>

              {mode === 'GUIDED' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {divisionOptions.map((opt, idx) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        handleSolveBonusRemainder(
                          opt.value.quotient,
                          opt.value.remainder,
                          opt.diagnosticFeedback
                        )
                      }
                      className="min-h-[52px] px-4 py-3 rounded-xl bg-violet-50/70 hover:bg-violet-100 border border-violet-200 hover:border-violet-500 font-mono text-base font-bold text-slate-900 tabular-nums transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span className="text-xs font-sans font-semibold text-violet-400">{idx + 1}.</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!quotientInput.trim()) return;
                      const q = Number(quotientInput);
                      const r = remainderInput.trim() === '' ? 0 : Number(remainderInput);
                      if (Number.isNaN(q) || Number.isNaN(r)) return;
                      handleSolveBonusRemainder(q, r);
                    }}
                    className="flex flex-wrap items-end gap-3"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Quociente Extra
                      </label>
                      <input
                        type="text"
                        inputMode="none"
                        placeholder="Clique"
                        value={quotientInput}
                        onClick={() => setActiveKeypadField('quotient')}
                        onChange={(e) => setQuotientInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className={`w-40 px-4 py-2.5 min-h-[48px] rounded-xl border font-mono text-lg font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-violet-600 ${
                          activeKeypadField === 'quotient' ? 'border-violet-600 ring-2 ring-violet-600/20' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Resto Final
                      </label>
                      <input
                        type="text"
                        inputMode="none"
                        placeholder="0"
                        value={remainderInput}
                        onClick={() => setActiveKeypadField('remainder')}
                        onChange={(e) => setRemainderInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
                        className={`w-32 px-4 py-2.5 min-h-[48px] rounded-xl border font-mono text-lg font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-violet-600 ${
                          activeKeypadField === 'remainder' ? 'border-violet-600 ring-2 ring-violet-600/20' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-6 py-3 min-h-[48px] rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Confirmar Sobras
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                  {(activeKeypadField === 'quotient' || activeKeypadField === 'remainder') && (
                    <DigitalKeypad
                      fieldLabel={keypadFieldLabels[activeKeypadField]}
                      onDigit={handleKeypadDigit}
                      onBackspace={handleKeypadBackspace}
                      onClear={handleKeypadClear}
                      onConfirm={handleKeypadConfirm}
                      onClose={() => setActiveKeypadField(null)}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* SUM_QUOTIENTS Controls */}
          {phase === 'SUM_QUOTIENTS' && (
            <div className="space-y-4">
              <div className="font-display text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
                Qual é o quociente final? Some:{' '}
                <span className="text-blue-700">
                  {[
                    ...plan.pieces.map((p) => p.partialQuotient),
                    ...(plan.bonusQuotient > 0 ? [plan.bonusQuotient] : []),
                  ].join(' + ')}
                </span>
              </div>

              {mode === 'GUIDED' ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {finalSumOptions.map((opt, idx) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSolveFinalSum(opt.value, opt.diagnosticFeedback)}
                      className="min-h-[52px] px-4 py-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-500 font-mono text-lg font-bold text-slate-900 tabular-nums transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span className="text-xs font-sans font-semibold text-slate-400">{idx + 1}.</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!finalSumInput.trim()) return;
                      const sum = Number(finalSumInput);
                      if (Number.isNaN(sum)) return;
                      handleSolveFinalSum(sum);
                    }}
                    className="flex flex-wrap items-center gap-3"
                  >
                    <input
                      type="text"
                      inputMode="none"
                      placeholder="Clique para somar"
                      value={finalSumInput}
                      onClick={() => setActiveKeypadField('finalSum')}
                      onChange={(e) => setFinalSumInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className={`w-48 px-4 py-3 min-h-[48px] rounded-xl border font-mono text-lg font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-600 ${
                        activeKeypadField === 'finalSum' ? 'border-emerald-600 ring-2 ring-emerald-600/20' : 'border-slate-300'
                      }`}
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-6 py-3 min-h-[48px] rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Concluir Divisão
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </form>
                  {activeKeypadField === 'finalSum' && (
                    <DigitalKeypad
                      fieldLabel={keypadFieldLabels.finalSum}
                      onDigit={handleKeypadDigit}
                      onBackspace={handleKeypadBackspace}
                      onClear={handleKeypadClear}
                      onConfirm={handleKeypadConfirm}
                      onClose={() => setActiveKeypadField(null)}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Achievement Unlock Toast */}
      {recentAchievement && (
        <div className="fixed bottom-5 right-5 z-40 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 max-w-sm">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-amber-400">Nova Conquista Desbloqueada</div>
            <div className="font-display font-bold text-sm">{recentAchievement.title}</div>
          </div>
        </div>
      )}

      {/* PAUSED Modal */}
      {gameState === 'PAUSED' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-5 text-center">
            <h2 className="font-display text-2xl font-bold text-slate-900">Jogo Pausado</h2>
            <p className="text-sm text-slate-600">
              Você está resolvendo <strong className="tabular-nums">{plan.dividend} ÷ {plan.divisor}</strong>.
            </p>
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onPauseToggle();
                }}
                className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                Continuar Jogando
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onReplayRound();
                }}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Reiniciar Divisão Atual
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onResetGame();
                }}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 text-rose-700 font-semibold text-sm hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Reiniciar Jogo (Zerar Pontos)
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onExitToMenu();
                }}
                className="w-full min-h-[44px] rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Voltar ao Menu Inicial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROUND_SUMMARY Victory Modal */}
      {gameState === 'ROUND_SUMMARY' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
                Quebra-Cabeça Resolvido!
              </h2>
              <p className="text-sm text-slate-600">
                Você completou a divisão por decomposição com sucesso.
              </p>
            </div>

            {/* Final Mathematical Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-center tabular-nums">
              <div className="font-display text-2xl font-extrabold text-slate-900">
                {plan.dividend} ÷ {plan.divisor} = <span className="text-blue-700">{plan.finalQuotient}</span>
              </div>
              <div className="text-sm font-medium text-slate-600">
                Resto da operação: <strong className="text-slate-900">{plan.finalRemainder}</strong>
              </div>
              <div className="text-xs font-mono text-slate-500 pt-1 border-t border-slate-200/70">
                Prova real: {plan.finalQuotient} × {plan.divisor} + {plan.finalRemainder} = {plan.dividend}
              </div>
            </div>

            {/* Round Metrics */}
            <div className="grid grid-cols-3 gap-3 text-center tabular-nums">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500">Pontos Ganhos</div>
                <div className="font-display text-lg font-bold text-emerald-700">+{lastPointsEarned}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500">Erros</div>
                <div className="font-display text-lg font-bold text-slate-900">{mistakesCount}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500">Tempo</div>
                <div className="font-display text-lg font-bold text-slate-900">
                  {mode === 'CHALLENGE' ? `${elapsedSeconds}s` : 'Livre'}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onNextLevel();
                }}
                className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-display font-bold text-sm hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                Próximo Desafio
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onOpenCustom();
                }}
                className="min-h-[48px] px-4 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 text-slate-800 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                Outro Número
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onExitToMenu();
                }}
                className="min-h-[48px] px-4 inline-flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { useCallback, useEffect, useState } from 'react';
import {
  CHALLENGE_LEVELS,
  GUIDED_LEVELS,
  INITIAL_ACHIEVEMENTS,
} from './data/curriculumAndLevels';
import { Achievement, GameMode, GameState, PlayerStats } from './types/game';
import { TitleScreen } from './components/TitleScreen';
import { GamePlayArena } from './components/GamePlayArena';
import { CurriculumModal } from './components/CurriculumModal';
import { AchievementsModal } from './components/AchievementsModal';
import { CustomNumberModal } from './components/CustomNumberModal';
import { soundEngine } from './utils/sound';

const STORAGE_KEY = 'quebre_numero_progress_v1';

const DEFAULT_STATS: PlayerStats = {
  totalScore: 0,
  roundsCompleted: 0,
  guidedCompleted: 0,
  challengeCompleted: 0,
  bestStreak: 0,
  currentStreak: 0,
  customProblemsSolved: 0,
  bestChallengeTimeSec: null,
};

interface SavedProgress {
  stats: PlayerStats;
  unlockedIds: string[];
}

function loadSavedProgress(): { stats: PlayerStats; achievements: Achievement[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { stats: DEFAULT_STATS, achievements: INITIAL_ACHIEVEMENTS };
    }
    const parsed = JSON.parse(raw) as Partial<SavedProgress>;
    const unlockedSet = new Set(parsed.unlockedIds ?? []);
    return {
      stats: { ...DEFAULT_STATS, ...(parsed.stats ?? {}) },
      achievements: INITIAL_ACHIEVEMENTS.map((a) => ({
        ...a,
        unlocked: unlockedSet.has(a.id),
      })),
    };
  } catch {
    return { stats: DEFAULT_STATS, achievements: INITIAL_ACHIEVEMENTS };
  }
}

export default function App() {
  const initial = loadSavedProgress();

  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [mode, setMode] = useState<GameMode>('GUIDED');
  const [guidedIndex, setGuidedIndex] = useState(0);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [customProblem, setCustomProblem] = useState<{ dividend: number; divisor: number } | null>(null);
  const [roundNonce, setRoundNonce] = useState(0);

  const [stats, setStats] = useState<PlayerStats>(initial.stats);
  const [achievements, setAchievements] = useState<Achievement[]>(initial.achievements);
  const [recentAchievement, setRecentAchievement] = useState<Achievement | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const [isCurriculumOpen, setIsCurriculumOpen] = useState(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  // Persist progress
  useEffect(() => {
    try {
      const payload: SavedProgress = {
        stats,
        unlockedIds: achievements.filter((a) => a.unlocked).map((a) => a.id),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [stats, achievements]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  // Global keyboard shortcuts (Escape for Pause, M for Mute)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      if (e.key === 'Escape') {
        if (isCurriculumOpen || isAchievementsOpen || isCustomOpen) return;
        if (gameState === 'PLAYING') {
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
        }
      } else if ((e.key === 'm' || e.key === 'M') && !isTyping) {
        handleToggleMute();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, isCurriculumOpen, isAchievementsOpen, isCustomOpen, handleToggleMute]);

  const handleStartGame = useCallback((chosenMode: GameMode) => {
    setMode(chosenMode);
    setCustomProblem(null);
    setRoundNonce((n) => n + 1);
    setGameState('PLAYING');
  }, []);

  const handleStartCustom = useCallback(
    (dividend: number, divisor: number, chosenMode: GameMode) => {
      setMode(chosenMode);
      setCustomProblem({ dividend, divisor });
      setIsCustomOpen(false);
      setRoundNonce((n) => n + 1);
      setGameState('PLAYING');
    },
    []
  );

  const handleRoundComplete = useCallback(
    (result: {
      dividend: number;
      divisor: number;
      elapsedSeconds: number;
      mistakesCount: number;
      decompositionMistakes: number;
      pointsEarned: number;
      isCustom: boolean;
    }) => {
      const nextStreak = stats.currentStreak + 1;
      const nextBestStreak = Math.max(stats.bestStreak, nextStreak);
      const nextBestTime =
        mode === 'CHALLENGE'
          ? stats.bestChallengeTimeSec === null
            ? result.elapsedSeconds
            : Math.min(stats.bestChallengeTimeSec, result.elapsedSeconds)
          : stats.bestChallengeTimeSec;

      const updatedStats: PlayerStats = {
        totalScore: stats.totalScore + result.pointsEarned,
        roundsCompleted: stats.roundsCompleted + 1,
        guidedCompleted: stats.guidedCompleted + (mode === 'GUIDED' ? 1 : 0),
        challengeCompleted: stats.challengeCompleted + (mode === 'CHALLENGE' ? 1 : 0),
        bestStreak: nextBestStreak,
        currentStreak: nextStreak,
        customProblemsSolved: stats.customProblemsSolved + (result.isCustom ? 1 : 0),
        bestChallengeTimeSec: nextBestTime,
      };
      setStats(updatedStats);

      // Evaluate achievement unlocks
      const shouldUnlock: Record<string, boolean> = {
        'first-puzzle': true,
        'place-value-master': result.decompositionMistakes === 0,
        'surgical-precision': result.mistakesCount === 0,
        'no-fear-remainder': result.dividend % result.divisor > 0,
        'thousands-champion': result.dividend >= 1000,
        'lightning-calc': mode === 'CHALLENGE' && result.elapsedSeconds <= 45,
        'streak-three': nextStreak >= 3,
        'numeric-explorer': result.isCustom,
      };

      let newlyUnlocked: Achievement | null = null;
      setAchievements((prev) =>
        prev.map((ach) => {
          if (!ach.unlocked && shouldUnlock[ach.id]) {
            const unlockedItem = {
              ...ach,
              unlocked: true,
              unlockedAt: new Date().toISOString(),
            };
            if (!newlyUnlocked) newlyUnlocked = unlockedItem;
            return unlockedItem;
          }
          return ach;
        })
      );

      if (newlyUnlocked) {
        setRecentAchievement(newlyUnlocked);
        soundEngine.playAchievement();
        setTimeout(() => {
          setRecentAchievement(null);
        }, 4200);
      }

      setGameState('ROUND_SUMMARY');
    },
    [stats, mode]
  );

  const handleNextLevel = useCallback(() => {
    setCustomProblem(null);
    if (mode === 'GUIDED') {
      setGuidedIndex((i) => (i + 1) % GUIDED_LEVELS.length);
    } else {
      setChallengeIndex((i) => (i + 1) % CHALLENGE_LEVELS.length);
    }
    setRoundNonce((n) => n + 1);
    setGameState('PLAYING');
  }, [mode]);

  const handleReplayRound = useCallback(() => {
    setRoundNonce((n) => n + 1);
    setGameState('PLAYING');
  }, []);

  const handleResetGame = useCallback(() => {
    setStats(DEFAULT_STATS);
    setGuidedIndex(0);
    setChallengeIndex(0);
    setCustomProblem(null);
    setRecentAchievement(null);
    setRoundNonce((n) => n + 1);
    setGameState((prev) => (prev === 'TITLE_MENU' ? 'TITLE_MENU' : 'PLAYING'));
  }, []);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <>
      {gameState === 'TITLE_MENU' ? (
        <TitleScreen
          selectedMode={mode}
          onSelectMode={setMode}
          onStartGame={handleStartGame}
          onOpenCustom={() => setIsCustomOpen(true)}
          onOpenCurriculum={() => setIsCurriculumOpen(true)}
          onOpenAchievements={() => setIsAchievementsOpen(true)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          stats={stats}
          unlockedCount={unlockedCount}
          totalAchievements={achievements.length}
          onResetGame={handleResetGame}
        />
      ) : (
        <GamePlayArena
          key={`${mode}-${guidedIndex}-${challengeIndex}-${customProblem?.dividend ?? 'preset'}-${customProblem?.divisor ?? 'preset'}-${roundNonce}`}
          gameState={gameState}
          mode={mode}
          levelIndex={mode === 'GUIDED' ? guidedIndex : challengeIndex}
          levels={mode === 'GUIDED' ? GUIDED_LEVELS : CHALLENGE_LEVELS}
          customProblem={customProblem}
          score={stats.totalScore}
          streak={stats.currentStreak}
          isMuted={isMuted}
          unlockedCount={unlockedCount}
          totalAchievements={achievements.length}
          recentAchievement={recentAchievement}
          onToggleMute={handleToggleMute}
          onPauseToggle={() =>
            setGameState((prev) => (prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'))
          }
          onExitToMenu={() => setGameState('TITLE_MENU')}
          onOpenCustom={() => setIsCustomOpen(true)}
          onOpenAchievements={() => setIsAchievementsOpen(true)}
          onRoundComplete={handleRoundComplete}
          onNextLevel={handleNextLevel}
          onReplayRound={handleReplayRound}
          onResetGame={handleResetGame}
        />
      )}

      <CurriculumModal
        isOpen={isCurriculumOpen}
        onClose={() => setIsCurriculumOpen(false)}
      />

      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        achievements={achievements}
        stats={stats}
      />

      <CustomNumberModal
        isOpen={isCustomOpen}
        onClose={() => setIsCustomOpen(false)}
        defaultMode={mode}
        onStartCustom={handleStartCustom}
      />
    </>
  );
}

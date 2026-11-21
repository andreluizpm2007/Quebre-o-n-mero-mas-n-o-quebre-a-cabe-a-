export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'ROUND_SUMMARY';

export type GameMode = 'GUIDED' | 'CHALLENGE';

export type PlayPhase =
  | 'ASSEMBLED'
  | 'VERIFY_DECOMPOSITION'
  | 'DIVIDE_PIECES'
  | 'BONUS_REMAINDER'
  | 'SUM_QUOTIENTS';

export type PlaceValueType = 'MILHAR' | 'CENTENA' | 'DEZENA' | 'UNIDADE' | 'SOBRA';

export interface PuzzlePieceData {
  id: string;
  place: PlaceValueType;
  label: string;
  shortLabel: string;
  digit: number;
  multiplier: number;
  value: number;
  partialQuotient: number;
  partialRemainder: number;
  decomposedVerified: boolean;
  dividedDone: boolean;
}

export interface DivisionPlan {
  dividend: number;
  divisor: number;
  pieces: PuzzlePieceData[];
  sumPartialRemainders: number;
  needsBonusRemainderStep: boolean;
  bonusQuotient: number;
  finalRemainder: number;
  finalQuotient: number;
}

export interface GuidedOption<T> {
  id: string;
  label: string;
  value: T;
  isCorrect: boolean;
  diagnosticFeedback: string;
}

export interface LevelPreset {
  id: string;
  tier: 1 | 2 | 3 | 4;
  title: string;
  dividend: number;
  divisor: number;
  hint: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  iconName: 'puzzle' | 'target' | 'zap' | 'compass' | 'layers' | 'award' | 'flame' | 'calculator';
  unlocked: boolean;
  unlockedAt?: string;
}

export interface PlayerStats {
  totalScore: number;
  roundsCompleted: number;
  guidedCompleted: number;
  challengeCompleted: number;
  bestStreak: number;
  currentStreak: number;
  customProblemsSolved: number;
  bestChallengeTimeSec: number | null;
}

export interface FeedbackMessage {
  type: 'success' | 'retry' | 'info';
  text: string;
}

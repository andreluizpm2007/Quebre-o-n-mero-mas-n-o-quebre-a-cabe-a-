import React, { useEffect } from 'react';
import { Award, Calculator, Compass, Flame, Layers, Lock, Puzzle, Target, Trophy, X, Zap } from 'lucide-react';
import { Achievement, PlayerStats } from '../types/game';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
  stats: PlayerStats;
}

const ICON_MAP: Record<Achievement['iconName'], React.FC<{ className?: string }>> = {
  puzzle: Puzzle,
  target: Target,
  zap: Zap,
  compass: Compass,
  layers: Layers,
  award: Award,
  flame: Flame,
  calculator: Calculator,
};

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  achievements,
  stats,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="achievements-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 id="achievements-modal-title" className="font-display text-lg font-bold text-slate-900">
                Conquistas e Desempenho
              </h2>
              <p className="text-xs text-slate-500 tabular-nums">
                {unlockedCount} de {achievements.length} conquistas desbloqueadas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Fechar conquistas"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6 space-y-6">
          {/* Player Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500">Pontuação Total</div>
              <div className="font-display text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                {stats.totalScore}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500">Divisões Feitas</div>
              <div className="font-display text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                {stats.roundsCompleted}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500">Melhor Sequência</div>
              <div className="font-display text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                {stats.bestStreak}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500">Recorde Desafio</div>
              <div className="font-display text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                {stats.bestChallengeTimeSec !== null ? `${stats.bestChallengeTimeSec}s` : '—'}
              </div>
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {achievements.map((ach) => {
              const Icon = ICON_MAP[ach.iconName];
              return (
                <div
                  key={ach.id}
                  className={`p-4 rounded-xl border transition-colors flex items-start gap-3.5 ${
                    ach.unlocked
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50/70 border-slate-200 opacity-75'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      ach.unlocked
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {ach.unlocked ? <Icon className="w-5 h-5" /> : <Lock className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-slate-900 leading-tight">
                        {ach.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {ach.description}
                    </p>
                    <div className="text-[11px] font-medium mt-1.5 text-slate-500">
                      {ach.unlocked ? 'Desbloqueada' : 'Bloqueada'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 min-h-[44px] rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

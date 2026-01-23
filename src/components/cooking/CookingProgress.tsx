'use client';

import { clsx } from 'clsx';
import { Star, Flame } from 'lucide-react';

interface CookingProgressProps {
  currentStep: number;
  totalSteps: number;
  completedMicroSteps: number;
  totalMicroSteps: number;
  completedSteps: number[];
  isHebrew: boolean;
}

export function CookingProgress({
  currentStep,
  totalSteps,
  completedMicroSteps,
  totalMicroSteps,
  completedSteps,
  isHebrew,
}: CookingProgressProps) {
  const progressPercent = totalSteps > 0 ? (completedSteps.length / totalSteps) * 100 : 0;
  const level = currentStep + 1;

  return (
    <div className="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border-b border-cream-dark">
      {/* Level indicator */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center',
              'bg-gradient-to-br from-honey-400 to-honey-500',
              'text-white font-bold text-lg shadow-md'
            )}
          >
            {level}
          </div>
          <div>
            <p className="text-sm text-charcoal/60">{isHebrew ? 'שלב' : 'Level'}</p>
            <p className="font-bold text-charcoal">
              {level} {isHebrew ? 'מתוך' : 'of'} {totalSteps}
            </p>
          </div>
        </div>

        {/* Stars earned */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalSteps, 10) }).map((_, idx) => (
            <Star
              key={idx}
              className={clsx(
                'w-5 h-5 transition-all duration-300',
                completedSteps.includes(idx)
                  ? 'text-honey-400 fill-honey-400 scale-110'
                  : 'text-charcoal/20'
              )}
            />
          ))}
          {totalSteps > 10 && (
            <span className="text-xs text-charcoal/50 ml-1">+{totalSteps - 10}</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-cream-dark rounded-full overflow-hidden">
        <div
          className={clsx(
            'absolute inset-y-0 left-0 rounded-full',
            'bg-gradient-to-r from-terracotta-400 via-terracotta-500 to-olive-500',
            'transition-all duration-500 ease-out'
          )}
          style={{ width: `${progressPercent}%` }}
        >
          {/* Animated shine */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>

        {/* Milestone markers at 25%, 50%, 75% */}
        {[25, 50, 75].map((percent) => (
          <div
            key={percent}
            className={clsx(
              'absolute top-1/2 -translate-y-1/2 w-1 h-4 rounded-full',
              progressPercent >= percent ? 'bg-white/50' : 'bg-charcoal/10'
            )}
            style={{ left: `${percent}%` }}
          />
        ))}
      </div>

      {/* Micro-step counter */}
      <div className="flex justify-between items-center mt-2 text-xs text-charcoal/50">
        <span>
          {isHebrew
            ? `${completedMicroSteps} מתוך ${totalMicroSteps} פעולות`
            : `${completedMicroSteps} of ${totalMicroSteps} actions`}
        </span>
        <span className="flex items-center gap-1">
          <Flame className="w-3 h-3 text-terracotta-400" />
          {completedSteps.length} {isHebrew ? 'הושלמו' : 'completed'}
        </span>
      </div>
    </div>
  );
}

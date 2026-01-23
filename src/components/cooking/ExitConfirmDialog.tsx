'use client';

import { clsx } from 'clsx';
import { X, Home, Pause, Trash2 } from 'lucide-react';

interface ExitConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndExit: () => void;
  onAbandon: () => void;
  progressPercentage: number;
  isHebrew?: boolean;
  isSaving?: boolean;
}

export function ExitConfirmDialog({
  isOpen,
  onClose,
  onSaveAndExit,
  onAbandon,
  progressPercentage,
  isHebrew = true,
  isSaving = false,
}: ExitConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div
        className={clsx(
          'relative w-full max-w-md mx-4 p-6 rounded-2xl',
          'bg-cream shadow-2xl',
          'animate-scale-in'
        )}
        dir={isHebrew ? 'rtl' : 'ltr'}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={clsx(
            'absolute top-4 p-2 rounded-xl',
            'text-charcoal/50 hover:text-charcoal hover:bg-charcoal/5',
            'transition-colors',
            isHebrew ? 'left-4' : 'right-4'
          )}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className={clsx('text-center', isHebrew ? 'text-right' : 'text-left')}>
          <h2 className="font-display text-2xl font-bold text-charcoal mb-2">
            {isHebrew ? 'לצאת מהבישול?' : 'Leave cooking?'}
          </h2>

          <p className="text-charcoal/70 mb-6">
            {isHebrew
              ? `התקדמת ${progressPercentage}% מהמתכון. מה תרצה לעשות?`
              : `You've completed ${progressPercentage}% of the recipe. What would you like to do?`}
          </p>

          {/* Progress bar */}
          <div className="w-full h-2 bg-charcoal/10 rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-olive-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {/* Save and Exit - Primary */}
            <button
              onClick={onSaveAndExit}
              disabled={isSaving}
              className={clsx(
                'w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl',
                'bg-olive-500 text-white font-bold text-lg',
                'hover:bg-olive-600 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isHebrew && 'flex-row-reverse'
              )}
            >
              <Pause className="h-5 w-5" />
              <span>
                {isSaving
                  ? isHebrew
                    ? 'שומר...'
                    : 'Saving...'
                  : isHebrew
                  ? 'שמור וצא'
                  : 'Save & Exit'}
              </span>
            </button>

            <p className={clsx(
              'text-xs text-charcoal/50',
              isHebrew ? 'text-right' : 'text-left'
            )}>
              {isHebrew
                ? 'ההתקדמות וההערות שלך יישמרו. תוכל להמשיך מאוחר יותר.'
                : 'Your progress and notes will be saved. You can resume later.'}
            </p>

            {/* Continue cooking */}
            <button
              onClick={onClose}
              className={clsx(
                'w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl',
                'bg-charcoal/5 text-charcoal font-bold text-lg',
                'hover:bg-charcoal/10 transition-colors',
                'border-2 border-charcoal/10',
                isHebrew && 'flex-row-reverse'
              )}
            >
              <span>{isHebrew ? 'המשך לבשל' : 'Continue cooking'}</span>
            </button>

            {/* Abandon - Destructive */}
            <button
              onClick={onAbandon}
              disabled={isSaving}
              className={clsx(
                'w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl',
                'text-red-600 font-medium',
                'hover:bg-red-50 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                isHebrew && 'flex-row-reverse'
              )}
            >
              <Trash2 className="h-4 w-4" />
              <span>{isHebrew ? 'בטל ומחק התקדמות' : 'Abandon & delete progress'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

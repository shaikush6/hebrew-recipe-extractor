'use client';

import { clsx } from 'clsx';
import { X, Play, RefreshCw, Clock } from 'lucide-react';

interface ResumeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onResume: () => void;
  onStartFresh: () => void;
  progressPercentage: number;
  lastActiveTime: string; // ISO date string
  isHebrew?: boolean;
}

function formatTimeAgo(dateString: string, isHebrew: boolean): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return isHebrew ? 'עכשיו' : 'just now';
  }
  if (diffMins < 60) {
    return isHebrew ? `לפני ${diffMins} דקות` : `${diffMins} minutes ago`;
  }
  if (diffHours < 24) {
    return isHebrew ? `לפני ${diffHours} שעות` : `${diffHours} hours ago`;
  }
  if (diffDays === 1) {
    return isHebrew ? 'אתמול' : 'yesterday';
  }
  return isHebrew ? `לפני ${diffDays} ימים` : `${diffDays} days ago`;
}

export function ResumeDialog({
  isOpen,
  onClose,
  onResume,
  onStartFresh,
  progressPercentage,
  lastActiveTime,
  isHebrew = true,
}: ResumeDialogProps) {
  if (!isOpen) return null;

  const timeAgo = formatTimeAgo(lastActiveTime, isHebrew);

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
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-olive-100 mb-4">
            <Play className="h-8 w-8 text-olive-600" />
          </div>

          <h2 className="font-display text-2xl font-bold text-charcoal mb-2">
            {isHebrew ? 'יש לך בישול בתהליך!' : 'You have cooking in progress!'}
          </h2>

          <p className="text-charcoal/70 mb-4">
            {isHebrew
              ? 'נמצאה התקדמות קודמת במתכון זה.'
              : 'Previous progress was found for this recipe.'}
          </p>

          {/* Progress info */}
          <div className="p-4 rounded-xl bg-olive-50 border border-olive-200 mb-6">
            <div className={clsx(
              'flex items-center gap-2 mb-2',
              isHebrew ? 'flex-row-reverse' : 'flex-row'
            )}>
              <Clock className="h-4 w-4 text-olive-600" />
              <span className="text-sm text-olive-700">
                {isHebrew ? 'פעילות אחרונה:' : 'Last active:'} {timeAgo}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-olive-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-olive-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-sm text-olive-700 mt-2 font-medium">
              {progressPercentage}% {isHebrew ? 'הושלם' : 'completed'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {/* Resume - Primary */}
            <button
              onClick={onResume}
              className={clsx(
                'w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl',
                'bg-olive-500 text-white font-bold text-lg',
                'hover:bg-olive-600 transition-colors',
                isHebrew && 'flex-row-reverse'
              )}
            >
              <Play className="h-5 w-5" />
              <span>{isHebrew ? 'המשך מהמקום שעצרתי' : 'Resume where I left off'}</span>
            </button>

            {/* Start Fresh - Secondary */}
            <button
              onClick={onStartFresh}
              className={clsx(
                'w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl',
                'bg-charcoal/5 text-charcoal font-bold text-lg',
                'hover:bg-charcoal/10 transition-colors',
                'border-2 border-charcoal/10',
                isHebrew && 'flex-row-reverse'
              )}
            >
              <RefreshCw className="h-5 w-5" />
              <span>{isHebrew ? 'התחל מחדש' : 'Start fresh'}</span>
            </button>

            <p className={clsx(
              'text-xs text-charcoal/50',
              isHebrew ? 'text-right' : 'text-left'
            )}>
              {isHebrew
                ? 'התחלה מחדש תמחק את ההתקדמות וההערות הקודמות.'
                : 'Starting fresh will delete your previous progress and notes.'}
            </p>

            {/* Cancel */}
            <button
              onClick={onClose}
              className={clsx(
                'w-full px-6 py-3 rounded-xl',
                'text-charcoal/60 font-medium',
                'hover:text-charcoal transition-colors'
              )}
            >
              {isHebrew ? 'ביטול' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

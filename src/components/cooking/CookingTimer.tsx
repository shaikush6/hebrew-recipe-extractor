'use client';

import { useState, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { Play, Pause, X, Bell, Volume2, VolumeX } from 'lucide-react';

interface CookingTimerProps {
  initialSeconds: number;
  label: string;
  onComplete: () => void;
  onDismiss: () => void;
  isHebrew: boolean;
}

export function CookingTimer({
  initialSeconds,
  label,
  onComplete,
  onDismiss,
  isHebrew,
}: CookingTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Play completion sound using Web Audio API
  const playCompletionSound = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const audioContext = new AudioContext();

      // Play a pleasant chime sequence
      const playNote = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioContext.currentTime;
      playNote(523.25, now, 0.3); // C5
      playNote(659.25, now + 0.15, 0.3); // E5
      playNote(783.99, now + 0.3, 0.5); // G5
    } catch {
      console.log('Audio not supported');
    }
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsComplete(true);
          setIsRunning(false);
          if (!isMuted) {
            playCompletionSound();
          }
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, secondsLeft, isMuted, onComplete, playCompletionSound]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((initialSeconds - secondsLeft) / initialSeconds) * 100;

  return (
    <div
      className={clsx(
        'fixed inset-x-4 bottom-4 md:inset-auto md:bottom-8 md:right-8 md:w-80',
        'paper-card p-4 md:p-6 z-50',
        'animate-slide-up',
        isComplete && 'animate-pulse bg-honey-50'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell
            className={clsx(
              'w-5 h-5',
              isComplete ? 'text-honey-500 animate-bounce' : 'text-terracotta-500'
            )}
          />
          <span className="font-bold text-charcoal">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 hover:bg-cream-dark rounded-lg transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-charcoal/50" />
            ) : (
              <Volume2 className="w-4 h-4 text-charcoal/50" />
            )}
          </button>
          <button
            onClick={onDismiss}
            className="p-2 hover:bg-cream-dark rounded-lg transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4 text-charcoal/50" />
          </button>
        </div>
      </div>

      {/* Timer display */}
      <div className="text-center mb-4">
        <span
          className={clsx(
            'font-display text-5xl md:text-6xl font-bold tabular-nums',
            isComplete ? 'text-honey-500' : 'text-terracotta-600'
          )}
        >
          {formatTime(secondsLeft)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-cream-dark rounded-full overflow-hidden mb-4">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-1000',
            isComplete
              ? 'bg-honey-400'
              : 'bg-gradient-to-r from-terracotta-400 to-terracotta-500'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        {!isComplete ? (
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold',
              isRunning
                ? 'bg-terracotta-100 text-terracotta-600 hover:bg-terracotta-200'
                : 'bg-olive-100 text-olive-600 hover:bg-olive-200',
              'transition-colors'
            )}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                <span>{isHebrew ? 'השהה' : 'Pause'}</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>{isHebrew ? 'המשך' : 'Resume'}</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={onDismiss}
            className="flex-1 py-3 rounded-xl font-bold bg-honey-400 text-white hover:bg-honey-500 transition-colors"
          >
            {isHebrew ? 'הבנתי!' : 'Got it!'}
          </button>
        )}
      </div>
    </div>
  );
}

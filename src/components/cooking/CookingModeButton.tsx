'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, Loader2, Sparkles, Play, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { ResumeDialog } from './ResumeDialog';

interface CookingModeButtonProps {
  recipeId: string;
  isHebrew: boolean;
}

interface ActiveSession {
  id: string;
  progress: number;
  lastActiveTime: string;
  currentStepGroupIndex: number;
  totalStepGroups?: number;
}

export function CookingModeButton({ recipeId, isHebrew }: CookingModeButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  // Check for existing active session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch(`/api/cooking-sessions?recipeId=${recipeId}`);
        const data = await response.json();

        if (data.session && data.session.status === 'active') {
          // Calculate progress
          const completedSteps = data.session.completedStepGroups?.length || 0;
          // Try to get total from session or estimate
          const totalSteps = data.session.totalStepGroups || 10;
          const progress = Math.round((completedSteps / totalSteps) * 100);

          setActiveSession({
            id: data.session.id,
            progress,
            lastActiveTime: data.session.lastActiveTime,
            currentStepGroupIndex: data.session.currentStepGroupIndex,
            totalStepGroups: totalSteps,
          });
        }
      } catch (err) {
        console.error('Error checking for session:', err);
      } finally {
        setIsCheckingSession(false);
      }
    }

    checkSession();
  }, [recipeId]);

  const handleClick = async () => {
    if (activeSession) {
      // Show resume dialog
      setShowResumeDialog(true);
      return;
    }

    // Start fresh
    await startCooking();
  };

  const startCooking = async (sessionId?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Pre-generate cooking data before navigating
      const response = await fetch('/api/cooking-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to prepare cooking mode');
      }

      // Navigate to cooking page
      const url = sessionId
        ? `/cooking/${recipeId}?session=${sessionId}`
        : `/cooking/${recipeId}`;
      router.push(url);
    } catch (err) {
      console.error('Failed to start cooking mode:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(false);
    }
  };

  const handleResume = useCallback(() => {
    if (activeSession) {
      setShowResumeDialog(false);
      startCooking(activeSession.id);
    }
  }, [activeSession]);

  const handleStartFresh = useCallback(async () => {
    setShowResumeDialog(false);

    // Abandon existing session first
    if (activeSession) {
      try {
        await fetch(`/api/cooking-sessions/${activeSession.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'abandon' }),
        });
      } catch (err) {
        console.error('Error abandoning session:', err);
      }
      setActiveSession(null);
    }

    // Start fresh
    await startCooking();
  }, [activeSession]);

  // Loading state while checking session
  if (isCheckingSession) {
    return (
      <div className="relative">
        <button
          disabled
          className={clsx(
            'group relative overflow-hidden px-6 py-3 rounded-xl font-bold text-lg',
            'bg-gradient-to-r from-terracotta-400 to-terracotta-500',
            'text-white shadow-lg opacity-70 cursor-wait'
          )}
        >
          <span className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>{isHebrew ? 'בודק...' : 'Checking...'}</span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={clsx(
          'group relative overflow-hidden px-6 py-3 rounded-xl font-bold text-lg',
          activeSession
            ? 'bg-gradient-to-r from-olive-500 to-olive-600'
            : 'bg-gradient-to-r from-terracotta-500 to-terracotta-600',
          'text-white shadow-lg hover:shadow-xl',
          'transform transition-all duration-300',
          'hover:scale-105 active:scale-95',
          'disabled:opacity-70 disabled:cursor-wait disabled:hover:scale-100',
          'focus:outline-none focus:ring-4',
          activeSession ? 'focus:ring-olive-300' : 'focus:ring-terracotta-300'
        )}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

        <span className="relative flex items-center gap-3">
          {isLoading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>{isHebrew ? 'מכין...' : 'Preparing...'}</span>
            </>
          ) : activeSession ? (
            <>
              <Play className="w-6 h-6" />
              <span>{isHebrew ? 'המשך בישול' : 'Continue Cooking'}</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-sm">
                {activeSession.progress}%
              </span>
            </>
          ) : (
            <>
              <ChefHat className="w-6 h-6" />
              <span>{isHebrew ? 'מצב בישול' : 'Start Cooking'}</span>
              <Sparkles className="w-5 h-5 opacity-80" />
            </>
          )}
        </span>
      </button>

      {/* Progress indicator badge */}
      {activeSession && activeSession.progress > 0 && (
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-olive-500 border-2 border-white flex items-center justify-center">
          <span className="text-xs font-bold text-white">{activeSession.progress}%</span>
        </div>
      )}

      {/* Error tooltip */}
      {error && (
        <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-red-100 text-red-700 text-sm rounded-lg text-center animate-fade-in">
          {error}
        </div>
      )}

      {/* Resume dialog */}
      {activeSession && (
        <ResumeDialog
          isOpen={showResumeDialog}
          onClose={() => setShowResumeDialog(false)}
          onResume={handleResume}
          onStartFresh={handleStartFresh}
          progressPercentage={activeSession.progress}
          lastActiveTime={activeSession.lastActiveTime}
          isHebrew={isHebrew}
        />
      )}
    </div>
  );
}

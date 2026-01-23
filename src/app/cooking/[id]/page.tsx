'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { clsx } from 'clsx';
import {
  Home,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  ChefHat,
  MoreVertical,
  List,
  Save,
  RotateCcw,
} from 'lucide-react';

import { CookingProgress } from '@/components/cooking/CookingProgress';
import { CookingStepCard } from '@/components/cooking/CookingStepCard';
import { CookingTimer } from '@/components/cooking/CookingTimer';
import { CookingComplete } from '@/components/cooking/CookingComplete';
import { ExitConfirmDialog } from '@/components/cooking/ExitConfirmDialog';
import { ResumeDialog } from '@/components/cooking/ResumeDialog';
import { StepNote } from '@/components/cooking/StepNote';
import { useCookingMode } from '@/hooks/useCookingMode';
import type { EnhancedCookingData } from '@/schemas/cooking-mode';

export default function CookingModePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipeId = params.id as string;
  const sessionIdParam = searchParams.get('session');

  const [cookingData, setCookingData] = useState<EnhancedCookingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [existingSession, setExistingSession] = useState<{
    id: string;
    progress: number;
    lastActiveTime: string;
  } | null>(null);

  // Session ID to use - either from URL or newly created
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    sessionIdParam || null
  );

  const {
    state,
    currentStepGroup,
    currentMicroStep,
    elapsedMinutes,
    earnedAchievements,
    canGoBack,
    canGoForward,
    overallProgress,
    actions,
  } = useCookingMode(cookingData, {
    sessionId: activeSessionId,
    recipeId,
  });

  const isHebrew = cookingData?.language === 'he';

  // Check for existing session on mount
  useEffect(() => {
    async function checkExistingSession() {
      if (sessionIdParam) return; // Already have a session from URL

      try {
        const response = await fetch(`/api/cooking-sessions?recipeId=${recipeId}`);
        const data = await response.json();

        if (data.session && data.session.status === 'active') {
          // Calculate progress percentage
          const progress = Math.round(
            ((data.session.completedStepGroups?.length || 0) /
              (cookingData?.totalStepGroups || 1)) *
              100
          );

          setExistingSession({
            id: data.session.id,
            progress,
            lastActiveTime: data.session.lastActiveTime,
          });
          setShowResumeDialog(true);
        }
      } catch (err) {
        console.error('Error checking for existing session:', err);
      }
    }

    if (cookingData && !activeSessionId) {
      checkExistingSession();
    }
  }, [recipeId, sessionIdParam, cookingData, activeSessionId]);

  // Create new session
  const createNewSession = useCallback(async () => {
    try {
      const response = await fetch('/api/cooking-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId, action: 'start' }),
      });
      const data = await response.json();

      if (data.session) {
        setActiveSessionId(data.session.id);
        // Update URL without reload
        const url = new URL(window.location.href);
        url.searchParams.set('session', String(data.session.id));
        window.history.replaceState({}, '', url.toString());
      }
    } catch (err) {
      console.error('Error creating session:', err);
    }
  }, [recipeId]);

  // Handle resume dialog actions
  const handleResume = useCallback(() => {
    if (existingSession) {
      setActiveSessionId(existingSession.id);
      // Update URL
      const url = new URL(window.location.href);
      url.searchParams.set('session', String(existingSession.id));
      window.history.replaceState({}, '', url.toString());
    }
    setShowResumeDialog(false);
    setExistingSession(null);
  }, [existingSession]);

  const handleStartFresh = useCallback(async () => {
    // Abandon existing session
    if (existingSession) {
      try {
        await fetch(`/api/cooking-sessions/${existingSession.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'abandon' }),
        });
      } catch (err) {
        console.error('Error abandoning session:', err);
      }
    }

    setShowResumeDialog(false);
    setExistingSession(null);

    // Create new session
    await createNewSession();
  }, [existingSession, createNewSession]);

  // Fetch cooking data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        // First try to get cached data
        let response = await fetch(`/api/cooking-mode?recipeId=${recipeId}`);
        let data = await response.json();

        // If not cached, generate it
        if (!response.ok || !data.success) {
          response = await fetch('/api/cooking-mode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipeId }),
          });
          data = await response.json();
        }

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to load cooking data');
        }

        setCookingData(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [recipeId]);

  // Create session after cooking data loads if no session yet
  useEffect(() => {
    if (cookingData && !activeSessionId && !sessionIdParam && !existingSession) {
      // Only create if not showing resume dialog
      if (!showResumeDialog) {
        createNewSession();
      }
    }
  }, [cookingData, activeSessionId, sessionIdParam, existingSession, showResumeDialog, createNewSession]);

  // Prevent screen sleep during cooking (Wake Lock API)
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    async function requestWakeLock() {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch {
        // Wake lock not supported or denied
      }
    }

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release();
      }
    };
  }, []);

  // Handle exit actions
  const handleSaveAndExit = useCallback(async () => {
    await actions.forceSyncNow();
    router.push('/');
  }, [actions, router]);

  const handleAbandon = useCallback(async () => {
    await actions.abandonSession();
    router.push('/');
  }, [actions, router]);

  // Close menu when clicking outside
  useEffect(() => {
    if (showMenu) {
      const handleClick = () => setShowMenu(false);
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [showMenu]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cream to-cream-dark">
        <div className="text-center paper-card p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-terracotta-100 flex items-center justify-center">
            <ChefHat className="w-10 h-10 text-terracotta-500 animate-bounce" />
          </div>
          <Loader2 className="w-8 h-8 text-terracotta-500 animate-spin mx-auto mb-4" />
          <p className="text-charcoal/60 font-medium">
            {isHebrew ? 'מכין את מדריך הבישול...' : 'Preparing your cooking guide...'}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !cookingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cream to-cream-dark p-4">
        <div className="paper-card p-8 text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="font-display text-xl font-bold text-charcoal mb-2">
            {isHebrew ? 'שגיאה' : 'Error'}
          </h2>
          <p className="text-red-500 mb-6">{error || 'Failed to load cooking data'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-xl bg-terracotta-500 text-white font-bold hover:bg-terracotta-600 transition-colors"
          >
            {isHebrew ? 'חזרה' : 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  // Completion state
  if (state.isComplete) {
    // Mark session as complete
    actions.completeSession();

    return (
      <CookingComplete
        recipeTitle={cookingData.recipeTitle}
        totalSteps={cookingData.totalStepGroups}
        totalMicroSteps={cookingData.totalMicroSteps}
        cookingTimeMinutes={elapsedMinutes}
        achievements={earnedAchievements}
        isHebrew={isHebrew}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-cream to-cream-dark">
      {/* Header - Redesigned */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-cream-dark sticky top-0 z-30">
        {/* Home button */}
        <button
          onClick={() => setShowExitDialog(true)}
          className="p-2 rounded-lg hover:bg-cream-dark transition-colors"
          title={isHebrew ? 'בית' : 'Home'}
        >
          <Home className="w-6 h-6 text-charcoal" />
        </button>

        {/* Step navigation */}
        <div className={clsx(
          'flex items-center gap-1',
          isHebrew && 'flex-row-reverse'
        )}>
          <button
            onClick={actions.goToPreviousMicroStep}
            disabled={!canGoBack}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              canGoBack
                ? 'hover:bg-cream-dark text-charcoal'
                : 'text-charcoal/30 cursor-not-allowed'
            )}
            title={isHebrew ? 'הקודם' : 'Previous'}
          >
            <ChevronLeft className={clsx('w-5 h-5', isHebrew && 'rotate-180')} />
          </button>

          <span className="px-3 py-1 rounded-full bg-olive-100 text-olive-700 font-bold text-sm min-w-[60px] text-center">
            {overallProgress.current + 1}/{overallProgress.total}
          </span>

          <button
            onClick={actions.goToNextMicroStep}
            disabled={!canGoForward}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              canGoForward
                ? 'hover:bg-cream-dark text-charcoal'
                : 'text-charcoal/30 cursor-not-allowed'
            )}
            title={isHebrew ? 'הבא' : 'Next'}
          >
            <ChevronRight className={clsx('w-5 h-5', isHebrew && 'rotate-180')} />
          </button>
        </div>

        {/* Title (truncated) */}
        <h1
          className="font-display font-bold text-sm text-charcoal truncate max-w-[30%] hidden md:block"
          dir={isHebrew ? 'rtl' : 'ltr'}
        >
          {cookingData.recipeTitle}
        </h1>

        {/* Menu button */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 rounded-lg hover:bg-cream-dark transition-colors"
            title={isHebrew ? 'תפריט' : 'Menu'}
          >
            <MoreVertical className="w-6 h-6 text-charcoal" />
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <div
              className={clsx(
                'absolute top-full mt-2 w-56 rounded-xl bg-white shadow-xl border border-cream-dark overflow-hidden',
                isHebrew ? 'left-0' : 'right-0'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2 space-y-1">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    // TODO: Show step overview drawer
                  }}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg',
                    'hover:bg-cream-dark transition-colors text-charcoal',
                    isHebrew && 'flex-row-reverse'
                  )}
                >
                  <List className="w-5 h-5" />
                  <span className="font-medium">
                    {isHebrew ? 'כל השלבים' : 'All steps'}
                  </span>
                </button>

                <button
                  onClick={async () => {
                    setShowMenu(false);
                    await actions.forceSyncNow();
                  }}
                  disabled={state.isSyncing}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg',
                    'hover:bg-cream-dark transition-colors text-charcoal',
                    'disabled:opacity-50',
                    isHebrew && 'flex-row-reverse'
                  )}
                >
                  <Save className="w-5 h-5" />
                  <span className="font-medium">
                    {state.isSyncing
                      ? isHebrew
                        ? 'שומר...'
                        : 'Saving...'
                      : isHebrew
                      ? 'שמור עכשיו'
                      : 'Save now'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    actions.reset();
                  }}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg',
                    'hover:bg-cream-dark transition-colors text-charcoal',
                    isHebrew && 'flex-row-reverse'
                  )}
                >
                  <RotateCcw className="w-5 h-5" />
                  <span className="font-medium">
                    {isHebrew ? 'התחל מחדש' : 'Start over'}
                  </span>
                </button>

                <div className="border-t border-cream-dark my-1" />

                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowExitDialog(true);
                  }}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg',
                    'hover:bg-red-50 transition-colors text-red-600',
                    isHebrew && 'flex-row-reverse'
                  )}
                >
                  <X className="w-5 h-5" />
                  <span className="font-medium">
                    {isHebrew ? 'יציאה' : 'Exit'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Progress bar */}
      <CookingProgress
        currentStep={state.currentStepGroupIndex}
        totalSteps={cookingData.totalStepGroups}
        completedMicroSteps={state.completedMicroSteps.size}
        totalMicroSteps={cookingData.totalMicroSteps}
        completedSteps={state.completedStepGroups}
        isHebrew={isHebrew}
      />

      {/* Main cooking content */}
      {currentStepGroup && (
        <div className="flex-1 flex flex-col">
          <CookingStepCard
            stepGroup={currentStepGroup}
            currentMicroStepIndex={state.currentMicroStepIndex}
            onMicroStepComplete={actions.completeMicroStep}
            onStartTimer={actions.startTimer}
            completedMicroSteps={state.completedMicroSteps}
            isHebrew={isHebrew}
          />

          {/* Note section for current step */}
          {currentMicroStep && (
            <div className="px-6 pb-6">
              <StepNote
                microStepId={currentMicroStep.id}
                existingNote={state.notes.get(currentMicroStep.id) || null}
                onSave={(noteText) => actions.saveNote(currentMicroStep.id, noteText)}
                onDelete={() => actions.deleteNote(currentMicroStep.id)}
                isHebrew={isHebrew}
              />
            </div>
          )}
        </div>
      )}

      {/* Active timer overlay */}
      {state.activeTimer && (
        <CookingTimer
          initialSeconds={state.activeTimer.durationSeconds}
          label={state.activeTimer.label}
          onComplete={() => {
            // Timer completed - could show a notification or auto-advance
          }}
          onDismiss={actions.dismissTimer}
          isHebrew={isHebrew}
        />
      )}

      {/* Exit confirmation dialog */}
      <ExitConfirmDialog
        isOpen={showExitDialog}
        onClose={() => setShowExitDialog(false)}
        onSaveAndExit={handleSaveAndExit}
        onAbandon={handleAbandon}
        progressPercentage={overallProgress.percentage}
        isHebrew={isHebrew}
        isSaving={state.isSyncing}
      />

      {/* Resume dialog */}
      {existingSession && (
        <ResumeDialog
          isOpen={showResumeDialog}
          onClose={() => {
            setShowResumeDialog(false);
            setExistingSession(null);
            createNewSession();
          }}
          onResume={handleResume}
          onStartFresh={handleStartFresh}
          progressPercentage={existingSession.progress}
          lastActiveTime={existingSession.lastActiveTime}
          isHebrew={isHebrew}
        />
      )}

      {/* Elapsed time indicator */}
      <div className="fixed bottom-4 left-4 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-lg text-sm text-charcoal/60">
        {elapsedMinutes} {isHebrew ? 'דקות' : 'min'}
      </div>
    </div>
  );
}

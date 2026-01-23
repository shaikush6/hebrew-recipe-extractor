'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { EnhancedCookingData } from '@/schemas/cooking-mode';
import {
  saveLocalSession,
  getLocalSession,
  clearLocalSession,
  createDebouncedSync,
  createInitialLocalState,
  initLocalStateFromSession,
  type LocalCookingState,
} from '@/lib/cooking-storage';

/**
 * State for cooking mode session
 */
export interface CookingState {
  // Session identification
  sessionId: string | null;
  recipeId: string | null;

  // Navigation
  currentStepGroupIndex: number;
  currentMicroStepIndex: number;

  // Progress tracking
  completedStepGroups: number[];
  completedMicroSteps: Set<string>;
  unlockedAchievements: string[];

  // Timer
  activeTimer: {
    durationSeconds: number;
    label: string;
    startedAt: number;
  } | null;

  // Timing
  startTime: number;
  totalElapsedSeconds: number;

  // Notes
  notes: Map<string, string>;

  // Status
  isComplete: boolean;
  isLoading: boolean;
  isSyncing: boolean;
}

/**
 * Actions available for cooking mode
 */
export interface CookingActions {
  // Navigation
  completeMicroStep: (microStepId: string) => void;
  goToNextMicroStep: () => void;
  goToPreviousMicroStep: () => void;
  goToStep: (stepGroupIndex: number, microStepIndex: number) => void;

  // Timer
  startTimer: (durationSeconds: number, label: string) => void;
  dismissTimer: () => void;

  // Notes
  saveNote: (microStepId: string, noteText: string) => void;
  deleteNote: (microStepId: string) => void;

  // Session management
  reset: () => void;
  completeSession: () => Promise<void>;
  abandonSession: () => Promise<void>;
  forceSyncNow: () => Promise<void>;
}

/**
 * Options for the cooking mode hook
 */
export interface UseCookingModeOptions {
  sessionId?: string | null;
  recipeId?: string;
  autoSync?: boolean;
  syncIntervalMs?: number;
}

const DEFAULT_OPTIONS: UseCookingModeOptions = {
  autoSync: true,
  syncIntervalMs: 10000,
};

/**
 * Hook for managing cooking mode state with persistence
 */
export function useCookingMode(
  cookingData: EnhancedCookingData | null,
  options: UseCookingModeOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const [state, setState] = useState<CookingState>({
    sessionId: opts.sessionId ?? null,
    recipeId: opts.recipeId ?? null,
    currentStepGroupIndex: 0,
    currentMicroStepIndex: 0,
    completedStepGroups: [],
    completedMicroSteps: new Set(),
    activeTimer: null,
    unlockedAchievements: [],
    startTime: Date.now(),
    totalElapsedSeconds: 0,
    notes: new Map(),
    isComplete: false,
    isLoading: true,
    isSyncing: false,
  });

  // Debounced sync manager
  const syncManager = useRef(createDebouncedSync(opts.syncIntervalMs));

  // Track elapsed time
  const elapsedTimeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load session on mount
  useEffect(() => {
    const loadSession = async () => {
      if (!opts.sessionId || !opts.recipeId) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      // Try localStorage first (fastest)
      const localState = getLocalSession(opts.sessionId);
      if (localState) {
        setState((prev) => ({
          ...prev,
          sessionId: localState.sessionId,
          recipeId: localState.recipeId,
          currentStepGroupIndex: localState.currentStepGroupIndex,
          currentMicroStepIndex: localState.currentMicroStepIndex,
          completedStepGroups: localState.completedStepGroups,
          completedMicroSteps: new Set(localState.completedMicroSteps),
          unlockedAchievements: localState.unlockedAchievements,
          startTime: localState.startTime,
          totalElapsedSeconds: localState.totalElapsedSeconds,
          notes: new Map(Object.entries(localState.notes)),
          isLoading: false,
        }));
        return;
      }

      // Load from database
      try {
        const response = await fetch(`/api/cooking-sessions/${opts.sessionId}`);
        if (response.ok) {
          const { session, notes } = await response.json();
          const dbState = initLocalStateFromSession(
            session.id,
            session.recipeId,
            {
              currentStepGroupIndex: session.currentStepGroupIndex,
              currentMicroStepIndex: session.currentMicroStepIndex,
              completedStepGroups: session.completedStepGroups,
              completedMicroSteps: session.completedMicroSteps,
              unlockedAchievements: session.unlockedAchievements,
              startTime: session.startTime,
              totalElapsedSeconds: session.totalElapsedSeconds,
            },
            notes
          );

          // Save to localStorage for fast access next time
          saveLocalSession(dbState);

          setState((prev) => ({
            ...prev,
            sessionId: dbState.sessionId,
            recipeId: dbState.recipeId,
            currentStepGroupIndex: dbState.currentStepGroupIndex,
            currentMicroStepIndex: dbState.currentMicroStepIndex,
            completedStepGroups: dbState.completedStepGroups,
            completedMicroSteps: new Set(dbState.completedMicroSteps),
            unlockedAchievements: dbState.unlockedAchievements,
            startTime: dbState.startTime,
            totalElapsedSeconds: dbState.totalElapsedSeconds,
            notes: new Map(Object.entries(dbState.notes)),
            isLoading: false,
          }));
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Failed to load session:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    loadSession();
  }, [opts.sessionId, opts.recipeId]);

  // Track elapsed time while session is active
  useEffect(() => {
    if (state.sessionId && !state.isComplete) {
      elapsedTimeRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          totalElapsedSeconds: prev.totalElapsedSeconds + 1,
        }));
      }, 1000);
    }

    return () => {
      if (elapsedTimeRef.current) {
        clearInterval(elapsedTimeRef.current);
      }
    };
  }, [state.sessionId, state.isComplete]);

  // Save to localStorage on state change
  useEffect(() => {
    if (state.isLoading || !state.sessionId || !state.recipeId) return;

    const localState: LocalCookingState = {
      sessionId: state.sessionId,
      recipeId: state.recipeId,
      currentStepGroupIndex: state.currentStepGroupIndex,
      currentMicroStepIndex: state.currentMicroStepIndex,
      completedStepGroups: state.completedStepGroups,
      completedMicroSteps: Array.from(state.completedMicroSteps),
      unlockedAchievements: state.unlockedAchievements,
      startTime: state.startTime,
      totalElapsedSeconds: state.totalElapsedSeconds,
      notes: Object.fromEntries(state.notes),
      lastSyncedAt: Date.now(),
      pendingSyncToDb: true,
    };

    saveLocalSession(localState);

    // Schedule debounced sync to database
    if (opts.autoSync) {
      syncManager.current.schedule(localState);
    }
  }, [
    state.sessionId,
    state.recipeId,
    state.currentStepGroupIndex,
    state.currentMicroStepIndex,
    state.completedStepGroups,
    state.completedMicroSteps,
    state.unlockedAchievements,
    state.totalElapsedSeconds,
    state.notes,
    state.isLoading,
    opts.autoSync,
  ]);

  // Sync on page visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && state.sessionId) {
        syncManager.current.flush();
      }
    };

    const handleBeforeUnload = () => {
      if (state.sessionId) {
        syncManager.current.flush();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state.sessionId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      syncManager.current.flush();
    };
  }, []);

  // Current step group
  const currentStepGroup = useMemo(() => {
    return cookingData?.stepGroups[state.currentStepGroupIndex] ?? null;
  }, [cookingData, state.currentStepGroupIndex]);

  // Current micro-step
  const currentMicroStep = useMemo(() => {
    return currentStepGroup?.microSteps[state.currentMicroStepIndex] ?? null;
  }, [currentStepGroup, state.currentMicroStepIndex]);

  // Total micro-steps in current group
  const totalMicroStepsInGroup = currentStepGroup?.microSteps.length ?? 0;

  // Navigation status
  const canGoBack = useMemo(() => {
    return state.currentStepGroupIndex > 0 || state.currentMicroStepIndex > 0;
  }, [state.currentStepGroupIndex, state.currentMicroStepIndex]);

  const canGoForward = useMemo(() => {
    if (!cookingData) return false;
    const isLastGroup = state.currentStepGroupIndex >= cookingData.totalStepGroups - 1;
    const isLastMicroStep = state.currentMicroStepIndex >= totalMicroStepsInGroup - 1;
    return !isLastGroup || !isLastMicroStep;
  }, [cookingData, state.currentStepGroupIndex, state.currentMicroStepIndex, totalMicroStepsInGroup]);

  // Calculate overall progress
  const overallProgress = useMemo(() => {
    if (!cookingData) return { current: 0, total: 0, percentage: 0 };

    let current = 0;
    let total = 0;

    for (let gi = 0; gi < cookingData.stepGroups.length; gi++) {
      const group = cookingData.stepGroups[gi];
      total += group.microSteps.length;

      if (gi < state.currentStepGroupIndex) {
        current += group.microSteps.length;
      } else if (gi === state.currentStepGroupIndex) {
        current += state.currentMicroStepIndex;
      }
    }

    return {
      current,
      total,
      percentage: total > 0 ? Math.round((current / total) * 100) : 0,
    };
  }, [cookingData, state.currentStepGroupIndex, state.currentMicroStepIndex]);

  // Check and unlock achievements
  const checkAchievements = useCallback(
    (stepGroupIndex: number, prevAchievements: string[]): string[] => {
      if (!cookingData?.achievements) return prevAchievements;

      const newAchievements = [...prevAchievements];

      for (const achievement of cookingData.achievements) {
        if (
          !prevAchievements.includes(achievement.id) &&
          achievement.unlocksAtStep <= stepGroupIndex
        ) {
          newAchievements.push(achievement.id);
        }
      }

      return newAchievements;
    },
    [cookingData]
  );

  // Complete a micro-step and advance
  const completeMicroStep = useCallback(
    (microStepId: string) => {
      setState((prev) => {
        // Add to completed set
        const newCompleted = new Set(prev.completedMicroSteps);
        newCompleted.add(microStepId);

        const isLastMicroStep = prev.currentMicroStepIndex >= totalMicroStepsInGroup - 1;
        const isLastGroup =
          prev.currentStepGroupIndex >= (cookingData?.totalStepGroups ?? 1) - 1;

        // Check for new achievements
        const newAchievements = checkAchievements(
          prev.currentStepGroupIndex,
          prev.unlockedAchievements
        );

        if (isLastMicroStep) {
          // Complete the step group
          const newCompletedGroups = [...prev.completedStepGroups, prev.currentStepGroupIndex];

          if (isLastGroup) {
            // Recipe complete!
            return {
              ...prev,
              completedMicroSteps: newCompleted,
              completedStepGroups: newCompletedGroups,
              unlockedAchievements: checkAchievements(
                prev.currentStepGroupIndex + 1,
                newAchievements
              ),
              isComplete: true,
            };
          }

          // Move to next step group
          return {
            ...prev,
            completedMicroSteps: newCompleted,
            completedStepGroups: newCompletedGroups,
            unlockedAchievements: newAchievements,
            currentStepGroupIndex: prev.currentStepGroupIndex + 1,
            currentMicroStepIndex: 0,
          };
        }

        // Move to next micro-step within same group
        return {
          ...prev,
          completedMicroSteps: newCompleted,
          unlockedAchievements: newAchievements,
          currentMicroStepIndex: prev.currentMicroStepIndex + 1,
        };
      });
    },
    [cookingData, totalMicroStepsInGroup, checkAchievements]
  );

  // Navigate to next micro-step (without completing)
  const goToNextMicroStep = useCallback(() => {
    setState((prev) => {
      if (prev.currentMicroStepIndex < totalMicroStepsInGroup - 1) {
        return { ...prev, currentMicroStepIndex: prev.currentMicroStepIndex + 1 };
      }
      if (prev.currentStepGroupIndex < (cookingData?.totalStepGroups ?? 1) - 1) {
        return {
          ...prev,
          currentStepGroupIndex: prev.currentStepGroupIndex + 1,
          currentMicroStepIndex: 0,
        };
      }
      return prev;
    });
  }, [cookingData, totalMicroStepsInGroup]);

  // Navigate to previous micro-step
  const goToPreviousMicroStep = useCallback(() => {
    setState((prev) => {
      if (prev.currentMicroStepIndex > 0) {
        return { ...prev, currentMicroStepIndex: prev.currentMicroStepIndex - 1 };
      }
      if (prev.currentStepGroupIndex > 0) {
        const prevGroup = cookingData?.stepGroups[prev.currentStepGroupIndex - 1];
        return {
          ...prev,
          currentStepGroupIndex: prev.currentStepGroupIndex - 1,
          currentMicroStepIndex: (prevGroup?.microSteps.length ?? 1) - 1,
        };
      }
      return prev;
    });
  }, [cookingData]);

  // Direct navigation to specific step
  const goToStep = useCallback((stepGroupIndex: number, microStepIndex: number) => {
    if (!cookingData) return;

    // Validate bounds
    if (stepGroupIndex < 0 || stepGroupIndex >= cookingData.stepGroups.length) return;
    const group = cookingData.stepGroups[stepGroupIndex];
    if (microStepIndex < 0 || microStepIndex >= group.microSteps.length) return;

    setState((prev) => ({
      ...prev,
      currentStepGroupIndex: stepGroupIndex,
      currentMicroStepIndex: microStepIndex,
    }));
  }, [cookingData]);

  // Start a timer
  const startTimer = useCallback((durationSeconds: number, label: string) => {
    setState((prev) => ({
      ...prev,
      activeTimer: {
        durationSeconds,
        label,
        startedAt: Date.now(),
      },
    }));
  }, []);

  // Dismiss active timer
  const dismissTimer = useCallback(() => {
    setState((prev) => ({ ...prev, activeTimer: null }));
  }, []);

  // Save a note for a micro-step
  const saveNote = useCallback((microStepId: string, noteText: string) => {
    setState((prev) => {
      const newNotes = new Map(prev.notes);
      if (noteText.trim()) {
        newNotes.set(microStepId, noteText.trim());
      } else {
        newNotes.delete(microStepId);
      }
      return { ...prev, notes: newNotes };
    });
  }, []);

  // Delete a note
  const deleteNote = useCallback((microStepId: string) => {
    setState((prev) => {
      const newNotes = new Map(prev.notes);
      newNotes.delete(microStepId);
      return { ...prev, notes: newNotes };
    });
  }, []);

  // Reset to beginning
  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStepGroupIndex: 0,
      currentMicroStepIndex: 0,
      completedStepGroups: [],
      completedMicroSteps: new Set(),
      activeTimer: null,
      unlockedAchievements: [],
      startTime: Date.now(),
      totalElapsedSeconds: 0,
      notes: new Map(),
      isComplete: false,
    }));
  }, []);

  // Complete the session
  const completeSession = useCallback(async () => {
    if (!state.sessionId) return;

    setState((prev) => ({ ...prev, isSyncing: true }));

    try {
      // Final sync
      await syncManager.current.flush();

      // Mark as complete in database
      await fetch(`/api/cooking-sessions/${state.sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });

      // Clear localStorage
      clearLocalSession(state.sessionId);

      setState((prev) => ({ ...prev, isComplete: true, isSyncing: false }));
    } catch (error) {
      console.error('Failed to complete session:', error);
      setState((prev) => ({ ...prev, isSyncing: false }));
    }
  }, [state.sessionId]);

  // Abandon the session
  const abandonSession = useCallback(async () => {
    if (!state.sessionId) return;

    setState((prev) => ({ ...prev, isSyncing: true }));

    try {
      // Final sync
      await syncManager.current.flush();

      // Mark as abandoned in database
      await fetch(`/api/cooking-sessions/${state.sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'abandon' }),
      });

      // Clear localStorage
      clearLocalSession(state.sessionId);
    } catch (error) {
      console.error('Failed to abandon session:', error);
    } finally {
      setState((prev) => ({ ...prev, isSyncing: false }));
    }
  }, [state.sessionId]);

  // Force immediate sync
  const forceSyncNow = useCallback(async () => {
    setState((prev) => ({ ...prev, isSyncing: true }));
    await syncManager.current.flush();
    setState((prev) => ({ ...prev, isSyncing: false }));
  }, []);

  // Calculate elapsed cooking time in minutes
  const elapsedMinutes = useMemo(() => {
    return Math.round(state.totalElapsedSeconds / 60);
  }, [state.totalElapsedSeconds]);

  // Get achievements that were unlocked
  const earnedAchievements = useMemo(() => {
    return (
      cookingData?.achievements.filter((a) =>
        state.unlockedAchievements.includes(a.id)
      ) ?? []
    );
  }, [cookingData, state.unlockedAchievements]);

  // Get note for current step
  const currentNote = useMemo(() => {
    if (!currentMicroStep) return null;
    return state.notes.get(currentMicroStep.id) ?? null;
  }, [currentMicroStep, state.notes]);

  return {
    state,
    currentStepGroup,
    currentMicroStep,
    elapsedMinutes,
    earnedAchievements,
    canGoBack,
    canGoForward,
    overallProgress,
    currentNote,
    actions: {
      completeMicroStep,
      goToNextMicroStep,
      goToPreviousMicroStep,
      goToStep,
      startTimer,
      dismissTimer,
      saveNote,
      deleteNote,
      reset,
      completeSession,
      abandonSession,
      forceSyncNow,
    } as CookingActions,
  };
}

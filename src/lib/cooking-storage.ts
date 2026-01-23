/**
 * Cooking Session Local Storage Layer
 * Provides instant saves and syncs to database
 */

const STORAGE_KEY_PREFIX = 'cooking_session_';
const ACTIVE_SESSION_KEY = 'cooking_active_session';

export interface LocalCookingState {
  sessionId: string;
  recipeId: string;
  currentStepGroupIndex: number;
  currentMicroStepIndex: number;
  completedStepGroups: number[];
  completedMicroSteps: string[];
  unlockedAchievements: string[];
  startTime: number; // timestamp in ms
  totalElapsedSeconds: number;
  notes: Record<string, string>;
  lastSyncedAt: number; // timestamp in ms
  pendingSyncToDb: boolean;
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the storage key for a session
 */
function getStorageKey(sessionId: string): string {
  return `${STORAGE_KEY_PREFIX}${sessionId}`;
}

/**
 * Save session state to localStorage (instant, ~1ms)
 */
export function saveLocalSession(state: LocalCookingState): void {
  if (!isLocalStorageAvailable()) return;

  try {
    const key = getStorageKey(state.sessionId);
    localStorage.setItem(key, JSON.stringify(state));

    // Also track this as the active session
    localStorage.setItem(ACTIVE_SESSION_KEY, String(state.sessionId));
  } catch (error) {
    console.warn('Failed to save session to localStorage:', error);
  }
}

/**
 * Load session state from localStorage
 */
export function getLocalSession(sessionId: string): LocalCookingState | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    const key = getStorageKey(sessionId);
    const data = localStorage.getItem(key);
    if (!data) return null;

    return JSON.parse(data) as LocalCookingState;
  } catch (error) {
    console.warn('Failed to load session from localStorage:', error);
    return null;
  }
}

/**
 * Get the ID of the currently active session (if any)
 */
export function getActiveLocalSessionId(): string | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    return localStorage.getItem(ACTIVE_SESSION_KEY);
  } catch {
    return null;
  }
}

/**
 * Clear a session from localStorage
 */
export function clearLocalSession(sessionId: string): void {
  if (!isLocalStorageAvailable()) return;

  try {
    const key = getStorageKey(sessionId);
    localStorage.removeItem(key);

    // Clear active session if it matches
    const activeId = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (activeId === sessionId) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  } catch (error) {
    console.warn('Failed to clear session from localStorage:', error);
  }
}

/**
 * Sync local state to database
 * Returns true if sync was successful
 */
export async function syncToDatabase(state: LocalCookingState): Promise<boolean> {
  try {
    // Update session progress
    const response = await fetch(`/api/cooking-sessions/${state.sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentStepGroupIndex: state.currentStepGroupIndex,
        currentMicroStepIndex: state.currentMicroStepIndex,
        completedStepGroups: state.completedStepGroups,
        completedMicroSteps: state.completedMicroSteps,
        unlockedAchievements: state.unlockedAchievements,
        totalElapsedSeconds: state.totalElapsedSeconds,
      }),
    });

    if (!response.ok) {
      console.error('Failed to sync session to database:', await response.text());
      return false;
    }

    // Sync notes (batch them)
    for (const [microStepId, noteText] of Object.entries(state.notes)) {
      await fetch(`/api/cooking-sessions/${state.sessionId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ microStepId, noteText }),
      });
    }

    // Update local state to mark as synced
    const updatedState: LocalCookingState = {
      ...state,
      lastSyncedAt: Date.now(),
      pendingSyncToDb: false,
    };
    saveLocalSession(updatedState);

    return true;
  } catch (error) {
    console.error('Error syncing to database:', error);
    return false;
  }
}

/**
 * Create a debounced sync function
 */
export function createDebouncedSync(delayMs = 10000): {
  schedule: (state: LocalCookingState) => void;
  flush: () => Promise<void>;
  cancel: () => void;
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingState: LocalCookingState | null = null;

  const flush = async (): Promise<void> => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (pendingState) {
      await syncToDatabase(pendingState);
      pendingState = null;
    }
  };

  const schedule = (state: LocalCookingState): void => {
    pendingState = state;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(async () => {
      if (pendingState) {
        await syncToDatabase(pendingState);
        pendingState = null;
      }
      timeoutId = null;
    }, delayMs);
  };

  const cancel = (): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    pendingState = null;
  };

  return { schedule, flush, cancel };
}

/**
 * Initialize local state from database session
 */
export function initLocalStateFromSession(
  sessionId: string,
  recipeId: string,
  dbData: {
    currentStepGroupIndex: number;
    currentMicroStepIndex: number;
    completedStepGroups: number[];
    completedMicroSteps: string[];
    unlockedAchievements: string[];
    startTime: string;
    totalElapsedSeconds: number;
  },
  notes: Record<string, string>
): LocalCookingState {
  return {
    sessionId,
    recipeId,
    currentStepGroupIndex: dbData.currentStepGroupIndex,
    currentMicroStepIndex: dbData.currentMicroStepIndex,
    completedStepGroups: dbData.completedStepGroups,
    completedMicroSteps: dbData.completedMicroSteps,
    unlockedAchievements: dbData.unlockedAchievements,
    startTime: new Date(dbData.startTime).getTime(),
    totalElapsedSeconds: dbData.totalElapsedSeconds,
    notes,
    lastSyncedAt: Date.now(),
    pendingSyncToDb: false,
  };
}

/**
 * Create initial local state for a new session
 */
export function createInitialLocalState(
  sessionId: string,
  recipeId: string
): LocalCookingState {
  return {
    sessionId,
    recipeId,
    currentStepGroupIndex: 0,
    currentMicroStepIndex: 0,
    completedStepGroups: [],
    completedMicroSteps: [],
    unlockedAchievements: [],
    startTime: Date.now(),
    totalElapsedSeconds: 0,
    notes: {},
    lastSyncedAt: Date.now(),
    pendingSyncToDb: false,
  };
}

/**
 * Get all local sessions (for debugging/cleanup)
 */
export function getAllLocalSessions(): LocalCookingState[] {
  if (!isLocalStorageAvailable()) return [];

  const sessions: LocalCookingState[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        const data = localStorage.getItem(key);
        if (data) {
          sessions.push(JSON.parse(data));
        }
      }
    }
  } catch (error) {
    console.warn('Error getting all local sessions:', error);
  }
  return sessions;
}

/**
 * Clean up old sessions from localStorage
 * Removes sessions older than maxAgeMs (default 7 days)
 */
export function cleanupOldSessions(maxAgeMs = 7 * 24 * 60 * 60 * 1000): number {
  if (!isLocalStorageAvailable()) return 0;

  let cleaned = 0;
  const now = Date.now();

  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        keys.push(key);
      }
    }

    for (const key of keys) {
      const data = localStorage.getItem(key);
      if (data) {
        const session = JSON.parse(data) as LocalCookingState;
        if (now - session.startTime > maxAgeMs) {
          localStorage.removeItem(key);
          cleaned++;
        }
      }
    }
  } catch (error) {
    console.warn('Error cleaning up old sessions:', error);
  }

  return cleaned;
}

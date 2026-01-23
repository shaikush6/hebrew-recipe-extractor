/**
 * Cooking Session Database Layer
 * Persists cooking quest progress and notes using Bun's built-in SQLite
 */

import { Database } from 'bun:sqlite';

// Use the same database file as recipes
const db = new Database('recipes.db');

// Migrate old table if recipe_id is INTEGER (needs TEXT for UUIDs)
const sessionTableInfo = db.prepare("PRAGMA table_info(cooking_sessions)").all() as Array<{ name: string; type: string }>;
const sessionRecipeIdCol = sessionTableInfo.find((col) => col.name === 'recipe_id');
if (sessionRecipeIdCol && sessionRecipeIdCol.type === 'INTEGER') {
  db.run(`DROP TABLE IF EXISTS cooking_sessions`);
  db.run(`DROP TABLE IF EXISTS cooking_notes`);
}

// Create cooking sessions table
db.run(`
  CREATE TABLE IF NOT EXISTS cooking_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id TEXT NOT NULL,
    current_step_group_index INTEGER DEFAULT 0,
    current_micro_step_index INTEGER DEFAULT 0,
    completed_step_groups TEXT DEFAULT '[]',
    completed_micro_steps TEXT DEFAULT '[]',
    unlocked_achievements TEXT DEFAULT '[]',
    start_time TEXT NOT NULL,
    last_active_time TEXT NOT NULL,
    total_elapsed_seconds INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    completed_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create cooking notes table
db.run(`
  CREATE TABLE IF NOT EXISTS cooking_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    micro_step_id TEXT NOT NULL,
    note_text TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES cooking_sessions(id),
    UNIQUE(session_id, micro_step_id)
  )
`);

// Create indexes for faster lookups
db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_recipe_id ON cooking_sessions(recipe_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_status ON cooking_sessions(status)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_notes_session_id ON cooking_notes(session_id)`);

// Types
export type SessionStatus = 'active' | 'completed' | 'abandoned';

export interface CookingSession {
  id: string;
  recipeId: string;
  currentStepGroupIndex: number;
  currentMicroStepIndex: number;
  completedStepGroups: number[];
  completedMicroSteps: string[];
  unlockedAchievements: string[];
  startTime: string;
  lastActiveTime: string;
  totalElapsedSeconds: number;
  status: SessionStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CookingNote {
  id: string;
  sessionId: string;
  microStepId: string;
  noteText: string;
  createdAt: string;
  updatedAt: string;
}

// Database row types (SQLite stores id as INTEGER, recipe_id as TEXT)
interface SessionRow {
  id: number;
  recipe_id: string;
  current_step_group_index: number;
  current_micro_step_index: number;
  completed_step_groups: string;
  completed_micro_steps: string;
  unlocked_achievements: string;
  start_time: string;
  last_active_time: string;
  total_elapsed_seconds: number;
  status: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface NoteRow {
  id: number;
  session_id: number;
  micro_step_id: string;
  note_text: string;
  created_at: string;
  updated_at: string;
}

/**
 * Convert database row to CookingSession object
 */
function rowToSession(row: SessionRow): CookingSession {
  return {
    id: String(row.id),
    recipeId: row.recipe_id,
    currentStepGroupIndex: row.current_step_group_index,
    currentMicroStepIndex: row.current_micro_step_index,
    completedStepGroups: JSON.parse(row.completed_step_groups),
    completedMicroSteps: JSON.parse(row.completed_micro_steps),
    unlockedAchievements: JSON.parse(row.unlocked_achievements),
    startTime: row.start_time,
    lastActiveTime: row.last_active_time,
    totalElapsedSeconds: row.total_elapsed_seconds,
    status: row.status as SessionStatus,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert database row to CookingNote object
 */
function rowToNote(row: NoteRow): CookingNote {
  return {
    id: String(row.id),
    sessionId: String(row.session_id),
    microStepId: row.micro_step_id,
    noteText: row.note_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Create a new cooking session for a recipe
 */
export function createCookingSession(recipeId: string): CookingSession {
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO cooking_sessions (
      recipe_id, start_time, last_active_time
    ) VALUES (?, ?, ?)
    RETURNING *
  `);

  const row = stmt.get(recipeId, now, now) as SessionRow;
  return rowToSession(row);
}

/**
 * Get a cooking session by ID
 */
export function getCookingSession(sessionId: string): CookingSession | null {
  const stmt = db.prepare(`SELECT * FROM cooking_sessions WHERE id = ?`);
  const row = stmt.get(sessionId) as SessionRow | null;

  if (!row) return null;
  return rowToSession(row);
}

/**
 * Get the active session for a recipe (if any)
 */
export function getActiveSessionForRecipe(recipeId: string): CookingSession | null {
  const stmt = db.prepare(`
    SELECT * FROM cooking_sessions
    WHERE recipe_id = ? AND status = 'active'
    ORDER BY last_active_time DESC
    LIMIT 1
  `);
  const row = stmt.get(recipeId) as SessionRow | null;

  if (!row) return null;
  return rowToSession(row);
}

/**
 * Get all sessions for a recipe (for history)
 */
export function getSessionsForRecipe(recipeId: string): CookingSession[] {
  const stmt = db.prepare(`
    SELECT * FROM cooking_sessions
    WHERE recipe_id = ?
    ORDER BY last_active_time DESC
  `);
  const rows = stmt.all(recipeId) as SessionRow[];
  return rows.map(rowToSession);
}

/**
 * Get recent active sessions across all recipes
 */
export function getRecentActiveSessions(limit = 10): CookingSession[] {
  const stmt = db.prepare(`
    SELECT * FROM cooking_sessions
    WHERE status = 'active'
    ORDER BY last_active_time DESC
    LIMIT ?
  `);
  const rows = stmt.all(limit) as SessionRow[];
  return rows.map(rowToSession);
}

/**
 * Update cooking session progress
 */
export interface SessionUpdate {
  currentStepGroupIndex?: number;
  currentMicroStepIndex?: number;
  completedStepGroups?: number[];
  completedMicroSteps?: string[];
  unlockedAchievements?: string[];
  totalElapsedSeconds?: number;
}

export function updateCookingSession(sessionId: string, updates: SessionUpdate): CookingSession | null {
  const now = new Date().toISOString();

  // Build dynamic update query
  const setClauses: string[] = ['last_active_time = ?', 'updated_at = ?'];
  const values: (string | number)[] = [now, now];

  if (updates.currentStepGroupIndex !== undefined) {
    setClauses.push('current_step_group_index = ?');
    values.push(updates.currentStepGroupIndex);
  }
  if (updates.currentMicroStepIndex !== undefined) {
    setClauses.push('current_micro_step_index = ?');
    values.push(updates.currentMicroStepIndex);
  }
  if (updates.completedStepGroups !== undefined) {
    setClauses.push('completed_step_groups = ?');
    values.push(JSON.stringify(updates.completedStepGroups));
  }
  if (updates.completedMicroSteps !== undefined) {
    setClauses.push('completed_micro_steps = ?');
    values.push(JSON.stringify(updates.completedMicroSteps));
  }
  if (updates.unlockedAchievements !== undefined) {
    setClauses.push('unlocked_achievements = ?');
    values.push(JSON.stringify(updates.unlockedAchievements));
  }
  if (updates.totalElapsedSeconds !== undefined) {
    setClauses.push('total_elapsed_seconds = ?');
    values.push(updates.totalElapsedSeconds);
  }

  values.push(sessionId);

  const stmt = db.prepare(`
    UPDATE cooking_sessions
    SET ${setClauses.join(', ')}
    WHERE id = ?
    RETURNING *
  `);

  const row = stmt.get(...values) as SessionRow | null;
  if (!row) return null;
  return rowToSession(row);
}

/**
 * Mark a session as completed
 */
export function completeCookingSession(sessionId: string): CookingSession | null {
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE cooking_sessions
    SET status = 'completed', completed_at = ?, last_active_time = ?, updated_at = ?
    WHERE id = ?
    RETURNING *
  `);

  const row = stmt.get(now, now, now, sessionId) as SessionRow | null;
  if (!row) return null;
  return rowToSession(row);
}

/**
 * Abandon a session (user exits without completing)
 */
export function abandonCookingSession(sessionId: string): CookingSession | null {
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    UPDATE cooking_sessions
    SET status = 'abandoned', last_active_time = ?, updated_at = ?
    WHERE id = ?
    RETURNING *
  `);

  const row = stmt.get(now, now, sessionId) as SessionRow | null;
  if (!row) return null;
  return rowToSession(row);
}

/**
 * Delete a session and its notes
 */
export function deleteCookingSession(sessionId: string): boolean {
  // Delete notes first (cascade)
  db.prepare(`DELETE FROM cooking_notes WHERE session_id = ?`).run(sessionId);

  const result = db.prepare(`DELETE FROM cooking_sessions WHERE id = ?`).run(sessionId);
  return result.changes > 0;
}

// ============== Notes Functions ==============

/**
 * Save or update a note for a micro-step
 */
export function saveNote(sessionId: string, microStepId: string, noteText: string): CookingNote {
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO cooking_notes (session_id, micro_step_id, note_text)
    VALUES (?, ?, ?)
    ON CONFLICT(session_id, micro_step_id) DO UPDATE SET
      note_text = excluded.note_text,
      updated_at = ?
    RETURNING *
  `);

  const row = stmt.get(sessionId, microStepId, noteText, now) as NoteRow;
  return rowToNote(row);
}

/**
 * Get all notes for a session
 */
export function getNotesForSession(sessionId: string): CookingNote[] {
  const stmt = db.prepare(`
    SELECT * FROM cooking_notes
    WHERE session_id = ?
    ORDER BY created_at ASC
  `);
  const rows = stmt.all(sessionId) as NoteRow[];
  return rows.map(rowToNote);
}

/**
 * Get notes as a map (microStepId -> noteText) for easy lookup
 */
export function getNotesMapForSession(sessionId: string): Record<string, string> {
  const notes = getNotesForSession(sessionId);
  const map: Record<string, string> = {};
  for (const note of notes) {
    map[note.microStepId] = note.noteText;
  }
  return map;
}

/**
 * Get a specific note by session and micro-step
 */
export function getNote(sessionId: string, microStepId: string): CookingNote | null {
  const stmt = db.prepare(`
    SELECT * FROM cooking_notes
    WHERE session_id = ? AND micro_step_id = ?
  `);
  const row = stmt.get(sessionId, microStepId) as NoteRow | null;

  if (!row) return null;
  return rowToNote(row);
}

/**
 * Delete a note
 */
export function deleteNote(noteId: string): boolean {
  const result = db.prepare(`DELETE FROM cooking_notes WHERE id = ?`).run(noteId);
  return result.changes > 0;
}

/**
 * Delete a note by session and micro-step
 */
export function deleteNoteByStep(sessionId: string, microStepId: string): boolean {
  const result = db.prepare(`
    DELETE FROM cooking_notes WHERE session_id = ? AND micro_step_id = ?
  `).run(sessionId, microStepId);
  return result.changes > 0;
}

// ============== Stats Functions ==============

/**
 * Get session statistics for a recipe
 */
export interface SessionStats {
  totalSessions: number;
  completedSessions: number;
  activeSessions: number;
  abandonedSessions: number;
  totalCookingTime: number; // in seconds
}

export function getSessionStatsForRecipe(recipeId: string): SessionStats {
  const total = db.prepare(`
    SELECT COUNT(*) as count FROM cooking_sessions WHERE recipe_id = ?
  `).get(recipeId) as { count: number };

  const completed = db.prepare(`
    SELECT COUNT(*) as count FROM cooking_sessions WHERE recipe_id = ? AND status = 'completed'
  `).get(recipeId) as { count: number };

  const active = db.prepare(`
    SELECT COUNT(*) as count FROM cooking_sessions WHERE recipe_id = ? AND status = 'active'
  `).get(recipeId) as { count: number };

  const abandoned = db.prepare(`
    SELECT COUNT(*) as count FROM cooking_sessions WHERE recipe_id = ? AND status = 'abandoned'
  `).get(recipeId) as { count: number };

  const time = db.prepare(`
    SELECT COALESCE(SUM(total_elapsed_seconds), 0) as total FROM cooking_sessions WHERE recipe_id = ?
  `).get(recipeId) as { total: number };

  return {
    totalSessions: total.count,
    completedSessions: completed.count,
    activeSessions: active.count,
    abandonedSessions: abandoned.count,
    totalCookingTime: time.total,
  };
}

export { db as cookingDb };

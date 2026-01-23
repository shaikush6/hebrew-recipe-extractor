/**
 * SQLite database layer for Cooking Mode
 * Caches AI-enhanced cooking data to avoid re-processing
 */

import { Database } from 'bun:sqlite';
import type { EnhancedCookingData } from '../schemas/cooking-mode';

// Use the same database file as recipes
const db = new Database('recipes.db');

// Migrate from old INTEGER recipe_id to TEXT for Supabase UUIDs
// Only drop if the column type is wrong (one-time migration)
const tableInfo = db.prepare("PRAGMA table_info(cooking_mode_data)").all() as Array<{ name: string; type: string }>;
const recipeIdCol = tableInfo.find((col) => col.name === 'recipe_id');
if (recipeIdCol && recipeIdCol.type === 'INTEGER') {
  db.run(`DROP TABLE cooking_mode_data`);
}

// Create cooking_mode_data table with TEXT recipe_id for Supabase UUIDs
db.run(`
  CREATE TABLE IF NOT EXISTS cooking_mode_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id TEXT UNIQUE NOT NULL,
    cooking_data TEXT NOT NULL,
    total_step_groups INTEGER NOT NULL,
    total_micro_steps INTEGER NOT NULL,
    estimated_minutes INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create index for fast lookups
db.run(`CREATE INDEX IF NOT EXISTS idx_cooking_recipe_id ON cooking_mode_data(recipe_id)`);

/**
 * Save enhanced cooking data for a recipe
 */
export function saveCookingData(recipeId: string, data: EnhancedCookingData): void {
  const stmt = db.prepare(`
    INSERT INTO cooking_mode_data (
      recipe_id, cooking_data, total_step_groups,
      total_micro_steps, estimated_minutes
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(recipe_id) DO UPDATE SET
      cooking_data = excluded.cooking_data,
      total_step_groups = excluded.total_step_groups,
      total_micro_steps = excluded.total_micro_steps,
      estimated_minutes = excluded.estimated_minutes,
      updated_at = CURRENT_TIMESTAMP
  `);

  stmt.run(
    recipeId,
    JSON.stringify(data),
    data.totalStepGroups,
    data.totalMicroSteps,
    data.estimatedTotalMinutes
  );
}

/**
 * Get cooking data by recipe ID
 */
export function getCookingDataByRecipeId(recipeId: string): EnhancedCookingData | null {
  const stmt = db.prepare(`
    SELECT cooking_data FROM cooking_mode_data WHERE recipe_id = ?
  `);

  const row = stmt.get(recipeId) as { cooking_data: string } | null;
  if (!row) return null;

  return JSON.parse(row.cooking_data) as EnhancedCookingData;
}

/**
 * Check if cooking data exists for a recipe
 */
export function hasCookingData(recipeId: string): boolean {
  const stmt = db.prepare(`
    SELECT 1 FROM cooking_mode_data WHERE recipe_id = ?
  `);
  return stmt.get(recipeId) !== null;
}

/**
 * Delete cooking data for a recipe
 * (Called when the recipe itself is deleted)
 */
export function deleteCookingData(recipeId: string): boolean {
  const stmt = db.prepare(`DELETE FROM cooking_mode_data WHERE recipe_id = ?`);
  return stmt.run(recipeId).changes > 0;
}

/**
 * Get stats about cached cooking data
 */
export function getCookingDataStats(): { totalCached: number; avgMicroSteps: number } {
  const total = db.prepare(`SELECT COUNT(*) as count FROM cooking_mode_data`).get() as { count: number };
  const avg = db.prepare(`SELECT AVG(total_micro_steps) as avg FROM cooking_mode_data`).get() as { avg: number | null };

  return {
    totalCached: total.count,
    avgMicroSteps: avg.avg || 0,
  };
}

export { db };

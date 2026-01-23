/**
 * SQLite database layer using Bun's built-in SQLite
 * Stores recipe extraction history for quick access
 */

import { Database } from 'bun:sqlite';
import type { Recipe } from '../schemas/recipe';

// Initialize database with file storage
const db = new Database('recipes.db');

// Create tables if they don't exist
db.run(`
  CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_url TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    language TEXT DEFAULT 'he',
    image_url TEXT,
    author TEXT,
    date_published TEXT,
    extraction_method TEXT,
    confidence REAL,
    recipe_data TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create index for faster URL lookups
db.run(`CREATE INDEX IF NOT EXISTS idx_source_url ON recipes(source_url)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_created_at ON recipes(created_at DESC)`);

export interface RecipeRecord {
  id: number;
  source_url: string;
  title: string;
  description: string | null;
  language: string;
  image_url: string | null;
  author: string | null;
  date_published: string | null;
  extraction_method: string | null;
  confidence: number | null;
  recipe_data: string;
  created_at: string;
  updated_at: string;
}

/**
 * Save a recipe to the database
 * Updates existing record if URL already exists
 */
export function saveRecipe(recipe: Recipe): RecipeRecord {
  const stmt = db.prepare(`
    INSERT INTO recipes (
      source_url, title, description, language, image_url,
      author, date_published, extraction_method, confidence, recipe_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source_url) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      language = excluded.language,
      image_url = excluded.image_url,
      author = excluded.author,
      date_published = excluded.date_published,
      extraction_method = excluded.extraction_method,
      confidence = excluded.confidence,
      recipe_data = excluded.recipe_data,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `);

  const result = stmt.get(
    recipe.sourceUrl,
    recipe.title,
    recipe.description,
    recipe.language,
    recipe.imageUrl,
    recipe.author,
    recipe.datePublished,
    recipe.extractionMethod,
    recipe.confidence,
    JSON.stringify(recipe)
  ) as RecipeRecord;

  return result;
}

/**
 * Recipe with database ID
 */
export interface RecipeWithId extends Recipe {
  id: number;
}

/**
 * Get a recipe by its source URL (includes database ID)
 */
export function getRecipeByUrl(url: string): RecipeWithId | null {
  const stmt = db.prepare(`SELECT id, recipe_data FROM recipes WHERE source_url = ?`);
  const row = stmt.get(url) as { id: number; recipe_data: string } | null;

  if (!row) return null;
  const recipe = JSON.parse(row.recipe_data) as Recipe;
  return { ...recipe, id: row.id };
}

/**
 * Get a recipe by its ID (includes database ID)
 */
export function getRecipeById(id: number): RecipeWithId | null {
  const stmt = db.prepare(`SELECT id, recipe_data FROM recipes WHERE id = ?`);
  const row = stmt.get(id) as { id: number; recipe_data: string } | null;

  if (!row) return null;
  const recipe = JSON.parse(row.recipe_data) as Recipe;
  return { ...recipe, id: row.id };
}

/**
 * Get recent recipes with pagination
 */
export function getRecentRecipes(limit = 20, offset = 0): RecipeRecord[] {
  const stmt = db.prepare(`
    SELECT id, source_url, title, description, language, image_url,
           author, extraction_method, confidence, created_at, updated_at
    FROM recipes
    ORDER BY updated_at DESC
    LIMIT ? OFFSET ?
  `);

  return stmt.all(limit, offset) as RecipeRecord[];
}

/**
 * Search recipes by title (supports Hebrew)
 */
export function searchRecipes(query: string, limit = 20): RecipeRecord[] {
  const stmt = db.prepare(`
    SELECT id, source_url, title, description, language, image_url,
           author, extraction_method, confidence, created_at, updated_at
    FROM recipes
    WHERE title LIKE ?
    ORDER BY updated_at DESC
    LIMIT ?
  `);

  return stmt.all(`%${query}%`, limit) as RecipeRecord[];
}

/**
 * Delete a recipe by ID
 */
export function deleteRecipe(id: number): boolean {
  const stmt = db.prepare(`DELETE FROM recipes WHERE id = ?`);
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Get total recipe count
 */
export function getRecipeCount(): number {
  const stmt = db.prepare(`SELECT COUNT(*) as count FROM recipes`);
  const row = stmt.get() as { count: number };
  return row.count;
}

/**
 * Check if a recipe exists by URL
 */
export function recipeExists(url: string): boolean {
  const stmt = db.prepare(`SELECT 1 FROM recipes WHERE source_url = ?`);
  return stmt.get(url) !== null;
}

/**
 * Get database stats
 */
export function getDbStats(): { totalRecipes: number; hebrewRecipes: number; englishRecipes: number } {
  const total = db.prepare(`SELECT COUNT(*) as count FROM recipes`).get() as { count: number };
  const hebrew = db.prepare(`SELECT COUNT(*) as count FROM recipes WHERE language = 'he'`).get() as { count: number };
  const english = db.prepare(`SELECT COUNT(*) as count FROM recipes WHERE language = 'en'`).get() as { count: number };

  return {
    totalRecipes: total.count,
    hebrewRecipes: hebrew.count,
    englishRecipes: english.count,
  };
}

export { db };

/**
 * Supabase Database Operations
 * Functions for recipe CRUD operations using Supabase
 */

import { createClient } from './server';
import type { Recipe, RecipeRecord, HistoryItem, Kashrut } from '@/types/recipe';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert a Recipe object to database record format
 */
function recipeToDbRecord(userId: string, recipe: Recipe): Omit<RecipeRecord, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    source_url: recipe.sourceUrl,
    title: recipe.title,
    description: recipe.description,
    language: recipe.language,
    image_url: recipe.imageUrl,
    author: recipe.author,
    date_published: recipe.datePublished,
    extraction_method: recipe.extractionMethod,
    confidence: recipe.confidence,
    recipe_data: recipe,
    kashrut: recipe.kashrut || null,
  };
}

/**
 * Convert a database record to Recipe object
 */
function dbRecordToRecipe(record: RecipeRecord): Recipe {
  return {
    ...record.recipe_data,
    id: record.id,
  };
}

/**
 * Convert a database record to HistoryItem
 */
function dbRecordToHistoryItem(record: RecipeRecord): HistoryItem {
  return {
    id: record.id,
    source_url: record.source_url,
    title: record.title,
    description: record.description,
    language: record.language,
    image_url: record.image_url,
    author: record.author,
    extraction_method: record.extraction_method,
    confidence: record.confidence,
    kashrut: record.kashrut,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

// ============================================
// RECIPE CRUD OPERATIONS
// ============================================

/**
 * Save a recipe to the database
 * If a recipe with the same URL exists for this user, update it
 * @returns The saved recipe with its ID
 */
export async function saveRecipe(userId: string, recipe: Recipe): Promise<Recipe> {
  const supabase = await createClient();

  // Check if recipe with same URL already exists for this user
  const { data: existing } = await supabase
    .from('recipe_recipes')
    .select('id')
    .eq('user_id', userId)
    .eq('source_url', recipe.sourceUrl)
    .single();

  const dbRecord = recipeToDbRecord(userId, recipe);

  if (existing) {
    // Update existing recipe
    const { data, error } = await supabase
      .from('recipe_recipes')
      .update({
        ...dbRecord,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('[Supabase DB] Error updating recipe:', error);
      throw new Error(`Failed to update recipe: ${error.message}`);
    }

    return dbRecordToRecipe(data as RecipeRecord);
  } else {
    // Insert new recipe
    const { data, error } = await supabase
      .from('recipe_recipes')
      .insert(dbRecord)
      .select()
      .single();

    if (error) {
      console.error('[Supabase DB] Error inserting recipe:', error);
      throw new Error(`Failed to save recipe: ${error.message}`);
    }

    return dbRecordToRecipe(data as RecipeRecord);
  }
}

/**
 * Get a recipe by URL for a specific user
 * @returns The recipe if found, null otherwise
 */
export async function getRecipeByUrl(userId: string, url: string): Promise<Recipe | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('recipe_recipes')
    .select('*')
    .eq('user_id', userId)
    .eq('source_url', url)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - recipe not found
      return null;
    }
    console.error('[Supabase DB] Error fetching recipe by URL:', error);
    throw new Error(`Failed to fetch recipe: ${error.message}`);
  }

  return dbRecordToRecipe(data as RecipeRecord);
}

/**
 * Get a recipe by ID
 * RLS will ensure user can only access their own recipes
 * @returns The recipe if found, null otherwise
 */
export async function getRecipeById(id: string): Promise<Recipe | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('recipe_recipes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - recipe not found
      return null;
    }
    console.error('[Supabase DB] Error fetching recipe by ID:', error);
    throw new Error(`Failed to fetch recipe: ${error.message}`);
  }

  return dbRecordToRecipe(data as RecipeRecord);
}

/**
 * Get recent recipes for a user
 * RLS will filter to user's own recipes
 */
export async function getRecentRecipes(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<HistoryItem[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('recipe_recipes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[Supabase DB] Error fetching recent recipes:', error);
    throw new Error(`Failed to fetch recipes: ${error.message}`);
  }

  return (data as RecipeRecord[]).map(dbRecordToHistoryItem);
}

/**
 * Search recipes by title or description
 * Uses PostgreSQL full-text search
 */
export async function searchRecipes(
  userId: string,
  query: string,
  limit: number = 20
): Promise<HistoryItem[]> {
  const supabase = await createClient();

  // Use ilike for simple text search (works with Hebrew)
  const { data, error } = await supabase
    .from('recipe_recipes')
    .select('*')
    .eq('user_id', userId)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Supabase DB] Error searching recipes:', error);
    throw new Error(`Failed to search recipes: ${error.message}`);
  }

  return (data as RecipeRecord[]).map(dbRecordToHistoryItem);
}

/**
 * Delete a recipe by ID
 * RLS will ensure user can only delete their own recipes
 */
export async function deleteRecipe(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('recipe_recipes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[Supabase DB] Error deleting recipe:', error);
    throw new Error(`Failed to delete recipe: ${error.message}`);
  }

  return true;
}

/**
 * Get total recipe count for a user
 */
export async function getRecipeCount(userId: string): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('recipe_recipes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    console.error('[Supabase DB] Error counting recipes:', error);
    throw new Error(`Failed to count recipes: ${error.message}`);
  }

  return count || 0;
}

/**
 * Get database stats for a user
 */
export async function getDbStats(userId: string): Promise<{
  totalRecipes: number;
  hebrewRecipes: number;
  englishRecipes: number;
}> {
  const supabase = await createClient();

  // Get total count
  const { count: totalRecipes, error: totalError } = await supabase
    .from('recipe_recipes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (totalError) {
    console.error('[Supabase DB] Error getting total count:', totalError);
    throw new Error(`Failed to get stats: ${totalError.message}`);
  }

  // Get Hebrew count
  const { count: hebrewRecipes, error: hebrewError } = await supabase
    .from('recipe_recipes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('language', 'he');

  if (hebrewError) {
    console.error('[Supabase DB] Error getting Hebrew count:', hebrewError);
    throw new Error(`Failed to get stats: ${hebrewError.message}`);
  }

  // Get English count
  const { count: englishRecipes, error: englishError } = await supabase
    .from('recipe_recipes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('language', 'en');

  if (englishError) {
    console.error('[Supabase DB] Error getting English count:', englishError);
    throw new Error(`Failed to get stats: ${englishError.message}`);
  }

  return {
    totalRecipes: totalRecipes || 0,
    hebrewRecipes: hebrewRecipes || 0,
    englishRecipes: englishRecipes || 0,
  };
}

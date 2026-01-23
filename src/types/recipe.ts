/**
 * Shared Recipe Types
 * Used across the application for type consistency
 */

// ============================================
// INGREDIENT TYPES
// ============================================

// Standard unit codes (matches schema UnitCode)
export type UnitCode =
  | 'cup' | 'tbsp' | 'tsp' | 'ml' | 'l' | 'fl_oz'
  | 'g' | 'kg' | 'oz' | 'lb'
  | 'piece' | 'slice' | 'clove' | 'bunch' | 'package' | 'can' | 'jar' | 'bag'
  | 'pinch' | 'dash' | 'to_taste' | 'as_needed' | 'unknown';

export interface Ingredient {
  original: string;
  item: string;
  quantity: number | null;
  unit: UnitCode | null;
  comments: string | null;
}

// ============================================
// RECIPE META TYPES
// ============================================

export type Difficulty = 'easy' | 'medium' | 'hard' | 'unknown';
export type Language = 'he' | 'en' | 'mixed';
export type ExtractionMethod = 'json-ld' | 'llm' | 'hybrid';
export type Kashrut = 'parve' | 'dairy' | 'meat' | 'not_kosher' | 'unknown';

export interface RecipeMeta {
  prepTime: number | null;
  cookTime: number | null;
  totalTime: number | null;
  servings: number | null;
  difficulty: Difficulty;
  cuisine: string | null;
  category: string | null;
  dietary: string[];
}

// ============================================
// NUTRITION TYPES
// ============================================

export interface Nutrition {
  calories: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fat: number | null;
  fiber: number | null;
  sodium: number | null;
}

// ============================================
// RECIPE TYPES
// ============================================

export interface Recipe {
  id?: string; // UUID from database
  title: string;
  description: string | null;
  language: Language;
  sourceUrl: string;
  imageUrl: string | null;
  author: string | null;
  datePublished: string | null;
  ingredients: Ingredient[];
  steps: string[];
  tips: string[];
  meta: RecipeMeta;
  nutrition?: Nutrition | null;
  extractionMethod: ExtractionMethod;
  confidence: number;
  kashrut?: Kashrut;
  rawText?: string;
}

// ============================================
// DATABASE RECORD TYPES (from Supabase)
// ============================================

export interface RecipeRecord {
  id: string;
  user_id: string;
  source_url: string;
  title: string;
  description: string | null;
  language: string;
  image_url: string | null;
  author: string | null;
  date_published: string | null;
  extraction_method: string | null;
  confidence: number | null;
  recipe_data: Recipe;
  kashrut: Kashrut | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// HISTORY TYPES (for UI)
// ============================================

export interface HistoryItem {
  id: string;
  source_url: string;
  title: string;
  description: string | null;
  language: string;
  image_url: string | null;
  author: string | null;
  extraction_method: string | null;
  confidence: number | null;
  kashrut: Kashrut | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// COOKING SESSION TYPES
// ============================================

export type SessionStatus = 'active' | 'completed' | 'abandoned';

export interface CookingSession {
  id: string;
  recipe_id: string;
  user_id: string;
  current_step_group_index: number;
  current_micro_step_index: number;
  completed_step_groups: number[];
  completed_micro_steps: string[];
  unlocked_achievements: string[];
  start_time: string | null;
  last_active_time: string | null;
  total_elapsed_seconds: number;
  status: SessionStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ExtractionResult {
  success: boolean;
  recipe: Recipe | null;
  error: string | null;
  warnings: string[];
  processingTimeMs: number;
  fromCache?: boolean;
  saved?: boolean;
}

export interface HistoryResponse {
  recipes: HistoryItem[];
  total: number;
}

export interface StatsResponse {
  totalRecipes: number;
  hebrewRecipes: number;
  englishRecipes: number;
}

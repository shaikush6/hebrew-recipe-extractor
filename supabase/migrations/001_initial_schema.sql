-- Hebrew Recipe Extractor V2 - Database Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/klszfbureuikeahpqsbs/sql)
-- All tables prefixed with 'recipe_' to avoid conflicts with existing project tables

-- ============================================
-- RECIPES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS recipe_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  language TEXT DEFAULT 'he',
  image_url TEXT,
  author TEXT,
  date_published TEXT,
  extraction_method TEXT,
  confidence REAL,
  recipe_data JSONB NOT NULL,
  kashrut TEXT CHECK (kashrut IN ('parve', 'dairy', 'meat', 'not_kosher', 'unknown')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipe_recipes_user_id ON recipe_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_recipes_source_url ON recipe_recipes(source_url);
CREATE INDEX IF NOT EXISTS idx_recipe_recipes_created_at ON recipe_recipes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_recipes_kashrut ON recipe_recipes(kashrut);

-- Unique constraint: each user can only have one recipe per URL
CREATE UNIQUE INDEX IF NOT EXISTS idx_recipe_recipes_user_url ON recipe_recipes(user_id, source_url);

-- Row Level Security
ALTER TABLE recipe_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recipes" ON recipe_recipes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes" ON recipe_recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes" ON recipe_recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes" ON recipe_recipes
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- COOKING SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS recipe_cooking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES recipe_recipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_step_group_index INTEGER DEFAULT 0,
  current_micro_step_index INTEGER DEFAULT 0,
  completed_step_groups JSONB DEFAULT '[]',
  completed_micro_steps JSONB DEFAULT '[]',
  unlocked_achievements JSONB DEFAULT '[]',
  start_time TIMESTAMPTZ,
  last_active_time TIMESTAMPTZ,
  total_elapsed_seconds INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recipe_sessions_user_id ON recipe_cooking_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_sessions_recipe_id ON recipe_cooking_sessions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_sessions_status ON recipe_cooking_sessions(status);

-- Row Level Security
ALTER TABLE recipe_cooking_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions" ON recipe_cooking_sessions
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- COOKING MODE DATA CACHE
-- ============================================
CREATE TABLE IF NOT EXISTS recipe_cooking_mode_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID UNIQUE REFERENCES recipe_recipes(id) ON DELETE CASCADE,
  cooking_data JSONB NOT NULL,
  total_step_groups INTEGER,
  total_micro_steps INTEGER,
  estimated_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_recipe_cooking_data_recipe ON recipe_cooking_mode_data(recipe_id);

-- Row Level Security (accessible if user owns the recipe)
ALTER TABLE recipe_cooking_mode_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view cooking data for own recipes" ON recipe_cooking_mode_data
  FOR SELECT USING (
    recipe_id IN (SELECT id FROM recipe_recipes WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert cooking data for own recipes" ON recipe_cooking_mode_data
  FOR INSERT WITH CHECK (
    recipe_id IN (SELECT id FROM recipe_recipes WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update cooking data for own recipes" ON recipe_cooking_mode_data
  FOR UPDATE USING (
    recipe_id IN (SELECT id FROM recipe_recipes WHERE user_id = auth.uid())
  );

-- ============================================
-- COOKING NOTES
-- ============================================
CREATE TABLE IF NOT EXISTS recipe_cooking_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES recipe_cooking_sessions(id) ON DELETE CASCADE,
  micro_step_id TEXT,
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, micro_step_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_recipe_notes_session ON recipe_cooking_notes(session_id);

-- Row Level Security
ALTER TABLE recipe_cooking_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notes" ON recipe_cooking_notes
  FOR ALL USING (
    session_id IN (SELECT id FROM recipe_cooking_sessions WHERE user_id = auth.uid())
  );

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_recipe_recipes_updated_at
  BEFORE UPDATE ON recipe_recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_sessions_updated_at
  BEFORE UPDATE ON recipe_cooking_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_cooking_data_updated_at
  BEFORE UPDATE ON recipe_cooking_mode_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_notes_updated_at
  BEFORE UPDATE ON recipe_cooking_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

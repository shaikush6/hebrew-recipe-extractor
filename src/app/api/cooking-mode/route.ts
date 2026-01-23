import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { getRecipeById } from '@/lib/supabase/db';
import { getCookingDataByRecipeId, saveCookingData } from '@/lib/cooking-db';
import { LLMCookingOutputSchema, type EnhancedCookingData } from '@/schemas/cooking-mode';

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Haiku 4.5 pricing (per 1M tokens)
const PRICING = {
  input: 1.00,   // $1.00 per 1M input tokens
  output: 5.00,  // $5.00 per 1M output tokens
};

function logTokenUsage(label: string, usage: any) {
  if (!usage) {
    console.log(`\n💰 [${label}] Token Usage: (usage data not available)\n`);
    return;
  }

  // AI SDK uses promptTokens/completionTokens
  const inputTokens = usage.promptTokens ?? usage.input_tokens ?? 0;
  const outputTokens = usage.completionTokens ?? usage.output_tokens ?? 0;

  const inputCost = (inputTokens / 1_000_000) * PRICING.input;
  const outputCost = (outputTokens / 1_000_000) * PRICING.output;
  const totalCost = inputCost + outputCost;

  console.log(`\n💰 [${label}] Token Usage:`);
  console.log(`   Model:  claude-haiku-4-5-20251001`);
  console.log(`   Input:  ${inputTokens.toLocaleString()} tokens ($${inputCost.toFixed(4)})`);
  console.log(`   Output: ${outputTokens.toLocaleString()} tokens ($${outputCost.toFixed(4)})`);
  console.log(`   TOTAL:  $${totalCost.toFixed(4)}\n`);
}

const COOKING_MODE_PROMPT = `You are a professional chef assistant helping home cooks follow recipes step by step.

Your task is to transform a recipe into an enhanced cooking guide. You must:

## 1. MICRO-STEPS
Break each recipe step into 1-2 action micro-steps. Each micro-step should be:
- A single, clear action that a cook can do without re-reading
- Specific with exact measurements when ingredients are involved
- Example: "Crack 3 eggs into the mixing bowl" or "Preheat oven to 180°C"

## 2. INGREDIENT MAPPING
For each micro-step, list exactly which ingredients are used:
- Reference ingredients by their originalIndex from the ingredients array
- Include the exact quantity needed for that specific step
- If a step uses part of an ingredient, specify that partial amount

## 3. TIMER DETECTION
Extract any time-based instructions as timers:
- "Bake for 20 minutes" → { durationSeconds: 1200, label: "Bake", isOptional: false }
- "Let rest 5 min" → { durationSeconds: 300, label: "Rest", isOptional: false }
- "Simmer until reduced, about 10 minutes" → { durationSeconds: 600, label: "Simmer", isOptional: true }
- Hebrew: "דקות" = minutes, "שעה" = hour, "שניות" = seconds

## 4. CONTEXTUAL TIPS
Add helpful tips for tricky or important steps:
- Technique tips: "Fold gently to keep air in the batter"
- Timing tips: "The onions are ready when translucent"
- Safety tips: "Handle carefully - the pan is very hot"
- Visual cues: "The dough should be smooth and elastic"

## 5. ACHIEVEMENTS
Create fun achievements for completing milestones:
- Always include: "First Steps" at step 0, "Halfway There" at middle, "Master Chef" at end
- Add technique-specific achievements (e.g., "Dough Master" after kneading)
- Use appropriate Lucide icon names: trophy, star, flame, chef-hat, sparkles, medal, award

## 6. PREP CHECKLIST
List everything needed before starting:
- All ingredients that need to be measured out (category: "ingredient")
- Equipment needed like bowls, pans, tools (category: "equipment")
- Prep work like "preheat oven", "butter the pan" (category: "prep")

## CRITICAL RULES:
- Preserve the original language. If the recipe is in Hebrew, provide Hebrew versions in *He fields
- Generate unique IDs for each stepGroup and microStep (use format: "sg-1", "ms-1-1", etc.)
- Estimate difficulty based on technique complexity (easy/medium/hard)
- Set milestones for each step group describing what's achieved ("Batter is ready!")`;

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * POST /api/cooking-mode
 * Generate enhanced cooking data for a recipe
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipeId, forceRefresh = false } = body;

    if (!recipeId) {
      return NextResponse.json(
        { success: false, error: 'Recipe ID is required' },
        { status: 400 }
      );
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getCookingDataByRecipeId(recipeId);
      if (cached) {
        console.log(`[Cooking Mode] Returning cached data for recipe ${recipeId}`);
        return NextResponse.json({
          success: true,
          data: cached,
          fromCache: true,
        });
      }
    }

    // Get the recipe from Supabase
    const recipe = await getRecipeById(recipeId);
    if (!recipe) {
      return NextResponse.json(
        { success: false, error: 'Recipe not found' },
        { status: 404 }
      );
    }

    console.log(`[Cooking Mode] Generating enhanced data for: ${recipe.title}`);

    // Generate enhanced cooking data with Claude
    const { object, usage } = await generateObject({
      model: anthropic('claude-haiku-4-5-20251001'),
      schema: LLMCookingOutputSchema,
      system: COOKING_MODE_PROMPT,
      prompt: `Transform this recipe into an enhanced cooking guide:

RECIPE TITLE: ${recipe.title}
LANGUAGE: ${recipe.language}

INGREDIENTS (with indices for reference):
${recipe.ingredients.map((ing, idx) =>
  `[${idx}] ${ing.quantity || ''} ${ing.unit || ''} ${ing.item}${ing.comments ? ` (${ing.comments})` : ''}`
).join('\n')}

ORIGINAL STEPS:
${recipe.steps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

TIPS FROM RECIPE:
${recipe.tips.length > 0 ? recipe.tips.join('\n') : 'None provided'}

METADATA:
- Prep Time: ${recipe.meta.prepTime || 'not specified'} minutes
- Cook Time: ${recipe.meta.cookTime || 'not specified'} minutes
- Servings: ${recipe.meta.servings || 'not specified'}
- Difficulty: ${recipe.meta.difficulty}
- Cuisine: ${recipe.meta.cuisine || 'not specified'}

Generate micro-steps, timers, tips, achievements, and prep checklist following the instructions.`,
      temperature: 0.3,
      maxTokens: 65536,
    });

    // Log token usage with cost
    if (usage) {
      logTokenUsage('Cooking Mode Generation', usage);
    }

    // Calculate totals
    const totalMicroSteps = object.stepGroups.reduce(
      (sum, group) => sum + group.microSteps.length,
      0
    );

    // Build the full enhanced cooking data
    const enhancedData: EnhancedCookingData = {
      recipeId,
      recipeTitle: recipe.title,
      language: recipe.language,
      totalStepGroups: object.stepGroups.length,
      totalMicroSteps,
      estimatedTotalMinutes: object.estimatedTotalMinutes ?? null,
      stepGroups: object.stepGroups,
      prepChecklist: object.prepChecklist ?? [],
      achievements: object.achievements ?? [],
      createdAt: new Date().toISOString(),
    };

    // Save to database cache
    saveCookingData(recipeId, enhancedData);
    console.log(`[Cooking Mode] Saved to cache: ${totalMicroSteps} micro-steps`);

    return NextResponse.json({
      success: true,
      data: enhancedData,
      fromCache: false,
    });
  } catch (error) {
    console.error('[Cooking Mode API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate cooking data',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cooking-mode?recipeId=123
 * Retrieve cached cooking data
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const recipeId = searchParams.get('recipeId');

  if (!recipeId) {
    return NextResponse.json(
      { success: false, error: 'Recipe ID is required' },
      { status: 400 }
    );
  }

  const data = getCookingDataByRecipeId(recipeId);

  if (!data) {
    return NextResponse.json(
      { success: false, error: 'Cooking data not found. Generate it first with POST.' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data,
    fromCache: true,
  });
}

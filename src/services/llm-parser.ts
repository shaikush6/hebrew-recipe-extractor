import { generateObject } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import {
  type Recipe,
  RecipeSchema,
  type Ingredient,
  IngredientSchema,
  RecipeMetaSchema,
  UnitCode,
} from '../schemas/recipe';

// Initialize Anthropic client
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// LLM-specific schemas for structured output
const LLMIngredientSchema = z.object({
  original: z.string().describe('Original ingredient text exactly as it appears'),
  item: z.string().describe('The ingredient name only (e.g., "flour", "קמח")'),
  quantity: z.number().nullable().describe('Numeric quantity. Convert fractions to decimals (e.g., "חצי" = 0.5, "1/2" = 0.5). null if not specified'),
  unit: UnitCode.nullable().describe('Standardized unit code. Convert Hebrew units: כוס=cup, כף=tbsp, כפית=tsp, גרם=g, etc.'),
  comments: z.string().nullable().describe('Preparation notes like "finely chopped", "קצוץ דק", "room temperature"'),
});

const LLMRecipeSchema = z.object({
  title: z.string().describe('Recipe title'),
  description: z.string().nullable().describe('Brief description or summary'),
  language: z.enum(['he', 'en', 'mixed']).describe('Primary language: he for Hebrew, en for English'),
  ingredients: z.array(LLMIngredientSchema).describe('All ingredients with parsed details'),
  steps: z.array(z.string()).describe('Ordered preparation steps. Clean and numbered instructions'),
  tips: z.array(z.string()).describe('Optional cooking tips, notes, or suggestions'),
  kashrut: z.enum(['parve', 'dairy', 'meat', 'not_kosher', 'unknown']).describe('Kashrut status: parve (neither meat nor dairy), dairy (חלבי), meat (בשרי), not_kosher, or unknown'),
  meta: z.object({
    prepTime: z.number().nullable().describe('Prep time in minutes'),
    cookTime: z.number().nullable().describe('Cook/bake time in minutes'),
    totalTime: z.number().nullable().describe('Total time in minutes'),
    servings: z.number().nullable().describe('Number of servings/portions'),
    difficulty: z.enum(['easy', 'medium', 'hard', 'unknown']),
    cuisine: z.string().nullable().describe('Cuisine type (Israeli, Italian, etc.)'),
    category: z.string().nullable().describe('Recipe category (dessert, main, etc.)'),
    dietary: z.array(z.string()).describe('Dietary tags (vegan, kosher, gluten-free, etc.)'),
  }),
});

const SYSTEM_PROMPT = `You are an expert recipe parser specializing in Hebrew and English recipes.
Your task is to extract structured recipe data from raw text content.

CRITICAL RULES:
1. PRESERVE original Hebrew/English text in the "original" field
2. NORMALIZE quantities:
   - Hebrew fractions: חצי = 0.5, רבע = 0.25, שליש = 0.333
   - Text fractions: 1/2 = 0.5, 1/4 = 0.25
   - Hebrew numbers: אחד/אחת = 1, שניים/שתיים = 2, etc.

3. NORMALIZE Hebrew units to codes:
   - כוס/כוסות → cup
   - כף/כפות → tbsp
   - כפית/כפיות → tsp
   - גרם/ג' → g
   - קילו/ק"ג → kg
   - מ"ל → ml
   - ליטר → l
   - שקית/שקיות → bag
   - חבילה → package
   - קורט/קמצוץ → pinch
   - לפי הטעם → to_taste

4. EXTRACT preparation notes as comments:
   - "קצוץ דק" → comments: "קצוץ דק"
   - "room temperature" → comments: "room temperature"
   - "finely chopped" → comments: "finely chopped"

5. CLEAN instructions:
   - Remove numbering prefixes (1., 2., etc.)
   - Keep each step as a complete, clear instruction
   - Maintain original language

6. INFER reasonable values:
   - If prep/cook times mentioned in text, extract them
   - Estimate difficulty from technique complexity
   - Identify dietary restrictions from ingredients

7. DETERMINE kashrut status:
   - parve: Contains no meat or dairy (vegetables, grains, eggs, fish)
   - dairy (חלבי): Contains dairy products (milk, cheese, butter, cream)
   - meat (בשרי): Contains meat or poultry
   - not_kosher: Contains explicitly non-kosher items (shellfish, pork, etc.)
   - unknown: Cannot determine from ingredients
   - Look for Hebrew indicators: חלבי, בשרי, פרווה, כשר

8. Handle MESSY content:
   - Ignore ads, navigation, comments
   - Focus on the actual recipe content
   - If ingredients/steps are mixed, separate them properly`;

export interface LLMParseOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

const DEFAULT_OPTIONS: LLMParseOptions = {
  model: 'claude-haiku-4-5-20251001',
  maxTokens: 4096,
  temperature: 0.1,
};

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

/**
 * Parse recipe content using Claude LLM
 */
export async function parseWithLLM(
  rawText: string,
  sourceUrl: string,
  partialData?: Partial<Recipe>,
  options: LLMParseOptions = {}
): Promise<Recipe> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Truncate text if too long (Claude has context limits)
  const maxTextLength = 15000;
  const truncatedText = rawText.length > maxTextLength
    ? rawText.slice(0, maxTextLength) + '\n\n[Content truncated...]'
    : rawText;

  // Build the prompt
  const userPrompt = partialData
    ? `I have partial recipe data extracted from structured metadata, but it may be incomplete or need refinement.

PARTIAL DATA:
${JSON.stringify(partialData, null, 2)}

RAW CONTENT TO VERIFY AND COMPLETE:
${truncatedText}

Please verify the partial data against the raw content, fill in any missing fields, and normalize all values according to the rules.`
    : `Extract the recipe from this content:

${truncatedText}`;

  try {
    const { object, usage } = await generateObject({
      model: anthropic(opts.model!),
      schema: LLMRecipeSchema,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: opts.temperature,
    });

    // Log token usage with cost
    console.log('[DEBUG] Raw usage object:', JSON.stringify(usage, null, 2));
    logTokenUsage('Recipe Extraction', usage);

    // Build the final recipe object
    const recipe: Recipe = {
      title: object.title,
      description: object.description,
      language: object.language,
      sourceUrl,
      imageUrl: partialData?.imageUrl || null,
      author: partialData?.author || null,
      datePublished: partialData?.datePublished || null,
      ingredients: object.ingredients as Ingredient[],
      steps: object.steps,
      tips: object.tips || [],
      meta: {
        prepTime: object.meta.prepTime,
        cookTime: object.meta.cookTime,
        totalTime: object.meta.totalTime,
        servings: object.meta.servings,
        difficulty: object.meta.difficulty,
        cuisine: object.meta.cuisine,
        category: object.meta.category,
        dietary: object.meta.dietary || [],
      },
      nutrition: partialData?.nutrition || null,
      extractionMethod: partialData ? 'hybrid' : 'llm',
      confidence: partialData ? 0.85 : 0.75,
      kashrut: object.kashrut,
      rawText: truncatedText,
    };

    return recipe;
  } catch (error) {
    console.error('LLM parsing error:', error);
    throw new Error(`Failed to parse recipe with LLM: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate and refine an existing recipe using LLM
 */
export async function refineRecipe(
  recipe: Partial<Recipe>,
  rawText: string,
  sourceUrl: string,
  options: LLMParseOptions = {}
): Promise<Recipe> {
  // Check if the existing data is good enough
  const hasGoodData = !!(
    recipe.title &&
    recipe.ingredients &&
    recipe.ingredients.length >= 2 &&
    recipe.steps &&
    recipe.steps.length >= 2
  );

  if (hasGoodData) {
    // Validate and enhance with LLM
    return parseWithLLM(rawText, sourceUrl, recipe, options);
  }

  // Full LLM extraction
  return parseWithLLM(rawText, sourceUrl, undefined, options);
}

/**
 * Check if ANTHROPIC_API_KEY is set
 */
export function hasApiKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

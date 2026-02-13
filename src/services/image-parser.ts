import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { type Recipe, UnitCode } from '../schemas/recipe';

// Initialize OpenAI client
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// LLM-specific schemas for structured output (same as llm-parser.ts)
const LLMIngredientSchema = z.object({
  original: z.string().describe('Original ingredient text exactly as it appears in the image'),
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

const VISION_SYSTEM_PROMPT = `You are an expert recipe parser specializing in Hebrew and English recipes.
Your task is to extract structured recipe data from an IMAGE of a recipe.
The image may contain:
- Printed text from a cookbook, magazine, or website screenshot
- Handwritten recipe notes
- A recipe card or index card
- A photo of a recipe page

CRITICAL RULES:
1. READ the text in the image carefully, including any handwritten text
2. PRESERVE original Hebrew/English text in the "original" field
3. NORMALIZE quantities:
   - Hebrew fractions: חצי = 0.5, רבע = 0.25, שליש = 0.333
   - Text fractions: 1/2 = 0.5, 1/4 = 0.25
   - Hebrew numbers: אחד/אחת = 1, שניים/שתיים = 2, etc.

4. NORMALIZE Hebrew units to codes:
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

5. EXTRACT preparation notes as comments:
   - "קצוץ דק" → comments: "קצוץ דק"
   - "room temperature" → comments: "room temperature"
   - "finely chopped" → comments: "finely chopped"

6. CLEAN instructions:
   - Remove numbering prefixes (1., 2., etc.)
   - Keep each step as a complete, clear instruction
   - Maintain original language

7. INFER reasonable values:
   - If prep/cook times mentioned in image, extract them
   - Estimate difficulty from technique complexity
   - Identify dietary restrictions from ingredients

8. DETERMINE kashrut status:
   - parve: Contains no meat or dairy (vegetables, grains, eggs, fish)
   - dairy (חלבי): Contains dairy products (milk, cheese, butter, cream)
   - meat (בשרי): Contains meat or poultry
   - not_kosher: Contains explicitly non-kosher items (shellfish, pork, etc.)
   - unknown: Cannot determine from ingredients

9. HANDLE difficult images:
   - If text is partially visible, extract what you can read
   - For handwritten text, do your best to interpret the writing
   - If measurements are unclear, make reasonable assumptions and note uncertainty in comments
   - Focus on the recipe content, ignore watermarks or decorations`;

export interface ImageParseOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

const DEFAULT_OPTIONS: ImageParseOptions = {
  model: 'gpt-4o',
  maxTokens: 4096,
  temperature: 0.1,
};

// GPT-4o pricing (per 1M tokens)
const PRICING = {
  input: 2.50,   // $2.50 per 1M input tokens
  output: 10.00,  // $10.00 per 1M output tokens
};

function logTokenUsage(label: string, usage: any) {
  if (!usage) {
    console.log(`\n[${label}] Token Usage: (usage data not available)\n`);
    return;
  }

  const inputTokens = usage.promptTokens ?? usage.input_tokens ?? 0;
  const outputTokens = usage.completionTokens ?? usage.output_tokens ?? 0;

  const inputCost = (inputTokens / 1_000_000) * PRICING.input;
  const outputCost = (outputTokens / 1_000_000) * PRICING.output;
  const totalCost = inputCost + outputCost;

  console.log(`\n[${label}] Token Usage:`);
  console.log(`   Model:  gpt-4o`);
  console.log(`   Input:  ${inputTokens.toLocaleString()} tokens ($${inputCost.toFixed(4)})`);
  console.log(`   Output: ${outputTokens.toLocaleString()} tokens ($${outputCost.toFixed(4)})`);
  console.log(`   TOTAL:  $${totalCost.toFixed(4)}\n`);
}

/**
 * Parse recipe from an image using OpenAI GPT-4 Vision
 */
export async function parseImageWithLLM(
  imageBase64: string,
  mimeType: string,
  options: ImageParseOptions = {}
): Promise<Recipe> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const { object, usage } = await generateObject({
      model: openai(opts.model!),
      schema: LLMRecipeSchema,
      system: VISION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: `data:${mimeType};base64,${imageBase64}`,
            },
            {
              type: 'text',
              text: 'Extract the recipe from this image. Read all visible text carefully, including any handwritten notes. The recipe may be in Hebrew or English.',
            },
          ],
        },
      ],
      temperature: opts.temperature,
    });

    // Log token usage with cost
    console.log('[DEBUG] Raw usage object:', JSON.stringify(usage, null, 2));
    logTokenUsage('Image Recipe Extraction', usage);

    // Build the final recipe object
    const recipe: Recipe = {
      title: object.title,
      description: object.description,
      language: object.language,
      sourceUrl: `image-upload:${Date.now()}`, // Placeholder, will be set by API route
      imageUrl: null, // Could potentially store the uploaded image
      author: null,
      datePublished: null,
      ingredients: object.ingredients,
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
      nutrition: null,
      extractionMethod: 'image',
      confidence: 0.7, // Image extraction typically has lower confidence than structured data
      kashrut: object.kashrut,
    };

    return recipe;
  } catch (error) {
    console.error('Image parsing error:', error);
    throw new Error(`Failed to parse recipe from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

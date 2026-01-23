import { z } from 'zod';

// Standard unit codes for normalization
export const UnitCode = z.enum([
  // Volume
  'cup', 'tbsp', 'tsp', 'ml', 'l', 'fl_oz',
  // Weight
  'g', 'kg', 'oz', 'lb',
  // Count
  'piece', 'slice', 'clove', 'bunch', 'package', 'can', 'jar', 'bag',
  // Other
  'pinch', 'dash', 'to_taste', 'as_needed', 'unknown'
]);

export type UnitCode = z.infer<typeof UnitCode>;

// Hebrew to English unit mapping
export const HEBREW_UNIT_MAP: Record<string, UnitCode> = {
  // Cups
  'כוס': 'cup',
  'כוסות': 'cup',
  // Tablespoons
  'כף': 'tbsp',
  'כפות': 'tbsp',
  'כף גדושה': 'tbsp',
  // Teaspoons
  'כפית': 'tsp',
  'כפיות': 'tsp',
  // Milliliters/Liters
  'מ"ל': 'ml',
  'מיליליטר': 'ml',
  'ליטר': 'l',
  'ל\'': 'l',
  // Weight
  'גרם': 'g',
  'ג\'': 'g',
  'ג"ר': 'g',
  'קילו': 'kg',
  'ק"ג': 'kg',
  'קילוגרם': 'kg',
  // Count
  'יחידה': 'piece',
  'יחידות': 'piece',
  'פרוסה': 'slice',
  'פרוסות': 'slice',
  'שן': 'clove',
  'שיני': 'clove',
  'שיניים': 'clove',
  'צרור': 'bunch',
  'אגודה': 'bunch',
  'חבילה': 'package',
  'שקית': 'bag',
  'שקיות': 'bag',
  'פחית': 'can',
  'קופסה': 'can',
  'צנצנת': 'jar',
  // Other
  'קורט': 'pinch',
  'קמצוץ': 'pinch',
  'מעט': 'dash',
  'לפי הטעם': 'to_taste',
  'לטעימה': 'to_taste',
  'כנדרש': 'as_needed',
  'לפי הצורך': 'as_needed',
};

// Hebrew fraction words to numbers
export const HEBREW_FRACTION_MAP: Record<string, number> = {
  'חצי': 0.5,
  'רבע': 0.25,
  'שליש': 0.333,
  'שני שליש': 0.667,
  'שלושת רבעי': 0.75,
  'שמינית': 0.125,
};

// Hebrew number words to numbers
export const HEBREW_NUMBER_MAP: Record<string, number> = {
  'אחד': 1,
  'אחת': 1,
  'שניים': 2,
  'שתיים': 2,
  'שלוש': 3,
  'שלושה': 3,
  'ארבע': 4,
  'ארבעה': 4,
  'חמש': 5,
  'חמישה': 5,
  'שש': 6,
  'שישה': 6,
  'שבע': 7,
  'שבעה': 7,
  'שמונה': 8,
  'תשע': 9,
  'תשעה': 9,
  'עשר': 10,
  'עשרה': 10,
};

// Ingredient schema
export const IngredientSchema = z.object({
  original: z.string().describe('Original ingredient text as it appears in the recipe'),
  item: z.string().describe('Cleaned ingredient name (e.g., "flour", "sugar", "קמח")'),
  quantity: z.number().nullable().describe('Numeric quantity (e.g., 2, 0.5). null if not specified'),
  unit: UnitCode.nullable().describe('Standardized unit code. null if not specified'),
  comments: z.string().nullable().describe('Additional notes like "room temperature", "finely chopped", "קצוץ דק"'),
});

export type Ingredient = z.infer<typeof IngredientSchema>;

// Recipe metadata schema
export const RecipeMetaSchema = z.object({
  prepTime: z.number().nullable().describe('Preparation time in minutes'),
  cookTime: z.number().nullable().describe('Cooking/baking time in minutes'),
  totalTime: z.number().nullable().describe('Total time in minutes'),
  servings: z.number().nullable().describe('Number of servings'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'unknown']).default('unknown'),
  cuisine: z.string().nullable().describe('Cuisine type (e.g., "Israeli", "Italian")'),
  category: z.string().nullable().describe('Recipe category (e.g., "dessert", "main course")'),
  dietary: z.array(z.string()).default([]).describe('Dietary tags (e.g., "vegan", "gluten-free", "kosher")'),
});

export type RecipeMeta = z.infer<typeof RecipeMetaSchema>;

// Nutrition schema (optional)
export const NutritionSchema = z.object({
  calories: z.number().nullable(),
  protein: z.number().nullable(),
  carbohydrates: z.number().nullable(),
  fat: z.number().nullable(),
  fiber: z.number().nullable(),
  sodium: z.number().nullable(),
}).nullable();

export type Nutrition = z.infer<typeof NutritionSchema>;

// Kashrut status
export const KashrutSchema = z.enum(['parve', 'dairy', 'meat', 'not_kosher', 'unknown']);
export type Kashrut = z.infer<typeof KashrutSchema>;

// Full Recipe schema
export const RecipeSchema = z.object({
  title: z.string().describe('Recipe title'),
  description: z.string().nullable().describe('Brief description or summary of the recipe'),
  language: z.enum(['he', 'en', 'mixed']).describe('Primary language of the recipe'),
  sourceUrl: z.string().url().describe('Original URL where the recipe was extracted from'),
  imageUrl: z.string().url().nullable().describe('Main recipe image URL'),
  author: z.string().nullable().describe('Recipe author or blog name'),
  datePublished: z.string().nullable().describe('Publication date if available'),
  ingredients: z.array(IngredientSchema).describe('List of ingredients with parsed details'),
  steps: z.array(z.string()).describe('Ordered list of preparation/cooking steps'),
  tips: z.array(z.string()).default([]).describe('Optional cooking tips or notes'),
  meta: RecipeMetaSchema,
  nutrition: NutritionSchema.optional(),
  extractionMethod: z.enum(['json-ld', 'llm', 'hybrid']).describe('How the recipe was extracted'),
  confidence: z.number().min(0).max(1).describe('Extraction confidence score (0-1)'),
  kashrut: KashrutSchema.optional().describe('Kashrut status: parve, dairy, meat, not_kosher, or unknown'),
  rawText: z.string().optional().describe('Raw text content used for extraction'),
});

export type Recipe = z.infer<typeof RecipeSchema>;

// Partial recipe for intermediate processing
export const PartialRecipeSchema = RecipeSchema.partial().extend({
  sourceUrl: z.string().url(),
});

export type PartialRecipe = z.infer<typeof PartialRecipeSchema>;

// Extraction result wrapper
export const ExtractionResultSchema = z.object({
  success: z.boolean(),
  recipe: RecipeSchema.nullable(),
  error: z.string().nullable(),
  warnings: z.array(z.string()).default([]),
  processingTimeMs: z.number(),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

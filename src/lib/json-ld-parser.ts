import * as cheerio from 'cheerio';
import {
  type Recipe,
  type Ingredient,
  type RecipeMeta,
  HEBREW_UNIT_MAP,
  HEBREW_FRACTION_MAP,
  HEBREW_NUMBER_MAP,
  type UnitCode
} from '../schemas/recipe';

interface SchemaRecipe {
  '@type': string | string[];
  name?: string;
  description?: string;
  image?: string | string[] | { url: string }[];
  author?: string | { name: string } | { name: string }[];
  datePublished?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  recipeYield?: string | number;
  recipeCategory?: string | string[];
  recipeCuisine?: string | string[];
  recipeIngredient?: string[];
  recipeInstructions?: string | string[] | { text: string }[] | { '@type': string; itemListElement?: { text: string }[] }[];
  nutrition?: {
    calories?: string;
    proteinContent?: string;
    carbohydrateContent?: string;
    fatContent?: string;
    fiberContent?: string;
    sodiumContent?: string;
  };
  keywords?: string | string[];
  suitableForDiet?: string | string[];
}

/**
 * Parse ISO 8601 duration to minutes
 * Examples: PT30M, PT1H30M, PT2H
 */
function parseDuration(duration: string | undefined): number | null {
  if (!duration) return null;

  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return null;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 60 + minutes + Math.round(seconds / 60);
}

/**
 * Detect if text is primarily Hebrew
 */
function isHebrew(text: string): boolean {
  const hebrewPattern = /[\u0590-\u05FF]/;
  const hebrewChars = (text.match(/[\u0590-\u05FF]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  return hebrewChars > latinChars;
}

/**
 * Parse Hebrew number words to numeric values
 */
function parseHebrewNumber(text: string): number | null {
  const trimmed = text.trim().toLowerCase();

  // Check for fraction words
  for (const [word, value] of Object.entries(HEBREW_FRACTION_MAP)) {
    if (trimmed.includes(word)) {
      return value;
    }
  }

  // Check for number words
  for (const [word, value] of Object.entries(HEBREW_NUMBER_MAP)) {
    if (trimmed === word) {
      return value;
    }
  }

  // Try parsing as number
  const num = parseFloat(trimmed);
  if (!isNaN(num)) return num;

  // Handle fractions like "1/2"
  const fractionMatch = trimmed.match(/(\d+)\s*\/\s*(\d+)/);
  if (fractionMatch) {
    return parseInt(fractionMatch[1], 10) / parseInt(fractionMatch[2], 10);
  }

  // Handle mixed fractions like "1 1/2"
  const mixedMatch = trimmed.match(/(\d+)\s+(\d+)\s*\/\s*(\d+)/);
  if (mixedMatch) {
    return parseInt(mixedMatch[1], 10) +
           parseInt(mixedMatch[2], 10) / parseInt(mixedMatch[3], 10);
  }

  return null;
}

/**
 * Parse Hebrew/English unit to standard code
 */
function parseUnit(text: string): UnitCode | null {
  const trimmed = text.trim().toLowerCase();

  // Check Hebrew units first
  for (const [hebrewUnit, code] of Object.entries(HEBREW_UNIT_MAP)) {
    if (trimmed.includes(hebrewUnit)) {
      return code;
    }
  }

  // English units
  const englishUnits: Record<string, UnitCode> = {
    'cup': 'cup',
    'cups': 'cup',
    'tablespoon': 'tbsp',
    'tablespoons': 'tbsp',
    'tbsp': 'tbsp',
    'teaspoon': 'tsp',
    'teaspoons': 'tsp',
    'tsp': 'tsp',
    'gram': 'g',
    'grams': 'g',
    'g': 'g',
    'kilogram': 'kg',
    'kilograms': 'kg',
    'kg': 'kg',
    'ml': 'ml',
    'milliliter': 'ml',
    'milliliters': 'ml',
    'liter': 'l',
    'liters': 'l',
    'l': 'l',
    'ounce': 'oz',
    'ounces': 'oz',
    'oz': 'oz',
    'pound': 'lb',
    'pounds': 'lb',
    'lb': 'lb',
    'lbs': 'lb',
    'piece': 'piece',
    'pieces': 'piece',
    'slice': 'slice',
    'slices': 'slice',
    'clove': 'clove',
    'cloves': 'clove',
    'bunch': 'bunch',
    'package': 'package',
    'can': 'can',
    'jar': 'jar',
    'bag': 'bag',
    'pinch': 'pinch',
    'dash': 'dash',
  };

  for (const [unit, code] of Object.entries(englishUnits)) {
    if (trimmed.includes(unit)) {
      return code;
    }
  }

  return null;
}

/**
 * Parse a single ingredient string into structured format
 */
export function parseIngredient(ingredientStr: string): Ingredient {
  const original = ingredientStr.trim();

  // Common patterns for ingredient parsing
  // Hebrew: "2 כוסות קמח" or "חצי כוס סוכר" or "קורט מלח"
  // English: "2 cups flour" or "1/2 cup sugar" or "pinch of salt"

  let quantity: number | null = null;
  let unit: UnitCode | null = null;
  let item = original;
  let comments: string | null = null;

  // Extract comments in parentheses
  const commentMatch = original.match(/\(([^)]+)\)/);
  if (commentMatch) {
    comments = commentMatch[1];
    item = original.replace(commentMatch[0], '').trim();
  }

  // Try to extract quantity - Hebrew fractions first
  for (const [word, value] of Object.entries(HEBREW_FRACTION_MAP)) {
    if (item.includes(word)) {
      quantity = value;
      item = item.replace(word, '').trim();
      break;
    }
  }

  // Then try numeric quantities
  if (quantity === null) {
    // Match numbers at the start, including fractions
    const numMatch = item.match(/^([\d\s/.]+)/);
    if (numMatch) {
      quantity = parseHebrewNumber(numMatch[1]);
      if (quantity !== null) {
        item = item.slice(numMatch[0].length).trim();
      }
    }
  }

  // Extract unit
  unit = parseUnit(item);
  if (unit) {
    // Remove the unit from the item
    for (const [unitWord] of Object.entries(HEBREW_UNIT_MAP)) {
      if (item.includes(unitWord)) {
        item = item.replace(unitWord, '').trim();
        break;
      }
    }
    // Also check English units
    const englishUnits = ['cup', 'cups', 'tablespoon', 'tablespoons', 'tbsp',
                          'teaspoon', 'teaspoons', 'tsp', 'gram', 'grams', 'g',
                          'kilogram', 'kilograms', 'kg', 'ml', 'milliliter',
                          'milliliters', 'liter', 'liters', 'l', 'ounce', 'ounces',
                          'oz', 'pound', 'pounds', 'lb', 'lbs', 'piece', 'pieces',
                          'slice', 'slices', 'clove', 'cloves', 'bunch', 'package',
                          'can', 'jar', 'bag', 'pinch', 'dash'];
    for (const unitWord of englishUnits) {
      const regex = new RegExp(`\\b${unitWord}s?\\b`, 'gi');
      item = item.replace(regex, '').trim();
    }
  }

  // Clean up the item name
  item = item
    .replace(/^(של|of)\s+/i, '')
    .replace(/^\s*[-–—]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    original,
    item: item || original,
    quantity,
    unit,
    comments,
  };
}

/**
 * Extract JSON-LD structured data from HTML
 */
function extractJsonLd(html: string): SchemaRecipe | null {
  const $ = cheerio.load(html);

  // Find all JSON-LD scripts
  const jsonLdScripts = $('script[type="application/ld+json"]');

  for (let i = 0; i < jsonLdScripts.length; i++) {
    try {
      const content = $(jsonLdScripts[i]).html();
      if (!content) continue;

      const data = JSON.parse(content);

      // Handle @graph structure
      if (data['@graph']) {
        for (const item of data['@graph']) {
          if (isRecipeType(item)) {
            return item as SchemaRecipe;
          }
        }
      }

      // Direct recipe object
      if (isRecipeType(data)) {
        return data as SchemaRecipe;
      }

      // Array of items
      if (Array.isArray(data)) {
        for (const item of data) {
          if (isRecipeType(item)) {
            return item as SchemaRecipe;
          }
        }
      }
    } catch {
      // Continue to next script
    }
  }

  return null;
}

function isRecipeType(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  const item = obj as Record<string, unknown>;
  const type = item['@type'];
  if (typeof type === 'string') {
    return type.toLowerCase() === 'recipe';
  }
  if (Array.isArray(type)) {
    return type.some(t => typeof t === 'string' && t.toLowerCase() === 'recipe');
  }
  return false;
}

/**
 * Extract image URL from various formats
 */
function extractImage(image: SchemaRecipe['image']): string | null {
  if (!image) return null;
  if (typeof image === 'string') return image;
  if (Array.isArray(image)) {
    const first = image[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && 'url' in first) return first.url;
  }
  return null;
}

/**
 * Extract author name from various formats
 */
function extractAuthor(author: SchemaRecipe['author']): string | null {
  if (!author) return null;
  if (typeof author === 'string') return author;
  if (typeof author === 'object' && 'name' in author) return author.name;
  if (Array.isArray(author)) {
    const first = author[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && 'name' in first) return first.name;
  }
  return null;
}

/**
 * Extract instructions from various formats
 */
function extractInstructions(instructions: SchemaRecipe['recipeInstructions']): string[] {
  if (!instructions) return [];

  if (typeof instructions === 'string') {
    // Split by newlines or numbered steps
    return instructions
      .split(/\n|(?=\d+\.\s)/)
      .map(s => s.replace(/^\d+\.\s*/, '').trim())
      .filter(s => s.length > 0);
  }

  if (Array.isArray(instructions)) {
    const steps: string[] = [];

    for (const item of instructions) {
      if (typeof item === 'string') {
        steps.push(item.trim());
      } else if (typeof item === 'object' && item !== null) {
        if ('text' in item && typeof item.text === 'string') {
          steps.push(item.text.trim());
        } else if ('itemListElement' in item && Array.isArray(item.itemListElement)) {
          for (const subItem of item.itemListElement) {
            if (typeof subItem === 'object' && subItem !== null && 'text' in subItem) {
              steps.push((subItem.text as string).trim());
            }
          }
        }
      }
    }

    return steps.filter(s => s.length > 0);
  }

  return [];
}

/**
 * Parse number from nutrition string (e.g., "250 calories" -> 250)
 */
function parseNutritionValue(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Parse servings from various formats
 * recipeYield can be: string, number, array of strings, or undefined
 */
function parseServings(yield_: unknown): number | null {
  if (!yield_) return null;
  if (typeof yield_ === 'number') return yield_;

  // Handle arrays - take the first element
  if (Array.isArray(yield_)) {
    for (const item of yield_) {
      const parsed = parseServings(item);
      if (parsed !== null) return parsed;
    }
    return null;
  }

  // Handle strings
  if (typeof yield_ === 'string') {
    const match = yield_.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  }

  return null;
}

/**
 * Main function to parse recipe from HTML using JSON-LD
 */
export function parseRecipeFromHtml(html: string, sourceUrl: string): Partial<Recipe> | null {
  const jsonLd = extractJsonLd(html);

  if (!jsonLd) {
    return null;
  }

  const title = jsonLd.name || '';
  const language = isHebrew(title) ? 'he' : 'en';

  // Parse ingredients
  const ingredients: Ingredient[] = (jsonLd.recipeIngredient || [])
    .map(ing => parseIngredient(ing));

  // Parse instructions
  const steps = extractInstructions(jsonLd.recipeInstructions);

  // Parse metadata
  const meta: RecipeMeta = {
    prepTime: parseDuration(jsonLd.prepTime),
    cookTime: parseDuration(jsonLd.cookTime),
    totalTime: parseDuration(jsonLd.totalTime),
    servings: parseServings(jsonLd.recipeYield),
    difficulty: 'unknown',
    cuisine: Array.isArray(jsonLd.recipeCuisine)
      ? jsonLd.recipeCuisine[0]
      : jsonLd.recipeCuisine || null,
    category: Array.isArray(jsonLd.recipeCategory)
      ? jsonLd.recipeCategory[0]
      : jsonLd.recipeCategory || null,
    dietary: jsonLd.suitableForDiet
      ? (Array.isArray(jsonLd.suitableForDiet)
        ? jsonLd.suitableForDiet
        : [jsonLd.suitableForDiet])
      : [],
  };

  // Parse nutrition if available
  const nutrition = jsonLd.nutrition ? {
    calories: parseNutritionValue(jsonLd.nutrition.calories),
    protein: parseNutritionValue(jsonLd.nutrition.proteinContent),
    carbohydrates: parseNutritionValue(jsonLd.nutrition.carbohydrateContent),
    fat: parseNutritionValue(jsonLd.nutrition.fatContent),
    fiber: parseNutritionValue(jsonLd.nutrition.fiberContent),
    sodium: parseNutritionValue(jsonLd.nutrition.sodiumContent),
  } : null;

  return {
    title,
    description: jsonLd.description || null,
    language,
    sourceUrl,
    imageUrl: extractImage(jsonLd.image),
    author: extractAuthor(jsonLd.author),
    datePublished: jsonLd.datePublished || null,
    ingredients,
    steps,
    tips: [],
    meta,
    nutrition,
    extractionMethod: 'json-ld',
    confidence: 0.9, // High confidence for structured data
  };
}

/**
 * Validate if parsed recipe has minimum required fields
 */
export function isValidRecipe(recipe: Partial<Recipe> | null): boolean {
  if (!recipe) return false;

  return !!(
    recipe.title &&
    recipe.ingredients &&
    recipe.ingredients.length > 0 &&
    recipe.steps &&
    recipe.steps.length > 0
  );
}

/**
 * Test script for Hebrew Recipe Extractor
 * Tests against known Hebrew recipe sites
 */

import { config } from 'dotenv';
import { extractRecipe } from './services/extractor';
import { parseIngredient } from './lib/json-ld-parser';

// Load environment variables from .env.local and .env
config({ path: '.env.local' });
config({ path: '.env' });

// Test URLs - mix of Hebrew and English sites
const TEST_URLS = [
  // Hebrew sites
  'https://www.nikib.co.il/2023/08/cheese-cake/', // Niki B - popular Israeli food blog
  // English sites with structured data (for testing JSON-LD)
  'https://www.allrecipes.com/recipe/10813/best-chocolate-chip-cookies/',
];

async function testIngredientParsing() {
  console.log('Testing Ingredient Parsing');
  console.log('==========================\n');

  const testCases = [
    // Hebrew ingredients
    '2 כוסות קמח',
    'חצי כוס סוכר',
    'כף שמן זית',
    '3 כפיות מלח',
    '500 גרם בשר טחון',
    'קורט מלח',
    '1/2 כוס חלב (חם)',
    '2 שיני שום קצוצות דק',

    // English ingredients
    '2 cups all-purpose flour',
    '1/2 cup butter, softened',
    '3 tablespoons olive oil',
    '1 tsp vanilla extract',
    '500g ground beef',
    'pinch of salt',
    '2 cloves garlic, minced',
  ];

  for (const ingredient of testCases) {
    const parsed = parseIngredient(ingredient);
    console.log(`Input: "${ingredient}"`);
    console.log(`  Item: ${parsed.item}`);
    console.log(`  Quantity: ${parsed.quantity}`);
    console.log(`  Unit: ${parsed.unit}`);
    console.log(`  Comments: ${parsed.comments}`);
    console.log('');
  }
}

async function testUrlExtraction() {
  console.log('\nTesting URL Extraction');
  console.log('======================\n');

  for (const url of TEST_URLS) {
    console.log(`\n📖 Testing: ${url}`);
    console.log('-'.repeat(60));

    try {
      const result = await extractRecipe(url, { verbose: true });

      if (result.success && result.recipe) {
        console.log('\n✅ Extraction Successful!');
        console.log(`   Title: ${result.recipe.title}`);
        console.log(`   Language: ${result.recipe.language}`);
        console.log(`   Method: ${result.recipe.extractionMethod}`);
        console.log(`   Confidence: ${(result.recipe.confidence * 100).toFixed(0)}%`);
        console.log(`   Ingredients: ${result.recipe.ingredients.length}`);
        console.log(`   Steps: ${result.recipe.steps.length}`);
        console.log(`   Time: ${result.processingTimeMs}ms`);

        // Show first few ingredients
        console.log('\n   First 3 ingredients:');
        result.recipe.ingredients.slice(0, 3).forEach((ing, i) => {
          console.log(`     ${i + 1}. ${ing.original}`);
          console.log(`        → ${ing.quantity || '?'} ${ing.unit || ''} ${ing.item}`);
        });

        // Show first step
        if (result.recipe.steps.length > 0) {
          console.log('\n   First step:');
          console.log(`     ${result.recipe.steps[0].slice(0, 100)}...`);
        }
      } else {
        console.log(`\n❌ Extraction Failed: ${result.error}`);
        if (result.warnings.length > 0) {
          console.log(`   Warnings: ${result.warnings.join(', ')}`);
        }
      }
    } catch (error) {
      console.log(`\n❌ Error: ${error instanceof Error ? error.message : error}`);
    }
  }
}

async function main() {
  console.log('Hebrew Recipe Extractor - Test Suite');
  console.log('=====================================\n');

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('⚠️  Warning: ANTHROPIC_API_KEY not set. LLM extraction will be disabled.\n');
  }

  // Run tests
  await testIngredientParsing();
  await testUrlExtraction();

  console.log('\n\nTest suite completed!');
}

main().catch(console.error);

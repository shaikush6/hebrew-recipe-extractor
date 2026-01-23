#!/usr/bin/env node

import { Command } from 'commander';
import { config } from 'dotenv';
import { extractRecipe, RecipeExtractor } from './services/extractor';
import { type Recipe } from './schemas/recipe';

// Load environment variables from .env and .env.local
config({ path: '.env.local' });
config({ path: '.env' });

const program = new Command();

program
  .name('recipe-extract')
  .description('Extract and normalize recipes from any URL (Hebrew & English)')
  .version('1.0.0');

program
  .argument('<url>', 'URL of the recipe to extract')
  .option('-o, --output <file>', 'Output file path (defaults to stdout)')
  .option('-p, --pretty', 'Pretty print JSON output', true)
  .option('-v, --verbose', 'Verbose output', false)
  .option('--no-llm', 'Disable LLM extraction (use JSON-LD only)')
  .option('-t, --timeout <ms>', 'Fetch timeout in milliseconds', '30000')
  .action(async (url: string, options: {
    output?: string;
    pretty?: boolean;
    verbose?: boolean;
    llm?: boolean;
    timeout?: string;
  }) => {
    const verbose = options.verbose || false;

    if (verbose) {
      console.log('Hebrew Recipe Extractor v1.0.0');
      console.log('==============================');
      console.log(`URL: ${url}`);
      console.log(`LLM Enabled: ${options.llm !== false}`);
      console.log(`Timeout: ${options.timeout}ms`);
      console.log('');
    }

    try {
      const result = await extractRecipe(url, {
        useLlm: options.llm !== false,
        timeout: parseInt(options.timeout || '30000', 10),
        verbose,
      });

      if (!result.success || !result.recipe) {
        console.error(`Error: ${result.error}`);
        if (result.warnings.length > 0) {
          console.error('Warnings:', result.warnings);
        }
        process.exit(1);
      }

      // Format output
      const output = options.pretty
        ? JSON.stringify(result.recipe, null, 2)
        : JSON.stringify(result.recipe);

      if (options.output) {
        const fs = await import('fs');
        fs.writeFileSync(options.output, output, 'utf-8');
        console.log(`Recipe saved to: ${options.output}`);
      } else {
        console.log(output);
      }

      if (verbose) {
        console.log('');
        console.log('==============================');
        console.log(`Extraction Method: ${result.recipe.extractionMethod}`);
        console.log(`Confidence: ${(result.recipe.confidence * 100).toFixed(0)}%`);
        console.log(`Processing Time: ${result.processingTimeMs}ms`);
        console.log(`Ingredients: ${result.recipe.ingredients.length}`);
        console.log(`Steps: ${result.recipe.steps.length}`);
        if (result.warnings.length > 0) {
          console.log(`Warnings: ${result.warnings.join(', ')}`);
        }
      }
    } catch (error) {
      console.error('Fatal error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// Add a batch extraction command
program
  .command('batch')
  .description('Extract recipes from multiple URLs')
  .argument('<urls...>', 'URLs of recipes to extract')
  .option('-o, --output-dir <dir>', 'Output directory for JSON files', './recipes')
  .option('-v, --verbose', 'Verbose output', false)
  .option('--no-llm', 'Disable LLM extraction')
  .action(async (urls: string[], options: {
    outputDir: string;
    verbose: boolean;
    llm?: boolean;
  }) => {
    const fs = await import('fs');
    const path = await import('path');

    // Create output directory
    if (!fs.existsSync(options.outputDir)) {
      fs.mkdirSync(options.outputDir, { recursive: true });
    }

    const extractor = new RecipeExtractor({
      useLlm: options.llm !== false,
      verbose: options.verbose,
    });

    try {
      await extractor.init();

      let successCount = 0;
      let failCount = 0;

      for (const url of urls) {
        console.log(`Processing: ${url}`);

        try {
          const result = await extractor.extract(url);

          if (result.success && result.recipe) {
            const filename = sanitizeFilename(result.recipe.title) + '.json';
            const filepath = path.join(options.outputDir, filename);

            fs.writeFileSync(filepath, JSON.stringify(result.recipe, null, 2), 'utf-8');
            console.log(`  ✓ Saved: ${filename}`);
            successCount++;
          } else {
            console.log(`  ✗ Failed: ${result.error}`);
            failCount++;
          }
        } catch (error) {
          console.log(`  ✗ Error: ${error instanceof Error ? error.message : error}`);
          failCount++;
        }
      }

      console.log('');
      console.log(`Done! ${successCount} succeeded, ${failCount} failed`);
    } finally {
      await extractor.close();
    }
  });

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\u0590-\u05FF\s-]/g, '') // Keep Hebrew, alphanumeric, space, dash
    .replace(/\s+/g, '-')
    .slice(0, 100);
}

program.parse();

import { UrlFetcher, type FetchResult } from './url-fetcher';
import { parseRecipeFromHtml, isValidRecipe } from '../lib/json-ld-parser';
import { parseWithLLM, refineRecipe, hasApiKey } from './llm-parser';
import { type Recipe, type ExtractionResult } from '../schemas/recipe';

export interface ExtractorOptions {
  useLlm?: boolean;
  forceRefresh?: boolean;
  timeout?: number;
  verbose?: boolean;
}

const DEFAULT_OPTIONS: ExtractorOptions = {
  useLlm: true,
  forceRefresh: false,
  timeout: 30000,
  verbose: false,
};

/**
 * Main Recipe Extractor
 * Orchestrates the extraction pipeline:
 * 1. Fetch URL content
 * 2. Try JSON-LD structured data extraction
 * 3. If incomplete, use LLM for refinement
 */
export class RecipeExtractor {
  private fetcher: UrlFetcher;
  private options: ExtractorOptions;

  constructor(options: ExtractorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.fetcher = new UrlFetcher();
  }

  /**
   * Initialize the extractor
   */
  async init(): Promise<void> {
    await this.fetcher.init();
  }

  /**
   * Close resources
   */
  async close(): Promise<void> {
    await this.fetcher.close();
  }

  /**
   * Extract recipe from URL
   */
  async extract(url: string): Promise<ExtractionResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      // Validate URL
      new URL(url);
    } catch {
      return {
        success: false,
        recipe: null,
        error: 'Invalid URL provided',
        warnings: [],
        processingTimeMs: Date.now() - startTime,
      };
    }

    this.log(`Fetching: ${url}`);

    let fetchResult: FetchResult;
    try {
      fetchResult = await this.fetcher.smartFetch(url, {
        timeout: this.options.timeout,
      });
      this.log(`Fetched in ${fetchResult.fetchTimeMs}ms (${fetchResult.cleanedText.length} chars)`);
    } catch (error) {
      return {
        success: false,
        recipe: null,
        error: `Failed to fetch URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
        warnings: [],
        processingTimeMs: Date.now() - startTime,
      };
    }

    // Step 1: Try JSON-LD extraction (fast & free)
    this.log('Attempting JSON-LD extraction...');
    const jsonLdRecipe = parseRecipeFromHtml(fetchResult.html, url);

    if (isValidRecipe(jsonLdRecipe)) {
      this.log('Found valid JSON-LD recipe data');

      // Check if we should refine with LLM
      if (this.options.useLlm && hasApiKey()) {
        this.log('Refining with LLM...');
        try {
          const refinedRecipe = await refineRecipe(
            jsonLdRecipe!,
            fetchResult.cleanedText,
            url
          );

          return {
            success: true,
            recipe: refinedRecipe,
            error: null,
            warnings,
            processingTimeMs: Date.now() - startTime,
          };
        } catch (error) {
          warnings.push(`LLM refinement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          this.log('LLM refinement failed, using JSON-LD data only');
        }
      }

      // Return JSON-LD data without LLM refinement
      const recipe: Recipe = {
        title: jsonLdRecipe!.title || 'Untitled Recipe',
        description: jsonLdRecipe!.description || null,
        language: jsonLdRecipe!.language || 'en',
        sourceUrl: url,
        imageUrl: jsonLdRecipe!.imageUrl || null,
        author: jsonLdRecipe!.author || null,
        datePublished: jsonLdRecipe!.datePublished || null,
        ingredients: jsonLdRecipe!.ingredients || [],
        steps: jsonLdRecipe!.steps || [],
        tips: jsonLdRecipe!.tips || [],
        meta: jsonLdRecipe!.meta || {
          prepTime: null,
          cookTime: null,
          totalTime: null,
          servings: null,
          difficulty: 'unknown',
          cuisine: null,
          category: null,
          dietary: [],
        },
        nutrition: jsonLdRecipe!.nutrition || null,
        extractionMethod: 'json-ld',
        confidence: 0.9,
      };

      return {
        success: true,
        recipe,
        error: null,
        warnings,
        processingTimeMs: Date.now() - startTime,
      };
    }

    this.log('No valid JSON-LD data found');

    // Step 2: Fallback to LLM extraction
    if (!this.options.useLlm) {
      return {
        success: false,
        recipe: null,
        error: 'No structured data found and LLM extraction is disabled',
        warnings,
        processingTimeMs: Date.now() - startTime,
      };
    }

    if (!hasApiKey()) {
      return {
        success: false,
        recipe: null,
        error: 'No structured data found and ANTHROPIC_API_KEY is not set',
        warnings,
        processingTimeMs: Date.now() - startTime,
      };
    }

    this.log('Using LLM for full extraction...');

    try {
      const recipe = await parseWithLLM(
        fetchResult.cleanedText,
        url,
        jsonLdRecipe || undefined
      );

      // Try to get image URL from HTML if not in LLM result
      if (!recipe.imageUrl) {
        recipe.imageUrl = this.extractImageFromHtml(fetchResult.html);
      }

      return {
        success: true,
        recipe,
        error: null,
        warnings,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        recipe: null,
        error: `LLM extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        warnings,
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Extract main image from HTML
   */
  private extractImageFromHtml(html: string): string | null {
    // Try common image patterns
    const patterns = [
      /<meta\s+property="og:image"\s+content="([^"]+)"/i,
      /<meta\s+name="twitter:image"\s+content="([^"]+)"/i,
      /<img[^>]+class="[^"]*recipe[^"]*"[^>]+src="([^"]+)"/i,
      /<img[^>]+itemprop="image"[^>]+src="([^"]+)"/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Log message if verbose mode is enabled
   */
  private log(message: string): void {
    if (this.options.verbose) {
      console.log(`[Extractor] ${message}`);
    }
  }
}

/**
 * Quick extraction function for single use
 */
export async function extractRecipe(
  url: string,
  options: ExtractorOptions = {}
): Promise<ExtractionResult> {
  const extractor = new RecipeExtractor(options);

  try {
    await extractor.init();
    return await extractor.extract(url);
  } finally {
    await extractor.close();
  }
}

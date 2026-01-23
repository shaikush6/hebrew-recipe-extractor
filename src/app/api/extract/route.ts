import { NextRequest, NextResponse } from 'next/server';
import { extractRecipe } from '@/services/extractor';
import { getUser } from '@/lib/supabase/server';
import { saveRecipe, getRecipeByUrl } from '@/lib/supabase/db';
import type { Recipe } from '@/types/recipe';

export const maxDuration = 60; // Allow up to 60 seconds for extraction
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, forceRefresh = false } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Check if user is authenticated (for caching and saving)
    const user = await getUser();
    const isAuthenticated = !!user;

    // Check cache first (only for authenticated users, unless force refresh)
    if (isAuthenticated && !forceRefresh) {
      try {
        const cached = await getRecipeByUrl(user.id, url);
        if (cached) {
          console.log(`[API] Returning cached recipe for: ${url}`);
          return NextResponse.json({
            success: true,
            recipe: cached, // includes id from database
            warnings: [],
            processingTimeMs: 0,
            fromCache: true,
            saved: true,
          });
        }
      } catch (cacheError) {
        console.error('[API] Cache lookup failed:', cacheError);
        // Continue with extraction
      }
    }

    console.log(`[API] Extracting recipe from: ${url}`);

    const result = await extractRecipe(url, {
      useLlm: true,
      timeout: 45000,
      verbose: true,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, warnings: result.warnings },
        { status: 422 }
      );
    }

    // If user is authenticated, save to Supabase
    let savedRecipe = result.recipe as Recipe | null;
    let wasSaved = false;

    if (isAuthenticated && result.recipe) {
      try {
        // Cast to Recipe type (structurally compatible)
        savedRecipe = await saveRecipe(user.id, result.recipe as Recipe);
        wasSaved = true;
        console.log(`[API] Saved recipe to Supabase: ${result.recipe.title} (id: ${savedRecipe?.id})`);
      } catch (dbError) {
        console.error('[API] Failed to save recipe to Supabase:', dbError);
        // Don't fail the request, just log the error
        // Guest mode: return recipe without saving
      }
    } else {
      console.log(`[API] Guest mode: recipe not saved to database`);
    }

    return NextResponse.json({
      success: true,
      recipe: savedRecipe,
      warnings: result.warnings,
      processingTimeMs: result.processingTimeMs,
      fromCache: false,
      saved: wasSaved,
    });
  } catch (error) {
    console.error('[API] Extraction error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

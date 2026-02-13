import { NextRequest, NextResponse } from 'next/server';
import { parseImageWithLLM } from '@/services/image-parser';
import { getUser } from '@/lib/supabase/server';
import { saveRecipe } from '@/lib/supabase/db';
import type { Recipe } from '@/types/recipe';

export const maxDuration = 60; // Allow up to 60 seconds for extraction
export const dynamic = 'force-dynamic';

// Maximum file size: 10MB (Claude's limit is 20MB but we'll be conservative)
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Image file is required' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Image file is too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Supported formats: JPEG, PNG, GIF, WebP' },
        { status: 400 }
      );
    }

    console.log(`[API] Extracting recipe from image: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)}KB)`);

    // Convert to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    // Extract recipe using vision
    const recipe = await parseImageWithLLM(base64, file.type);

    // Set unique source URL for image uploads
    recipe.sourceUrl = `image-upload:${Date.now()}`;

    // Check if user is authenticated
    const user = await getUser();
    const isAuthenticated = !!user;

    // If user is authenticated, save to Supabase
    let savedRecipe: Recipe = recipe;
    let wasSaved = false;

    if (isAuthenticated) {
      try {
        savedRecipe = await saveRecipe(user.id, recipe);
        wasSaved = true;
        console.log(`[API] Saved image recipe to Supabase: ${recipe.title} (id: ${savedRecipe.id})`);
      } catch (dbError) {
        console.error('[API] Failed to save image recipe to Supabase:', dbError);
        // Don't fail the request, just log the error
      }
    } else {
      console.log(`[API] Guest mode: image recipe not saved to database`);
    }

    const processingTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      recipe: savedRecipe,
      warnings: [],
      processingTimeMs,
      fromCache: false,
      saved: wasSaved,
    });
  } catch (error) {
    console.error('[API] Image extraction error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract recipe from image',
      },
      { status: 500 }
    );
  }
}

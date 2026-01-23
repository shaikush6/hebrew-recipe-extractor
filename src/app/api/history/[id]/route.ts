import { NextRequest, NextResponse } from 'next/server';
import { getRecipeById, deleteRecipe } from '@/lib/supabase/db';

/**
 * GET /api/history/[id]
 * Get a specific recipe by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recipe = await getRecipeById(params.id);

    if (!recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error('Get recipe error:', error);
    return NextResponse.json(
      { error: 'Failed to get recipe' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/history/[id]
 * Delete a recipe by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteRecipe(params.id);

    return NextResponse.json({ success: true, id: params.id });
  } catch (error) {
    console.error('Delete recipe error:', error);
    return NextResponse.json(
      { error: 'Failed to delete recipe' },
      { status: 500 }
    );
  }
}

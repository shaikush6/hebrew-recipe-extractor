import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { getRecentRecipes, searchRecipes, getDbStats } from '@/lib/supabase/db';

/**
 * GET /api/history
 * Get recent recipes or search by query
 * Requires authentication - returns 401 if not logged in
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', recipes: [], count: 0 },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const statsOnly = searchParams.get('stats') === 'true';

    // Return stats only
    if (statsOnly) {
      const stats = await getDbStats(user.id);
      return NextResponse.json(stats);
    }

    // Search or get recent
    const recipes = query
      ? await searchRecipes(user.id, query, limit)
      : await getRecentRecipes(user.id, limit, offset);

    return NextResponse.json({
      recipes,
      count: recipes.length,
      offset,
      limit,
    });
  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipe history' },
      { status: 500 }
    );
  }
}

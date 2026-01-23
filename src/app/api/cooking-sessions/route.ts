import { NextRequest, NextResponse } from 'next/server';
import {
  createCookingSession,
  getActiveSessionForRecipe,
  getRecentActiveSessions,
  getCookingSession,
  type CookingSession,
} from '@/lib/cooking-session-db';

/**
 * GET /api/cooking-sessions
 * List recent active sessions or get session for a specific recipe
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recipeId = searchParams.get('recipeId');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (recipeId) {
      // Get active session for a specific recipe
      const session = getActiveSessionForRecipe(recipeId);
      return NextResponse.json({ session });
    }

    // Get recent active sessions across all recipes
    const sessions = getRecentActiveSessions(limit);
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching cooking sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cooking sessions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cooking-sessions
 * Create a new session or resume existing one
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipeId, action } = body as { recipeId: string; action: 'start' | 'resume' };

    if (!recipeId) {
      return NextResponse.json(
        { error: 'recipeId is required' },
        { status: 400 }
      );
    }

    let session: CookingSession | null = null;

    if (action === 'resume') {
      // Try to find and return existing active session
      session = getActiveSessionForRecipe(recipeId);
      if (session) {
        return NextResponse.json({ session, resumed: true });
      }
    }

    // Create new session
    session = createCookingSession(recipeId);
    return NextResponse.json({ session, resumed: false }, { status: 201 });
  } catch (error) {
    console.error('Error creating cooking session:', error);
    return NextResponse.json(
      { error: 'Failed to create cooking session' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import {
  getCookingSession,
  updateCookingSession,
  completeCookingSession,
  abandonCookingSession,
  deleteCookingSession,
  getNotesMapForSession,
  type SessionUpdate,
} from '@/lib/cooking-session-db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/cooking-sessions/[id]
 * Get a session by ID with its notes
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const session = getCookingSession(id);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Include notes map for convenience
    const notes = getNotesMapForSession(id);

    return NextResponse.json({ session, notes });
  } catch (error) {
    console.error('Error fetching cooking session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cooking session' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cooking-sessions/[id]
 * Update session progress
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const body = await request.json();
    const { action, ...updates } = body as { action?: 'complete' | 'abandon' } & SessionUpdate;

    // Handle special actions
    if (action === 'complete') {
      const session = completeCookingSession(id);
      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ session });
    }

    if (action === 'abandon') {
      const session = abandonCookingSession(id);
      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ session });
    }

    // Regular progress update
    const session = updateCookingSession(id, updates);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error updating cooking session:', error);
    return NextResponse.json(
      { error: 'Failed to update cooking session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cooking-sessions/[id]
 * Delete a session and all its notes
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const deleted = deleteCookingSession(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cooking session:', error);
    return NextResponse.json(
      { error: 'Failed to delete cooking session' },
      { status: 500 }
    );
  }
}

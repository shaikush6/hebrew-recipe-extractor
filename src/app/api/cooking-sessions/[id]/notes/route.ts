import { NextRequest, NextResponse } from 'next/server';
import {
  getNotesForSession,
  saveNote,
  deleteNoteByStep,
  getCookingSession,
} from '@/lib/cooking-session-db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/cooking-sessions/[id]/notes
 * Get all notes for a session
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Verify session exists
    const session = getCookingSession(id);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const notes = getNotesForSession(id);
    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cooking-sessions/[id]/notes
 * Save or update a note for a micro-step
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const body = await request.json();
    const { microStepId, noteText } = body as { microStepId: string; noteText: string };

    if (!microStepId) {
      return NextResponse.json(
        { error: 'microStepId is required' },
        { status: 400 }
      );
    }

    // Verify session exists
    const session = getCookingSession(id);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // If noteText is empty, delete the note
    if (!noteText || noteText.trim() === '') {
      deleteNoteByStep(id, microStepId);
      return NextResponse.json({ deleted: true });
    }

    const note = saveNote(id, microStepId, noteText.trim());
    return NextResponse.json({ note });
  } catch (error) {
    console.error('Error saving note:', error);
    return NextResponse.json(
      { error: 'Failed to save note' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cooking-sessions/[id]/notes
 * Delete a note by micro-step ID
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const microStepId = searchParams.get('microStepId');

    if (!microStepId) {
      return NextResponse.json(
        { error: 'microStepId query parameter is required' },
        { status: 400 }
      );
    }

    const deleted = deleteNoteByStep(id, microStepId);
    return NextResponse.json({ deleted });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}

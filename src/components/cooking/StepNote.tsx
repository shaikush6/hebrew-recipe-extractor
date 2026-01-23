'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { MessageSquarePlus, Pencil, Trash2, Check, X } from 'lucide-react';

interface StepNoteProps {
  microStepId: string;
  existingNote: string | null;
  onSave: (noteText: string) => void;
  onDelete: () => void;
  isHebrew?: boolean;
  className?: string;
}

export function StepNote({
  microStepId,
  existingNote,
  onSave,
  onDelete,
  isHebrew = true,
  className,
}: StepNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState(existingNote || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update local state when existingNote changes
  useEffect(() => {
    if (!isEditing) {
      setNoteText(existingNote || '');
    }
  }, [existingNote, isEditing]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [isEditing]);

  const handleStartEditing = useCallback(() => {
    setNoteText(existingNote || '');
    setIsEditing(true);
  }, [existingNote]);

  const handleSave = useCallback(() => {
    const trimmed = noteText.trim();
    if (trimmed) {
      onSave(trimmed);
    } else if (existingNote) {
      // If user clears the note, delete it
      onDelete();
    }
    setIsEditing(false);
  }, [noteText, existingNote, onSave, onDelete]);

  const handleCancel = useCallback(() => {
    setNoteText(existingNote || '');
    setIsEditing(false);
  }, [existingNote]);

  const handleDelete = useCallback(() => {
    onDelete();
    setIsEditing(false);
    setNoteText('');
  }, [onDelete]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleSave();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  // No note and not editing - show "Add note" button
  if (!existingNote && !isEditing) {
    return (
      <div className={clsx('mt-4', className)}>
        <button
          onClick={handleStartEditing}
          className={clsx(
            'inline-flex items-center gap-2 px-4 py-2 rounded-xl',
            'text-charcoal/60 hover:text-charcoal',
            'bg-cream/50 hover:bg-cream border border-charcoal/10',
            'transition-all duration-200',
            isHebrew && 'flex-row-reverse'
          )}
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span className="text-sm font-medium">
            {isHebrew ? 'הוסף הערה' : 'Add note'}
          </span>
        </button>
      </div>
    );
  }

  // Editing mode
  if (isEditing) {
    return (
      <div className={clsx('mt-4 space-y-3', className)}>
        <textarea
          ref={textareaRef}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isHebrew ? 'כתוב הערה...' : 'Write a note...'}
          className={clsx(
            'w-full min-h-[100px] p-4 rounded-xl resize-none',
            'text-sm text-charcoal',
            'bg-white border-2 border-honey-300',
            'focus:outline-none focus:border-honey-500 focus:ring-2 focus:ring-honey-200',
            'placeholder:text-charcoal/40',
            isHebrew && 'text-right'
          )}
          dir={isHebrew ? 'rtl' : 'ltr'}
        />
        <div
          className={clsx(
            'flex items-center gap-2',
            isHebrew ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          <button
            onClick={handleSave}
            className={clsx(
              'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl',
              'bg-olive-500 text-white font-medium text-sm',
              'hover:bg-olive-600 transition-colors',
              isHebrew && 'flex-row-reverse'
            )}
          >
            <Check className="h-4 w-4" />
            <span>{isHebrew ? 'שמור' : 'Save'}</span>
          </button>
          <button
            onClick={handleCancel}
            className={clsx(
              'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl',
              'text-charcoal/70 font-medium text-sm',
              'hover:bg-charcoal/5 transition-colors',
              isHebrew && 'flex-row-reverse'
            )}
          >
            <X className="h-4 w-4" />
            <span>{isHebrew ? 'ביטול' : 'Cancel'}</span>
          </button>
          {existingNote && (
            <button
              onClick={handleDelete}
              className={clsx(
                'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl',
                'text-red-600 font-medium text-sm',
                'hover:bg-red-50 transition-colors',
                isHebrew && 'flex-row-reverse'
              )}
            >
              <Trash2 className="h-4 w-4" />
              <span>{isHebrew ? 'מחק' : 'Delete'}</span>
            </button>
          )}
        </div>
        <p className={clsx(
          'text-xs text-charcoal/50',
          isHebrew ? 'text-right' : 'text-left'
        )}>
          {isHebrew
            ? 'Cmd/Ctrl+Enter לשמירה, Esc לביטול'
            : 'Cmd/Ctrl+Enter to save, Esc to cancel'}
        </p>
      </div>
    );
  }

  // Display mode - has note
  return (
    <div
      className={clsx(
        'mt-4 p-4 rounded-xl',
        'bg-honey-50 border-2 border-honey-200',
        className
      )}
    >
      <div
        className={clsx(
          'flex items-start gap-2 mb-2',
          isHebrew ? 'flex-row-reverse' : 'flex-row'
        )}
      >
        <MessageSquarePlus className="h-4 w-4 text-honey-600 flex-shrink-0 mt-0.5" />
        <span className={clsx(
          'text-xs font-bold text-honey-700 uppercase tracking-wide',
          isHebrew ? 'text-right' : 'text-left'
        )}>
          {isHebrew ? 'ההערה שלי' : 'My note'}
        </span>
      </div>
      <p
        className={clsx(
          'text-sm text-charcoal whitespace-pre-wrap leading-relaxed',
          isHebrew ? 'text-right' : 'text-left'
        )}
        dir={isHebrew ? 'rtl' : 'ltr'}
      >
        {existingNote}
      </p>
      <div
        className={clsx(
          'flex items-center gap-1 mt-3 pt-3 border-t border-honey-200',
          isHebrew ? 'flex-row-reverse' : 'flex-row'
        )}
      >
        <button
          onClick={handleStartEditing}
          className={clsx(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
            'text-xs font-medium text-honey-700',
            'hover:bg-honey-100 transition-colors',
            isHebrew && 'flex-row-reverse'
          )}
        >
          <Pencil className="h-3 w-3" />
          <span>{isHebrew ? 'עריכה' : 'Edit'}</span>
        </button>
        <button
          onClick={handleDelete}
          className={clsx(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
            'text-xs font-medium text-honey-700 hover:text-red-600',
            'hover:bg-red-50 transition-colors',
            isHebrew && 'flex-row-reverse'
          )}
        >
          <Trash2 className="h-3 w-3" />
          <span>{isHebrew ? 'מחק' : 'Delete'}</span>
        </button>
      </div>
    </div>
  );
}

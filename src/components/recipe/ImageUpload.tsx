'use client';

import { useState, useCallback, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

interface ImageUploadProps {
  onUpload: (file: File) => void;
  isLoading: boolean;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default function ImageUpload({ onUpload, isLoading }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please upload a JPEG, PNG, GIF, or WebP image / אנא העלה תמונה בפורמט JPEG, PNG, GIF או WebP';
    }
    if (file.size > MAX_SIZE) {
      return 'Image must be smaller than 10MB / התמונה חייבת להיות קטנה מ-10MB';
    }
    return null;
  };

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrag = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  const handleSubmit = () => {
    if (selectedFile && !isLoading) {
      onUpload(selectedFile);
    }
  };

  const clearSelection = () => {
    setPreview(null);
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !preview && inputRef.current?.click()}
        className={clsx(
          "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer",
          dragActive
            ? "border-terracotta-400 bg-terracotta-50"
            : preview
              ? "border-olive-300 bg-olive-50/50"
              : "border-cream-dark hover:border-terracotta-300 hover:bg-cream/50",
          isLoading && "pointer-events-none opacity-60"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleChange}
          className="hidden"
          disabled={isLoading}
        />

        {preview ? (
          // Preview State
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={preview}
                alt="Recipe preview"
                className="max-h-48 rounded-lg shadow-md object-contain"
              />
              {!isLoading && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelection();
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-charcoal text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-sm text-charcoal/60">
              {selectedFile?.name} ({(selectedFile?.size! / 1024).toFixed(1)} KB)
            </p>
          </div>
        ) : (
          // Upload State
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center">
              {dragActive ? (
                <Upload className="w-8 h-8 text-terracotta-500" />
              ) : (
                <ImageIcon className="w-8 h-8 text-charcoal/40" />
              )}
            </div>
            <div>
              <p className="font-medium text-charcoal">
                {dragActive ? 'Drop image here...' : 'Upload recipe image'}
              </p>
              <p className="text-sm text-charcoal/60 mt-1">
                {dragActive ? 'שחרר את התמונה כאן...' : 'גרור תמונה או לחץ לבחירה'}
              </p>
            </div>
            <p className="text-xs text-charcoal/40">
              JPEG, PNG, GIF, WebP up to 10MB
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm" dir="auto">
          {error}
        </div>
      )}

      {/* Extract Button */}
      {preview && (
        <button
          onClick={handleSubmit}
          disabled={isLoading || !selectedFile}
          className={clsx(
            "w-full py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2",
            isLoading || !selectedFile
              ? "bg-charcoal/20 text-charcoal/40 cursor-not-allowed"
              : "bg-terracotta-500 text-white hover:bg-terracotta-600 active:scale-[0.98] shadow-md hover:shadow-lg"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Extracting... / מחלץ...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Extract Recipe / חלץ מתכון</span>
            </>
          )}
        </button>
      )}

      {/* Hints */}
      <div className="text-sm text-charcoal/60 text-center space-y-1">
        <p>Supports printed recipes, cookbook pages, and handwritten notes</p>
        <p className="text-xs">תומך במתכונים מודפסים, דפי ספרי בישול ופתקים בכתב יד</p>
      </div>
    </div>
  );
}

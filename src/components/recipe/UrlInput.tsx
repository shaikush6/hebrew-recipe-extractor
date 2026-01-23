'use client';

import { ChefHat, Loader2, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export default function UrlInput({
  value,
  onChange,
  onSubmit,
  isLoading,
}: UrlInputProps) {
  return (
    <div className="paper-card p-6 md:p-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-terracotta-100 flex items-center justify-center">
          <ChefHat className="w-6 h-6 text-terracotta-600" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-charcoal">
            Recipe Extractor
          </h1>
          <p className="text-charcoal/60 text-sm">
            מחלץ מתכונים מכל אתר
          </p>
        </div>
      </div>

      <div className="relative">
        <label htmlFor="recipe-url" className="sr-only">
          Recipe URL / קישור למתכון
        </label>
        <input
          id="recipe-url"
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isLoading && onSubmit()}
          placeholder="Paste recipe URL here... / הדביקו קישור למתכון"
          className="w-full px-5 py-4 pr-32 rounded-xl border-2 border-cream-dark focus:border-terracotta-400 focus:ring-4 focus:ring-terracotta-100 transition-all duration-200 bg-white/80 text-charcoal placeholder:text-charcoal/40 font-body text-lg outline-none"
          dir="auto"
          disabled={isLoading}
          aria-describedby="url-hint"
          autoComplete="url"
        />
        <button
          onClick={onSubmit}
          disabled={isLoading || !value.trim()}
          aria-label={isLoading ? 'Extracting recipe...' : 'Extract recipe from URL'}
          className={clsx(
            "absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center gap-2",
            isLoading || !value.trim()
              ? "bg-charcoal/20 text-charcoal/40 cursor-not-allowed"
              : "bg-terracotta-500 text-white hover:bg-terracotta-600 active:scale-95 shadow-md hover:shadow-lg"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="w-4 h-4" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">Extract</span>
        </button>
      </div>

      <div
        className="flex flex-wrap items-center gap-2 mt-4 text-sm text-charcoal/60"
        id="url-hint"
      >
        <span>Try:</span>
        {[
          { label: 'Niki B', url: 'https://www.nikib.co.il' },
          { label: 'AllRecipes', url: 'https://www.allrecipes.com' },
        ].map((site) => (
          <button
            key={site.label}
            onClick={() => onChange(site.url)}
            aria-label={`Try ${site.label}`}
            className="px-3 py-1 rounded-full bg-cream-dark hover:bg-olive-100 transition-colors"
          >
            {site.label}
          </button>
        ))}
      </div>
    </div>
  );
}

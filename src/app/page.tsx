'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  ChefHat,
  Clock,
  Utensils,
  AlertCircle,
  History,
  Trash2,
  PanelLeftClose,
  RefreshCw,
  Search,
  X,
  Zap,
  Image as ImageIcon,
} from 'lucide-react';
import { clsx } from 'clsx';

import { Recipe, HistoryItem } from '@/types/recipe';
import { formatRelativeTime } from '@/lib/format';

import LoadingAnimation from '@/components/ui/LoadingAnimation';
import RecipeInput, { type InputTab } from '@/components/recipe/RecipeInput';
import RecipeDisplay from '@/components/recipe/RecipeDisplay';
import { UserMenu } from '@/components/auth/UserMenu';

// History sidebar component
function HistorySidebar({
  isOpen,
  onToggle,
  history,
  onSelectRecipe,
  onDeleteRecipe,
  onRefresh,
  isLoading,
  searchQuery,
  onSearchChange,
}: {
  isOpen: boolean;
  onToggle: () => void;
  history: HistoryItem[];
  onSelectRecipe: (record: HistoryItem) => void;
  onDeleteRecipe: (id: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) {
  return (
    <>
      {/* Toggle button - always visible */}
      <button
        onClick={onToggle}
        className={clsx(
          "fixed top-4 z-50 p-3 rounded-xl shadow-lg transition-all duration-300",
          "bg-white/90 backdrop-blur-sm border border-cream-dark hover:bg-terracotta-50",
          isOpen ? "left-72" : "left-4"
        )}
        title={isOpen ? "Close history" : "Open history"}
      >
        {isOpen ? (
          <PanelLeftClose className="w-5 h-5 text-terracotta-600" />
        ) : (
          <div className="relative">
            <History className="w-5 h-5 text-terracotta-600" />
            {history.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-terracotta-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {history.length > 9 ? '9+' : history.length}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Sidebar panel */}
      <aside
        className={clsx(
          "fixed top-0 left-0 h-full w-72 bg-white/95 backdrop-blur-md shadow-2xl z-40",
          "transform transition-transform duration-300 ease-out border-r border-cream-dark",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-cream-dark bg-cream/50">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-bold text-charcoal flex items-center gap-2">
                <History className="w-5 h-5 text-terracotta-500" />
                Recipe History
              </h2>
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className={clsx(
                  "p-2 rounded-lg hover:bg-cream-dark transition-colors",
                  isLoading && "animate-spin"
                )}
              >
                <RefreshCw className="w-4 h-4 text-charcoal/60" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search recipes..."
                className="w-full pl-9 pr-8 py-2 rounded-lg border border-cream-dark bg-white/80 text-sm focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-cream-dark rounded"
                >
                  <X className="w-3 h-3 text-charcoal/40" />
                </button>
              )}
            </div>
          </div>

          {/* Recipe list */}
          <div className="flex-1 overflow-y-auto p-2">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-16 h-16 rounded-full bg-cream-dark flex items-center justify-center mb-4">
                  <Utensils className="w-8 h-8 text-terracotta-300" />
                </div>
                <p className="text-charcoal/60 text-sm">
                  {searchQuery ? 'No recipes found' : 'No recipes yet'}
                </p>
                <p className="text-charcoal/40 text-xs mt-1">
                  {searchQuery ? 'Try a different search' : 'Extract a recipe to get started'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((record) => (
                  <div
                    key={record.id}
                    className="group relative p-3 rounded-xl bg-cream/50 hover:bg-cream-dark/70 transition-all cursor-pointer"
                    onClick={() => onSelectRecipe(record)}
                  >
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-cream-dark">
                        {record.image_url ? (
                          <img
                            src={record.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ChefHat className="w-6 h-6 text-terracotta-300" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-medium text-charcoal text-sm truncate"
                          dir={record.language === 'he' ? 'rtl' : 'ltr'}
                        >
                          {record.title}
                        </h3>
                        <p className="text-xs text-charcoal/50 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(record.updated_at)}
                        </p>
                        {record.extraction_method && (
                          <span className={clsx(
                            "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full mt-1",
                            record.extraction_method === 'json-ld' ? "bg-olive-100 text-olive-700" :
                            record.extraction_method === 'llm' ? "bg-terracotta-100 text-terracotta-700" :
                            record.extraction_method === 'image' ? "bg-purple-100 text-purple-700" :
                            "bg-honey-100 text-honey-700"
                          )}>
                            {record.extraction_method === 'image' ? (
                              <ImageIcon className="w-2.5 h-2.5" />
                            ) : (
                              <Zap className="w-2.5 h-2.5" />
                            )}
                            {record.extraction_method.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRecipe(record.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer stats */}
          {history.length > 0 && (
            <div className="p-3 border-t border-cream-dark bg-cream/30 text-center">
              <p className="text-xs text-charcoal/50">
                {history.length} recipe{history.length !== 1 ? 's' : ''} saved
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-charcoal/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}

// Error display component
function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="paper-card p-8 animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-charcoal mb-2">
            Extraction Failed
          </h3>
          <p className="text-charcoal/70">{message}</p>
          <p className="text-sm text-charcoal/50 mt-4">
            Make sure the URL points to a page with a recipe. Some sites may block automated access.
          </p>
        </div>
      </div>
    </div>
  );
}

// Main page component
export default function HomePage() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Input tab state
  const [inputTab, setInputTab] = useState<InputTab>('url');

  // History state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch history on mount and after extraction
  const fetchHistory = useCallback(async (query?: string) => {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      params.set('limit', '50');

      const response = await fetch(`/api/history?${params}`);
      const data = await response.json();

      if (response.ok) {
        setHistory(data.recipes || []);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistory(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, fetchHistory]);

  // Handle selecting a recipe from history
  const handleSelectFromHistory = async (record: HistoryItem) => {
    setIsLoading(true);
    setError(null);
    setHistoryOpen(false);

    try {
      const response = await fetch(`/api/history/${record.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to load recipe');
      }

      setRecipe(data);
      setUrl(record.source_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipe');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a recipe
  const handleDeleteRecipe = async (id: string) => {
    try {
      const response = await fetch(`/api/history/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setHistory(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete recipe:', err);
    }
  };

  const handleExtract = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setRecipe(null);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract recipe');
      }

      setRecipe(data.recipe);

      // Refresh history to show the new recipe
      fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image extraction
  const handleImageExtract = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setRecipe(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/extract-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract recipe from image');
      }

      setRecipe(data.recipe);

      // Refresh history to show the new recipe
      fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Auth Header - Fixed top right */}
      <header className="fixed top-4 right-4 z-50">
        <UserMenu />
      </header>

      {/* History Sidebar */}
      <HistorySidebar
        isOpen={historyOpen}
        onToggle={() => setHistoryOpen(!historyOpen)}
        history={history}
        onSelectRecipe={handleSelectFromHistory}
        onDeleteRecipe={handleDeleteRecipe}
        onRefresh={() => fetchHistory()}
        isLoading={historyLoading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <main className={clsx(
        "min-h-screen py-8 px-4 transition-all duration-300",
        historyOpen && "lg:pl-80"
      )}>
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Decorative header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 text-terracotta-400 mb-4">
              <span className="flourish">*</span>
              <span className="text-sm font-medium tracking-widest uppercase">
                Recipe Magic
              </span>
              <span className="flourish">*</span>
            </div>
          </div>

          {/* Recipe Input (URL or Image) */}
          <RecipeInput
            urlValue={url}
            onUrlChange={setUrl}
            onUrlSubmit={handleExtract}
            onImageUpload={handleImageExtract}
            isLoading={isLoading}
            activeTab={inputTab}
            onTabChange={setInputTab}
          />

          {/* Loading state */}
          {isLoading && (
            <div className="paper-card">
              <LoadingAnimation />
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && <ErrorDisplay message={error} />}

          {/* Recipe display */}
          {recipe && !isLoading && <RecipeDisplay recipe={recipe} />}

          {/* Empty state */}
          {!recipe && !isLoading && !error && (
            <div className="text-center py-16 animate-fade-in">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-cream-dark mb-6">
                <Utensils className="w-12 h-12 text-terracotta-300" />
              </div>
              <h3 className="font-display text-xl text-charcoal/70 mb-2">
                No recipe yet
              </h3>
              <p className="text-charcoal/50">
                Paste a recipe URL or upload an image to get started
              </p>
              <p className="text-charcoal/40 text-sm mt-1">
                הדביקו קישור למתכון או העלו תמונה
              </p>
              {history.length > 0 && (
                <button
                  onClick={() => setHistoryOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-terracotta-100 hover:bg-terracotta-200 text-terracotta-700 transition-colors text-sm font-medium"
                >
                  <History className="w-4 h-4" />
                  View {history.length} saved recipe{history.length !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          )}

          {/* Footer */}
          <footer className="text-center py-8 text-sm text-charcoal/40">
            <p>
              Built with love for home cooks everywhere
            </p>
            <p className="mt-1 text-xs">
              Supports Hebrew & English recipes - Powered by Bun + SQLite
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}

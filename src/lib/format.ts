/**
 * Formatting Utilities
 * Helper functions for displaying recipe data
 */

// ============================================
// LANGUAGE DETECTION
// ============================================

/**
 * Detect if text contains Hebrew characters
 */
export function isHebrew(text: string): boolean {
  const hebrewPattern = /[\u0590-\u05FF]/;
  return hebrewPattern.test(text);
}

// ============================================
// TIME FORMATTING
// ============================================

/**
 * Format time in minutes to human readable string
 */
export function formatTime(minutes: number | null): string {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

// ============================================
// DIFFICULTY LABELS
// ============================================

const DIFFICULTY_LABELS: Record<string, { en: string; he: string }> = {
  easy: { en: 'Easy', he: 'קל' },
  medium: { en: 'Medium', he: 'בינוני' },
  hard: { en: 'Hard', he: 'מאתגר' },
  unknown: { en: 'Unknown', he: 'לא ידוע' },
};

/**
 * Get difficulty label in the appropriate language
 */
export function getDifficultyLabel(difficulty: string, isHeb: boolean): string {
  return DIFFICULTY_LABELS[difficulty]?.[isHeb ? 'he' : 'en'] || difficulty;
}

// ============================================
// UNIT DISPLAY
// ============================================

const UNIT_DISPLAY: Record<string, { en: string; he: string }> = {
  cup: { en: 'cup', he: 'כוס' },
  tbsp: { en: 'tbsp', he: 'כף' },
  tsp: { en: 'tsp', he: 'כפית' },
  g: { en: 'g', he: 'גרם' },
  kg: { en: 'kg', he: 'ק"ג' },
  ml: { en: 'ml', he: 'מ"ל' },
  l: { en: 'l', he: 'ליטר' },
  piece: { en: 'pc', he: 'יח\'' },
  slice: { en: 'slice', he: 'פרוסה' },
  clove: { en: 'clove', he: 'שן' },
  bunch: { en: 'bunch', he: 'צרור' },
  package: { en: 'pkg', he: 'חבילה' },
  bag: { en: 'bag', he: 'שקית' },
  can: { en: 'can', he: 'פחית' },
  jar: { en: 'jar', he: 'צנצנת' },
  pinch: { en: 'pinch', he: 'קורט' },
  dash: { en: 'dash', he: 'מעט' },
  to_taste: { en: 'to taste', he: 'לפי הטעם' },
  as_needed: { en: 'as needed', he: 'לפי הצורך' },
};

/**
 * Format unit for display in the appropriate language
 */
export function formatUnit(unit: string | null, isHeb: boolean): string {
  if (!unit) return '';
  return UNIT_DISPLAY[unit]?.[isHeb ? 'he' : 'en'] || unit;
}

// ============================================
// KASHRUT LABELS
// ============================================

const KASHRUT_LABELS: Record<string, { en: string; he: string; color: string }> = {
  parve: { en: 'Parve', he: 'פרווה', color: 'bg-olive-100 text-olive-700' },
  dairy: { en: 'Dairy', he: 'חלבי', color: 'bg-blue-100 text-blue-700' },
  meat: { en: 'Meat', he: 'בשרי', color: 'bg-red-100 text-red-700' },
  not_kosher: { en: 'Not Kosher', he: 'לא כשר', color: 'bg-gray-100 text-gray-700' },
  unknown: { en: 'Unknown', he: 'לא ידוע', color: 'bg-gray-100 text-gray-500' },
};

/**
 * Get kashrut label and styling
 */
export function getKashrutLabel(kashrut: string | null, isHeb: boolean): { label: string; color: string } | null {
  if (!kashrut || kashrut === 'unknown') return null;
  const info = KASHRUT_LABELS[kashrut];
  if (!info) return null;
  return {
    label: isHeb ? info.he : info.en,
    color: info.color,
  };
}

// ============================================
// QUANTITY FORMATTING
// ============================================

/**
 * Format quantity for display (handles fractions)
 */
export function formatQuantity(quantity: number | null): string {
  if (quantity === null) return '';

  // Common fractions
  if (quantity === 0.25) return '¼';
  if (quantity === 0.333 || quantity === 0.33) return '⅓';
  if (quantity === 0.5) return '½';
  if (quantity === 0.667 || quantity === 0.66) return '⅔';
  if (quantity === 0.75) return '¾';

  // Mixed numbers
  if (quantity > 1) {
    const whole = Math.floor(quantity);
    const frac = quantity - whole;
    if (frac === 0.25) return `${whole}¼`;
    if (frac === 0.5) return `${whole}½`;
    if (frac === 0.75) return `${whole}¾`;
  }

  // Regular numbers
  if (Number.isInteger(quantity)) return quantity.toString();
  return quantity.toFixed(1).replace(/\.0$/, '');
}

// ============================================
// EXTRACTION METHOD LABELS
// ============================================

const METHOD_LABELS: Record<string, { en: string; he: string }> = {
  'json-ld': { en: 'Schema.org', he: 'סכמה' },
  'llm': { en: 'AI Extracted', he: 'חילוץ AI' },
  'hybrid': { en: 'Hybrid', he: 'משולב' },
};

/**
 * Get extraction method label
 */
export function getMethodLabel(method: string, isHeb: boolean): string {
  return METHOD_LABELS[method]?.[isHeb ? 'he' : 'en'] || method;
}

/**
 * Get confidence color class based on confidence score
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.9) return 'text-olive-600';
  if (confidence >= 0.75) return 'text-honey-600';
  return 'text-terracotta-600';
}

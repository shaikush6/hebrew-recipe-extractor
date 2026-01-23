/**
 * Israeli Seasonal Produce Calendar
 * Data for ~50 common Israeli produce items with peak months and substitutes
 */

export interface SeasonalProduce {
  nameHe: string;
  nameEn: string;
  peakMonths: number[]; // 1-12 representing months
  category: 'vegetable' | 'fruit' | 'herb';
  substitutes?: string[]; // Suggestions when out of season
}

// Peak months: 1=January, 12=December
export const SEASONAL_PRODUCE: SeasonalProduce[] = [
  // VEGETABLES
  { nameHe: 'עגבנייה', nameEn: 'tomato', peakMonths: [5, 6, 7, 8, 9], category: 'vegetable', substitutes: ['canned tomatoes', 'sun-dried tomatoes'] },
  { nameHe: 'מלפפון', nameEn: 'cucumber', peakMonths: [4, 5, 6, 7, 8, 9], category: 'vegetable', substitutes: ['zucchini'] },
  { nameHe: 'פלפל', nameEn: 'bell pepper', peakMonths: [5, 6, 7, 8, 9, 10], category: 'vegetable', substitutes: ['roasted peppers'] },
  { nameHe: 'חציל', nameEn: 'eggplant', peakMonths: [6, 7, 8, 9, 10], category: 'vegetable', substitutes: ['zucchini', 'portobello mushroom'] },
  { nameHe: 'קישוא', nameEn: 'zucchini', peakMonths: [5, 6, 7, 8, 9], category: 'vegetable', substitutes: ['yellow squash', 'eggplant'] },
  { nameHe: 'גזר', nameEn: 'carrot', peakMonths: [1, 2, 3, 10, 11, 12], category: 'vegetable' },
  { nameHe: 'בצל', nameEn: 'onion', peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], category: 'vegetable' },
  { nameHe: 'שום', nameEn: 'garlic', peakMonths: [5, 6, 7], category: 'vegetable' },
  { nameHe: 'תפוח אדמה', nameEn: 'potato', peakMonths: [1, 2, 3, 4, 5, 10, 11, 12], category: 'vegetable' },
  { nameHe: 'בטטה', nameEn: 'sweet potato', peakMonths: [9, 10, 11, 12, 1, 2], category: 'vegetable' },
  { nameHe: 'כרוב', nameEn: 'cabbage', peakMonths: [1, 2, 3, 11, 12], category: 'vegetable' },
  { nameHe: 'כרובית', nameEn: 'cauliflower', peakMonths: [10, 11, 12, 1, 2, 3], category: 'vegetable' },
  { nameHe: 'ברוקולי', nameEn: 'broccoli', peakMonths: [10, 11, 12, 1, 2, 3, 4], category: 'vegetable' },
  { nameHe: 'סלק', nameEn: 'beet', peakMonths: [10, 11, 12, 1, 2, 3], category: 'vegetable' },
  { nameHe: 'דלעת', nameEn: 'pumpkin', peakMonths: [9, 10, 11, 12], category: 'vegetable', substitutes: ['butternut squash', 'sweet potato'] },
  { nameHe: 'שעועית ירוקה', nameEn: 'green beans', peakMonths: [4, 5, 6, 7, 8, 9], category: 'vegetable', substitutes: ['frozen green beans'] },
  { nameHe: 'אפונה', nameEn: 'peas', peakMonths: [2, 3, 4, 5], category: 'vegetable', substitutes: ['frozen peas'] },
  { nameHe: 'תרד', nameEn: 'spinach', peakMonths: [10, 11, 12, 1, 2, 3, 4], category: 'vegetable', substitutes: ['kale', 'swiss chard'] },
  { nameHe: 'חסה', nameEn: 'lettuce', peakMonths: [10, 11, 12, 1, 2, 3, 4, 5], category: 'vegetable' },
  { nameHe: 'סלרי', nameEn: 'celery', peakMonths: [10, 11, 12, 1, 2, 3, 4], category: 'vegetable' },
  { nameHe: 'כרישה', nameEn: 'leek', peakMonths: [10, 11, 12, 1, 2, 3], category: 'vegetable' },
  { nameHe: 'ארטישוק', nameEn: 'artichoke', peakMonths: [2, 3, 4, 5], category: 'vegetable', substitutes: ['canned artichoke hearts'] },
  { nameHe: 'אספרגוס', nameEn: 'asparagus', peakMonths: [2, 3, 4, 5], category: 'vegetable', substitutes: ['green beans'] },
  { nameHe: 'קולורבי', nameEn: 'kohlrabi', peakMonths: [10, 11, 12, 1, 2, 3], category: 'vegetable', substitutes: ['turnip', 'radish'] },
  { nameHe: 'צנון', nameEn: 'radish', peakMonths: [10, 11, 12, 1, 2, 3, 4], category: 'vegetable' },

  // FRUITS
  { nameHe: 'תפוז', nameEn: 'orange', peakMonths: [11, 12, 1, 2, 3, 4], category: 'fruit' },
  { nameHe: 'קלמנטינה', nameEn: 'clementine', peakMonths: [11, 12, 1, 2], category: 'fruit', substitutes: ['mandarin', 'tangerine'] },
  { nameHe: 'אשכולית', nameEn: 'grapefruit', peakMonths: [11, 12, 1, 2, 3], category: 'fruit' },
  { nameHe: 'לימון', nameEn: 'lemon', peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], category: 'fruit' },
  { nameHe: 'תפוח', nameEn: 'apple', peakMonths: [8, 9, 10, 11], category: 'fruit' },
  { nameHe: 'אגס', nameEn: 'pear', peakMonths: [8, 9, 10, 11], category: 'fruit' },
  { nameHe: 'ענבים', nameEn: 'grapes', peakMonths: [7, 8, 9, 10], category: 'fruit' },
  { nameHe: 'רימון', nameEn: 'pomegranate', peakMonths: [9, 10, 11], category: 'fruit', substitutes: ['cranberries', 'pomegranate molasses'] },
  { nameHe: 'תאנה', nameEn: 'fig', peakMonths: [7, 8, 9, 10], category: 'fruit', substitutes: ['dried figs'] },
  { nameHe: 'תמר', nameEn: 'date', peakMonths: [9, 10, 11], category: 'fruit' },
  { nameHe: 'אבטיח', nameEn: 'watermelon', peakMonths: [5, 6, 7, 8], category: 'fruit' },
  { nameHe: 'מלון', nameEn: 'melon', peakMonths: [5, 6, 7, 8, 9], category: 'fruit' },
  { nameHe: 'אפרסק', nameEn: 'peach', peakMonths: [5, 6, 7, 8], category: 'fruit', substitutes: ['nectarine', 'canned peaches'] },
  { nameHe: 'שזיף', nameEn: 'plum', peakMonths: [6, 7, 8], category: 'fruit', substitutes: ['prunes'] },
  { nameHe: 'משמש', nameEn: 'apricot', peakMonths: [5, 6, 7], category: 'fruit', substitutes: ['dried apricots', 'peaches'] },
  { nameHe: 'תות שדה', nameEn: 'strawberry', peakMonths: [2, 3, 4, 5], category: 'fruit', substitutes: ['frozen strawberries'] },
  { nameHe: 'אבוקדו', nameEn: 'avocado', peakMonths: [10, 11, 12, 1, 2, 3, 4, 5], category: 'fruit' },
  { nameHe: 'מנגו', nameEn: 'mango', peakMonths: [5, 6, 7, 8, 9], category: 'fruit', substitutes: ['frozen mango', 'papaya'] },
  { nameHe: 'בננה', nameEn: 'banana', peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], category: 'fruit' },
  { nameHe: 'לוקט', nameEn: 'loquat', peakMonths: [4, 5], category: 'fruit', substitutes: ['apricot'] },

  // HERBS
  { nameHe: 'פטרוזיליה', nameEn: 'parsley', peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], category: 'herb' },
  { nameHe: 'כוסברה', nameEn: 'cilantro', peakMonths: [10, 11, 12, 1, 2, 3, 4], category: 'herb', substitutes: ['parsley with a squeeze of lime'] },
  { nameHe: 'נענע', nameEn: 'mint', peakMonths: [4, 5, 6, 7, 8, 9], category: 'herb', substitutes: ['dried mint'] },
  { nameHe: 'בזיליקום', nameEn: 'basil', peakMonths: [5, 6, 7, 8, 9, 10], category: 'herb', substitutes: ['dried basil', 'oregano'] },
  { nameHe: 'שמיר', nameEn: 'dill', peakMonths: [3, 4, 5, 6, 7, 8, 9], category: 'herb', substitutes: ['dried dill', 'fennel fronds'] },
  { nameHe: 'רוזמרין', nameEn: 'rosemary', peakMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], category: 'herb' },
  { nameHe: 'תימין', nameEn: 'thyme', peakMonths: [4, 5, 6, 7, 8, 9], category: 'herb', substitutes: ['dried thyme'] },
  { nameHe: 'זעתר', nameEn: 'za\'atar herb', peakMonths: [4, 5, 6, 7, 8, 9], category: 'herb', substitutes: ['dried za\'atar spice blend'] },
];

/**
 * Check if a produce item is currently in season
 */
export function isInSeason(produceNameOrItem: string): boolean {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const produce = findProduce(produceNameOrItem);
  if (!produce) return true; // If not found, assume available
  return produce.peakMonths.includes(currentMonth);
}

/**
 * Find a produce item by Hebrew or English name
 */
export function findProduce(name: string): SeasonalProduce | undefined {
  const normalized = name.toLowerCase().trim();
  return SEASONAL_PRODUCE.find(
    p => p.nameHe.includes(normalized) ||
         p.nameEn.toLowerCase().includes(normalized) ||
         normalized.includes(p.nameHe) ||
         normalized.includes(p.nameEn.toLowerCase())
  );
}

/**
 * Get seasonal status and substitutes for an ingredient
 */
export function getSeasonalInfo(ingredientName: string): {
  inSeason: boolean;
  produce?: SeasonalProduce;
  substitutes?: string[];
} {
  const produce = findProduce(ingredientName);
  if (!produce) {
    return { inSeason: true };
  }

  const currentMonth = new Date().getMonth() + 1;
  const inSeason = produce.peakMonths.includes(currentMonth);

  return {
    inSeason,
    produce,
    substitutes: inSeason ? undefined : produce.substitutes,
  };
}

/**
 * Get all produce currently in season
 */
export function getCurrentSeasonalProduce(): SeasonalProduce[] {
  const currentMonth = new Date().getMonth() + 1;
  return SEASONAL_PRODUCE.filter(p => p.peakMonths.includes(currentMonth));
}

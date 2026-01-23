/**
 * Diaspora Ingredient Substitutes
 * Help cooks outside Israel find alternatives to uniquely Israeli ingredients
 */

export interface DiasporaIngredient {
  nameHe: string;
  nameEn: string;
  description: string;
  regions: {
    us?: DiasporaSubstitute;
    eu?: DiasporaSubstitute;
    uk?: DiasporaSubstitute;
    general?: DiasporaSubstitute;
  };
}

export interface DiasporaSubstitute {
  substitute: string;
  whereToFind?: string;
  notes?: string;
}

export const DIASPORA_INGREDIENTS: DiasporaIngredient[] = [
  {
    nameHe: 'לבנה',
    nameEn: 'labneh',
    description: 'Strained yogurt cheese, thick and creamy',
    regions: {
      us: {
        substitute: 'Greek yogurt (strained overnight) or cream cheese mixed with yogurt',
        whereToFind: 'Whole Foods, Middle Eastern grocery stores, Trader Joe\'s',
        notes: 'Strain Greek yogurt in cheesecloth overnight for closest texture',
      },
      eu: {
        substitute: 'Quark or Greek yogurt',
        whereToFind: 'Most supermarkets carry Quark',
        notes: 'German Quark is very similar in texture',
      },
      uk: {
        substitute: 'Greek yogurt or Philadelphia cream cheese mixed 1:1 with Greek yogurt',
        whereToFind: 'Waitrose, larger Tesco stores, Middle Eastern shops',
      },
    },
  },
  {
    nameHe: 'טחינה',
    nameEn: 'tahini',
    description: 'Sesame seed paste',
    regions: {
      general: {
        substitute: 'Any brand of tahini (Al Ard, Soom, Seed + Mill are good)',
        whereToFind: 'Most supermarkets now stock tahini in the international or natural foods aisle',
        notes: 'Israeli brands (Al Ard, Har Bracha) are smoothest. Avoid bitter/separated brands.',
      },
    },
  },
  {
    nameHe: 'חלבה',
    nameEn: 'halva',
    description: 'Sweet tahini confection',
    regions: {
      us: {
        substitute: 'Joyva halva or Seed + Mill halva',
        whereToFind: 'Amazon, specialty food stores, some Whole Foods',
      },
      eu: {
        substitute: 'Turkish or Greek halva',
        whereToFind: 'Turkish/Greek grocery stores, Amazon',
        notes: 'Look for tahini-based (not semolina-based) for Israeli style',
      },
      general: {
        substitute: 'Make your own: tahini + honey/sugar + vanilla',
        whereToFind: 'Any grocery store with tahini',
      },
    },
  },
  {
    nameHe: 'זעתר',
    nameEn: 'za\'atar spice blend',
    description: 'Herb and sesame blend with sumac',
    regions: {
      general: {
        substitute: 'Mix: 2 tbsp dried thyme, 1 tbsp sumac, 1 tbsp sesame seeds, 1/2 tsp salt',
        whereToFind: 'Ready-made at Whole Foods, Trader Joe\'s, Middle Eastern stores, Amazon',
        notes: 'Quality varies greatly - look for brands with visible green herbs',
      },
    },
  },
  {
    nameHe: 'סומק',
    nameEn: 'sumac',
    description: 'Tangy, lemony red spice',
    regions: {
      general: {
        substitute: 'Lemon zest with a pinch of salt (not the same, but adds tartness)',
        whereToFind: 'Middle Eastern stores, Whole Foods, Penzeys, Amazon',
        notes: 'No true substitute - worth ordering online if unavailable locally',
      },
    },
  },
  {
    nameHe: 'בורגול',
    nameEn: 'bulgur',
    description: 'Cracked wheat',
    regions: {
      general: {
        substitute: 'Couscous (for texture) or quinoa (for nutrition profile)',
        whereToFind: 'Most supermarkets in the grain/rice aisle or bulk section',
        notes: 'Bulgur is usually available - check international aisle',
      },
    },
  },
  {
    nameHe: 'פריקה',
    nameEn: 'freekeh',
    description: 'Roasted green wheat',
    regions: {
      us: {
        substitute: 'Farro or bulgur',
        whereToFind: 'Whole Foods, Middle Eastern stores, Amazon',
        notes: 'Farro has similar nutty flavor but different texture',
      },
      general: {
        substitute: 'Bulgur or pearl barley',
        whereToFind: 'Health food stores, Middle Eastern grocers',
      },
    },
  },
  {
    nameHe: 'חומוס מבושל',
    nameEn: 'cooked chickpeas',
    description: 'Israeli-style tender chickpeas',
    regions: {
      general: {
        substitute: 'Canned chickpeas (drained) or dried chickpeas soaked overnight',
        whereToFind: 'Any supermarket',
        notes: 'For best hummus, use dried chickpeas with 1 tsp baking soda while cooking',
      },
    },
  },
  {
    nameHe: 'שמן זית ישראלי',
    nameEn: 'Israeli olive oil',
    description: 'High-quality extra virgin olive oil',
    regions: {
      general: {
        substitute: 'Quality Greek, Spanish, or California extra virgin olive oil',
        whereToFind: 'Specialty food stores, Costco (Kirkland brand is good)',
        notes: 'Look for harvest date on bottle - fresher is better',
      },
    },
  },
  {
    nameHe: 'גבינה בולגרית',
    nameEn: 'Bulgarian cheese',
    description: 'Brined white cheese, softer than feta',
    regions: {
      general: {
        substitute: 'Feta cheese (Greek style is closest)',
        whereToFind: 'Any supermarket',
        notes: 'Soak feta in milk for 30 min to reduce saltiness for Israeli-style',
      },
    },
  },
  {
    nameHe: 'צפתית',
    nameEn: 'tzfatit cheese',
    description: 'Soft, mild white cheese from Tzfat',
    regions: {
      us: {
        substitute: 'Fresh mozzarella or farmer\'s cheese',
        whereToFind: 'Any supermarket',
      },
      eu: {
        substitute: 'Fresh mozzarella or halloumi (for grilling)',
        whereToFind: 'Most supermarkets',
      },
      general: {
        substitute: 'Queso fresco or paneer',
        whereToFind: 'Latin or Indian grocery stores',
        notes: 'None are exact matches - tzfatit has unique mild, slightly salty flavor',
      },
    },
  },
  {
    nameHe: 'סילאן',
    nameEn: 'silan (date syrup)',
    description: 'Thick date syrup/honey',
    regions: {
      us: {
        substitute: 'Date syrup (Just Date Syrup brand) or make from blended dates',
        whereToFind: 'Whole Foods, Middle Eastern stores, Amazon',
      },
      general: {
        substitute: 'Honey or maple syrup (different flavor but similar sweetness)',
        whereToFind: 'Any supermarket',
        notes: 'To make: blend 1 cup pitted dates with 1 cup hot water, strain',
      },
    },
  },
  {
    nameHe: 'פיתה',
    nameEn: 'pita bread',
    description: 'Israeli-style thick, fluffy pita',
    regions: {
      general: {
        substitute: 'Greek pita or naan bread',
        whereToFind: 'Most supermarkets in the bread aisle',
        notes: 'Israeli pita is thicker than Lebanese. Greek pita or homemade is closest.',
      },
    },
  },
  {
    nameHe: 'עמבה',
    nameEn: 'amba',
    description: 'Pickled mango sauce with fenugreek',
    regions: {
      us: {
        substitute: 'Mix mango chutney with mustard and turmeric',
        whereToFind: 'Middle Eastern stores, Amazon (Galil brand)',
        notes: 'No true substitute - essential for sabich',
      },
      general: {
        substitute: 'Mango pickle (Indian achaar) thinned with oil',
        whereToFind: 'Indian grocery stores',
      },
    },
  },
  {
    nameHe: 'חריף תימני (סחוג)',
    nameEn: 's\'chug (zhug)',
    description: 'Spicy Yemenite green/red hot sauce',
    regions: {
      general: {
        substitute: 'Blend: jalapeños, cilantro, garlic, cumin, cardamom, olive oil',
        whereToFind: 'Some Whole Foods carry it, Middle Eastern stores',
        notes: 'Green (cilantro-based) is most common. Red uses hot peppers.',
      },
    },
  },
  {
    nameHe: 'חריימה',
    nameEn: 'harissa',
    description: 'North African hot pepper paste',
    regions: {
      general: {
        substitute: 'Any North African harissa or sriracha mixed with cumin',
        whereToFind: 'Most supermarkets now stock harissa',
        notes: 'Tunisian harissa is closest to Israeli style',
      },
    },
  },
  {
    nameHe: 'פתיתים',
    nameEn: 'ptitim (Israeli couscous)',
    description: 'Toasted pasta pearls',
    regions: {
      general: {
        substitute: 'Pearl couscous or acini di pepe pasta',
        whereToFind: 'Most supermarkets in the pasta or international aisle',
        notes: 'Pearl couscous is the same thing with a different name',
      },
    },
  },
  {
    nameHe: 'פלאפל מיקס',
    nameEn: 'falafel mix',
    description: 'Ready-made falafel mixture',
    regions: {
      general: {
        substitute: 'Make from scratch with dried chickpeas, or use Fantastic Foods mix',
        whereToFind: 'Middle Eastern stores, some supermarkets',
        notes: 'Fresh from dried chickpeas is vastly superior to any mix',
      },
    },
  },
];

/**
 * Find diaspora info for an ingredient
 */
export function findDiasporaInfo(ingredientName: string): DiasporaIngredient | undefined {
  const normalized = ingredientName.toLowerCase().trim();
  return DIASPORA_INGREDIENTS.find(
    d => d.nameHe.includes(normalized) ||
         d.nameEn.toLowerCase().includes(normalized) ||
         normalized.includes(d.nameHe) ||
         normalized.includes(d.nameEn.toLowerCase())
  );
}

/**
 * Get substitutes for a specific region
 */
export function getRegionalSubstitutes(
  ingredientName: string,
  region: 'us' | 'eu' | 'uk' | 'general' = 'general'
): DiasporaSubstitute | undefined {
  const ingredient = findDiasporaInfo(ingredientName);
  if (!ingredient) return undefined;

  // Try specific region first, fall back to general
  return ingredient.regions[region] || ingredient.regions.general;
}

/**
 * Check if an ingredient has diaspora info available
 */
export function hasDiasporaInfo(ingredientName: string): boolean {
  return !!findDiasporaInfo(ingredientName);
}

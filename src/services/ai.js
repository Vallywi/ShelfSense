// AI Features for ShelfSense

/**
 * 1. Expiry Status Detection (accurate day-based)
 */
export function getStatus(expiryDate) {
  if (!expiryDate) return "safe";
  
  const now = new Date();
  const expDate = new Date(expiryDate);
  
  // Calculate difference in milliseconds
  const diffMs = expDate.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return "expired";
  if (diffDays <= 2) return "urgent"; // Less than 48 hours
  if (diffDays <= 7) return "soon";   // Within a week
  return "safe";
}

/**
 * 1.1 Fetch real product data from Open Food Facts
 */
export async function fetchProductFromBarcode(barcode) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await res.json();
    if (data.status === 1 && data.product) {
      return {
        name: data.product.product_name || data.product.generic_name || 'Unknown Product',
        image: data.product.image_url || data.product.image_front_url || null,
        category: data.product.categories_tags?.[0]?.split(':')?.[1] || 'Others',
      };
    }
  } catch (e) {
    console.warn('Open Food Facts lookup failed:', e);
  }
  return null;
}

/**
 * 2. AI Expiry Prediction (if no date given)
 */
export function predictExpiry(productName) {
  if (!productName) return 7;
  const rules = {
    milk: 7, bread: 5, cooked: 2, canned: 365, noodles: 180,
    egg: 21, meat: 3, chicken: 3, fish: 2, cheese: 14,
    yogurt: 10, butter: 30, fruit: 5, vegetable: 7, rice: 365,
    pasta: 365, sauce: 14, juice: 7, soda: 180,
  };
  const nameLower = productName.toLowerCase();
  const key = Object.keys(rules).find(k => nameLower.includes(k));
  return key ? rules[key] : 7;
}

/**
 * 3. Smart Recommendation
 */
export function getRecommendation(item) {
  if (!item || !item.status) return "Safe to store";
  if (item.status === "expired") return "Discard immediately";
  if (item.status === "urgent") return "Use today or cook now";
  if (item.status === "soon") return "Plan meals soon";
  return "Safe to store";
}

/**
 * 4. Quick Recipe Suggestion (for banner)
 */
export function suggestRecipe(items) {
  if (!items || items.length === 0) return "Add items to get recipe ideas.";
  const names = items.map(i => i.name.toLowerCase());
  if (names.some(n => n.includes("egg")) && names.some(n => n.includes("bread"))) return "Make French Toast 🍞";
  if (names.some(n => n.includes("sardines"))) return "Cook sardines with noodles 🍝";
  if (names.some(n => n.includes("chicken")) && names.some(n => n.includes("rice"))) return "Chicken Fried Rice 🍗";
  return "Create a simple mixed dish 🍳";
}

/**
 * 5. Product Image URL Lookup
 * Returns a relevant food image from Unsplash (free, no auth required)
 */
export function getProductImage(itemName) {
  if (!itemName) return null;
  const name = itemName.toLowerCase();
  const imageMap = {
    egg: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=200&q=80',
    bread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80',
    milk: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&q=80',
    chicken: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=200&q=80',
    rice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&q=80',
    pasta: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200&q=80',
    noodle: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=200&q=80',
    sardine: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&q=80',
    cheese: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=200&q=80',
    tomato: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=200&q=80',
    apple: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=200&q=80',
    banana: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&q=80',
    yogurt: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=200&q=80',
    butter: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=200&q=80',
    juice: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=200&q=80',
    fish: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&q=80',
    meat: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200&q=80',
    garlic: 'https://images.unsplash.com/photo-1538260407527-fc36a0baa4e2?w=200&q=80',
    onion: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=200&q=80',
    carrot: 'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=200&q=80',
  };
  const key = Object.keys(imageMap).find(k => name.includes(k));
  return key ? imageMap[key] : 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80';
}

/**
 * 6. Full Recipe Database
 */
export const RECIPE_DATABASE = [
  {
    id: 'french-toast',
    keywords: ['egg', 'bread'],
    name: 'French Toast',
    emoji: '🍞',
    description: 'A classic breakfast dish using eggs and bread — sweet, golden, and delicious.',
    time: '15 mins',
    difficulty: 'Easy',
    servings: 2,
    ingredients: [
      '2 slices of bread',
      '2 eggs',
      '¼ cup milk',
      '1 tsp vanilla extract',
      '1 tbsp butter',
      'Maple syrup & powdered sugar to serve',
    ],
    steps: [
      'Whisk eggs, milk, and vanilla together in a shallow bowl.',
      'Dip each bread slice in the egg mixture, coating both sides well.',
      'Heat butter in a pan over medium heat until melted.',
      'Cook each bread slice for 2–3 minutes per side until golden brown.',
      'Serve immediately with maple syrup and powdered sugar.',
    ],
    image: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&q=80',
  },
  {
    id: 'sardines-noodles',
    keywords: ['sardine', 'noodle'],
    name: 'Sardines with Noodles',
    emoji: '🍝',
    description: 'Quick and savory Filipino-style noodle dish using canned sardines.',
    time: '20 mins',
    difficulty: 'Easy',
    servings: 2,
    ingredients: [
      '1 can sardines in tomato sauce',
      '200g noodles',
      '3 cloves garlic, minced',
      '1 onion, diced',
      'Salt, pepper, and soy sauce to taste',
      '2 tbsp cooking oil',
    ],
    steps: [
      'Cook noodles according to package instructions, then set aside.',
      'Heat oil in a pan. Sauté garlic and onion until fragrant.',
      'Add sardines (with sauce) and break them up gently.',
      'Toss in the cooked noodles and mix everything together.',
      'Season with soy sauce, salt, and pepper.',
      'Serve hot with a lime wedge.',
    ],
    image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80',
  },
  {
    id: 'chicken-fried-rice',
    keywords: ['chicken', 'rice'],
    name: 'Chicken Fried Rice',
    emoji: '🍗',
    description: 'Classic fried rice with tender chicken pieces, soy sauce, and vegetables.',
    time: '25 mins',
    difficulty: 'Medium',
    servings: 3,
    ingredients: [
      '2 cups day-old cooked rice',
      '1 chicken breast, diced',
      '2 eggs',
      '½ cup frozen peas & carrots',
      '3 tbsp soy sauce',
      '2 cloves garlic',
      '2 tbsp sesame oil',
    ],
    steps: [
      'Heat sesame oil in a wok over high heat.',
      'Add garlic and stir-fry for 30 seconds.',
      'Add chicken and cook until no longer pink (about 5 mins).',
      'Push everything to the side and scramble the eggs in the center.',
      'Add rice and toss everything together vigorously.',
      'Add vegetables and soy sauce. Stir-fry for 3 more minutes.',
      'Taste and adjust seasoning. Serve hot.',
    ],
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80',
  },
  {
    id: 'grilled-cheese',
    keywords: ['bread', 'cheese'],
    name: 'Grilled Cheese Sandwich',
    emoji: '🧀',
    description: 'The ultimate comfort food — crispy bread with perfectly melted cheese.',
    time: '10 mins',
    difficulty: 'Easy',
    servings: 1,
    ingredients: [
      '2 slices bread',
      '2 slices cheddar or mozzarella cheese',
      '1 tbsp butter',
    ],
    steps: [
      'Butter one side of each bread slice.',
      'Place cheese slices on the non-buttered side of one slice.',
      'Top with the second slice, buttered side out.',
      'Heat a pan over medium-low heat.',
      'Cook for 2–3 minutes per side until golden and cheese is melted.',
      'Slice diagonally and serve immediately.',
    ],
    image: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=600&q=80',
  },
  {
    id: 'simple-custard',
    keywords: ['milk', 'egg'],
    name: 'Simple Custard',
    emoji: '🍮',
    description: 'A silky, smooth custard dessert made with everyday pantry items.',
    time: '60 mins',
    difficulty: 'Medium',
    servings: 4,
    ingredients: [
      '2 cups whole milk',
      '3 eggs',
      '½ cup sugar',
      '1 tsp vanilla extract',
      'Pinch of salt',
    ],
    steps: [
      'Preheat oven to 175°C (350°F).',
      'Warm the milk in a saucepan over medium heat until just simmering.',
      'Whisk eggs, sugar, vanilla, and salt until smooth.',
      'Slowly pour warm milk into the egg mixture while stirring constantly.',
      'Strain and pour into ramekins.',
      'Place ramekins in a baking dish with 1 inch of hot water.',
      'Bake for 40–45 minutes until just set. Cool before serving.',
    ],
    image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=80',
  },
  {
    id: 'banana-smoothie',
    keywords: ['banana', 'milk'],
    name: 'Banana Smoothie',
    emoji: '🍌',
    description: 'A quick and nutritious blended drink perfect for breakfast or a snack.',
    time: '5 mins',
    difficulty: 'Easy',
    servings: 1,
    ingredients: [
      '2 ripe bananas',
      '1 cup cold milk',
      '1 tbsp honey (optional)',
      '½ tsp vanilla extract',
      'Ice cubes',
    ],
    steps: [
      'Peel and slice bananas.',
      'Add bananas, milk, honey, and vanilla to a blender.',
      'Add a handful of ice cubes.',
      'Blend until smooth and creamy.',
      'Pour into a glass and serve immediately.',
    ],
    image: 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=600&q=80',
  },
  {
    id: 'garlic-butter-pasta',
    keywords: ['pasta', 'garlic', 'butter'],
    name: 'Garlic Butter Pasta',
    emoji: '🍝',
    description: 'Simple yet incredibly flavorful pasta in a rich garlic-butter sauce.',
    time: '20 mins',
    difficulty: 'Easy',
    servings: 2,
    ingredients: [
      '200g spaghetti or pasta',
      '4 cloves garlic, minced',
      '3 tbsp butter',
      '2 tbsp olive oil',
      'Fresh parsley',
      'Salt, pepper, and Parmesan cheese',
    ],
    steps: [
      'Cook pasta according to package instructions. Reserve ½ cup pasta water.',
      'While pasta cooks, melt butter and olive oil in a large pan over medium heat.',
      'Add garlic and sauté for 1–2 minutes until fragrant (do not burn).',
      'Add drained pasta and toss well, adding pasta water to loosen.',
      'Season with salt and pepper. Top with parsley and Parmesan.',
      'Serve immediately.',
    ],
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80',
  },
  {
    id: 'tomato-scrambled-eggs',
    keywords: ['egg', 'tomato'],
    name: 'Tomato Scrambled Eggs',
    emoji: '🍳',
    description: 'A popular Chinese-style scrambled egg dish with juicy tomatoes.',
    time: '10 mins',
    difficulty: 'Easy',
    servings: 2,
    ingredients: [
      '3 eggs',
      '2 tomatoes, cut into wedges',
      '1 tbsp soy sauce',
      '1 tsp sugar',
      '2 tbsp cooking oil',
      'Salt to taste',
      'Spring onion for garnish',
    ],
    steps: [
      'Beat eggs with a pinch of salt.',
      'Heat 1 tbsp oil in a pan, add eggs and scramble lightly. Set aside.',
      'Add remaining oil, then stir-fry tomatoes for 2 minutes.',
      'Add soy sauce and sugar, stir to combine.',
      'Return eggs to the pan and toss everything together.',
      'Garnish with spring onion and serve with rice.',
    ],
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
  },
];

/**
 * 7. Match recipes against pantry items
 */
export function getMatchingRecipes(items) {
  if (!items || items.length === 0) return [];
  const names = items.map(i => i.name.toLowerCase());
  const expiringNames = items
    .filter(i => i.status === 'soon' || i.status === 'urgent')
    .map(i => i.name.toLowerCase());

  const matched = [];
  for (const recipe of RECIPE_DATABASE) {
    const matchCount = recipe.keywords.filter(kw => names.some(n => n.includes(kw))).length;
    if (matchCount > 0) {
      const expiryBoost = recipe.keywords.filter(kw => expiringNames.some(n => n.includes(kw))).length;
      matched.push({ ...recipe, matchCount, expiryBoost });
    }
  }
  // Prioritize expiring items, then match count
  matched.sort((a, b) => (b.expiryBoost - a.expiryBoost) || (b.matchCount - a.matchCount));
  return matched;
}

/**
 * 8. Robust Expiry Date Extraction from OCR
 */

const MONTH_MAP = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, TUL: 6, // Common OCR mistake
  AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
};

export function cleanOCRText(text) {
  if (!text) return "";
  return text.toUpperCase()
    .replace(/TUL/g, "JUL")
    .replace(/[OI]/g, (match) => match === 'O' ? '0' : '1') // O -> 0, I -> 1
    .replace(/S/g, "5")
    .replace(/[^A-Z0-9\/\-\.\s,]/g, ""); // Remove noise
}

export function parseExpiryDate(rawText) {
  if (!rawText) return null;
  const text = cleanOCRText(rawText);
  
  const patterns = [
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/,      // 21/07/2026
    /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,      // 2026-07-21
    /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})(?!\d)/, // 21/07/26
    /(\d{1,2})\s+([A-Z]{3})[A-Z]*\s+(\d{2,4})/,      // 21 JUL 2026
    /([A-Z]{3})[A-Z]*\s+(\d{1,2}),?\s+(\d{2,4})/,    // JUL 21, 2026
    /(?:EXP|BEST|BY|BEFORE|BB|E)\s*(\d{1,2})[A-Z\s]+(\d{2,4})/i, // EXP JUL 2026
  ];

  const candidates = [];

  for (const pattern of patterns) {
    const matches = text.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      try {
        let d, m, y;
        
        // Pattern specific mapping
        if (MONTH_MAP[match[2]]) { // DD MON YYYY
          d = parseInt(match[1]);
          m = MONTH_MAP[match[2]];
          y = parseInt(match[3]);
        } else if (MONTH_MAP[match[1]]) { // MON DD YYYY
          m = MONTH_MAP[match[1]];
          d = parseInt(match[2]);
          y = parseInt(match[3]);
        } else if (parseInt(match[1]) > 1000) { // YYYY-MM-DD
          y = parseInt(match[1]);
          m = parseInt(match[2]) - 1;
          d = parseInt(match[3]);
        } else { // DD/MM/YYYY or MM/DD/YYYY (Assume DD/MM if first <= 12 and second > 12, or just stick to standard)
          // We'll prioritize DD/MM/YYYY for general use
          d = parseInt(match[1]);
          m = parseInt(match[2]) - 1;
          y = parseInt(match[3]);
          if (m > 11) { // Flip if it looks like MM/DD
            [d, m] = [m + 1, d - 1]; 
          }
        }

        if (y < 100) y += 2000;
        
        // Validation: 5-digit years or impossible months/days
        if (y > 2100 || y < 2020 || m < 0 || m > 11 || d < 1 || d > 31) continue;
        
        const date = new Date(y, m, d);
        if (!isNaN(date.getTime())) candidates.push(date);
      } catch (e) {}
    }
  }

  if (candidates.length === 0) return null;
  
  // Return the date furthest in the future (most likely the expiry, not production date)
  return new Date(Math.max(...candidates.map(c => c.getTime())));
}

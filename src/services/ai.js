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
 * 2. Expiry prediction (when the user hasn't given a date)
 *
 * Returns the typical shelf life in DAYS for the given product name.
 * Numbers reflect USDA / FoodKeeper / FDA published guidelines for the
 * most common form of each item — sealed in original packaging, refrigerated
 * where applicable. Opened or cooked items are noted explicitly.
 *
 * Matching uses the LONGEST key first so e.g. "ground beef" is matched
 * before "beef", and "buttermilk" before "butter".
 */
const SHELF_LIFE_DAYS = {
  // ── Fresh produce (refrigerated) ──────────────────────
  'avocado': 5, 'banana': 5, 'strawberry': 5, 'raspberry': 5, 'blackberry': 5,
  'blueberry': 7, 'mango': 7, 'pineapple': 5, 'grape': 7, 'peach': 5,
  'plum': 5, 'cherry': 7, 'pear': 14, 'orange': 14, 'lemon': 21,
  'lime': 21, 'apple': 30, 'watermelon': 7, 'melon': 7, 'kiwi': 14,
  'tomato': 7, 'cucumber': 7, 'lettuce': 7, 'spinach': 5, 'kale': 7,
  'broccoli': 7, 'cauliflower': 7, 'cabbage': 21, 'celery': 14,
  'mushroom': 7, 'bell pepper': 14, 'pepper': 14, 'eggplant': 7,
  'zucchini': 7, 'asparagus': 5, 'green bean': 7, 'corn': 5,
  'carrot': 30, 'potato': 30, 'onion': 30, 'garlic': 90, 'ginger': 21,
  'sweet potato': 21, 'beetroot': 21, 'beet': 21,
  'fruit': 7, 'vegetable': 7, 'salad': 5, 'herb': 7,

  // ── Dairy ─────────────────────────────────────────────
  'whole milk': 14, 'skim milk': 14, 'almond milk': 7, 'oat milk': 7,
  'soy milk': 7, 'condensed milk': 730, 'evaporated milk': 730,
  'buttermilk': 14, 'milk': 14,
  'heavy cream': 14, 'whipping cream': 14, 'sour cream': 21, 'cream': 14,
  'greek yogurt': 21, 'yogurt': 21,
  'cottage cheese': 14, 'cream cheese': 21, 'mozzarella': 21,
  'cheddar': 180, 'parmesan': 365, 'feta': 30, 'brie': 14, 'gouda': 90,
  'cheese': 21,
  'butter': 60, 'margarine': 90,

  // ── Eggs ──────────────────────────────────────────────
  'hard boiled egg': 7, 'egg white': 4, 'egg': 35,

  // ── Meat & poultry (raw, refrigerated) ────────────────
  'ground beef': 2, 'ground pork': 2, 'ground chicken': 2,
  'ground turkey': 2, 'ground meat': 2,
  'chicken breast': 2, 'chicken thigh': 2, 'chicken wing': 2,
  'whole chicken': 2, 'chicken': 2, 'turkey': 2, 'duck': 2,
  'steak': 5, 'beef': 5, 'pork chop': 5, 'pork': 5, 'lamb': 5, 'veal': 5,
  'bacon': 7, 'sausage': 7, 'hot dog': 14, 'ham': 7,
  'salami': 21, 'pepperoni': 21, 'prosciutto': 30, 'deli meat': 5,
  'meat': 3,

  // ── Fish & seafood (raw, refrigerated) ────────────────
  'salmon': 2, 'tuna steak': 2, 'shrimp': 2, 'prawn': 2,
  'crab': 2, 'lobster': 2, 'mussel': 2, 'clam': 2, 'oyster': 2,
  'fish': 2, 'seafood': 2,

  // ── Canned goods (sealed, pantry) ─────────────────────
  'canned tuna': 1095, 'canned sardines': 1095, 'canned salmon': 1095,
  'canned beans': 1095, 'canned corn': 1095, 'canned soup': 730,
  'canned tomato': 730, 'canned fruit': 540, 'canned vegetable': 730,
  'corned beef': 1095, 'spam': 1095, 'sardines': 1095,
  'tuna': 1095, 'canned': 730,

  // ── Bakery ────────────────────────────────────────────
  'baguette': 3, 'sourdough': 7, 'whole wheat bread': 5, 'tortilla': 14,
  'pita': 7, 'bagel': 7, 'roll': 5, 'bun': 5, 'croissant': 3,
  'muffin': 5, 'donut': 3, 'doughnut': 3, 'cake': 5, 'cupcake': 5,
  'pastry': 5, 'pie': 4, 'bread': 7,

  // ── Pantry staples (dry, sealed) ──────────────────────
  'white rice': 1825, 'brown rice': 365, 'jasmine rice': 1825,
  'basmati rice': 1825, 'rice': 1095,
  'spaghetti': 730, 'macaroni': 730, 'pasta': 730,
  'instant noodle': 365, 'ramen': 365, 'noodle': 365,
  'flour': 365, 'whole wheat flour': 180, 'almond flour': 180,
  'sugar': 1825, 'brown sugar': 730, 'salt': 1825,
  'oat': 730, 'oats': 730, 'oatmeal': 730, 'cereal': 365, 'granola': 180,
  'quinoa': 730, 'couscous': 730, 'lentil': 730, 'bean': 730,

  // ── Beverages ─────────────────────────────────────────
  'orange juice': 14, 'apple juice': 14, 'juice': 14,
  'soda': 270, 'cola': 270, 'sparkling water': 270, 'water': 730,
  'beer': 180, 'wine': 1095, 'spirit': 3650, 'vodka': 3650, 'whiskey': 3650,
  'coffee bean': 365, 'ground coffee': 180, 'instant coffee': 730, 'coffee': 365,
  'green tea': 730, 'tea': 730, 'energy drink': 270, 'sports drink': 270,

  // ── Sauces, condiments & spreads ──────────────────────
  'ketchup': 365, 'mustard': 365, 'mayonnaise': 60, 'mayo': 60,
  'soy sauce': 730, 'fish sauce': 730, 'oyster sauce': 365,
  'hot sauce': 730, 'sriracha': 730, 'tabasco': 1825,
  'vinegar': 1825, 'olive oil': 540, 'cooking oil': 365, 'oil': 365,
  'jam': 365, 'jelly': 365, 'marmalade': 365, 'honey': 3650,
  'peanut butter': 540, 'almond butter': 365, 'nutella': 365,
  'salsa': 60, 'pesto': 14, 'gravy': 60, 'sauce': 60,

  // ── Snacks (sealed) ───────────────────────────────────
  'chocolate': 365, 'dark chocolate': 730, 'candy': 365,
  'chips': 60, 'crisps': 60, 'pretzel': 90, 'popcorn': 180,
  'cracker': 90, 'cookie': 30, 'biscuit': 60, 'gum': 365,
  'nuts': 365, 'almond': 365, 'cashew': 365, 'walnut': 180,
  'raisin': 365, 'dried fruit': 180,

  // ── Frozen ────────────────────────────────────────────
  'ice cream': 60, 'frozen pizza': 180, 'frozen vegetable': 365,
  'frozen meat': 180, 'frozen': 180,

  // ── Cooked / leftovers ────────────────────────────────
  'leftover': 4, 'cooked rice': 5, 'cooked chicken': 4,
  'cooked pasta': 5, 'cooked': 4, 'soup': 4, 'stew': 4,
};

const CATEGORY_FALLBACK_DAYS = {
  'Fresh Produce': 7,
  'Dairy & Eggs': 14,
  'Meat & Poultry': 3,
  'Fish & Seafood': 2,
  'Bakery': 7,
  'Grains & Rice': 365,
  'Canned Goods': 730,
  'Snacks': 90,
  'Beverages': 180,
  'Others': 14,
};

// Cache the longest-first key list so we don't re-sort on every call.
const _SORTED_KEYS = Object.keys(SHELF_LIFE_DAYS).sort((a, b) => b.length - a.length);

export function predictExpiry(productName, category) {
  if (productName) {
    const name = productName.toLowerCase().trim();
    for (const key of _SORTED_KEYS) {
      // word-boundary-ish match: substring is fine here because longer keys
      // are tested first ("ground beef" before "beef", "buttermilk" before "butter")
      if (name.includes(key)) return SHELF_LIFE_DAYS[key];
    }
  }
  if (category && CATEGORY_FALLBACK_DAYS[category] != null) {
    return CATEGORY_FALLBACK_DAYS[category];
  }
  return 7;
}

/**
 * Format a day-count as a friendly duration: "5 days", "3 weeks", "2 months", "1 year".
 */
export function formatShelfLife(days) {
  if (days == null) return '';
  if (days < 14) return `${days} day${days === 1 ? '' : 's'}`;
  if (days < 60) {
    const w = Math.round(days / 7);
    return `${w} week${w === 1 ? '' : 's'}`;
  }
  if (days < 365) {
    const m = Math.round(days / 30);
    return `${m} month${m === 1 ? '' : 's'}`;
  }
  const y = Math.round(days / 365);
  return `${y} year${y === 1 ? '' : 's'}`;
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
  const key = Object.keys(imageMap).find(k => name.toLowerCase().includes(k));
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
    id: 'meat-loaf-fried-rice',
    keywords: ['meat loaf', 'rice'],
    name: 'Meat Loaf Fried Rice',
    emoji: '🍚',
    description: 'A savory twist on fried rice using diced meat loaf for extra flavor.',
    time: '15 mins',
    difficulty: 'Easy',
    servings: 2,
    ingredients: ['150g meat loaf, diced', '2 cups cooked rice', '1 egg', 'Garlic', 'Soy sauce'],
    steps: ['Fry meat loaf until crispy.', 'Add garlic and egg.', 'Toss in rice and soy sauce.', 'Mix well and serve.'],
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80',
  },
  {
    id: 'tuna-pasta-salad',
    keywords: ['tuna', 'pasta'],
    name: 'Creamy Tuna Pasta',
    emoji: '🥗',
    description: 'A quick, filling pasta dish using pantry staples.',
    time: '15 mins',
    difficulty: 'Easy',
    servings: 2,
    ingredients: ['1 can tuna', '200g pasta', 'Mayonnaise', 'Onion', 'Black pepper'],
    steps: ['Boil pasta.', 'Drain tuna and mix with mayo and onions.', 'Combine with pasta.', 'Chill or serve warm.'],
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
  },
  {
    id: 'tuna-sandwich',
    keywords: ['tuna', 'bread'],
    name: 'Classic Tuna Melt',
    emoji: '🥪',
    description: 'Crispy toasted bread with savory tuna filling.',
    time: '10 mins',
    difficulty: 'Easy',
    servings: 1,
    ingredients: ['1 can tuna', '2 slices bread', 'Cheese', 'Butter'],
    steps: ['Mix tuna with a little mayo.', 'Spread on bread with cheese.', 'Grill with butter until golden.'],
    image: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?w=600&q=80',
  },
  {
    id: 'pantry-omelette',
    keywords: ['egg', 'tomato', 'onion'],
    name: 'Garden Omelette',
    emoji: '🍳',
    description: 'A fresh and healthy breakfast using basic vegetables.',
    time: '8 mins',
    difficulty: 'Easy',
    servings: 1,
    ingredients: ['2 eggs', '1 tomato', '1/2 onion', 'Salt & Pepper'],
    steps: ['Sauté onions and tomatoes.', 'Pour beaten eggs over.', 'Fold and serve when set.'],
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80',
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
  {
    id: 'tuna-patties',
    keywords: ['tuna', 'egg'],
    name: 'Golden Tuna Patties',
    emoji: '🍘',
    description: 'Pan-fried tuna cakes that are crispy on the outside and tender inside.',
    time: '20 mins',
    difficulty: 'Medium',
    servings: 2,
    ingredients: ['1 can tuna', '1 egg', 'Breadcrumbs', 'Garlic powder'],
    steps: ['Mix all ingredients.', 'Form into small patties.', 'Fry in oil until golden brown.'],
    image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&q=80',
  },
  {
    id: 'quick-ramen-upgrade',
    keywords: ['noodle', 'egg'],
    name: 'Fancy Pantry Ramen',
    emoji: '🍜',
    description: 'Elevate simple instant noodles with a soft-boiled egg and aromatics.',
    time: '10 mins',
    difficulty: 'Easy',
    servings: 1,
    ingredients: ['1 pack instant noodles', '1 egg', 'Garlic', 'Spring onions'],
    steps: ['Cook noodles.', 'Add egg (poached or boiled).', 'Garnish with garlic and onions.'],
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
  },
  {
    id: 'meat-loaf-stew',
    keywords: ['meat loaf', 'tomato'],
    name: 'Savory Meat Loaf Stew',
    emoji: '🍲',
    description: 'A comforting stew using sliced meat loaf in a rich tomato base.',
    time: '25 mins',
    difficulty: 'Medium',
    servings: 3,
    ingredients: ['1 can meat loaf', 'Tomato sauce', 'Potato', 'Carrot'],
    steps: ['Sauté diced meat loaf.', 'Add veggies and tomato sauce.', 'Simmer until tender.'],
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80',
  },
  {
    id: 'banana-pancakes',
    keywords: ['banana', 'egg'],
    name: '2-Ingredient Pancakes',
    emoji: '🥞',
    description: 'Healthy and naturally sweet pancakes made with just bananas and eggs.',
    time: '12 mins',
    difficulty: 'Easy',
    servings: 2,
    ingredients: ['2 ripe bananas', '2 eggs'],
    steps: ['Mash bananas.', 'Whisk in eggs.', 'Cook small portions in a pan.'],
    image: 'https://images.unsplash.com/photo-1528452697241-c390a2ec4651?w=600&q=80',
  },
  {
    id: 'garlic-rice',
    keywords: ['rice', 'garlic'],
    name: 'Filipino Sinangag',
    emoji: '🧄',
    description: 'The ultimate breakfast side dish — aromatic garlic fried rice.',
    time: '10 mins',
    difficulty: 'Easy',
    servings: 2,
    ingredients: ['2 cups leftover rice', '4 cloves garlic', 'Oil', 'Salt'],
    steps: ['Fry minced garlic until golden.', 'Add rice and toss.', 'Season with salt.'],
    image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&q=80',
  },
  {
    id: 'tuna-tofu-stirfry',
    keywords: ['tuna', 'onion'],
    name: 'Tuna & Onion Sauté',
    emoji: '🥘',
    description: 'A quick and cheap savory stir-fry perfect with rice.',
    time: '10 mins',
    difficulty: 'Easy',
    servings: 1,
    ingredients: ['1 can tuna', '1 large onion', 'Soy sauce', 'Calamansi or Lemon'],
    steps: ['Caramelize onions.', 'Add tuna (drained).', 'Splash of soy sauce and citrus.'],
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80',
  },
];

/**
 * 7. Match recipes against pantry items
 */
export function getMatchingRecipes(items) {
  if (!items || items.length === 0) return [];
  const names = items.map(i => i.name.toLowerCase());
  const expiringNames = items
    .filter(i => i.status === 'urgent' || i.status === 'soon')
    .map(i => i.name.toLowerCase());

  return RECIPE_DATABASE.filter(recipe => {
    // Priority 1: Uses expiring items
    const hasExpiring = recipe.keywords.some(k => expiringNames.some(en => en.includes(k)));
    if (hasExpiring) return true;

    // Priority 2: Has most ingredients
    const matchCount = recipe.keywords.filter(k => names.some(n => n.includes(k))).length;
    return matchCount >= 1;
  });
}

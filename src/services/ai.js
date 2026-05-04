// AI Features for ShelfSense

/**
 * 1. Expiry Status Detection
 * Determines the status of an item based on its expiry date.
 */
export function getStatus(expiryDate) {
  if (!expiryDate) return "safe";
  
  const today = new Date();
  const expDate = new Date(expiryDate);
  const diff = (expDate - today) / (1000 * 60 * 60 * 24);

  if (diff <= 0) return "expired";
  if (diff <= 2) return "urgent";
  if (diff <= 5) return "soon";
  return "safe";
}

/**
 * 2. AI Expiry Prediction
 * Predicts expiry days based on product name if no date is provided.
 */
export function predictExpiry(productName) {
  if (!productName) return 7;

  const rules = {
    milk: 7,
    bread: 5,
    cooked: 2,
    canned: 365,
    noodles: 180,
    egg: 21,
    meat: 3,
    chicken: 3,
    fish: 2,
    cheese: 14,
  };

  const nameLower = productName.toLowerCase();
  const key = Object.keys(rules).find(k => nameLower.includes(k));

  return key ? rules[key] : 7; // Default to 7 days if unknown
}

/**
 * 3. Smart Recommendation System
 * Provides an action recommendation based on item status.
 */
export function getRecommendation(item) {
  if (!item || !item.status) return "Safe to store";
  
  if (item.status === "expired") {
    return "Discard immediately";
  }
  if (item.status === "urgent") {
    return "Use today or cook now";
  }
  if (item.status === "soon") {
    return "Plan meals soon";
  }
  return "Safe to store";
}

/**
 * 4. Recipe Suggestion
 * Suggests simple recipes based on a list of items.
 */
export function suggestRecipe(items) {
  if (!items || items.length === 0) return "Add items to get recipe ideas.";

  const names = items.map(i => i.name.toLowerCase());

  if (names.some(n => n.includes("egg")) && names.some(n => n.includes("bread"))) {
    return "Make French Toast";
  }

  if (names.some(n => n.includes("sardines"))) {
    return "Cook sardines with noodles";
  }
  
  if (names.some(n => n.includes("chicken")) && names.some(n => n.includes("rice"))) {
    return "Chicken fried rice";
  }

  return "Create a simple mixed dish";
}

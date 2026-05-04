import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStatus, predictExpiry } from './ai';

const ITEMS_KEY = 'shelfsense_items';

// Get all items from local storage
const getStoredItems = async () => {
  try {
    const json = await AsyncStorage.getItem(ITEMS_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error('Error reading items:', error);
    return [];
  }
};

// Save all items to local storage
const saveItems = async (items) => {
  try {
    await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving items:', error);
    throw error;
  }
};

// Add a new item
export const addItem = async (itemData) => {
  const items = await getStoredItems();
  const status = getStatus(itemData.expiryDate);

  const newItem = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: itemData.name,
    category: itemData.category,
    expiryDate: itemData.expiryDate,
    status,
    createdAt: new Date().toISOString(),
  };

  items.push(newItem);
  await saveItems(items);
  return newItem;
};

// Subscribe to items (polls storage and calls callback)
// Returns an unsubscribe function
export const subscribeToItems = (callback) => {
  let active = true;

  const fetchItems = async () => {
    const items = await getStoredItems();
    // Re-calculate status for each item on every fetch
    const updatedItems = items.map(item => ({
      ...item,
      status: getStatus(item.expiryDate),
    }));
    // Sort by expiry date ascending
    updatedItems.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    if (active) {
      callback(updatedItems);
    }
  };

  // Fetch immediately
  fetchItems();

  // Poll every 2 seconds so the UI stays fresh
  const interval = setInterval(fetchItems, 2000);

  return () => {
    active = false;
    clearInterval(interval);
  };
};

// Update an existing item
export const updateItem = async (itemId, updatedData) => {
  const items = await getStoredItems();
  const index = items.findIndex(i => i.id === itemId);

  if (index === -1) throw new Error('Item not found');

  const status = updatedData.expiryDate
    ? getStatus(updatedData.expiryDate)
    : items[index].status;

  items[index] = { ...items[index], ...updatedData, status };
  await saveItems(items);
  return items[index];
};

// Delete an item
export const deleteItem = async (itemId) => {
  const items = await getStoredItems();
  const filtered = items.filter(i => i.id !== itemId);
  await saveItems(filtered);
};

// Get all items (one-time fetch, not subscription)
export const getAllItems = async () => {
  const items = await getStoredItems();
  return items.map(item => ({
    ...item,
    status: getStatus(item.expiryDate),
  }));
};

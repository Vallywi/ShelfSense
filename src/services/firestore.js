import { getStatus } from './ai';
import { fetchItems, addItemAPI, updateItemAPI, deleteItemAPI } from './api';

// Add a new item via backend
export const addItem = async (itemData) => {
  const status = getStatus(itemData.expiryDate);
  const data = await addItemAPI({
    name: itemData.name,
    category: itemData.category,
    quantity: itemData.quantity,
    expiryDate: itemData.expiryDate,
    imageUrl: itemData.imageUrl, // Save real product image
    status,
  });
  return data.item;
};

// Subscribe to items (polls backend every 3s)
export const subscribeToItems = (callback) => {
  let active = true;

  const fetchAll = async () => {
    try {
      const data = await fetchItems();
      const items = (data.items || []).map(item => ({
        ...item,
        status: getStatus(item.expiryDate),
      }));
      items.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
      if (active) callback(items);
    } catch (e) {
      console.warn('Item fetch error:', e.message);
      if (active) callback([]);
    }
  };

  fetchAll();
  const interval = setInterval(fetchAll, 3000);

  return () => {
    active = false;
    clearInterval(interval);
  };
};

// Update an existing item via backend
export const updateItem = async (itemId, updatedData) => {
  const status = updatedData.expiryDate ? getStatus(updatedData.expiryDate) : undefined;
  const dataToUpdate = { ...updatedData };
  if (status) dataToUpdate.status = status;
  const data = await updateItemAPI(itemId, dataToUpdate);
  return data.item;
};

// Update item quantity directly
export const updateItemQuantity = async (itemId, currentQuantity, delta) => {
  // Extract number from string if needed (e.g. "2 boxes" -> 2)
  const match = String(currentQuantity).match(/^(\d+)/);
  let num = match ? parseInt(match[1]) : 1;
  const suffix = String(currentQuantity).replace(/^\d+/, '').trim();
  
  num = Math.max(0, num + delta);
  const newQuantity = suffix ? `${num} ${suffix}` : `${num}`;
  
  return updateItem(itemId, { quantity: newQuantity });
};

// Mark item as consumed (delete it)
export const consumeItem = async (itemId) => {
  return deleteItemAPI(itemId);
};

// Delete an item via backend
export const deleteItem = async (itemId) => {
  return deleteItemAPI(itemId);
};

// Get all items (one-time fetch)
export const getAllItems = async () => {
  const data = await fetchItems();
  return (data.items || []).map(item => ({
    ...item,
    status: getStatus(item.expiryDate),
  }));
};

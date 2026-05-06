import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Auto-detect API URL
const getBaseUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const { hostname, port, origin } = window.location;
    // When running Expo dev (localhost:8081 / :19006), the API server lives on :3000
    const isExpoDev = (hostname === 'localhost' || hostname === '127.0.0.1') &&
      (port === '8081' || port === '19006');
    if (isExpoDev) return `http://${hostname}:3000`;
    // Otherwise use same origin (works on Vercel deploy)
    return origin;
  }
  // Native local development fallback
  return 'http://localhost:3000';
};

const API_BASE = getBaseUrl();
const TOKEN_KEY = 'shelfsense_jwt_token';

// ─── Token Management ─────────────────────────────────────────────
export async function getToken() {
  try { return await AsyncStorage.getItem(TOKEN_KEY); }
  catch { return null; }
}

export async function setToken(token) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function removeToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// ─── Core Request Helper ──────────────────────────────────────────
async function apiRequest(endpoint, options = {}) {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

// ─── Auth API ─────────────────────────────────────────────────────
export async function registerUser(name, email, password) {
  const data = await apiRequest('/api/auth?action=register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  await setToken(data.token);
  return data;
}

export async function loginUser(email, password) {
  const data = await apiRequest('/api/auth?action=login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  await setToken(data.token);
  return data;
}

export async function getCurrentUser() {
  return apiRequest('/api/me');
}

export async function updateUserProfile(updates) {
  return apiRequest('/api/me', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function logoutUser() {
  await removeToken();
}

// ─── Pantries API ─────────────────────────────────────────────────
export async function fetchPantries() {
  return apiRequest('/api/pantries');
}

export async function createPantry(name) {
  return apiRequest('/api/pantries', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function fetchPantryDetail(pantryId) {
  return apiRequest(`/api/pantries/${pantryId}`);
}

export async function joinPantry(inviteCode) {
  return apiRequest('/api/pantries?action=join', {
    method: 'POST',
    body: JSON.stringify({ inviteCode }),
  });
}

export async function deletePantry(pantryId) {
  return apiRequest(`/api/pantries/${pantryId}`, { method: 'DELETE' });
}

export async function removeMemberAPI(pantryId, memberId) {
  return apiRequest('/api/pantries?action=remove', {
    method: 'DELETE',
    body: JSON.stringify({ pantryId, memberId }),
  });
}

// ─── Chef Assistant API ──────────────────────────────────────────
export async function chatWithChef(message, items = [], history = []) {
  return apiRequest('/api/chef', {
    method: 'POST',
    body: JSON.stringify({ message, items, history }),
  });
}

// ─── Items API ────────────────────────────────────────────────────
export async function fetchItems(pantryId) {
  const query = pantryId ? `?pantryId=${pantryId}` : '';
  return apiRequest(`/api/items${query}`);
}

export async function addItemAPI(itemData) {
  return apiRequest('/api/items', {
    method: 'POST',
    body: JSON.stringify(itemData),
  });
}

export async function updateItemAPI(itemId, updates) {
  return apiRequest(`/api/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteItemAPI(itemId) {
  return apiRequest(`/api/items/${itemId}`, { method: 'DELETE' });
}

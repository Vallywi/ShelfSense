// Browser-first notification service for ShelfSense.
// On native (iOS/Android), this no-ops gracefully — real native push
// would require expo-notifications, which isn't installed yet.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFIED_KEY = 'notifiedItemSnapshot';

export const notificationsSupported = () => {
  return Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window;
};

export const getPermission = () => {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission; // 'granted' | 'denied' | 'default'
};

export const requestPermission = async () => {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'denied';
  }
};

const sendNotification = (title, body, options = {}) => {
  if (!notificationsSupported()) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
  } catch (e) {
    console.warn('Notification failed:', e);
  }
};

// Build a stable snapshot key for an item's notification state
const itemSnapshotKey = (item) => `${item.id}::${item.status}`;

const loadSnapshot = async () => {
  try {
    const raw = await AsyncStorage.getItem(NOTIFIED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

const saveSnapshot = async (set) => {
  try {
    await AsyncStorage.setItem(NOTIFIED_KEY, JSON.stringify([...set]));
  } catch {}
};

/**
 * Check items and fire browser notifications for ones that
 * have newly entered an "urgent" or "expired" state.
 * Returns the count of notifications sent.
 */
export const checkAndNotify = async (items) => {
  if (!notificationsSupported()) return 0;
  if (Notification.permission !== 'granted') return 0;

  const enabledRaw = await AsyncStorage.getItem('appNotifications');
  const enabled = enabledRaw === null ? true : enabledRaw === 'true';
  if (!enabled) return 0;

  const previous = await loadSnapshot();
  const updated = new Set();
  let sentCount = 0;

  const urgentItems = items.filter(i => i.status === 'urgent' && i.expiryDate);
  const expiredItems = items.filter(i => i.status === 'expired' && i.expiryDate);
  const soonItems = items.filter(i => i.status === 'soon' && i.expiryDate);

  // Fire one notification per item that just transitioned into urgent/expired
  [...urgentItems, ...expiredItems].forEach(item => {
    const key = itemSnapshotKey(item);
    updated.add(key);
    if (!previous.has(key)) {
      const days = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      const title = item.status === 'expired' ? '⚠️ Item Expired' : '⏰ Use Soon';
      const body = item.status === 'expired'
        ? `${item.name} has expired. Time to remove it.`
        : days <= 0
          ? `${item.name} expires today!`
          : `${item.name} expires in ${days} day${days === 1 ? '' : 's'}.`;
      sendNotification(title, body, { tag: `expiry-${item.id}` });
      sentCount++;
    }
  });

  // Track soon items so we don't re-notify, but don't spam — they get included in batched daily summary below
  soonItems.forEach(item => {
    updated.add(itemSnapshotKey(item));
  });

  // Daily batch: if we have multiple soon-expiring items and haven't notified today
  const today = new Date().toDateString();
  const dailyKey = `daily-${today}`;
  if (soonItems.length >= 3 && !previous.has(dailyKey)) {
    sendNotification(
      `🍃 ${soonItems.length} items expiring this week`,
      `${soonItems.slice(0, 3).map(i => i.name).join(', ')}${soonItems.length > 3 ? ` and ${soonItems.length - 3} more` : ''}.`,
      { tag: dailyKey }
    );
    sentCount++;
    updated.add(dailyKey);
  } else if (previous.has(dailyKey)) {
    updated.add(dailyKey);
  }

  await saveSnapshot(updated);
  return sentCount;
};

export const sendTestNotification = () => {
  if (!notificationsSupported()) return false;
  if (Notification.permission !== 'granted') return false;
  sendNotification('🍳 ShelfSense', 'Notifications are working! You\'ll get alerts when items are about to expire.');
  return true;
};

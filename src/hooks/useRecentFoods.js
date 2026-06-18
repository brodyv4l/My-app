import { useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

const MAX_RECENT = 20;

function storageKey(uid) {
  return `foodprint-recent-foods-${uid || 'guest'}`;
}

export function useRecentFoods() {
  const { user } = useAuth();
  const key = useMemo(() => storageKey(user?.uid), [user?.uid]);

  const getRecent = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [key]);

  const addRecent = useCallback(async (food) => {
    if (!food?.id) return;
    try {
      const current = await getRecent();
      const next = [
        food,
        ...current.filter((f) => f.id !== food.id),
      ].slice(0, MAX_RECENT);
      await AsyncStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, [key, getRecent]);

  const clearRecent = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }, [key]);

  return { getRecent, addRecent, clearRecent, key };
}

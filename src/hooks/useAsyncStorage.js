import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAsyncStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(key)
      .then((item) => {
        if (mounted && item !== null) {
          setStoredValue(JSON.parse(item));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoaded(true);
      });
    return () => { mounted = false; };
  }, [key]);

  const setValue = useCallback((value) => {
    setStoredValue((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [key]);

  return [storedValue, setValue, loaded];
}

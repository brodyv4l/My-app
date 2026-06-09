import { useState, useEffect, useRef } from 'react';
import { FOOD_API_CONFIG } from '../config/foodApi';
import { searchFoods } from '../services/food/searchFoods';

export function useFoodSearch(query) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < FOOD_API_CONFIG.minQueryLength) {
      setResults([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    setLoading(true);
    setError(null);
    const id = ++requestId.current;

    const timer = setTimeout(async () => {
      try {
        const foods = await searchFoods(trimmed);
        if (requestId.current === id) {
          setResults(foods);
          setError(null);
        }
      } catch (err) {
        if (requestId.current === id) {
          setResults([]);
          setError(err.message);
        }
      } finally {
        if (requestId.current === id) setLoading(false);
      }
    }, FOOD_API_CONFIG.searchDebounceMs);

    return () => clearTimeout(timer);
  }, [query]);

  return { results, loading, error };
}

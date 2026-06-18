import { useState, useEffect, useRef, useCallback } from 'react';
import { FOOD_API_CONFIG } from '../config/foodApi';
import { searchFoods } from '../services/food/searchFoods';

const DEBOUNCE_MS = 300;

function mergeResults(prev, next, append) {
  if (!append) return next;
  const seen = new Set(prev.map((f) => f.id));
  return [...prev, ...next.filter((f) => !seen.has(f.id))];
}

export function useFoodSearch(query) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const abortRef = useRef(null);
  const queryRef = useRef(query);

  const runSearch = useCallback(async (trimmed, pageNum, append) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const foods = await searchFoods(trimmed, pageNum, controller.signal);
      if (controller.signal.aborted || queryRef.current.trim() !== trimmed) return;

      setResults((prev) => mergeResults(prev, foods, append));
      setHasMore(foods.length >= FOOD_API_CONFIG.pageSize);
      setPage(pageNum);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      if (queryRef.current.trim() !== trimmed) return;
      if (!append) setResults([]);
      setError(err?.message || 'Search failed');
      if (!append) setHasMore(false);
    } finally {
      if (!controller.signal.aborted && queryRef.current.trim() === trimmed) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    queryRef.current = query;
    const trimmed = query.trim();

    if (trimmed.length < FOOD_API_CONFIG.minQueryLength) {
      abortRef.current?.abort();
      setResults([]);
      setLoading(false);
      setError(null);
      setPage(1);
      setHasMore(false);
      return undefined;
    }

    setPage(1);
    const timer = setTimeout(() => {
      runSearch(trimmed, 1, false);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, runSearch]);

  const loadMore = useCallback(() => {
    const trimmed = query.trim();
    if (
      loading
      || !hasMore
      || trimmed.length < FOOD_API_CONFIG.minQueryLength
    ) {
      return;
    }
    runSearch(trimmed, page + 1, true);
  }, [query, loading, hasMore, page, runSearch]);

  return { results, loading, error, page, loadMore, hasMore };
}

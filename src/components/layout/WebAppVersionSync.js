import { useEffect } from 'react';
import { Platform } from 'react-native';

const STORAGE_KEY = 'foodprint-build-version';

async function fetchLiveVersion() {
  try {
    const res = await fetch(`/build-version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const type = res.headers.get('content-type') || '';
      if (type.includes('json')) {
        const data = await res.json();
        if (data?.version) return String(data.version);
      }
    }
  } catch {
    // fall through
  }

  try {
    const res = await fetch(`/?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/index-([a-f0-9]+)\.js/);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

/** On web, reload once when production serves a newer build (fixes stale PWA / browser cache). */
export default function WebAppVersionSync() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;

    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return undefined;

    let cancelled = false;

    (async () => {
      const version = await fetchLiveVersion();
      if (!version || cancelled) return;

      const previous = window.localStorage.getItem(STORAGE_KEY);
      if (previous && previous !== version) {
        window.localStorage.setItem(STORAGE_KEY, version);
        window.location.reload();
        return;
      }
      if (!previous) window.localStorage.setItem(STORAGE_KEY, version);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

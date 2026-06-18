import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';
import { uriToBase64 } from '../utils/image';
import { getLocalDateString } from '../utils/dates';

function storageKey(userId) {
  return `foodprint-${userId}-progressPhotosDb`;
}

function newPhotoId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `photo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function rowToPhoto(row) {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    photoData: row.photo_data || null,
    photoUrl: row.photo_url || null,
    caption: row.caption || '',
    createdAt: row.created_at || null,
  };
}

export function getProgressPhotoUri(photo) {
  if (!photo) return null;
  if (photo.photoData) {
    const raw = photo.photoData;
    if (raw.startsWith('data:')) return raw;
    return `data:image/jpeg;base64,${raw}`;
  }
  return photo.photoUrl || photo.uri || null;
}

async function loadLocalPhotos(userId) {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveLocalPhotos(userId, photos) {
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(photos));
}

function sortPhotosNewestFirst(photos) {
  return [...photos].sort((a, b) => {
    const dateCmp = String(b.date).localeCompare(String(a.date));
    if (dateCmp !== 0) return dateCmp;
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });
}

export async function fetchProgressPhotos(userId) {
  if (!userId) return [];

  const local = await loadLocalPhotos(userId);

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('progress_photos')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('fetchProgressPhotos:', error.message);
      return local;
    }

    const remote = (data || []).map(rowToPhoto);
    if (!remote.length) return local;

    const remoteIds = new Set(remote.map((p) => p.id));
    const merged = sortPhotosNewestFirst([
      ...remote,
      ...local.filter((p) => !remoteIds.has(p.id)),
    ]);
    await saveLocalPhotos(userId, merged);
    return merged;
  }

  return local;
}

export async function insertProgressPhoto(userId, { uri, base64, caption = '' }) {
  if (!userId) throw new Error('Sign in to save photos.');

  const photoData = base64 || await uriToBase64(uri);
  const entry = {
    id: newPhotoId(),
    userId,
    date: getLocalDateString(),
    photoData,
    photoUrl: uri || null,
    caption: caption || '',
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('progress_photos')
      .insert({
        id: entry.id,
        user_id: userId,
        date: entry.date,
        photo_data: photoData,
        photo_url: entry.photoUrl,
        caption: entry.caption,
        created_at: entry.createdAt,
      })
      .select('*')
      .single();

    if (!error && data) {
      const saved = rowToPhoto(data);
      if (!saved.photoData && entry.photoData) saved.photoData = entry.photoData;
      const local = await loadLocalPhotos(userId);
      await saveLocalPhotos(userId, sortPhotosNewestFirst([saved, ...local.filter((p) => p.id !== saved.id)]));
      return saved;
    }
    if (error) console.warn('insertProgressPhoto:', error.message);
  }

  const local = await loadLocalPhotos(userId);
  const next = sortPhotosNewestFirst([entry, ...local.filter((p) => p.id !== entry.id)]);
  await saveLocalPhotos(userId, next);
  return entry;
}

export async function deleteProgressPhoto(userId, photoId) {
  if (!userId || !photoId) return;

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('progress_photos').delete().eq('id', photoId);
    if (error) console.warn('deleteProgressPhoto:', error.message);
  }

  const local = await loadLocalPhotos(userId);
  await saveLocalPhotos(userId, local.filter((p) => p.id !== photoId));
}

export function getNearestWeight(weightLogs, dateStr) {
  if (!weightLogs?.length || !dateStr) return null;
  const target = new Date(`${dateStr}T12:00:00`).getTime();
  const maxDiff = 7 * 24 * 60 * 60 * 1000;

  let nearest = null;
  let nearestDiff = Infinity;

  weightLogs.forEach((entry) => {
    const diff = Math.abs(new Date(`${entry.date}T12:00:00`).getTime() - target);
    if (diff < nearestDiff) {
      nearestDiff = diff;
      nearest = entry;
    }
  });

  if (!nearest || nearestDiff > maxDiff) return null;
  return nearest.weight;
}

export function formatTimeBetween(beforeDate, afterDate) {
  const days = Math.round(
    (new Date(`${afterDate}T12:00:00`) - new Date(`${beforeDate}T12:00:00`)) / (1000 * 60 * 60 * 24),
  );
  if (days <= 0) return 'Same day';
  const weeks = Math.floor(days / 7);
  const rem = days % 7;
  if (weeks >= 1) {
    if (rem > 0) return `${weeks} week${weeks !== 1 ? 's' : ''}, ${rem} day${rem !== 1 ? 's' : ''} apart`;
    return `${weeks} week${weeks !== 1 ? 's' : ''} apart`;
  }
  return `${days} day${days !== 1 ? 's' : ''} apart`;
}

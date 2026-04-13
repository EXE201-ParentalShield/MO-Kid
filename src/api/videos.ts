import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';
import { handleApiError, logError } from './errorHandler';

export interface VideoItem {
  videoId: number;
  title: string;
  description?: string;
  url?: string;
  youtubeId?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
}

export interface VideosResponse {
  success: boolean;
  data: VideoItem[];
}

export interface VideoResponse {
  success: boolean;
  data: VideoItem;
}

export interface LogWatchPayload {
  deviceId: number;
  videoId: number;
  duration: number;
  completed: boolean;
}

export interface LogResponse {
  success: boolean;
  message: string;
}

const clean = (v: any): string =>
  v === null || v === undefined ? '' : String(v).replace(/`/g, '').trim();

const isHttp = (u: string) => /^https?:\/\//i.test(u);

const normalizeHttpUrl = (url: string): string => {
  const raw = clean(url);
  if (!raw) return '';
  if (raw.startsWith('/')) {
    const base = String(apiClient.defaults.baseURL || '').replace(/\/api\/?$/i, '');
    return base ? `${base}${raw}` : '';
  }
  if (/^\/\//.test(raw)) return `https:${raw}`;
  if (isHttp(raw)) {
    if (/^http:\/\/(i\d*\.ytimg\.com|img\.youtube\.com)\//i.test(raw)) {
      return raw.replace(/^http:\/\//i, 'https://');
    }
    return raw;
  }
  return '';
};

const clampDurationSeconds = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 0;

  // If backend accidentally sends milliseconds, convert to seconds.
  if (value > 86400 && value <= 21600000) {
    value = Math.round(value / 1000);
  }

  // Guard against sentinel/invalid values (for example int max).
  if (value > 6 * 3600) return 0;
  return Math.round(value);
};

const parseDurationSeconds = (raw: any): number => {
  const num = typeof raw === 'string' ? Number(raw) : Number(raw ?? 0);
  return clampDurationSeconds(num);
};

const toStableNumericId = (rawId: any, fallbackSeed: string): number => {
  const parsed = Number(rawId);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.round(parsed);
  }

  let hash = 0;
  for (let i = 0; i < fallbackSeed.length; i += 1) {
    hash = (hash << 5) - hash + fallbackSeed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
};

export const normalizeYoutubeId = (input: string): string => {
  const trimmed = clean(input);
  if (!trimmed) return '';

  const simpleId = trimmed.split(/[?&#/]/)[0] || '';
  if (/^[A-Za-z0-9_-]{11}$/.test(simpleId)) return simpleId;

  if (isHttp(trimmed)) {
    const patterns = [
      /[?&]v=([A-Za-z0-9_-]{11})/,
      /youtu\.be\/([A-Za-z0-9_-]{11})/,
      /\/embed\/([A-Za-z0-9_-]{11})/,
      /\/shorts\/([A-Za-z0-9_-]{11})/,
      /\/vi\/([A-Za-z0-9_-]{11})\//,
    ];
    for (const p of patterns) {
      const m = trimmed.match(p);
      if (m && m[1]) return m[1];
    }
    return '';
  }

  return '';
};

const extractYoutubeId = (item: any): string => {
  const candidates = [
    clean(item.youtubeId),
    clean(item.url),
    clean(item.videoUrl),
    clean(item.youtubeUrl),
    clean(item.thumbnailUrl),
    clean(item.thumbnail),
    clean(item.thumbUrl),
  ];

  for (const c of candidates) {
    const id = normalizeYoutubeId(c);
    if (id) return id;
  }

  return '';
};

export const buildYoutubeUrl = (youtubeIdOrUrl: string): string => {
  const raw = clean(youtubeIdOrUrl);
  if (isHttp(raw)) return raw;
  const id = normalizeYoutubeId(raw);
  if (!id) return '';
  return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
};

// ✅ FIX: Helper trả về undefined thay vì '' khi không có giá trị
// Giúp các check `if (v.url)` hoạt động đúng trong WatchVideoScreen
const resolveUrl = (item: any): string | undefined => {
  const candidates = [
    normalizeHttpUrl(item.url),
    normalizeHttpUrl(item.videoUrl),
    normalizeHttpUrl(item.link),
    normalizeHttpUrl(item.sourceUrl),
    normalizeHttpUrl(item.youtubeUrl),
  ];

  // Ưu tiên các field URL trực tiếp
  for (const c of candidates) {
    if (c) return c;
  }

  // Fallback: build từ youtubeId
  const youtubeIdRaw = clean(item.youtubeId);
  if (youtubeIdRaw) {
    return buildYoutubeUrl(youtubeIdRaw);
  }

  // ✅ Trả về undefined (không phải '') để `if (v.url)` hoạt động đúng
  return undefined;
};

const resolveThumbnail = (item: any, normalizedId: string): string | undefined => {
  const thumbRaw =
    normalizeHttpUrl(item.thumbnailUrl) ||
    normalizeHttpUrl(item.thumbnail) ||
    normalizeHttpUrl(item.thumbUrl);
  if (thumbRaw) return thumbRaw;
  if (normalizedId) {
    return `https://i.ytimg.com/vi/${normalizedId}/hqdefault.jpg`;
  }
  return undefined;
};

const normalizeItem = (item: any): VideoItem => {
  const finalYoutubeId = extractYoutubeId(item);
  const durationRaw = item.durationSeconds ?? item.duration ?? item.lengthSeconds ?? item.length ?? 0;
  const fallbackSeed =
    `${clean(item.videoId)}|${clean(item.id)}|${clean(item.title)}|${finalYoutubeId}|${clean(item.url)}`;

  return {
    videoId: toStableNumericId(item.videoId ?? item.id, fallbackSeed),
    title: clean(item.title) || clean(item.name),
    description: clean(item.description) || clean(item.desc) || undefined,
    url: resolveUrl(item),                          // ✅ undefined thay vì ''
    youtubeId: finalYoutubeId || undefined,
    thumbnailUrl: resolveThumbnail(item, finalYoutubeId),
    durationSeconds: parseDurationSeconds(durationRaw),
  };
};

export const getVideos = async (): Promise<VideoItem[]> => {
  try {
    const res = await apiClient.get<any>('/Videos');
    const payload = res.data;
    const list = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
      ? payload.data
      : [];
    return (list as any[]).map(normalizeItem);
  } catch (error) {
    logError(error, 'Videos.getVideos');
    throw new Error(handleApiError(error));
  }
};

export const getVideoById = async (id: number): Promise<VideoItem> => {
  try {
    const res = await apiClient.get<any>(`/Videos/${id}`);
    const payload = res.data;
    const item = payload?.data ?? payload ?? {};
    return normalizeItem(item);
  } catch (error) {
    logError(error, 'Videos.getVideoById');
    throw new Error(handleApiError(error));
  }
};

export const logVideoWatch = async (
  videoId: number,
  duration: number,
  completed: boolean
): Promise<LogResponse> => {
  try {
    const deviceIdStr = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    if (!deviceIdStr) {
      throw new Error('Device ID not found. Please login again.');
    }
    const payload: LogWatchPayload = {
      deviceId: parseInt(deviceIdStr),
      videoId,
      duration,
      completed,
    };
    const res = await apiClient.post<LogResponse>('/Videos/log', payload);
    return res.data;
  } catch (error) {
    logError(error, 'Videos.logVideoWatch');
    throw new Error(handleApiError(error));
  }
};
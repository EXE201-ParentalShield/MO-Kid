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

export const normalizeYoutubeId = (input: string): string => {
  const trimmed = clean(input);
  if (!trimmed) return '';
  if (isHttp(trimmed)) {
    const patterns = [
      /[?&]v=([A-Za-z0-9_-]{6,})/,
      /youtu\.be\/([A-Za-z0-9_-]{6,})/,
      /\/embed\/([A-Za-z0-9_-]{6,})/,
      /\/shorts\/([A-Za-z0-9_-]{6,})/,
    ];
    for (const p of patterns) {
      const m = trimmed.match(p);
      if (m && m[1]) return m[1];
    }
    return trimmed;
  }
  return trimmed;
};

export const buildYoutubeUrl = (youtubeIdOrUrl: string): string => {
  const raw = clean(youtubeIdOrUrl);
  if (isHttp(raw)) return raw;
  const id = normalizeYoutubeId(raw);
  return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
};

// ✅ FIX: Helper trả về undefined thay vì '' khi không có giá trị
// Giúp các check `if (v.url)` hoạt động đúng trong WatchVideoScreen
const resolveUrl = (item: any): string | undefined => {
  const candidates = [
    clean(item.url),
    clean(item.videoUrl),
    clean(item.link),
    clean(item.sourceUrl),
    clean(item.youtubeUrl),
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
    clean(item.thumbnailUrl) || clean(item.thumbnail) || clean(item.thumbUrl);
  if (thumbRaw) return thumbRaw;
  if (normalizedId && !isHttp(clean(item.youtubeId))) {
    return `https://img.youtube.com/vi/${normalizedId}/hqdefault.jpg`;
  }
  return undefined;
};

const normalizeItem = (item: any): VideoItem => {
  const youtubeIdRaw = clean(item.youtubeId);
  const normalizedId = normalizeYoutubeId(youtubeIdRaw);
  const duration =
    item.durationSeconds ?? item.duration ?? item.lengthSeconds ?? item.length ?? 0;

  return {
    videoId: item.videoId ?? item.id,
    title: clean(item.title) || clean(item.name),
    description: clean(item.description) || clean(item.desc) || undefined,
    url: resolveUrl(item),                          // ✅ undefined thay vì ''
    youtubeId: normalizedId || undefined,
    thumbnailUrl: resolveThumbnail(item, normalizedId),
    durationSeconds:
      typeof duration === 'string'
        ? parseInt(duration, 10) || 0
        : Number(duration) || 0,
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
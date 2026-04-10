import apiClient from './client';
import { handleApiError, logError } from './errorHandler';

export interface AllowedAppItem {
  appId: number;
  appName: string;
  packageName: string;
  iconUrl?: string;
  isActive: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const clean = (value: unknown): string =>
  value === null || value === undefined ? '' : String(value).trim();

const resolveIconUrl = (url: unknown): string | undefined => {
  const raw = clean(url);
  if (!raw) return undefined;

  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^\/\//.test(raw)) return `https:${raw}`;

  const base = String(apiClient.defaults.baseURL || '').replace(/\/api\/?$/i, '');
  if (!base) return undefined;

  if (raw.startsWith('/')) return `${base}${raw}`;
  return `${base}/${raw.replace(/^\/+/, '')}`;
};

const normalizeItem = (item: any): AllowedAppItem => {
  const numericId = Number(item?.appId);

  return {
    appId: Number.isFinite(numericId) ? numericId : 0,
    appName: clean(item?.appName) || 'Unknown App',
    packageName: clean(item?.packageName),
    iconUrl: resolveIconUrl(item?.iconUrl),
    isActive: Boolean(item?.isActive),
  };
};

export const getAllowedApps = async (): Promise<AllowedAppItem[]> => {
  try {
    const res = await apiClient.get<ApiResponse<AllowedAppItem[]>>('/Apps', {
      params: {
        isActive: true,
      },
    });

    const list = Array.isArray(res.data?.data) ? res.data.data : [];
    return list.map(normalizeItem).filter((item) => item.appId > 0);
  } catch (error) {
    logError(error, 'Apps.getAllowedApps');
    throw new Error(handleApiError(error));
  }
};

// Shield Kid App - Device API
import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';
import { handleApiError, logError } from './errorHandler';
import * as Device from 'expo-device';

export interface DeviceInfo {
  deviceId: number;
  parentId: number;
  username: string;
  childName: string;
  deviceUniqueId: string;
  deviceName: string;
  deviceType: string;
  osVersion: string;
  status: string;
  isLocked: boolean;
  lockReason?: string;
  lockedAt?: string;
  lastHeartbeat: string;
  batteryLevel: number;
  storageUsage: number;
  createdAt: string;
}

export interface DeviceResponse {
  success: boolean;
  data: DeviceInfo;
}

export interface HeartbeatData {
  batteryLevel: number;
  storageUsage: number;
}

export interface HeartbeatResponse {
  success: boolean;
  message: string;
  data: {
    deviceId: number;
    deviceUniqueId: string;
    deviceName: string;
    deviceType: string;
    status: string;
    isLocked: boolean;
    lockReason?: string;
    lockedAt?: string;
    lastHeartbeat: string;
    batteryLevel: number;
    storageUsage: number;
    approvedRequestId?: number;
    approvedMinutes?: number;
    hasActiveSession?: boolean;
    activeSessionId?: number;
    activeRequestId?: number;
    activeSessionStartTime?: string;
    activeSessionEndTime?: string;
    activeSessionAllowedMinutes?: number;
    activeSessionRemainingMinutes?: number;
  };
}

export interface SessionResponse {
  success: boolean;
  message: string;
  data: {
    usageSessionId: number;
    requestId: number;
    deviceId: number;
    startTime: string;
    endTime: string;
    allowedMinutes: number;
    remainingMinutes: number;
    status: string;
  };
}

export const getMyDevice = async (): Promise<DeviceInfo> => {
  try {
    const response = await apiClient.get<DeviceResponse>('/device');
    
    // Save deviceId to storage
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, response.data.data.deviceId.toString());
    
    return response.data.data;
  } catch (error) {
    logError(error, 'Device.getMyDevice');
    throw new Error(handleApiError(error));
  }
};

export const sendHeartbeat = async (batteryLevel: number, storageUsage: number): Promise<HeartbeatResponse> => {
  try {
    // Get deviceUniqueId from storage
    const deviceUniqueId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_UNIQUE_ID);
    
    if (!deviceUniqueId) {
      throw new Error('Device Unique ID not found. Please login again.');
    }
    
    const response = await apiClient.post<HeartbeatResponse>('/device/heartbeat', {
      deviceUniqueId,
      batteryLevel,
      storageUsage,
    });
    
    return response.data;
  } catch (error) {
    logError(error, 'Device.sendHeartbeat');
    throw new Error(handleApiError(error));
  }
};

export const getDeviceInfo = async () => {
  try {
    const deviceName = Device.deviceName || 'Unknown Device';
    const osVersion = Device.osVersion || '0';
    const deviceType = Device.osName || 'Android';
    
    return {
      deviceName,
      osVersion,
      deviceType,
    };
  } catch (error) {
    logError(error, 'Device.getDeviceInfo');
    return {
      deviceName: 'Unknown Device',
      osVersion: '0',
      deviceType: 'Android',
    };
  }
};

export const startSession = async (requestId: number): Promise<SessionResponse> => {
  try {
    // Get deviceUniqueId from storage
    const deviceUniqueId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_UNIQUE_ID);
    
    if (!deviceUniqueId) {
      throw new Error('Device Unique ID not found. Please login again.');
    }
    
    const response = await apiClient.post<SessionResponse>('/device/start-session', {
      deviceUniqueId,
      requestId,
    });
    
    console.log('[Device.startSession] Session started:', response.data.data);
    return response.data;
  } catch (error) {
    logError(error, 'Device.startSession');
    throw new Error(handleApiError(error));
  }
};

export const endSession = async (usageSessionId: number, actualUsedMinutes: number): Promise<SessionResponse> => {
  try {
    // Get deviceUniqueId from storage
    const deviceUniqueId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_UNIQUE_ID);
    
    if (!deviceUniqueId) {
      throw new Error('Device Unique ID not found. Please login again.');
    }
    
    const response = await apiClient.post<SessionResponse>('/device/end-session', {
      deviceUniqueId,
      usageSessionId,
      actualUsedMinutes,
    });
    
    console.log('[Device.endSession] Session ended:', response.data.data);
    return response.data;
  } catch (error) {
    logError(error, 'Device.endSession');
    throw new Error(handleApiError(error));
  }
};

export const getDeviceStatus = async (): Promise<HeartbeatResponse['data']> => {
  try {
    // Get deviceUniqueId from storage
    const deviceUniqueId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_UNIQUE_ID);
    
    if (!deviceUniqueId) {
      throw new Error('Device Unique ID not found. Please login again.');
    }
    
    const response = await apiClient.get<HeartbeatResponse>(`/device/status?deviceUniqueId=${deviceUniqueId}`);
    
    return response.data.data;
  } catch (error) {
    logError(error, 'Device.getDeviceStatus');
    throw new Error(handleApiError(error));
  }
};

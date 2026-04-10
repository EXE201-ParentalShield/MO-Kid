// Shield Kid App - Authentication API
import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';
import { handleApiError, logError } from './errorHandler';
import * as Device from 'expo-device';

export interface LoginData {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: {
    userId: number;
    username: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    role: string;
  };
  token: string;
}

export interface DeviceLoginResponse {
  success: boolean;
  message: string;
  device: {
    deviceId: number;
    username: string;
    childName: string;
    deviceUniqueId: string;
    deviceName: string;
    deviceType: string;
    osVersion: string;
    status: string;
    isLocked: boolean;
    lockReason?: string;
    parentId: number;
  };
  token: string;
}

export const deviceLogin = async (username: string, password: string): Promise<DeviceLoginResponse> => {
  try {
    const response = await apiClient.post<DeviceLoginResponse>('/auth/device-login', {
      username,
      password,
    });

    if (!response.data || !response.data.token) {
      throw new Error('Phản hồi từ máy chủ không hợp lệ');
    }

    if (!response.data.device) {
      throw new Error('Không nhận được thông tin thiết bị');
    }

    // Save token and device data
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, response.data.token);
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, response.data.device.deviceId.toString());
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_UNIQUE_ID, response.data.device.deviceUniqueId);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.device));

    console.log('[Auth.deviceLogin] Login successful:', {
      deviceId: response.data.device.deviceId,
      username: response.data.device.username,
      deviceUniqueId: response.data.device.deviceUniqueId,
      isLocked: response.data.device.isLocked,
    });

    return response.data;
  } catch (error) {
    logError(error, 'Auth.deviceLogin');
    throw new Error(handleApiError(error));
  }
};

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      username,
      password,
    });

    if (!response.data || !response.data.token) {
      throw new Error('Phản hồi từ máy chủ không hợp lệ');
    }

    if (!response.data.user) {
      throw new Error('Không nhận được thông tin người dùng');
    }

    // Save token and user data
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, response.data.token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));

    console.log('[Auth.login] Login successful:', {
      userId: response.data.user.userId,
      username: response.data.user.username,
      role: response.data.user.role,
    });

    return response.data;
  } catch (error) {
    logError(error, 'Auth.login');
    throw new Error(handleApiError(error));
  }
};

export const logout = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.TOKEN, 
      STORAGE_KEYS.USER_DATA, 
      STORAGE_KEYS.DEVICE_ID,
      STORAGE_KEYS.DEVICE_UNIQUE_ID
    ]);
  } catch (error) {
    logError(error, 'Auth.logout');
    throw new Error(handleApiError(error));
  }
};

// Shield Kid App - Access Requests API
import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';
import { handleApiError, logError } from './errorHandler';

export interface AccessRequest {
  requestId: number;
  deviceId: number;
  requestedMinutes: number;
  approvedMinutes?: number;
  reason?: string;
  status: string;
  isCompleted?: boolean;
  parentNote?: string;
  createdAt: string;
  respondedAt?: string;
}

export interface CreateRequestData {
  requestedMinutes: number;
  reason: string;
}

export interface RequestResponse {
  success: boolean;
  message: string;
  data: AccessRequest;
}

export interface RequestsResponse {
  success: boolean;
  data: AccessRequest[];
}

export const createAccessRequest = async (
  requestedMinutes: number,
  reason: string
): Promise<AccessRequest> => {
  try {
    // Get deviceId from storage
    const deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    
    if (!deviceId) {
      throw new Error('Device ID not found. Please login again.');
    }
    
    const response = await apiClient.post<RequestResponse>('/requests', {
      deviceId: parseInt(deviceId),
      requestedMinutes,
      reason,
    });

    return response.data.data;
  } catch (error) {
    logError(error, 'Requests.createAccessRequest');
    throw new Error(handleApiError(error));
  }
};

export const getMyRequests = async (): Promise<AccessRequest[]> => {
  try {
    // Get deviceId from storage to filter only this device's requests
    const deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
    
    if (!deviceId) {
      throw new Error('Device ID not found. Please login again.');
    }
    
    const response = await apiClient.get<RequestsResponse>('/requests', {
      params: {
        deviceId: parseInt(deviceId)
      }
    });
    return response.data.data;
  } catch (error) {
    logError(error, 'Requests.getMyRequests');
    throw new Error(handleApiError(error));
  }
};

export const getRequestById = async (requestId: number): Promise<AccessRequest> => {
  try {
    const response = await apiClient.get<RequestResponse>(`/requests/${requestId}`);
    return response.data.data;
  } catch (error) {
    logError(error, 'Requests.getRequestById');
    throw new Error(handleApiError(error));
  }
};

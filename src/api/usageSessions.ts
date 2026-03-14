// Shield Kid App - Usage Sessions API
import apiClient from './client';
import { handleApiError, logError } from './errorHandler';

export interface UsageSession {
  usageSessionId: number;
  deviceId: number;
  startTime: string;
  endTime: string;
  allowedMinutes: number;
  remainingMinutes: number;
  status: string;
}

export interface SessionResponse {
  success: boolean;
  data: UsageSession;
}

export interface SessionsResponse {
  success: boolean;
  data: UsageSession[];
}

export const getCurrentSession = async (): Promise<UsageSession | null> => {
  try {
    const response = await apiClient.get<SessionsResponse>('/usagesessions', {
      params: { status: 'Active' }
    });
    
    // Return the first active session, or null if none
    return response.data.data[0] || null;
  } catch (error) {
    logError(error, 'UsageSessions.getCurrentSession');
    throw new Error(handleApiError(error));
  }
};

export const getSessionById = async (sessionId: number): Promise<UsageSession> => {
  try {
    const response = await apiClient.get<SessionResponse>(`/usagesessions/${sessionId}`);
    return response.data.data;
  } catch (error) {
    logError(error, 'UsageSessions.getSessionById');
    throw new Error(handleApiError(error));
  }
};

export const getAllSessions = async (): Promise<UsageSession[]> => {
  try {
    const response = await apiClient.get<SessionsResponse>('/usagesessions');
    return response.data.data;
  } catch (error) {
    logError(error, 'UsageSessions.getAllSessions');
    throw new Error(handleApiError(error));
  }
};

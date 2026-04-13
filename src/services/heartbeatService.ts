// Shield Kid App - Heartbeat Service (CRITICAL)
// This service runs every 30 seconds to send device status to backend
// and check if device has been locked by parent

import * as Battery from 'expo-battery';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendHeartbeat, HeartbeatResponse } from '../api/device';
import { logError } from '../api/errorHandler';
import { endSession } from '../api/device';
import { STORAGE_KEYS } from '../utils/constants';
import { stopKioskModeAfterSession } from './kioskModeService';

export interface HeartbeatStatus {
  isLocked: boolean;
  lockReason?: string;
  lockedAt?: string;
  batteryLevel: number;
  storageUsage: number;
}

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let onLockChangeCallback: ((isLocked: boolean, reason?: string) => void) | null = null;
let onSessionExpiredCallback: (() => void) | null = null;
let isAutoEndingSession = false;

const clearStoredSession = async () => {
  await AsyncStorage.multiRemove([
    STORAGE_KEYS.CURRENT_SESSION_ID,
    'sessionStartTime',
    'sessionRequestId',
    'sessionApprovedMinutes',
  ]);
};

const markCompletedRequest = async () => {
  const requestIdStr = await AsyncStorage.getItem('sessionRequestId');
  if (!requestIdStr) return;

  const requestId = parseInt(requestIdStr, 10);
  if (Number.isNaN(requestId)) return;

  const completedIdsStr = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_REQUEST_IDS);
  const completedIds = completedIdsStr ? JSON.parse(completedIdsStr) : [];

  if (!completedIds.includes(requestId)) {
    completedIds.push(requestId);
    await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_REQUEST_IDS, JSON.stringify(completedIds));
  }
};

const enforceSessionTimeout = async () => {
  if (isAutoEndingSession) return;

  const [sessionIdStr, sessionStartTimeStr, approvedMinutesStr] = await AsyncStorage.multiGet([
    STORAGE_KEYS.CURRENT_SESSION_ID,
    'sessionStartTime',
    'sessionApprovedMinutes',
  ]).then((entries) => entries.map((entry) => entry[1]));

  if (!sessionIdStr || !sessionStartTimeStr || !approvedMinutesStr) return;

  const sessionId = parseInt(sessionIdStr, 10);
  const approvedMinutes = parseInt(approvedMinutesStr, 10);
  const sessionStart = new Date(sessionStartTimeStr);

  if (Number.isNaN(sessionId) || Number.isNaN(approvedMinutes) || Number.isNaN(sessionStart.getTime())) {
    return;
  }

  if (approvedMinutes <= 0) return;

  const elapsedMinutes = Math.floor((Date.now() - sessionStart.getTime()) / 60000);
  if (elapsedMinutes < approvedMinutes) return;

  isAutoEndingSession = true;
  try {
    await endSession(sessionId, approvedMinutes);
    await markCompletedRequest();
    await clearStoredSession();
    await stopKioskModeAfterSession();
    if (onSessionExpiredCallback) {
      onSessionExpiredCallback();
    }
  } catch (error) {
    logError(error, 'HeartbeatService.enforceSessionTimeout');
  } finally {
    isAutoEndingSession = false;
  }
};

/**
 * Get current battery level (0-100)
 */
const getBatteryLevel = async (): Promise<number> => {
  try {
    const level = await Battery.getBatteryLevelAsync();
    return Math.round(level * 100);
  } catch (error) {
    logError(error, 'HeartbeatService.getBatteryLevel');
    return 100; // Default to 100% on error
  }
};

/**
 * Get storage usage percentage (0-100)
 * TODO: Update to new FileSystem API when stable
 */
const getStorageUsage = async (): Promise<number> => {
  try {
    // Temporary: Return mock value to avoid deprecated API warning
    // In production, use the new FileSystem API or platform-specific modules
    return 50; // Mock 50% storage usage
  } catch (error) {
    logError(error, 'HeartbeatService.getStorageUsage');
    return 0; // Default to 0% on error
  }
};

/**
 * Send heartbeat to backend
 */
const performHeartbeat = async (): Promise<HeartbeatStatus> => {
  try {
    await enforceSessionTimeout();

    const batteryLevel = await getBatteryLevel();
    const storageUsage = await getStorageUsage();

    const response = await sendHeartbeat(batteryLevel, storageUsage);

    const status: HeartbeatStatus = {
      isLocked: response.data.isLocked,
      lockReason: response.data.lockReason,
      lockedAt: response.data.lockedAt,
      batteryLevel,
      storageUsage,
    };

    // Trigger callback if lock status changed
    if (onLockChangeCallback) {
      onLockChangeCallback(status.isLocked, status.lockReason);
    }

    return status;
  } catch (error) {
    logError(error, 'HeartbeatService.performHeartbeat');
    throw error;
  }
};

/**
 * Start heartbeat service - sends heartbeat every 30 seconds
 */
export const startHeartbeatService = (
  onLockChange?: (isLocked: boolean, reason?: string) => void,
  onSessionExpired?: () => void
): void => {
  // Stop existing interval if any
  stopHeartbeatService();

  // Set callback
  if (onLockChange) {
    onLockChangeCallback = onLockChange;
  }
  if (onSessionExpired) {
    onSessionExpiredCallback = onSessionExpired;
  }

  // Send first heartbeat immediately
  performHeartbeat().catch((err) => {
    console.error('Initial heartbeat failed:', err);
  });

  // Start interval - send heartbeat every 30 seconds
  heartbeatInterval = setInterval(() => {
    performHeartbeat().catch((err) => {
      console.error('Heartbeat failed:', err);
    });
  }, 30000); // 30 seconds

  console.log('[HeartbeatService] Started - interval: 30s');
};

/**
 * Stop heartbeat service
 */
export const stopHeartbeatService = (): void => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    console.log('[HeartbeatService] Stopped');
  }

  onSessionExpiredCallback = null;
};

/**
 * Send single heartbeat (manual trigger)
 */
export const sendManualHeartbeat = async (): Promise<HeartbeatStatus> => {
  return performHeartbeat();
};

/**
 * Check device status from backend
 * NOTE: This function is deprecated as GET /api/device endpoint doesn't exist
 * Lock status is now checked via heartbeat response
 */
export const checkDeviceStatus = async () => {
  try {
    // Return mock data since API endpoint doesn't exist
    return {
      isLocked: false,
      lockReason: undefined,
      lockedAt: undefined,
      status: 'Active',
    };
  } catch (error) {
    logError(error, 'HeartbeatService.checkDeviceStatus');
    throw error;
  }
};

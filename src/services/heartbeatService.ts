// Shield Kid App - Heartbeat Service (CRITICAL)
// This service runs every 30 seconds to send device status to backend
// and check if device has been locked by parent

import * as Battery from 'expo-battery';
import { sendHeartbeat, HeartbeatResponse } from '../api/device';
import { logError } from '../api/errorHandler';

export interface HeartbeatStatus {
  isLocked: boolean;
  lockReason?: string;
  lockedAt?: string;
  batteryLevel: number;
  storageUsage: number;
}

let heartbeatInterval: NodeJS.Timeout | null = null;
let onLockChangeCallback: ((isLocked: boolean, reason?: string) => void) | null = null;

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
  onLockChange?: (isLocked: boolean, reason?: string) => void
): void => {
  // Stop existing interval if any
  stopHeartbeatService();

  // Set callback
  if (onLockChange) {
    onLockChangeCallback = onLockChange;
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

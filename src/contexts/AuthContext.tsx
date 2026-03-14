import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '../utils/storage';
import * as authApi from '../api/auth';
import apiClient from '../api/client';
import { startHeartbeatService, stopHeartbeatService } from '../services/heartbeatService';

interface User {
  userId: number;
  username: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
}

interface DeviceInfo {
  deviceId: number;
  childName: string;
  deviceName: string;
  deviceType: string;
  osVersion: string;
  isLocked: boolean;
  lockReason?: string;
}

interface AuthContextType {
  user: User | null;
  deviceInfo: DeviceInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLocked: boolean;
  hasDevice: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshDeviceInfo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [hasDevice, setHasDevice] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  // Stop heartbeat service on unmount
  useEffect(() => {
    return () => {
      stopHeartbeatService();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const token = await storage.getToken();
      const userData = await storage.getUserData();
      
      if (token && userData) {
        setUser(userData);
        
        // Check if we have device info stored
        const deviceUniqueId = await storage.getDeviceUniqueId();
        if (deviceUniqueId) {
          // Device info available - set it from stored data
          setHasDevice(true);
          
          // Try to refresh device status
          await refreshDeviceInfo();
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDeviceInfo = async () => {
    try {
      const deviceUniqueId = await storage.getDeviceUniqueId();
      
      if (!deviceUniqueId) {
        console.error('[AuthContext] DeviceUniqueId not found in storage');
        setHasDevice(false);
        return;
      }

      // Try to get device from backend
      try {
        console.log('[AuthContext] Fetching device status for:', deviceUniqueId);
        const response = await apiClient.get(`/device/status?deviceUniqueId=${deviceUniqueId}`);
        
        console.log('[AuthContext] Device status response:', JSON.stringify(response.data, null, 2));
        
        if (response.data.success && response.data.data) {
          const backendDevice = response.data.data;
          
          const deviceInfo: DeviceInfo = {
            deviceId: backendDevice.deviceId,
            childName: user?.fullName || 'Child',
            deviceName: backendDevice.deviceName || 'Unknown Device',
            deviceType: backendDevice.deviceType || 'Android',
            osVersion: backendDevice.osVersion || 'Unknown',
            isLocked: backendDevice.isLocked,
            lockReason: backendDevice.lockReason,
          };
          
          setDeviceInfo(deviceInfo);
          setIsLocked(backendDevice.isLocked);
          setHasDevice(true);
          
          console.log('[AuthContext] Device found and set:', deviceInfo);
          
          // Start heartbeat service
          startHeartbeatService((locked, reason) => {
            setIsLocked(locked);
            setDeviceInfo(prev => prev ? { ...prev, isLocked: locked, lockReason: reason } : null);
          });
        } else {
          console.warn('[AuthContext] Device not found in backend - response:', response.data);
          setHasDevice(false);
        }
      } catch (error: any) {
        console.error('[AuthContext] Error fetching device:', error.message);
        if (error.response) {
          console.error('[AuthContext] Error response:', error.response.data);
        }
        // Device doesn't exist yet
        setHasDevice(false);
      }
    } catch (error) {
      console.error('Error refreshing device info:', error);
      setHasDevice(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      // Use device-login API instead of regular login
      const response = await authApi.deviceLogin(username, password);
      
      // Set device info from response
      const deviceInfo: DeviceInfo = {
        deviceId: response.device.deviceId,
        childName: response.device.childName,
        deviceName: response.device.deviceName,
        deviceType: response.device.deviceType,
        osVersion: 'Unknown', // Not in device response
        isLocked: response.device.isLocked,
        lockReason: response.device.lockReason,
      };
      
      // Create user object from device data for compatibility
      const userData = {
        userId: response.device.deviceId, // Use deviceId as userId
        username: response.device.username,
        fullName: response.device.childName,
        email: '',
        phoneNumber: '',
        role: 'Child',
      };
      
      setUser(userData);
      setDeviceInfo(deviceInfo);
      setIsLocked(response.device.isLocked);
      setHasDevice(true);
      
      console.log('[AuthContext] Device login successful:', {
        deviceId: response.device.deviceId,
        deviceUniqueId: response.device.deviceUniqueId,
        isLocked: response.device.isLocked,
      });
      
      // Start heartbeat service
      startHeartbeatService((locked, reason) => {
        setIsLocked(locked);
        setDeviceInfo(prev => prev ? { ...prev, isLocked: locked, lockReason: reason } : null);
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    // Always clear local state first
    stopHeartbeatService();
    setUser(null);
    setDeviceInfo(null);
    setIsLocked(false);
    setHasDevice(false);
    
    try {
      await authApi.logout();
      await storage.clearAll();
    } catch (error) {
      console.error('Logout error:', error);
      // Still try to clear storage even if API fails
      try {
        await storage.clearAll();
      } catch (clearError) {
        console.error('Clear storage error:', clearError);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        deviceInfo,
        isAuthenticated: !!user,
        isLoading,
        isLocked,
        hasDevice,
        login,
        logout,
        refreshDeviceInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

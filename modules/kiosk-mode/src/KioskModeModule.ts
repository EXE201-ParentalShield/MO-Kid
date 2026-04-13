import { requireNativeModule } from 'expo-modules-core';

export type KioskModeNativeModule = {
  startLockTask: () => void;
  stopLockTask: () => void;
  isLockTaskActive: () => boolean;
};

export default requireNativeModule<KioskModeNativeModule>('KioskMode');

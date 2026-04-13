import { requireOptionalNativeModule } from 'expo-modules-core';

export type KioskModeNativeModule = {
  startLockTask: () => Promise<void>;
  stopLockTask: () => Promise<void>;
  isLockTaskActive: () => Promise<boolean>;
};

export default requireOptionalNativeModule<KioskModeNativeModule>('KioskMode');

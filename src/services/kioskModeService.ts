import { Platform } from 'react-native';
import KioskModeModule, { KioskModeNativeModule } from '../../modules/kiosk-mode/src/KioskModeModule';

const nativeKioskModule: KioskModeNativeModule | null | undefined = Platform.OS === 'android' ? KioskModeModule : undefined;

const canUseNativeKiosk = Platform.OS === 'android' && !!nativeKioskModule;

export const startKioskModeForSession = async () => {
  if (!canUseNativeKiosk || !nativeKioskModule?.startLockTask) {
    console.log('[KioskMode] Native lock task module is unavailable on this build');
    return false;
  }

  try {
    await nativeKioskModule.startLockTask();
    console.log('[KioskMode] startLockTask success');
    return true;
  } catch (error) {
    console.error('[KioskMode] startLockTask failed', error);
    return false;
  }
};

export const stopKioskModeAfterSession = async () => {
  if (!canUseNativeKiosk || !nativeKioskModule?.stopLockTask) {
    console.log('[KioskMode] Native lock task module is unavailable on this build');
    return false;
  }

  try {
    await nativeKioskModule.stopLockTask();
    console.log('[KioskMode] stopLockTask success');
    return true;
  } catch (error) {
    console.error('[KioskMode] stopLockTask failed', error);
    return false;
  }
};

export const checkKioskModeState = async () => {
  if (!canUseNativeKiosk || !nativeKioskModule?.isLockTaskActive) {
    return false;
  }

  try {
    const active = await nativeKioskModule.isLockTaskActive();
    return !!active;
  } catch (error) {
    console.error('[KioskMode] isLockTaskActive failed', error);
    return false;
  }
};

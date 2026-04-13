import React from 'react';
import { Alert, AppState, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { STORAGE_KEYS } from '../utils/constants';
import { startKioskModeForSession, stopKioskModeAfterSession } from '../services/kioskModeService';

// Import screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeSoftScreen';
import AppsScreen from '../screens/AppsSoftScreen';
import ProfileScreen from '../screens/ProfileSoftScreen';
import RequestScreen from '../screens/RequestSoftScreen';
import BlockedScreen from '../screens/BlockedScreen';
import NoDeviceScreen from '../screens/NoDeviceScreen';
import VideosScreen from '../screens/VideosScreen';
import WatchVideoScreen from '../screens/WatchVideoScreen';


export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  NoDevice: undefined;
  Home: undefined;
  Apps: undefined;
  Profile: undefined;
  Request: undefined;
  Blocked: undefined;
  Videos: undefined;
  WatchVideo: { video: { videoId: number; title: string; description?: string; url?: string; youtubeId?: string; thumbnailUrl?: string; durationSeconds?: number } };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

const resetToHomeSafely = (attempt = 0) => {
  console.log('[SessionExpire] resetToHomeSafely called', { attempt, isReady: navigationRef.isReady() });

  if (navigationRef.isReady()) {
    console.log('[SessionExpire] navigation is ready, resetting to Home');
    navigationRef.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
    return;
  }

  if (attempt >= 5) {
    console.warn('[SessionExpire] navigation reset aborted after max retries');
    return;
  }

  console.log('[SessionExpire] navigation not ready, scheduling retry', { nextAttempt: attempt + 1 });
  setTimeout(() => resetToHomeSafely(attempt + 1), 150);
};

export const AppNavigator = () => {
  const { isAuthenticated, isLoading, hasDevice, sessionExpiredSignal } = useAuth();
  const [hasActiveSession, setHasActiveSession] = React.useState(false);

  const checkSessionActive = React.useCallback(async () => {
    try {
      const [sessionId, sessionStartTime, approvedMinutes] = await AsyncStorage.multiGet([
        STORAGE_KEYS.CURRENT_SESSION_ID,
        'sessionStartTime',
        'sessionApprovedMinutes',
      ]).then((results) => results.map((item) => item[1]));

      const active = Boolean(sessionId && sessionStartTime && Number(approvedMinutes) > 0);
      setHasActiveSession(active);
      return active;
    } catch (error) {
      console.error('[SessionFreeze] checkSessionActive error', error);
      setHasActiveSession(false);
      return false;
    }
  }, []);

  React.useEffect(() => {
    if (!sessionExpiredSignal || !isAuthenticated || !hasDevice) return;

    console.log('[SessionExpire] showing session expired alert', {
      sessionExpiredSignal,
      isAuthenticated,
      hasDevice,
      isNavReady: navigationRef.isReady(),
    });

    Alert.alert(
      'Hết thời gian phiên ⏰',
      'Phiên sử dụng đã hết thời gian. Nhấn OK để quay về trang chủ.',
      [
        {
          text: 'OK',
          onPress: () => {
            console.log('[SessionExpire] user pressed OK on session expired alert');
            resetToHomeSafely();
          },
        },
      ],
      { cancelable: false }
    );
  }, [hasDevice, isAuthenticated, sessionExpiredSignal]);

  React.useEffect(() => {
    let isMounted = true;
    const updateSession = async () => {
      const active = await checkSessionActive();
      if (active) {
        await startKioskModeForSession();
      } else {
        await stopKioskModeAfterSession();
      }
      if (isMounted) {
        setHasActiveSession(active);
      }
    };

    updateSession();
    const intervalId = setInterval(updateSession, 5000);

    const appStateListener = AppState.addEventListener('change', async (nextState) => {
      if (nextState === 'background') {
        const activeSession = await checkSessionActive();
        if (activeSession) {
          console.log('[SessionFreeze] app moved to background while session active');
        }
      }
    });

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      appStateListener.remove();
    };
  }, [checkSessionActive]);

  if (isLoading) {
    return null; // or a loading screen
  }

  return (
    <View style={styles.container}>
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4CAF93',
          },
          headerShadowVisible: false,
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700',
          },
          contentStyle: {
            backgroundColor: '#F7FCFA',
          },
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen 
              name="Splash" 
              component={SplashScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : !hasDevice ? (
          <>
            <Stack.Screen 
              name="NoDevice" 
              component={NoDeviceScreen}
              options={{ title: 'Chưa có thiết bị', headerLeft: () => null }}
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ title: 'Kid Shield' }}
            />
            <Stack.Screen 
              name="Apps" 
              component={AppsScreen}
              options={{ title: 'Ứng dụng được phép' }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ title: 'Thông tin cá nhân' }}
            />
            <Stack.Screen 
              name="Videos" 
              component={VideosScreen}
              options={{ title: 'Video an toàn' }}
            />
            <Stack.Screen 
              name="WatchVideo" 
              component={WatchVideoScreen}
              options={{ title: 'Xem video' }}
            />
            <Stack.Screen 
              name="Request" 
              component={RequestScreen}
              options={{ title: 'Yêu cầu truy cập' }}
            />
            <Stack.Screen 
              name="Blocked" 
              component={BlockedScreen}
              options={{ title: 'Nội dung bị chặn' }}
            />
          </>
        )}
      </Stack.Navigator>
      </NavigationContainer>
      {hasActiveSession && (
        <View style={styles.freezeBanner} pointerEvents="none">
          <Text style={styles.freezeText} numberOfLines={2}>
            Phiên sử dụng đang chạy. Không thể thoát khỏi ứng dụng cho đến khi phiên kết thúc.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  freezeBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(20, 83, 45, 0.95)',
    zIndex: 999,
  },
  freezeText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
  },
});

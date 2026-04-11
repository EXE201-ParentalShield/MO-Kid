import React from 'react';
import { Alert } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';

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

  if (isLoading) {
    return null; // or a loading screen
  }

  return (
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
  );
};

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';

// Import screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import AppsScreen from '../screens/AppsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RequestScreen from '../screens/RequestScreen';
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

export const AppNavigator = () => {
  const { isAuthenticated, isLoading, hasDevice } = useAuth();

  if (isLoading) {
    return null; // or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#10b981',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
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

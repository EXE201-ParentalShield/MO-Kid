// Shield Family Kid App - Constants
export const COLORS = {
  primary: '#3DD68C',
  primaryDark: '#2db574',
  primaryLight: '#6ee0a7',
  secondary: '#4C9AFF',
  success: '#059669',
  danger: '#dc2626',
  warning: '#f59e0b',
  background: '#f0fdf9',
  backgroundGradientStart: '#3DD68C',
  backgroundGradientEnd: '#E8FFF5',
  card: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#d1fae5',
  shadow: 'rgba(61, 214, 140, 0.2)',
  glow: 'rgba(61, 214, 140, 0.3)',
};

export const SCREEN_NAMES = {
  SPLASH: 'Splash',
  LOGIN: 'Login',
  HOME: 'Home',
  APPS: 'Apps',
  PROFILE: 'Profile',
  REQUEST: 'Request',
  BLOCKED: 'Blocked',
};

export const API_ENDPOINTS = {
  BASE_URL: 'https://api.shieldfamily.com', // Replace with actual API
  LOGIN: '/auth/kid/login',
  HOME: '/kid/home',
  APPS: '/kid/apps',
  REQUESTS: '/kid/requests',
};

export const STORAGE_KEYS = {
  TOKEN: '@shield_kid_token',
  USER_DATA: '@shield_kid_user',
};

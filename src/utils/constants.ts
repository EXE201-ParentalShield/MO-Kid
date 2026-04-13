// Shield Family Kid App - Constants
export const COLORS = {
  primary: '#4CAF93',
  primaryDark: '#2F8F74',
  primaryLight: '#DDF5EE',
  secondary: '#BFE7F7',
  success: '#059669',
  danger: '#E57373',
  warning: '#f59e0b',
  background: '#F7FCFA',
  backgroundGradientStart: '#FFFFFF',
  backgroundGradientEnd: '#EAF8F2',
  card: '#ffffff',
  text: '#17322A',
  textSecondary: '#64748b',
  border: '#D9EEE6',
  shadow: 'rgba(23, 50, 42, 0.08)',
  glow: 'rgba(76, 175, 147, 0.18)',
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
  AUTH_LOGIN_AT: '@shield_kid_auth_login_at',
  DEVICE_ID: '@shield_kid_device_id',
  DEVICE_UNIQUE_ID: '@shield_kid_device_unique_id',
  CURRENT_SESSION_ID: '@shield_kid_current_session_id',
  COMPLETED_REQUEST_IDS: '@shield_kid_completed_request_ids',
  REQUEST_BADGE_LAST_SEEN_AT: '@shield_kid_request_badge_last_seen_at',
};

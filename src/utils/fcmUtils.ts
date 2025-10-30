// fcmUtils.ts
import { getFcmToken, isNotificationPermissionGranted, requestNotificationPermission } from '../firebase-messaging';
import { putFcmToken } from '../redux/apis/retailer/notificationsApis';

// FCM Token localStorage key
const FCM_TOKEN_KEY = 'pushNotificationDeviceId';

// Send FCM token to backend for retailer users
export const sendFcmTokenToBackend = async (token: string) => {
  try {
    // Use the retailer-specific API endpoint
    const response = await putFcmToken(token);
    
    if (response) {
      console.log('FCM token sent to backend successfully');
      return true;
    } else {
      console.error('Failed to send FCM token to backend');
      return false;
    }
  } catch (error) {
    console.error('Error sending FCM token to backend:', error);
    return false;
  }
};

// Initialize FCM and send token to backend
export const initializeFCMAndSendToken = async () => {
  try {
    // Check if we already have a token and it's the same
    const existingToken = getStoredFcmToken();
    
    // Check if permission is granted
    if (!isNotificationPermissionGranted()) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        console.warn('Notification permission denied by user');
        return null;
      }
    }

    // Get FCM token
    const token = await getFcmToken();
    if (!token) {
      console.warn('Failed to get FCM token');
      return null;
    }

    // Only send token to backend if it's different from the stored one
    if (token !== existingToken) {
      const sent = await sendFcmTokenToBackend(token);
      if (sent) {
        localStorage.setItem(FCM_TOKEN_KEY, token);
        console.log('FCM token saved and sent to backend');
      }
    } else {
      console.log('FCM token already exists and is up to date');
    }

    return token;
  } catch (error) {
    console.error('Error initializing FCM:', error);
    return null;
  }
};

// Get stored FCM token
export const getStoredFcmToken = (): string | null => {
  try {
    return localStorage.getItem(FCM_TOKEN_KEY);
  } catch (error) {
    console.warn('Error accessing localStorage:', error);
    return null;
  }
};

// Clear stored FCM token
export const clearStoredFcmToken = (): void => {
  try {
    localStorage.removeItem(FCM_TOKEN_KEY);
  } catch (error) {
    console.warn('Error clearing FCM token from localStorage:', error);
  }
};

// Check if FCM is supported
export const isFCMSupported = (): boolean => {
  try {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator && 
      'Notification' in window &&
      'PushManager' in window &&
      typeof window.addEventListener === 'function'
    );
  } catch (error) {
    console.warn('Error checking FCM support:', error);
    return false;
  }
}; 
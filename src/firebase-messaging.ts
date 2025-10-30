// firebase-messaging.ts
import { checkFirebaseSupport, isFirebaseMessagingAvailable } from './utils/firebaseWrapper';

// Check if Firebase messaging is supported in this browser
const isFirebaseMessagingSupported = (): boolean => {
  try {
    const supportCheck = checkFirebaseSupport();
    return supportCheck.supported;
  } catch (error) {
    console.warn('Firebase messaging not supported:', error);
    return false;
  }
};

// Initialize Firebase only if supported
// let app: any = null;
// let messaging: any = null;

try {
  if (isFirebaseMessagingSupported()) {
    // app = initializeApp(firebaseConfig); // This line is removed as per the new_code
    // messaging = getMessaging(app); // This line is removed as per the new_code
  }
} catch (error) {
  console.warn('Failed to initialize Firebase:', error);
}

// 👇 Request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    if (!isFirebaseMessagingSupported()) {
      console.warn('Firebase messaging not supported in this browser');
      return false;
    }

    const permission = await Notification.requestPermission();
    // console.log('Notification permission:', permission);  
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// 👇 Check if notification permission is granted
export const isNotificationPermissionGranted = (): boolean => {
  try {
    if (!isFirebaseMessagingSupported()) {
      return false;
    }
    return Notification.permission === 'granted';
  } catch (error) {
    console.warn('Error checking notification permission:', error);
    return false;
  }
};

// 👇 Request permission and get token
export const getFcmToken = async (): Promise<string | null> => {
  try {
    if (!isFirebaseMessagingSupported()) {
      console.warn('Firebase messaging not supported in this browser');
      return null;
    }

    if (!isFirebaseMessagingAvailable()) {
      console.warn('Firebase not initialized yet');
      return null;
    }

    // First check if we have permission
    if (!isNotificationPermissionGranted()) {
      // console.log('Requesting notification permission...'); 
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        console.warn('Notification permission denied');
        return null;
      }
    }

    // Check if service worker is registered
    if (!('serviceWorker' in navigator)) {
      console.error('Service Worker not supported');
      return null;
    }

    // Dynamic import to prevent crashes
    const { getToken } = await import('firebase/messaging');
    const { getMessaging } = await import('firebase/messaging');
    
    // Get messaging instance from the wrapper
    const messaging = getMessaging();
    
    if (!messaging) {
      console.warn('Firebase messaging not available');
      return null;
    }

    const currentToken = await getToken(messaging, {
      // Get this from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY || "YOUR_VAPID_KEY_HERE",
    });

    if (currentToken) {
      // console.log('FCM Token:', currentToken);
      return currentToken;
    } else {
      console.warn('No registration token available');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
    return null;
  }
};

// 👇 Receive foreground messages
export const onMessageListener = (callback: (payload: any) => void) => {
  try {
    if (!isFirebaseMessagingSupported()) {
      console.warn('Firebase messaging not supported in this browser');
      // Return a dummy unsubscribe function to prevent errors
      return () => {};
    }

    if (!isFirebaseMessagingAvailable()) {
      console.warn('Firebase not initialized yet');
      // Return a dummy unsubscribe function to prevent errors
      return () => {};
    }

    // Dynamic import to prevent crashes
    return import('firebase/messaging').then(({ onMessage, getMessaging }) => {
      const messaging = getMessaging();
      
      if (!messaging) {
        console.warn('Firebase messaging not available');
        return () => {};
      }

      return onMessage(messaging, (payload) => {
        // console.log('Message received. ', payload);
        callback(payload);
      });
    }).catch((error) => {
      console.warn('Error setting up message listener:', error);
      return () => {};
    });
  } catch (error) {
    console.warn('Error setting up message listener:', error);
    // Return a dummy unsubscribe function to prevent errors
    return () => {};
  }
};

// 👇 Initialize FCM (call this when app starts)
export const initializeFCM = async (): Promise<string | null> => {
  try {
    if (!isFirebaseMessagingSupported()) {
      console.warn('Firebase messaging not supported in this browser');
      return null;
    }

    // console.log('Initializing FCM...');
    const token = await getFcmToken();
    
    if (token) {
      // Store token in localStorage for later use
      localStorage.setItem('pushNotificationDeviceId', token);
      // console.log('FCM initialized successfully');
    } else {
      console.warn('FCM initialization failed - no token received');
    }
    
    return token;
  } catch (error) {
    console.error('Error initializing FCM:', error);
    return null;
  }
};

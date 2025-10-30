// firebaseWrapper.ts
// This file provides a safe wrapper around Firebase initialization
// to prevent crashes in unsupported browsers

let isFirebaseAvailable = false;
let firebaseError: string | null = null;
let initializationAttempted = false;

// Check if Firebase messaging is supported in this browser
export const checkFirebaseSupport = (): { supported: boolean; error?: string } => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return { supported: false, error: 'Not in browser environment' };
    }

    // Check if we're in a Node.js environment (SSR)
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      return { supported: false, error: 'Node.js environment detected' };
    }

    // Check for required APIs
    if (!('serviceWorker' in navigator)) {
      return { supported: false, error: 'Service Worker not supported' };
    }

    if (!('Notification' in window)) {
      return { supported: false, error: 'Notifications not supported' };
    }

    if (!('PushManager' in window)) {
      return { supported: false, error: 'Push Manager not supported' };
    }

    if (typeof window.addEventListener !== 'function') {
      return { supported: false, error: 'addEventListener not available' };
    }

    // Check if we're in a secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      return { supported: false, error: 'Not in secure context (HTTPS required)' };
    }

    // Additional checks for problematic environments
    try {
      // Test if addEventListener works
      const testElement = document.createElement('div');
      testElement.addEventListener('test', () => {});
      testElement.removeEventListener('test', () => {});
    } catch (error) {
      console.log('addEventListener test failed', error);
      return { supported: false, error: 'addEventListener test failed' };
    }

    return { supported: true };
  } catch (error) {
    return { 
      supported: false, 
      error: `Browser compatibility check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
};

// Initialize Firebase safely
export const initializeFirebaseSafely = async (): Promise<{ success: boolean; error?: string }> => {
  // Prevent multiple initialization attempts
  if (initializationAttempted) {
    return { 
      success: isFirebaseAvailable, 
      error: firebaseError || undefined
    };
  }

  initializationAttempted = true;

  try {
    const supportCheck = checkFirebaseSupport();
    
    if (!supportCheck.supported) {
      firebaseError = supportCheck.error || 'Browser not supported';
      return { success: false, error: firebaseError };
    }

    // Dynamic import to prevent crashes if Firebase modules fail to load
    const { initializeApp } = await import('firebase/app');
    const { getMessaging } = await import('firebase/messaging');

    const firebaseConfig = {
      apiKey: "AIzaSyD_rshvbucHnIRbvxUckVjRYSsEC8t2Wwo",
      authDomain: "retailer-woopsa.firebaseapp.com",
      projectId: "retailer-woopsa",
      storageBucket: "retailer-woopsa.firebasestorage.app",
      messagingSenderId: "533776914587",
      appId: "1:533776914587:web:374b37857532658864ce3e",
      measurementId: "G-JFYK43WHZJ"
    };

    const app = initializeApp(firebaseConfig);
    const messaging = getMessaging(app);
    console.log('messaging', messaging);
    
    isFirebaseAvailable = true;
    return { success: true };
  } catch (error) {
    firebaseError = error instanceof Error ? error.message : 'Firebase initialization failed';
    isFirebaseAvailable = false;
    return { success: false, error: firebaseError };
  }
};

// Check if Firebase is available
export const isFirebaseMessagingAvailable = (): boolean => {
  return isFirebaseAvailable;
};

// Get the last Firebase error
export const getFirebaseError = (): string | null => {
  return firebaseError;
};

// Safe wrapper for Firebase messaging operations
export const safeFirebaseOperation = async <T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> => {
  try {
    if (!isFirebaseAvailable) {
      console.warn('Firebase messaging not available');
      return fallback;
    }
    
    return await operation();
  } catch (error) {
    console.warn('Firebase operation failed:', error);
    return fallback;
  }
};

// Initialize Firebase on app startup
export const initializeFirebaseOnStartup = async (): Promise<void> => {
  try {
    // Add a small delay to ensure the app is fully loaded
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const result = await initializeFirebaseSafely();
    
    if (result.success) {
      console.log('Firebase messaging initialized successfully');
    } else {
      console.warn('Firebase messaging not available:', result.error);
    }
  } catch (error) {
    console.warn('Failed to initialize Firebase on startup:', error);
  }
};

// Force disable Firebase (useful for testing or when issues occur)
export const forceDisableFirebase = (): void => {
  isFirebaseAvailable = false;
  firebaseError = 'Firebase manually disabled';
  console.warn('Firebase messaging manually disabled');
};

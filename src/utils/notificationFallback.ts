// notificationFallback.ts
// Provides fallback notification functionality when Firebase messaging is not available

export interface NotificationData {
  title: string;
  body: string;
  timestamp?: number;
}

class NotificationFallback {
  private notifications: NotificationData[] = [];
  private listeners: ((notification: NotificationData) => void)[] = [];

  // Add a notification
  addNotification(title: string, body: string): void {
    const notification: NotificationData = {
      title,
      body,
      timestamp: Date.now()
    };

    this.notifications.push(notification);
    
    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.warn('Error in notification listener:', error);
      }
    });

    // Keep only last 50 notifications to prevent memory issues
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(-50);
    }
  }

  // Get all notifications
  getNotifications(): NotificationData[] {
    return [...this.notifications];
  }

  // Clear all notifications
  clearNotifications(): void {
    this.notifications = [];
  }

  // Add a listener for new notifications
  addListener(listener: (notification: NotificationData) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Remove a specific listener
  removeListener(listener: (notification: NotificationData) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Check if fallback notifications are supported
  isSupported(): boolean {
    try {
      return typeof window !== 'undefined' && 'localStorage' in window;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const notificationFallback = new NotificationFallback();

// Helper function to show a simple browser notification
export const showBrowserNotification = (title: string, body: string): void => {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      });
    }
  } catch (error) {
    console.warn('Failed to show browser notification:', error);
  }
};

// Helper function to check if browser notifications are supported
export const isBrowserNotificationSupported = (): boolean => {
  try {
    return 'Notification' in window;
  } catch {
    return false;
  }
};

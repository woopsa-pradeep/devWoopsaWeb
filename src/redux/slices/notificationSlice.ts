import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getNotificationList, readNotification, readAllNotification } from '../apis/retailer/notificationsApis';

interface Notification {
  id: number;
  userNumber: string;
  title: string;
  description: string;
  isRead: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  type?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

// Async thunks for retailer
export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (_, { getState }) => {
    const state = getState() as any;
    const role = state.auth.role;
    
    // Only for retailer users
    if (role === 'retailer') {
      const response: any = await getNotificationList();
      return response.data;
    }
    return [];
  }
);

export const fetchNotificationCount = createAsyncThunk(
  'notification/fetchNotificationCount',
  async (_, { getState }) => {
    const state = getState() as any;
    const role = state.auth.role;
    
    // Only for retailer users
    if (role === 'retailer') {
      const response: any = await getNotificationList();
      const unreadCount = response.data.filter((notification: Notification) => !notification.isRead).length;
      return { unreadCount };
    }
    return { unreadCount: 0 };
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId: string, { getState }) => {
    const state = getState() as any;
    const role = state.auth.role;
    
    // Only for retailer users
    if (role === 'retailer') {
      await readNotification(notificationId);
    }
    
    return notificationId;
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (_, { getState }) => {
    const state = getState() as any;
    const role = state.auth.role;
    
    // Only for retailer users
    if (role === 'retailer') {
      await readAllNotification();
    }
    
    return true;
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    updateNotificationCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload || [];
        state.unreadCount = (action.payload || []).filter((notification: Notification) => !notification.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch notifications';
      })
      // Fetch notification count
      .addCase(fetchNotificationCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.unreadCount || 0;
      })
      // Mark as read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find((n: any) => n.id === action.payload);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      // Mark all as read
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach(notification => {
          notification.isRead = true;
        });
        state.unreadCount = 0;
      });
  },
});

export const { clearNotifications, addNotification, updateNotificationCount } = notificationSlice.actions;
export default notificationSlice.reducer; 
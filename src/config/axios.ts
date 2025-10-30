import axios from 'axios';
import { logout } from '../redux/slices/authSlice';
import { clearCart } from '../redux/slices/cartSlice';
import { store } from '../redux/store';
import { clearSalesCart } from '../redux/slices/salesCartSlice';
import { showGlobalPopup } from '../redux/slices/globalPopupSlice';
import { clearDashboardData } from '../redux/slices/dashboardSlice';
import { clearSalesDashboardData } from '../redux/slices/salesDashboardSlice';

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 600000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If token exists, add it to headers
    if (token) {
      config!.headers!.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Handle 409 Customer context changed for sales users
    if (error?.response?.status === 409) {
      const state = store.getState();
      const userRole = state.auth.role;
      const customerId = error?.response?.data?.data?.currentCustomerId
      if (userRole === 'sales') {
        store.dispatch(showGlobalPopup({
          title: "Customer Context Changed",
          message: "Customer context changed. Please refresh.",
          buttonText: "OK",
          customerId
        }));
      }
    }

    // Handle 401 Unauthorized and 403 Forbidden errors
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear auth state and cart data
      store.dispatch(logout());
      store.dispatch(clearCart());
      store.dispatch(clearSalesCart());
      store.dispatch(clearDashboardData());
      store.dispatch(clearSalesDashboardData());
      
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
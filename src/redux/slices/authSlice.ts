// src/redux/slices/authSlice.ts

import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { loginUser, loginWithOtpThunk, signupThunk, verifyOtpThunk, loginSalesUser } from "../thunks/authThunks";

interface WarehouseDetail {
  D_Name: string;
  D_Addr1: string;
  D_City: string;
  D_State: string;
  D_Phone: string;
}

interface Route {
  Route_Number: number;
  Stop_Number: number;
}

interface SalesRep {
  S_Desc: string;
}

interface StoreDetail {
  C_CoName: string;
  C_Address: string;
  C_City: string;
  C_State: string;
  C_Phone: string;
  C_Number: string;
  C_Name: string;
  LastPaymentAmount: number;
  C_OrderDay: any;
  salesRep: SalesRep;
  Routes: Route[];
  LastBalance: number;
  C_Zip: string;
  Jurisdiction_State: string;
}

interface Customer {
  C_Number: number;
  C_Name: string;
}

interface Store {
  C_Number: number;
  C_CoName: string;
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  error: string | null;
  emailPhone: string | null;
  otpSent: boolean;
  role: string | null;
  wareHouseDetail: WarehouseDetail[] | null;
  storeDetail: StoreDetail | null;
  signUpData:any;
  module: any;
  selectedCustomer: Customer | null;
  isSessionActive: any;
  logo: string | null;
  allowDiscount: boolean | null;
  discountLimit: number | null;
  allowDeliveryCharge: boolean | null;
  hasMultipleStore: boolean | null;
  stores: Store[] | null;
  selectedStore: Store | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  loading: false,
  error: null,
  emailPhone: null,
  otpSent: false,
  role: null,
  wareHouseDetail: null,
  storeDetail: null,
  signUpData: null,
  module: null,
  selectedCustomer: null,
  isSessionActive: null,
  logo: null,
  allowDiscount: null,
  discountLimit: null,
  allowDeliveryCharge: null,
  hasMultipleStore: null,
  stores: null,
  selectedStore: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.emailPhone = null;
      state.otpSent = false;
      state.role = null;
      state.wareHouseDetail = null;
      state.storeDetail = null;
      state.logo= null;
      state.signUpData = null;
      state.module = null;
      state.selectedCustomer = null;
      state.isSessionActive = null;
      state.allowDiscount = null;
      state.discountLimit = null;
      state.allowDeliveryCharge = null;
      state.hasMultipleStore = null;
      state.stores = null;
      state.selectedStore = null;
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('emailPhone');
      localStorage.removeItem('pushNotificationDeviceId');
    },
    clearError: (state) => {
      state.error = null;
    },
    setSelectedCustomer: (state, action) => {
      state.selectedCustomer = action.payload;
    },
    updateSessionCustomer: (state, action) => {
      if (state.isSessionActive) {
        state.isSessionActive.currentCustomerId = action.payload;
      }
    },
    updateStoreDetails: (state, action) => {
      state.storeDetail = action.payload;
    },
    setLogo: (state, action) => {
      state.logo = action.payload;
    },
    setMultipleStores: (state, action) => {
      state.hasMultipleStore = action.payload.hasMultipleStore;
      state.stores = action.payload.stores;
      if (action.payload.stores && action.payload.stores.length > 0) {
        // Always update selectedStore based on current storeDetail
        const currentStoreNumber = state.storeDetail?.C_Number;
        const currentStore = action.payload.stores.find((store: Store) => 
          store.C_Number.toString() === currentStoreNumber?.toString()
        );
        // Set selectedStore to current store if found, otherwise keep existing or set first
        state.selectedStore = currentStore || state.selectedStore || action.payload.stores[0];
      } else {
        // If no stores, clear selectedStore
        state.selectedStore = null;
      }
    },
    setSelectedStore: (state, action) => {
      state.selectedStore = action.payload;
    },
    setAuthFromSwitchStore: (state, action) => {
      // Handle switchStore response like verifyOtp response
      const authData = action.payload.authData;
      const emailPhone = action.payload.emailPhone;
      state.isAuthenticated = true;
      state.token = authData.token;
      state.role = authData.role;
      state.wareHouseDetail = authData.wareHouseDetail;
      state.storeDetail = authData.storeDetail;
      state.logo = authData.logo;
      if (emailPhone) {
        state.emailPhone = emailPhone;
        localStorage.setItem('emailPhone', emailPhone);
      }
      localStorage.setItem('token', authData.token);
      localStorage.setItem('role', authData.role);
    }
  },
  extraReducers: (builder) => {
    builder
      // OTP Login
      .addCase(loginWithOtpThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      
      .addCase(loginWithOtpThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.otpSent = true;
        state.emailPhone = action.meta.arg.email_phone;
        localStorage.setItem('emailPhone', action.meta.arg.email_phone);
      })
      .addCase(loginWithOtpThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // OTP Verification
      .addCase(verifyOtpThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtpThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.wareHouseDetail = action.payload.wareHouseDetail;
        state.storeDetail = action.payload.storeDetail;
        state.otpSent = false;
        state.logo = action.payload.logo;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('role', action.payload.role);
      })
      .addCase(verifyOtpThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Signup
      .addCase(signupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupThunk.fulfilled, (state, action: any) => {
        state.loading = false;
        state.signUpData = action?.payload?.data;
      })
      .addCase(signupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: any) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.role = action.payload.role;
        state.wareHouseDetail = action.payload.wareHouseDetail;
        state.storeDetail = action.payload.storeDetail;
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('role', action.payload.role);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Sales Login
      .addCase(loginSalesUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginSalesUser.fulfilled, (state, action: any) => {
        const data = action?.payload?.data;
        state.loading = false;
        state.isAuthenticated = true;
        state.token = data.token;
        state.role = data.role;
        state.logo = data.logo;
        state.module = data.rolesPermission;
        state.isSessionActive = data?.profile?.isSessionActive;
        state.storeDetail = data?.storeDetail;
        state.allowDiscount = data?.profile?.allowDiscount ?? null;
        state.discountLimit = data?.profile?.discountLimit ?? null;
        state.allowDeliveryCharge = data?.profile?.allowDeliveryCharge ?? null;
        // Convert wholesaledetail object to array
        state.wareHouseDetail = data?.wholeStoreDetail ? [data.wholeStoreDetail] : null;
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
      })
      .addCase(loginSalesUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
      
  },
});

export const { logout, clearError, setSelectedCustomer, updateSessionCustomer, updateStoreDetails, setLogo, setMultipleStores, setSelectedStore, setAuthFromSwitchStore } = authSlice.actions;
export const selectAuth = (state: RootState) => state.auth;
export default authSlice.reducer;

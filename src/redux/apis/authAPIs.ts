// src/redux/apis/authAPIs.ts

import axiosInstance from "../../config/axios";
import { getDeviceHeaders } from "../../utils/deviceUtils";

interface LoginPayload {
  email_phone: string;
  isEmail: boolean;
}

interface VerifyOtpPayload {
  email_phone: string;
  otp: string;
}

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
  LastPaymentAmount: number;
  C_OrderDay: any;
  salesRep: SalesRep;
  Routes: Route[];
  C_Zip: string;
  Jurisdiction_State: string;
}

interface AuthResponse {
  wareHouseDetail: WarehouseDetail[];
  storeDetail: StoreDetail;
  role: string;
  token: string;
  logo?: string;
  salesCategory?: number[];
  showTradeShow?: boolean;
}

export const fakeLogin = async (data: { email_phone: string; password: string }) => {
  return new Promise<{ token: string }>((resolve, reject) => {
    setTimeout(() => {
      if (data.email_phone === "admin@example.com" && data.password === "admin123") {
        resolve({ token: "fake_jwt_token" });
      } else {
        reject("Invalid email or password");
      }
    }, 1000);
  });
};

export const login = async (data: { email_phone: string; password: string,isEmail: boolean }) => {
  try {
    const response = await axiosInstance.post('/auth/loginWithPassword', data,
      {
        headers: getDeviceHeaders()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};
export const signup = async (data: { account_number: string }) => {
  try {
    const response = await axiosInstance.post('/auth/signup', data,
      {
        headers: getDeviceHeaders()
      }
    );
    return response;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;  
  }
};
export const verifyRetailerOtp = async (data: {  email_phone:string, account_number: string, otp: string }) => {
  try {
    const response = await axiosInstance.post('/auth/verifyRetailerOtp', data,
      {
        headers: getDeviceHeaders()
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching data:', error);
    return error?.response?.data || 'Failed to verify OTP';  
  }
};

export const loginWithOtp = async (data: LoginPayload): Promise<{ message: string }> => {
  try {
    const response = await axiosInstance.post<{ message: string }>('/auth/login', data,
      {
        headers: getDeviceHeaders()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error in OTP login:', error);
    throw error;
  }
};

export const verifyOtp = async (data: VerifyOtpPayload): Promise<AuthResponse> => {
  try {
    const response = await axiosInstance.post<AuthResponse>('/auth/verify', data,
      {
        headers: getDeviceHeaders()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error in OTP verification:', error);
    throw error;
  }
};

export const loginSales = async (data: { email: string; password: string }) => {
  try {
    const response = await axiosInstance.post('/auth/salesLogin', data,
      {
        headers: getDeviceHeaders()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error in sales login:', error);
    throw error;
  }
};

export const forgotPassword = async (data: { email: string }) => {
  try {
    const response = await axiosInstance.post('/auth/forgotPassword', data,
      {
        headers: getDeviceHeaders()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error in forgot password:', error);
    throw error;
  }
};

export const resetPassword = async (data: { token: string; newPassword: string }) => {
  try {
    const response = await axiosInstance.post('/auth/resetPassword', data,
      {
        headers: getDeviceHeaders()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error in reset password:', error);
    throw error;
  }
};

export const resendOtp = async (data: { email_phone: string, isEmail: boolean }) => {
  try {
    const response = await axiosInstance.post('/auth/resendOtp', data,
      {
        headers: getDeviceHeaders()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error in resend OTP:', error);
    throw error;
  }
};

export const authLogout = async () => {
  try {
    const response = await axiosInstance.post('/auth/logout', {},
      {
        headers: getDeviceHeaders()
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error in logout:', error);
    throw error;
  }
}
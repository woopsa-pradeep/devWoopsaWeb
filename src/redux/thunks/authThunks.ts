// src/redux/thunks/authThunks.ts

import { createAsyncThunk } from "@reduxjs/toolkit";
import { login, loginWithOtp, signup, verifyOtp, loginSales } from "../apis/authAPIs";
import { toast } from "react-hot-toast";

interface LoginPayload {
  email_phone: string;
  isEmail: boolean;
}

interface VerifyOtpPayload {
  email_phone: string;
  otp: string;
}

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (data: { email_phone: string; password: string ,isEmail: boolean}, thunkAPI) => {
    try {
      const response = await login(data);
      return response;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error?.response?.data?.message || 'Login failed');
    }
  }
);

export const loginWithOtpThunk = createAsyncThunk(
  "auth/loginWithOtp",
  async (data: LoginPayload, thunkAPI) => {
    try {
      const response = await loginWithOtp(data);
      toast.success("OTP sent successfully");
      return response;
    } catch (error:any) {
      return thunkAPI.rejectWithValue(error?.response?.data?.message || 'Failed to send OTP');
    }
  }
);

export const verifyOtpThunk = createAsyncThunk(
  "auth/verifyOtp",
  async (data: VerifyOtpPayload, thunkAPI) => {
    try {
      const response: any = await verifyOtp(data);
      toast.success("OTP verified successfully");
      return response?.data;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error?.response?.data?.message || 'Failed to verify OTP');
    }
  }
);

export const signupThunk = createAsyncThunk(
  "auth/signup",
  async (data: { account_number: string }, thunkAPI) => {
    try {
      const response: any = await signup(data);
      return response?.data;
    } catch (error:any) {
      return thunkAPI.rejectWithValue(error?.response?.data?.message);
    }
  }
);

export const loginSalesUser = createAsyncThunk(
  "auth/loginSalesUser",
  async (data: { email: string; password: string }, thunkAPI) => {
    try {
      const response = await loginSales(data);
      return response;
    } catch (error: any) {
      return thunkAPI.rejectWithValue(error?.response?.data?.message || 'Sales login failed');
    }
  }
);
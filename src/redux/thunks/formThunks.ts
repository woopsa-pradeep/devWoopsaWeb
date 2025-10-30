import { createAsyncThunk } from "@reduxjs/toolkit";
import { fakeFormSubmit } from "../apis/exampleAPI";

export const submitForm = createAsyncThunk(
  "form/submitForm",
  async (formData: { name: string; email: string }, thunkAPI) => {
    try {
      const res = await fakeFormSubmit(formData);
      return res;
    } catch (error) {
      // Log the error for debugging
      console.error("Form submission error:", error);
      
      // Return a user-friendly error message
      return thunkAPI.rejectWithValue("Failed to submit form. Please try again later.");
    }
  }
);

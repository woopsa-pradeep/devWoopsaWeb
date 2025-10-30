// src/redux/slices/formSlice.ts
import { createSlice } from "@reduxjs/toolkit";
import { submitForm } from "../thunks/formThunks";
import { RootState } from "../store";

interface FormState {
  data: { name: string; email: string }[]; // stores submitted forms
  submitting: boolean;
  message: string | null;
  error: string | null;
}

const initialState: FormState = {
  data: [],
  submitting: false,
  message: null,
  error: null,
};

const formSlice = createSlice({
  name: "form",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(submitForm.pending, (state) => {
        state.submitting = true;
        state.message = null;
        state.error = null;
      })
      .addCase(submitForm.fulfilled, (state, action) => {
        state.submitting = false;
        state.data.push(action.payload);
        state.message = "Form submitted successfully!";
      })
      .addCase(submitForm.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      });
  },
});

export default formSlice.reducer;
export const selectForm = (state: RootState) => state.form;

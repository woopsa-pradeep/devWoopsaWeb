import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface GlobalPopupState {
  isOpen: boolean;
  title: string;
  message: string;
  buttonText: string;
  customerId: any
}

const initialState: GlobalPopupState = {
  isOpen: false,
  title: "Notification",
  message: "",
  buttonText: "OK",
  customerId: null
};

const globalPopupSlice = createSlice({
  name: 'globalPopup',
  initialState,
  reducers: {
    showGlobalPopup: (state, action: PayloadAction<{
      title?: string;
      message: string;
      buttonText?: string;
        customerId?: any;
    }>) => {
      state.isOpen = true;
      state.title = action.payload.title || "Notification";
      state.message = action.payload.message;
      state.buttonText = action.payload.buttonText || "OK";
      state.customerId = action.payload.customerId || "";
    },
    hideGlobalPopup: (state) => {
      state.isOpen = false;
      state.title = "Notification";
      state.message = "";
      state.buttonText = "OK";
      state.customerId = "";
    },
    setCustomerId: (state, action: PayloadAction<any>) => {
      state.customerId = action.payload;
    }
  }
});

export const { showGlobalPopup, hideGlobalPopup, setCustomerId } = globalPopupSlice.actions;
export default globalPopupSlice.reducer; 
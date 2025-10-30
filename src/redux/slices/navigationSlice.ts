import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type NavigationStep = 
  | 'dashboard'
  | 'retailer-requests'
  | 'products'
  | 'orders'
  | 'users'
  | 'settings'
  | 'profile'
  | 'notifications'
  | 'support'
  | 'analytics'
  | 'reports'
  | 'inventory'
  | 'customers'
  | 'vendors'
  | 'promotions'
  | 'stories'
  | 'permissions'
  | 'links'
  | 'account-receivable'
  | 'track-devices'
  | 'retailer-request-form';

interface NavigationState {
  activeStep: NavigationStep;
  previousStep: NavigationStep | null;
}

const initialState: NavigationState = {
  activeStep: 'dashboard',
  previousStep: null,
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    setActiveStep: (state, action: PayloadAction<NavigationStep>) => {
      state.previousStep = state.activeStep;
      state.activeStep = action.payload;
    },
    goBack: (state) => {
      if (state.previousStep) {
        const temp = state.activeStep;
        state.activeStep = state.previousStep;
        state.previousStep = temp;
      }
    },
    resetNavigation: (state) => {
      state.activeStep = 'dashboard';
      state.previousStep = null;
    },
  },
});

export const { setActiveStep, goBack, resetNavigation } = navigationSlice.actions;
export default navigationSlice.reducer;

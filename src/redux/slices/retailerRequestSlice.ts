import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RetailerRequest {
  id: string;
  business_name: string;
  dba_name?: string;
  business_type: string;
  federal_ein?: string;
  ownership_type?: string;
  primary_contact: string;
  phone?: string;
  email?: string;
  website?: string;
  physical_street?: string;
  physical_city?: string;
  physical_state?: string;
  physical_zip?: string;
  physical_county?: string;
  mailing_same_as_physical?: boolean;
  mailing_street?: string;
  mailing_city?: string;
  mailing_state?: string;
  mailing_zip?: string;
  sales_tax_id?: string;
  state_tobacco_license?: string;
  federal_tobacco_permit?: string;
  resale_certificate_url?: string;
  state_tobacco_license_url?: string;
  business_license_url?: string;
  owner_government_id_url?: string;
  owners?: Array<{
    fullName: string;
    title?: string;
    ownership?: string;
    dateOfBirth?: string;
    email?: string;
    homeAddress?: string;
    phone?: string;
  }>;
  credit_limit_requested?: boolean;
  bank_name?: string;
  bank_account_last4?: string;
  references?: Array<{
    company: string;
    contact?: string;
    phone?: string;
    email?: string;
  }>;
  preferred_delivery_time?: string;
  special_delivery_instructions?: string;
  compliance_certification?: boolean;
  authorized_signature?: string;
  signature_date?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';
  createdAt: string;
  updatedAt: string;
}

interface RetailerRequestState {
  selectedRequest: RetailerRequest | null;
  loading: boolean;
  error: string | null;
}

const initialState: RetailerRequestState = {
  selectedRequest: null,
  loading: false,
  error: null,
};

const retailerRequestSlice = createSlice({
  name: 'retailerRequest',
  initialState,
  reducers: {
    setSelectedRequest: (state, action: PayloadAction<RetailerRequest>) => {
      state.selectedRequest = action.payload;
      state.error = null;
    },
    clearSelectedRequest: (state) => {
      state.selectedRequest = null;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { 
  setSelectedRequest, 
  clearSelectedRequest, 
  setLoading, 
  setError 
} = retailerRequestSlice.actions;

export default retailerRequestSlice.reducer;

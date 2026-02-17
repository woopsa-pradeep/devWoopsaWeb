import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface TradeShowBasicDetails {
  id: number | string | null;
  name: string;
  tradeShowDate: string;
  deliveryStartDate: string;
  deliveryEndDate: string;
  deliveryWeeks: number;
}

/** Step 0 form draft (serializable for persist) */
export interface TradeShowCreateDraft {
  name: string;
  tradeShowDate: string | null;
  startDate: string | null;
  endDate: string | null;
}

/** Saved item from API (POST bulk or summary) for step 2 PUT */
export interface SavedTradeShowItem {
  id: number;
  discount: string;
  minQuantity: number;
  maxQuantity: number;
  disType: "PERCENT" | "FLAT";
}

/** Applied discount item (Products & Discounts step) */
export interface AppliedDiscountItemPayload {
  itemNumber: string;
  discount: string;
  minQuantity: number;
  maxQuantity: number;
  disType: "PERCENT" | "FLAT";
  salesCategory?: number;
  priceClass?: number;
  description?: string;
  name?: string;
  price?: string | number;
}

/** getTradeShowSummary response shape (serializable for persist) */
export interface TradeShowSummaryData {
  data: Array<{
    id: number;
    itemNumber: string;
    description: string;
    discount: string;
    minQuantity: number;
    maxQuantity: number;
    disType: string;
    salesCategory?: number;
    priceClass?: number;
  }>;
  vendors: Array<{
    Primary_Vendor: number;
    V_Description: string;
    V_Email: string;
    V_Phone: string;
    V_Addr1: string;
    V_City: string;
    V_State: string;
    V_Zip: string;
  }>;
  tradeShow: {
    id: number;
    name: string;
    tradeShowDate: string;
    deliveryStartDate: string;
    deliveryEndDate: string;
    deliveryWeeks: number;
  };
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  retails?: {
    count: number;
    rows: Array<{ retailerId: number; retailerName: string }>;
  };
  weekWiseCounts?: Array<{ weekNumber: number; count: number }>;
}

interface TradeShowState {
  currentTradeShow: TradeShowBasicDetails | null;
  selectedVendorIds: number[];
  /** Step 0 draft (name, dates) when no currentTradeShow yet */
  createDraft: TradeShowCreateDraft;
  /** Current step 0–5 */
  activeStep: number;
  selectedRetailerIds: number[];
  /** Step 2: products with discounts (from UI + API response) */
  appliedItems: AppliedDiscountItemPayload[];
  /** itemNumber -> saved API row for step 2 PUT */
  savedTradeShowItems: Record<string, SavedTradeShowItem>;
  /** weekIndex (as string for JSON) -> item numbers in that week */
  weekProductAssignments: Record<string, string[]>;
  /** getTradeShowSummary response for Summary step and update */
  summaryData: TradeShowSummaryData | null;
  lastSavedVendorIds: number[] | null;
  lastSavedRetailerIds: number[] | null;
  lastSavedDeliveryItemNumbers: string[] | null;
  /** Step 2: item numbers already saved so we only ADD new, UPDATE/DELETE existing */
  lastSavedItemNumbers: string[] | null;
}

const initialState: TradeShowState = {
  currentTradeShow: null,
  selectedVendorIds: [],
  createDraft: {
    name: "",
    tradeShowDate: null,
    startDate: null,
    endDate: null,
  },
  activeStep: 0,
  selectedRetailerIds: [],
  appliedItems: [],
  savedTradeShowItems: {},
  weekProductAssignments: {},
  summaryData: null,
  lastSavedVendorIds: null,
  lastSavedRetailerIds: null,
  lastSavedDeliveryItemNumbers: null,
  lastSavedItemNumbers: null,
};

const tradeShowSlice = createSlice({
  name: "tradeShow",
  initialState,
  reducers: {
    setCurrentTradeShow(state, action: PayloadAction<TradeShowBasicDetails>) {
      state.currentTradeShow = action.payload;
    },
    clearCurrentTradeShow(state) {
      state.currentTradeShow = null;
      state.selectedVendorIds = [];
      state.createDraft = initialState.createDraft;
      state.activeStep = 0;
      state.selectedRetailerIds = [];
      state.appliedItems = [];
      state.savedTradeShowItems = {};
      state.weekProductAssignments = {};
      state.summaryData = null;
      state.lastSavedVendorIds = null;
      state.lastSavedRetailerIds = null;
      state.lastSavedDeliveryItemNumbers = null;
      state.lastSavedItemNumbers = null;
    },
    setSelectedVendorIds(state, action: PayloadAction<number[]>) {
      state.selectedVendorIds = action.payload;
    },
    setCreateDraft(state, action: PayloadAction<Partial<TradeShowCreateDraft>>) {
      state.createDraft = { ...state.createDraft, ...action.payload };
    },
    setActiveStep(state, action: PayloadAction<number>) {
      state.activeStep = action.payload;
    },
    setSelectedRetailerIds(state, action: PayloadAction<number[]>) {
      state.selectedRetailerIds = action.payload;
    },
    setAppliedItems(state, action: PayloadAction<AppliedDiscountItemPayload[]>) {
      state.appliedItems = action.payload;
    },
    setSavedTradeShowItems(state, action: PayloadAction<Record<string, SavedTradeShowItem>>) {
      state.savedTradeShowItems = action.payload;
    },
    mergeSavedTradeShowItems(state, action: PayloadAction<Record<string, SavedTradeShowItem>>) {
      state.savedTradeShowItems = { ...state.savedTradeShowItems, ...action.payload };
    },
    /** weekProductAssignments: keys are week index as string for JSON persist */
    setWeekProductAssignments(state, action: PayloadAction<Record<string, string[]>>) {
      state.weekProductAssignments = action.payload;
    },
    setSummaryData(state, action: PayloadAction<TradeShowSummaryData | null>) {
      state.summaryData = action.payload;
    },
    setLastSavedVendorIds(state, action: PayloadAction<number[] | null>) {
      state.lastSavedVendorIds = action.payload;
    },
    setLastSavedRetailerIds(state, action: PayloadAction<number[] | null>) {
      state.lastSavedRetailerIds = action.payload;
    },
    setLastSavedDeliveryItemNumbers(state, action: PayloadAction<string[] | null>) {
      state.lastSavedDeliveryItemNumbers = action.payload;
    },
    setLastSavedItemNumbers(state, action: PayloadAction<string[] | null>) {
      state.lastSavedItemNumbers = action.payload;
    },
  },
});

export const {
  setCurrentTradeShow,
  clearCurrentTradeShow,
  setSelectedVendorIds,
  setCreateDraft,
  setActiveStep,
  setSelectedRetailerIds,
  setAppliedItems,
  setSavedTradeShowItems,
  mergeSavedTradeShowItems,
  setWeekProductAssignments,
  setSummaryData,
  setLastSavedVendorIds,
  setLastSavedRetailerIds,
  setLastSavedDeliveryItemNumbers,
  setLastSavedItemNumbers,
} = tradeShowSlice.actions;
export default tradeShowSlice.reducer;

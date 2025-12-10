import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  getOrderConfirmationList,
  acceptOrder,
  getOrderConfirmationDetails,
  updateOrderConfirmation,
  restartOrderConfirmation,
  lockOrderConfirmation
} from '../apis/sales/orderConfirmApis';

// Interfaces
export interface OrderListItem {
  Order_Number: number;
  C_Number: number;
  status: string;
  Order_Source: number;
  isOrderConfirmed: {
    status: string;
    id: number;
    current_orderline: number;
    startTime?: string | null;
    endTime?: string | null;
    sales_id?: number;
    'sales.id'?: number;
    'sales.firstName'?: string;
    'sales.lastName'?: string;
  } | null;
  Order_Source_Name: string;
  Order_Date: string;
  customerName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  route: number | null;
  stop: number | null;
  totalQuantityOrdered: number;
  salesRep?: string;
}

export interface OrderDetailItem {
  Order_Number: number;
  Line_Number: number;
  Item_Number: number;
  Sales_Category: number;
  OTP_Number: number;
  Quantity_Ordered: number;
  Quantity_Shipped: number;
  Pack: number;
  Price: number;
  Price_Reference: number;
  Retail: number;
  NetCost: number;
  BaseCost: number;
  Invoice_Cost: number;
  AvgCost: number;
  OTP_Amount_State: number;
  OTP_Amount_County: number;
  OTP_Amount_City: number;
  DepositAmount: number;
  Price_Subclass: number;
  OffInvoice_Amount: number;
  Taxable: boolean;
  EBT: boolean;
  Points: number;
  STAMP_Qty: number;
  ItemDescription: string;
  CaseWeight: number;
  CaseCount: number;
  inventory: {
    Item_Number: number;
    Description: string;
    Pack: number;
    CaseCount: number;
    UOM: string;
    UPCList: Array<{
      UPC_Number: string;
    }>;
  };
  isDistributorImageShow: boolean;
  distributorImage: string | null;
  masterImage: string;
}

export interface OrderHeader {
  Order_Number: number;
  Order_Date: string;
  User_ID: number;
  Order_Source: number;
  Delivery_Charge: number;
  Total_Price: number;
  Total_Discount: string;
  Total_Deposit: number;
  customer?: {
    C_Name: string;
    C_Number: number;
    C_Address: string;
    C_City: string;
    C_State: string;
    C_Phone: string;
    customerRoute?: {
      Route_Number: number;
      Stop_Number: number;
    };
  };
}

export interface ScannedItem {
  upc: string;
  lineNumber: number;
  timestamp: number;
}

interface OrderConfirmState {
  // List state
  orderList: OrderListItem[];
  listLoading: boolean;
  listError: string | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  
  // Current order details state
  currentOrderNumber: number | null;
  orderHeader: OrderHeader | null;
  orderDetails: OrderDetailItem[];
  detailsLoading: boolean;
  detailsError: string | null;
  
  // Scanning state
  isScanning: boolean;
  scannedItems: ScannedItem[];
  currentScanBuffer: string;
  
  // Confirmation state
  confirmedLines: Record<number, {
    quantityShipped: number;
    scanned: boolean;
  }>;
  acceptLoading: boolean;
  updateLoading: boolean;
  restartLoading: boolean;
  lockLoading: boolean;
  acceptError: string | null;
  updateError: string | null;
  restartError: string | null;
  lockError: string | null;
}

const initialState: OrderConfirmState = {
  orderList: [],
  listLoading: false,
  listError: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  
  currentOrderNumber: null,
  orderHeader: null,
  orderDetails: [],
  detailsLoading: false,
  detailsError: null,
  
  isScanning: false,
  scannedItems: [],
  currentScanBuffer: '',
  
  confirmedLines: {},
  acceptLoading: false,
  updateLoading: false,
  restartLoading: false,
  lockLoading: false,
  acceptError: null,
  updateError: null,
  restartError: null,
  lockError: null,
};

// Thunks
export const fetchOrderConfirmationList = createAsyncThunk(
  'orderConfirm/fetchOrderConfirmationList',
  async (
    params: {
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
      search?: string;
      status?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response: any = await getOrderConfirmationList(
        params.page,
        params.limit,
        params.startDate,
        params.endDate,
        params.search,
        params.status
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch order list');
    }
  }
);

export const acceptOrderThunk = createAsyncThunk(
  'orderConfirm/acceptOrder',
  async (
    params: { orderNumber: number; currentOrderline: number },
    { rejectWithValue }
  ) => {
    try {
      const response: any = await acceptOrder(params.orderNumber, params.currentOrderline);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to accept order');
    }
  }
);

export const fetchOrderConfirmationDetails = createAsyncThunk(
  'orderConfirm/fetchOrderConfirmationDetails',
  async (orderNumber: number, { rejectWithValue }) => {
    try {
      const response: any = await getOrderConfirmationDetails(orderNumber);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch order details');
    }
  }
);

export const updateOrderConfirmationThunk = createAsyncThunk(
  'orderConfirm/updateOrderConfirmation',
  async (
    params: {
      orderNumber: number;
      status: string;
      current_orderline: number;
      orderDetail: Array<{
        Order_Number: number;
        Line_Number: number;
        Quantity_Ordered: number;
        Quantity_Shipped: number;
      }>;
      Bundles?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const { orderNumber, ...data } = params;
      const response: any = await updateOrderConfirmation(orderNumber, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update order');
    }
  }
);

export const restartOrderConfirmationThunk = createAsyncThunk(
  'orderConfirm/restartOrderConfirmation',
  async (
    params: { orderNumber: number; currentOrderline: number },
    { rejectWithValue }
  ) => {
    try {
      const response: any = await restartOrderConfirmation(params.orderNumber, params.currentOrderline);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to restart order');
    }
  }
);

export const lockOrderConfirmationThunk = createAsyncThunk(
  'orderConfirm/lockOrderConfirmation',
  async (orderNumber: number, { rejectWithValue }) => {
    try {
      const response: any = await lockOrderConfirmation(orderNumber);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to lock order');
    }
  }
);

const orderConfirmSlice = createSlice({
  name: 'orderConfirm',
  initialState,
  reducers: {
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
      state.currentPage = 1;
    },
    setCurrentOrderNumber: (state, action: PayloadAction<number | null>) => {
      state.currentOrderNumber = action.payload;
      if (!action.payload) {
        state.orderHeader = null;
        state.orderDetails = [];
        state.confirmedLines = {};
        state.scannedItems = [];
      }
    },
    setIsScanning: (state, action: PayloadAction<boolean>) => {
      state.isScanning = action.payload;
      if (!action.payload) {
        state.currentScanBuffer = '';
      }
    },
    setScanBuffer: (state, action: PayloadAction<string>) => {
      state.currentScanBuffer = action.payload;
    },
    addScannedItem: (state, action: PayloadAction<ScannedItem>) => {
      state.scannedItems.push(action.payload);
    },
    clearScannedItems: (state) => {
      state.scannedItems = [];
    },
    updateConfirmedLine: (
      state,
      action: PayloadAction<{
        lineNumber: number;
        quantityShipped: number;
        scanned: boolean;
      }>
    ) => {
      state.confirmedLines[action.payload.lineNumber] = {
        quantityShipped: action.payload.quantityShipped,
        scanned: action.payload.scanned,
      };
    },
    resetConfirmedLines: (state) => {
      state.confirmedLines = {};
    },
    clearOrderDetails: (state) => {
      state.orderHeader = null;
      state.orderDetails = [];
      state.confirmedLines = {};
      state.scannedItems = [];
      state.currentOrderNumber = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch order list
      .addCase(fetchOrderConfirmationList.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchOrderConfirmationList.fulfilled, (state, action) => {
        state.listLoading = false;
        state.orderList = action.payload?.orderList || [];
        state.totalCount = action.payload?.totalCount || 0;
        state.totalPages = action.payload?.totalPages || 0;
        state.currentPage = action.payload?.page || 1;
        state.pageSize = action.payload?.limit || 10;
      })
      .addCase(fetchOrderConfirmationList.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload as string;
      })
      
      // Accept order
      .addCase(acceptOrderThunk.pending, (state) => {
        state.acceptLoading = true;
        state.acceptError = null;
      })
      .addCase(acceptOrderThunk.fulfilled, (state) => {
        state.acceptLoading = false;
        // Refresh order list after accepting
      })
      .addCase(acceptOrderThunk.rejected, (state, action) => {
        state.acceptLoading = false;
        state.acceptError = action.payload as string;
      })
      
      // Fetch order details
      .addCase(fetchOrderConfirmationDetails.pending, (state) => {
        state.detailsLoading = true;
        state.detailsError = null;
      })
      .addCase(fetchOrderConfirmationDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.orderHeader = action.payload?.orderHeader || null;
        state.orderDetails = action.payload?.data || [];
        state.currentOrderNumber = action.payload?.orderHeader?.Order_Number || null;
        
        // Initialize confirmed lines with ordered quantities
        const confirmedLines: Record<number, { quantityShipped: number; scanned: boolean }> = {};
        (action.payload?.data || []).forEach((item: OrderDetailItem) => {
          confirmedLines[item.Line_Number] = {
            quantityShipped: item.Quantity_Shipped || 0,
            scanned: false,
          };
        });
        state.confirmedLines = confirmedLines;
      })
      .addCase(fetchOrderConfirmationDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        state.detailsError = action.payload as string;
      })
      
      // Update order confirmation
      .addCase(updateOrderConfirmationThunk.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateOrderConfirmationThunk.fulfilled, (state) => {
        state.updateLoading = false;
        // Optionally refresh order details after update
      })
      .addCase(updateOrderConfirmationThunk.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload as string;
      })
      
      // Restart order confirmation
      .addCase(restartOrderConfirmationThunk.pending, (state) => {
        state.restartLoading = true;
        state.restartError = null;
      })
      .addCase(restartOrderConfirmationThunk.fulfilled, (state) => {
        state.restartLoading = false;
        // Refresh order list after restart
      })
      .addCase(restartOrderConfirmationThunk.rejected, (state, action) => {
        state.restartLoading = false;
        state.restartError = action.payload as string;
      })
      
      // Lock order confirmation
      .addCase(lockOrderConfirmationThunk.pending, (state) => {
        state.lockLoading = true;
        state.lockError = null;
      })
      .addCase(lockOrderConfirmationThunk.fulfilled, (state) => {
        state.lockLoading = false;
        // Refresh order list after locking
      })
      .addCase(lockOrderConfirmationThunk.rejected, (state, action) => {
        state.lockLoading = false;
        state.lockError = action.payload as string;
      });
  },
});

export const {
  setCurrentPage,
  setPageSize,
  setCurrentOrderNumber,
  setIsScanning,
  setScanBuffer,
  addScannedItem,
  clearScannedItems,
  updateConfirmedLine,
  resetConfirmedLines,
  clearOrderDetails,
} = orderConfirmSlice.actions;

export default orderConfirmSlice.reducer;


import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getCartItems } from '../apis/retailer/orderApis';

// Interface for cart item from API
interface CartItem {
  Description: string;
  Item_Number: number;
  CaseCount: number;
  UOM: string;
  Price1: number;
  price: number;
  BaseCost: number;
  Invoice_Cost: number;
  AvgCost: number;
  NetCost: number;
  isPriceChanged: boolean;
  oldPrice: number;
  newPrice: number;
  showDistributorImage: boolean;
  distributorImage: string | null;
  masterImage: string;
  UnitOunces: any;
  Tax_Rate: number;
  priceWithTax: number;
  showLowStock: boolean;
  showTheInventoryStock: boolean;
  showWithOutPrice: boolean;
  allowToOrder: boolean;
  Inventory_OnHand: number;
  hasProductLimit?: boolean; // Add this field
  productLimit?: number | null; // Add this field
  Product: {
    id: number;
    Customer_Number: number;
    Item_Number: number;
    Price: string;
    Qty: number;
    TotalPrice: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  count: number;
  // New validation fields
  totalItems: number;
  totalAmountWithTax: number;
  userItemLimitQty: number | null;
  userLimitMinOrderAmount: number | null;
  totalAmount: number;
}

const initialState: CartState = {
  items: [],
  loading: false,
  error: null,
  count: 0,
  totalItems: 0,
  totalAmountWithTax: 0,
  userItemLimitQty: null,
  userLimitMinOrderAmount: null,
  totalAmount: 0,
};

// Async thunk to fetch cart items
export const fetchCartItems = createAsyncThunk(
  'cart/fetchCartItems',
  async (_, { rejectWithValue }) => {
    try {
      const response: any = await getCartItems();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch cart items');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      state.count = action.payload.length;
    },
    updateCartItem: (state, action: PayloadAction<{ id: number; quantity: number }>) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(item => item.Product.id === id);
      if (item) {
        item.Product.Qty = quantity;
        item.Product.TotalPrice = (item.price * quantity).toFixed(2);
      }
    },
    removeCartItem: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(item => item.Product.id !== action.payload);
      state.count = state.items.length;
    },
    clearCart: (state) => {
      state.items = [];
      state.count = 0;
      state.totalItems = 0;
      state.totalAmountWithTax = 0;
      state.totalAmount = 0;
    },
    setCartCount: (state, action: PayloadAction<number>) => {
      state.count = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCartItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCartItems.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.finalCartItems) {
          state.items = action.payload.finalCartItems;
          state.count = action.payload.finalCartItems.length;
        }
        // Store validation data
        state.totalItems = action.payload?.totalItems || 0;
        state.totalAmountWithTax = action.payload?.totalAmountWithTax || 0;
        state.userItemLimitQty = action.payload?.userItemLimitQty || null;
        state.userLimitMinOrderAmount = action.payload?.userLimitMinOrderAmount || null;
        state.totalAmount = action.payload?.totalAmount || 0;
      })
      .addCase(fetchCartItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch cart items';
      });
  },
});

export const { 
  setCartItems, 
  updateCartItem, 
  removeCartItem, 
  clearCart, 
  setCartCount 
} = cartSlice.actions;

export default cartSlice.reducer; 
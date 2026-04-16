import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getCartItem, updateCartItem, removeFromCart, clearCart, addToCart } from '../apis/sales/salesOrderApis';
import { RootState } from '../store';

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
  showPrice: boolean;
  showPriceToSalesRep: boolean;
  showTheInventoryStock: boolean;
  showTheInventoryStockToSalesRep: boolean;
  allowToOrder: boolean;
  allowToOrderSalesRep: boolean;
  hasProductLimit?: boolean;
  productLimit?: number | null;
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
export const fetchSalesPriceBookCartItems = createAsyncThunk(
  'salesPriceBookCart/fetchSalesPriceBookCartItems',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const customerId = state.auth.selectedCustomer?.C_Number;

      if (!customerId) {
        throw new Error('Customer ID not found');
      }

      const response: any = await getCartItem(customerId.toString());
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch cart items');
    }
  }
);

// Async thunk to add item to cart
export const addItemToSalesPriceBookCart = createAsyncThunk(
  'salesPriceBookCart/addItemToSalesPriceBookCart',
  async (params: any, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const customerId = state.auth.selectedCustomer?.C_Number;

      if (!customerId) {
        throw new Error('Customer ID not found');
      }

      const response: any = await addToCart(customerId.toString(), params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add item to cart');
    }
  }
);

// Async thunk to update cart item
export const updateSalesPriceBookCartItem = createAsyncThunk(
  'salesPriceBookCart/updateSalesPriceBookCartItem',
  async ({ cartItemId, params }: { cartItemId: string; params: any }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const customerId = state.auth.selectedCustomer?.C_Number;

      if (!customerId) {
        throw new Error('Customer ID not found');
      }

      const response: any = await updateCartItem(cartItemId, params, customerId.toString());
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update cart item');
    }
  }
);

// Async thunk to remove item from cart
export const removeSalesPriceBookCartItem = createAsyncThunk(
  'salesPriceBookCart/removeSalesPriceBookCartItem',
  async (cartItemId: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const customerId = state.auth.selectedCustomer?.C_Number;

      if (!customerId) {
        throw new Error('Customer ID not found');
      }

      const response: any = await removeFromCart(cartItemId, customerId.toString());
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove item from cart');
    }
  }
);

// Async thunk to clear cart
export const clearSalesPriceBookCart = createAsyncThunk(
  'salesPriceBookCart/clearSalesPriceBookCart',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const customerId = state.auth.selectedCustomer?.C_Number;

      if (!customerId) {
        throw new Error('Customer ID not found');
      }

      const response: any = await clearCart(customerId.toString());
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to clear cart');
    }
  }
);

const salesPriceBookCartSlice = createSlice({
  name: 'salesPriceBookCart',
  initialState,
  reducers: {
    setSalesPriceBookCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      state.count = action.payload.length;
    },
    updateSalesPriceBookCartItemLocal: (state, action: PayloadAction<{ id: number; quantity: number }>) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(item => item.Product.id === id);
      if (item) {
        item.Product.Qty = quantity;
        item.Product.TotalPrice = (item.price * quantity).toFixed(2);
      }
    },
    removeSalesPriceBookCartItemLocal: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(item => item.Product.id !== action.payload);
      state.count = state.items.length;
    },
    clearSalesPriceBookCartLocal: (state) => {
      state.items = [];
      state.count = 0;
      state.totalItems = 0;
      state.totalAmountWithTax = 0;
      state.totalAmount = 0;
    },
    setSalesPriceBookCartCount: (state, action: PayloadAction<number>) => {
      state.count = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cart items
      .addCase(fetchSalesPriceBookCartItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesPriceBookCartItems.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.finalCartItems) {
          state.items = action.payload.finalCartItems;
          state.count = action.payload.finalCartItems.length;
        }
        state.totalItems = action.payload?.totalItems || 0;
        state.totalAmountWithTax = action.payload?.totalAmountWithTax || 0;
        state.userItemLimitQty = action.payload?.userItemLimitQty || null;
        state.userLimitMinOrderAmount = action.payload?.userLimitMinOrderAmount || null;
        state.totalAmount = action.payload?.totalAmount || 0;
      })
      .addCase(fetchSalesPriceBookCartItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch cart items';
      })
      // Add item to cart
      .addCase(addItemToSalesPriceBookCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addItemToSalesPriceBookCart.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.finalCartItems) {
          state.items = action.payload.finalCartItems;
          state.count = action.payload.finalCartItems.length;
        }
        state.totalItems = action.payload?.totalItems || 0;
        state.totalAmountWithTax = action.payload?.totalAmountWithTax || 0;
        state.userItemLimitQty = action.payload?.userItemLimitQty || null;
        state.userLimitMinOrderAmount = action.payload?.userLimitMinOrderAmount || null;
        state.totalAmount = action.payload?.totalAmount || 0;
      })
      .addCase(addItemToSalesPriceBookCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add item to cart';
      })
      // Update cart item
      .addCase(updateSalesPriceBookCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSalesPriceBookCartItem.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.finalCartItems) {
          state.items = action.payload.finalCartItems;
          state.count = action.payload.finalCartItems.length;
        }
        state.totalItems = action.payload?.totalItems || 0;
        state.totalAmountWithTax = action.payload?.totalAmountWithTax || 0;
        state.userItemLimitQty = action.payload?.userItemLimitQty || null;
        state.userLimitMinOrderAmount = action.payload?.userLimitMinOrderAmount || null;
        state.totalAmount = action.payload?.totalAmount || 0;
      })
      .addCase(updateSalesPriceBookCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update cart item';
      })
      // Remove cart item
      .addCase(removeSalesPriceBookCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeSalesPriceBookCartItem.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.finalCartItems) {
          state.items = action.payload.finalCartItems;
          state.count = action.payload.finalCartItems.length;
        }
        state.totalItems = action.payload?.totalItems || 0;
        state.totalAmountWithTax = action.payload?.totalAmountWithTax || 0;
        state.userItemLimitQty = action.payload?.userItemLimitQty || null;
        state.userLimitMinOrderAmount = action.payload?.userLimitMinOrderAmount || null;
        state.totalAmount = action.payload?.totalAmount || 0;
      })
      .addCase(removeSalesPriceBookCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to remove item from cart';
      })
      // Clear cart
      .addCase(clearSalesPriceBookCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearSalesPriceBookCart.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
        state.count = 0;
        state.totalItems = 0;
        state.totalAmountWithTax = 0;
        state.totalAmount = 0;
      })
      .addCase(clearSalesPriceBookCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to clear cart';
      });
  },
});

export const {
  setSalesPriceBookCartItems,
  updateSalesPriceBookCartItemLocal,
  removeSalesPriceBookCartItemLocal,
  clearSalesPriceBookCartLocal,
  setSalesPriceBookCartCount
} = salesPriceBookCartSlice.actions;

export default salesPriceBookCartSlice.reducer;

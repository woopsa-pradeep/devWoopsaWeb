import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SalesTradeShowCartState {
  count: number;
}

const initialState: SalesTradeShowCartState = {
  count: 0,
};

const salesTradeShowCartSlice = createSlice({
  name: "salesTradeShowCart",
  initialState,
  reducers: {
    setSalesTradeShowCartCount: (state, action: PayloadAction<number>) => {
      state.count = action.payload;
    },
    clearSalesTradeShowCartCount: (state) => {
      state.count = 0;
    },
  },
});

export const { setSalesTradeShowCartCount, clearSalesTradeShowCartCount } = salesTradeShowCartSlice.actions;
export default salesTradeShowCartSlice.reducer;

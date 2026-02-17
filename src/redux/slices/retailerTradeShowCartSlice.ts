import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface RetailerTradeShowCartState {
  count: number;
}

const initialState: RetailerTradeShowCartState = {
  count: 0,
};

const retailerTradeShowCartSlice = createSlice({
  name: "retailerTradeShowCart",
  initialState,
  reducers: {
    setTradeShowCartCount: (state, action: PayloadAction<number>) => {
      state.count = action.payload;
    },
    clearTradeShowCartCount: (state) => {
      state.count = 0;
    },
  },
});

export const { setTradeShowCartCount, clearTradeShowCartCount } = retailerTradeShowCartSlice.actions;
export default retailerTradeShowCartSlice.reducer;

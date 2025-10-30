// redux/slices/layoutSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type LayoutState = {
  layout: "horizontal" | "vertical";
};

const initialState: LayoutState = {
  layout: "vertical",
};

const layoutSlice = createSlice({
  name: "layout",
  initialState,
  reducers: {
    setLayout(state, action: PayloadAction<"horizontal" | "vertical">) {
      state.layout = action.payload;
    },
  },
});

export const { setLayout } = layoutSlice.actions;
export default layoutSlice.reducer;

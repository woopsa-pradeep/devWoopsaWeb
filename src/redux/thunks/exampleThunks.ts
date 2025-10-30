import { createAsyncThunk } from "@reduxjs/toolkit";
import { fetchExampleData } from "../apis/exampleAPI";
export const getExampleData = createAsyncThunk(
  "example/getExampleData",
  async (_, thunkAPI) => {
    try {
      const res = await fetchExampleData();
      return res;
    } catch (err) {
      return thunkAPI.rejectWithValue(err);
    }
  }
);

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { SupplierType } from "@/lib/types";

interface SupplierState {
  data: SupplierType[];
  loading: boolean;
  error: string | null;
}

const initialState: SupplierState = {
  data: [],
  loading: false,
  error: null,
};

export const fetchSupplierData = createAsyncThunk(
  "supplier/fetchData",
  async () => {
    const url = new URL("/api/supplier", window.location.origin);
    console.log("Fetching from:", url.toString()); // Log the full URL
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    console.log("Fetched data:", data); // Log the fetched data
    return data;
  }
);

const SupplierSlice = createSlice({
  name: "supplier",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSupplierData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSupplierData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchSupplierData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch data";
      });
  },
});

export default SupplierSlice.reducer;

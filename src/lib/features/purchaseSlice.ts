import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { PurchaseType } from "@/lib/types";

interface PurchaseState {
  data: PurchaseType[];
  loading: boolean;
  error: string | null;
}

const initialState: PurchaseState = {
  data: [],
  loading: false,
  error: null,
};

// Create an async thunk for fetching data
export const fetchPurchaseData = createAsyncThunk(
  "produksi/fetchData",
  async ({ startDate, endDate }: { startDate?: string; endDate?: string }) => {
    const url = new URL("/api/purchase", window.location.origin);
    if (startDate && endDate) {
      url.searchParams.append("startDate", startDate);
      url.searchParams.append("endDate", endDate);
    }
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

const purchaseSlice = createSlice({
  name: "purchase",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchaseData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload; // Ensure this is being set
      })
      .addCase(fetchPurchaseData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Something went wrong";
      });
  },
});

export default purchaseSlice.reducer;

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { LbmType } from "@/lib/types";

interface ReturState {
  data: LbmType[];
  loading: boolean;
  error: string | null;
}

const initialState: ReturState = {
  data: [],
  loading: false,
  error: null,
};

// Create an async thunk for fetching data
export const fetchReturData = createAsyncThunk(
  "produksi/fetchData",
  async ({ startDate, endDate }: { startDate?: string; endDate?: string }) => {
    const url = new URL("/api/retur1", window.location.origin);
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

const returSlice = createSlice({
  name: "retur",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReturData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReturData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload; // Ensure this is being set
      })
      .addCase(fetchReturData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Something went wrong";
      });
  },
});

export default returSlice.reducer;

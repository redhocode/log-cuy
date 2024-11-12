import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { Spktype } from "@/lib/types";

interface SpkState {
  data: Spktype[];
  loading: boolean;
  error: string | null;
}

const initialState: SpkState = {
  data: [],
  loading: false,
  error: null,
};

// Create an async thunk for fetching data
export const fetchSpkData = createAsyncThunk(
  "produksi/fetchData",
  async ({ startDate, endDate }: { startDate?: string; endDate?: string }) => {
    const url = new URL("/api/spk", window.location.origin);
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

const spkSlice = createSlice({
  name: "spk",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSpkData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSpkData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload; // Ensure this is being set
      })
      .addCase(fetchSpkData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Something went wrong";
      });
  },
});

export default spkSlice.reducer;

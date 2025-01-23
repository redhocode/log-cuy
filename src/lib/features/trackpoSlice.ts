import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { trackPoType } from "@/lib/types";

interface TrackPOState {
  data: trackPoType[];
  loading: boolean;
  error: string | null;
}

const initialState: TrackPOState = {
  data: [],
  loading: false,
  error: null,
};

// Create an async thunk for fetching data
export const fetchTrackPO = createAsyncThunk(
  "produksi/fetchData",
  async ({ startDate, endDate }: { startDate?: string; endDate?: string }) => {
    const url = new URL("/api/trackpo", window.location.origin);
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

const TrackPOSlice = createSlice({
  name: "trackpo",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrackPO.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrackPO.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload; // Ensure this is being set
      })
      .addCase(fetchTrackPO.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Something went wrong";
      });
  },
});

export default TrackPOSlice.reducer;

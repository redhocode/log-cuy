import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { logacrType } from "@/lib/types";

interface LogAcrState {
  data: logacrType[];
  loading: boolean;
  error: string | null;
}

const initialState: LogAcrState = {
  data: [],
  loading: false,
  error: null,
};

export const fetchLogAcrData = createAsyncThunk(
  "logacr/fetchData",
  async ({
    startDate,
    endDate,
  }: {
    startDate?: string | undefined;
    endDate?: string | undefined;
  }) => {
    const url = new URL("/api/logacr", window.location.origin);
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

const LogAcrSlice = createSlice({
  name: "logacr",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLogAcrData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLogAcrData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchLogAcrData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch data";
      });
  },
});

export default LogAcrSlice.reducer;

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loguserType } from "@/lib/types";

interface LogUserState {
  data: loguserType[];
  loading: boolean;
  error: string | null;
}

const initialState: LogUserState = {
  data: [],
  loading: false,
  error: null,
};

export const fetchLogUserData = createAsyncThunk(
  "loguser/fetchData",
  async ({
    startDate,
    endDate,
  }: {
    startDate?: string | undefined;
    endDate?: string | undefined;
  }) => {
    const url = new URL("/api/loguser", window.location.origin);
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

const LogUserSlice = createSlice({
  name: "loguser",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLogUserData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLogUserData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchLogUserData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch data";
      });
  },
});

export default LogUserSlice.reducer;

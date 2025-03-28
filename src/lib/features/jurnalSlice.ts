import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { kasType } from "@/lib/types";

interface JurnalState {
  data: kasType[];
  loading: boolean;
  error: string | null;
}

const initialState: JurnalState = {
  data: [],
  loading: false,
  error: null,
};

// Update async thunk to accept refType parameter
export const fetchJurnalData = createAsyncThunk(
  "akuntan/fetchData",
  async ({
    startDate,
    endDate,
    refType,
  }: {
    startDate?: string;
    endDate?: string;
    refType?: string;
  }) => {
    const url = new URL("/api/jurnal", window.location.origin);

    // Append startDate and endDate if available
    if (startDate && endDate) {
      url.searchParams.append("startDate", startDate);
      url.searchParams.append("endDate", endDate);
    }

    // Append refType if available
    if (refType) {
      url.searchParams.append("refType", refType);
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

const jurnalSlice = createSlice({
  name: "jurnal",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchJurnalData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchJurnalData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload; // Ensure this is being set
      })
      .addCase(fetchJurnalData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Something went wrong";
      });
  },
});

export default jurnalSlice.reducer;

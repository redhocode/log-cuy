import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { glbarangType } from "@/lib/types";

interface GLBarangState {
  data: glbarangType[];
  loading: boolean;
  error: string | null;
}

const initialState: GLBarangState = {
  data: [],
  loading: false,
  error: null,
};

// Create an async thunk for fetching data
export const fetchGLBarangData = createAsyncThunk(
  "produksi/fetchData",
  async ({ startDate, endDate }: { startDate?: string; endDate?: string }) => {
    const url = new URL("/api/glbarang", window.location.origin);
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

const GLBarangSlice = createSlice({
  name: "GLBarang",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGLBarangData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGLBarangData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload; // Ensure this is being set
      })
      .addCase(fetchGLBarangData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Something went wrong";
      });
  },
});

export default GLBarangSlice.reducer;

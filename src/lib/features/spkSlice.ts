import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { Spktype, SpkUpdateRequest } from "@/lib/types";

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

export const fetchSpkData = createAsyncThunk(
  "spk/fetchSpkData",
  async (filters?: { startDate?: string; endDate?: string }) => {
    const response = await axios.get("/api/spk", { params: filters });
    return response.data;
  }
);

export const updateSpkStatus = createAsyncThunk(
  "spk/updateSpkStatus",
  async ({ No_SPK, Completed }: SpkUpdateRequest) => {
    const response = await axios.put("/api/spk", { No_SPK, Completed });
    return { No_SPK, Completed, FinishedDate: response.data.FinishedDate };
  }
);

export const bulkUpdateSpkStatus = createAsyncThunk(
  "spk/bulkUpdateSpkStatus",
  async ({ spkList, Completed }: { spkList: string[]; Completed: boolean }) => {
    const response = await axios.patch("/api/spk", { spkList, Completed });
    return { spkList, Completed };
  }
);

const spkSlice = createSlice({
  name: "spk",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch data
      .addCase(fetchSpkData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSpkData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchSpkData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch data";
      })
      // Update single SPK
      .addCase(updateSpkStatus.fulfilled, (state, action) => {
        const index = state.data.findIndex(item => item.No_SPK === action.payload.No_SPK);
        if (index !== -1) {
          state.data[index].Completed = action.payload.Completed;
          state.data[index].FinishedDate = action.payload.FinishedDate;
        }
      })
      // Bulk update SPK
      .addCase(bulkUpdateSpkStatus.fulfilled, (state, action) => {
        const now = new Date().toISOString();
        state.data.forEach(item => {
          if (action.payload.spkList.includes(item.No_SPK)) {
            item.Completed = action.payload.Completed;
            item.FinishedDate = action.payload.Completed ? now : undefined;
          }
        });
      });
  },
});

export default spkSlice.reducer;
// lib/features/masterSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { masterType } from "@/lib/types";

interface MasterState {
  data: masterType[];
  loading: boolean;
  error: string | null;
  updating: boolean;
}

const initialState: MasterState = {
  data: [],
  loading: false,
  error: null,
  updating: false,
};

export const fetchMasterData = createAsyncThunk(
  "master/fetchMasterData",
  async () => {
    const response = await axios.get("/api/master");
    console.log("Fetch response:", response.data);
    
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  }
);

export const updateMasterItem = createAsyncThunk(
  "master/updateMasterItem",
  async (item: masterType) => {
    console.log("Updating item:", item);
    const response = await axios.put("/api/master", item);
    console.log("Update response:", response.data);
    
    if (response.data.success) {
      return response.data.data || item;
    }
    throw new Error(response.data.error || "Failed to update");
  }
);

export const deleteMasterItem = createAsyncThunk(
  "master/deleteMasterItem",
  async (ItemID: string) => {
    const response = await axios.delete(`/api/master?ItemID=${ItemID}`);
    if (response.data.success) {
      return ItemID;
    }
    throw new Error(response.data.error || "Failed to delete");
  }
);

const masterSlice = createSlice({
  name: "master",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch data
      .addCase(fetchMasterData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMasterData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        console.log("Data loaded:", state.data.length);
      })
      .addCase(fetchMasterData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch data";
        state.data = [];
      })
      // Update item
      .addCase(updateMasterItem.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateMasterItem.fulfilled, (state, action) => {
        state.updating = false;
        const index = state.data.findIndex(item => item.ItemID === action.payload.ItemID);
        if (index !== -1) {
          state.data[index] = { ...state.data[index], ...action.payload };
          console.log("Item updated in state:", state.data[index]);
        } else {
          // If not found, refresh all data
          state.loading = true;
        }
      })
      .addCase(updateMasterItem.rejected, (state, action) => {
        state.updating = false;
        state.error = action.error.message || "Failed to update";
        console.error("Update rejected:", action.error);
      })
      // Delete item
      .addCase(deleteMasterItem.pending, (state) => {
        state.updating = true;
      })
      .addCase(deleteMasterItem.fulfilled, (state, action) => {
        state.updating = false;
        state.data = state.data.filter(item => item.ItemID !== action.payload);
      })
      .addCase(deleteMasterItem.rejected, (state, action) => {
        state.updating = false;
        state.error = action.error.message || "Failed to delete";
      });
  },
});

export const { clearError } = masterSlice.actions;
export default masterSlice.reducer;
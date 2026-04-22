// lib/features/bomSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

interface BomItem {
  TransID: number;
  itemidHD: string;
  itemnamehd: string;
  itemnamehd2: string;
  ItemID: string;
  ItemName: string;
  ItemName2: string;
  BahanQty: number;
  Departemen: string;
  NamaJenis: string;
}

interface BomState {
  data: BomItem[];
  loading: boolean;
  error: string | null;
  updating: boolean;
}

const initialState: BomState = {
  data: [],
  loading: false,
  error: null,
  updating: false,
};

export const fetchBomData = createAsyncThunk(
  "bom/fetchBomData",
  async (params?: { itemid?: string; searchType?: string }) => {
    const response = await axios.get("/api/bom", { params });
    return response.data;
  }
);

export const updateBomComponent = createAsyncThunk(
  "bom/updateBomComponent",
  async ({ TransID, ItemID, BahanQty }: { TransID: string; ItemID: string; BahanQty: number }) => {
    const response = await axios.put("/api/bom", { TransID, ItemID, BahanQty, action: "update" });
    return { TransID, ItemID, BahanQty };
  }
);

export const deleteBomComponent = createAsyncThunk(
  "bom/deleteBomComponent",
  async ({ TransID, ItemID }: { TransID: string; ItemID: string }) => {
    const response = await axios.put("/api/bom", { TransID, ItemID, action: "delete" });
    return { TransID, ItemID };
  }
);

export const addBomComponent = createAsyncThunk(
  "bom/addBomComponent",
  async ({ TransID, components }: { TransID: string; components: Array<{ ItemID: string; BahanQty: number; BahanPackSatuan?: string }> }) => {
    const response = await axios.patch("/api/bom", { action: "add", TransID, components });
    return { TransID, components };
  }
);

const bomSlice = createSlice({
  name: "bom",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch data
      .addCase(fetchBomData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBomData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchBomData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch data";
      })
      // Update component
      .addCase(updateBomComponent.pending, (state) => {
        state.updating = true;
      })
      .addCase(updateBomComponent.fulfilled, (state, action) => {
        state.updating = false;
        const index = state.data.findIndex(
          item => item.TransID === parseInt(action.payload.TransID) && item.ItemID === action.payload.ItemID
        );
        if (index !== -1) {
          state.data[index].BahanQty = action.payload.BahanQty;
        }
      })
      .addCase(updateBomComponent.rejected, (state, action) => {
        state.updating = false;
        state.error = action.error.message || "Failed to update";
      })
      // Delete component
      .addCase(deleteBomComponent.fulfilled, (state, action) => {
        state.data = state.data.filter(
          item => !(item.TransID === parseInt(action.payload.TransID) && item.ItemID === action.payload.ItemID)
        );
      });
  },
});

export const { clearError } = bomSlice.actions;
export default bomSlice.reducer;
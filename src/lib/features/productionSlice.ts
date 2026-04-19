// lib/features/productionSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { ProduksiType } from "@/lib/types";

interface ProductionState {
  data: ProduksiType[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductionState = {
  data: [],
  loading: false,
  error: null,
};

// Gunakan nama yang konsisten: fetchProductionData
export const fetchProductionData = createAsyncThunk(
  "production/fetchData",
  async ({ startDate, endDate, prodType, itemType }: { startDate?: string; endDate?: string; prodType?: string; itemType?: string } = {}) => {
    const params: any = {};
    if (startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    }
    if (prodType) params.prodType = prodType;
    if (itemType) params.itemType = itemType;
    
    const response = await axios.get("/api/produksi", { params });
    return response.data;
  }
);

const productionSlice = createSlice({
  name: "production",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductionData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductionData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchProductionData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Something went wrong";
      });
  },
});

export default productionSlice.reducer;
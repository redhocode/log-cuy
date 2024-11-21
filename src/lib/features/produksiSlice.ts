import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { ProduksiType } from "@/lib/types";

interface ProduksiState {
  data: ProduksiType[];
  loading: boolean;
  error: string | null;
}

const initialState: ProduksiState = {
  data: [],
  loading: false,
  error: null,
};

// Create an async thunk for fetching data
// Menambahkan parameter remark ke URL saat melakukan fetch data
export const fetchProduksiData = createAsyncThunk(
  "produksi/fetchData",
  async ({ startDate, endDate, remark, prodType, itemType }: { startDate?: string; endDate?: string; remark?: string; prodType?: string; itemType?: string }) => {
    const url = new URL("/api/produksi", window.location.origin);

    if (startDate && endDate) {
      url.searchParams.append("startDate", startDate);
      url.searchParams.append("endDate", endDate);
    }

    if (remark) {
      url.searchParams.append("remark", remark); // pastikan remark ditambahkan
    }
    if (prodType) {
      url.searchParams.append("prodType", prodType); // pastikan prodType ditambahkan
    }
    if (itemType) {
      url.searchParams.append("itemType", itemType); // pastikan itemType ditambahkan
    }
    console.log("Fetching from URL:", url.toString()); // Cek apakah remark ditambahkan dengan benar
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    console.log("Fetched data:", data); // Lihat data yang diterima
    return data;
  }
);


const produksiSlice = createSlice({
  name: "produksi",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProduksiData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProduksiData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload; // Ensure this is being set
      })
      .addCase(fetchProduksiData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Something went wrong";
      });
  },
});

export default produksiSlice.reducer;

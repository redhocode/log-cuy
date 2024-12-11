import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { masterType } from "@/lib/types";

interface MasterState {
    data: masterType[];
    loading: boolean;
    error: string | null;
}

const initialState: MasterState = {
    data: [],
    loading: false,
    error: null,
};

export const fetchMasterData = createAsyncThunk(
    "master/fetchData",
    async () => {
        const url = new URL("/api/master", window.location.origin);
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

const masterSlice = createSlice({
    name: "master",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchMasterData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMasterData.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchMasterData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || "Failed to fetch data";
            });
    },
});

export default masterSlice.reducer;

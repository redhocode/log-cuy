// store.ts
import { configureStore } from "@reduxjs/toolkit";
import produksiReducer from "./features/produksiSlice"; // Adjust path as necessary
import lbmReducer from "./features/lbmSlice"; // Adjust path as necessary
import lbkReducer from "./features/lbkSlice"; // Adjust path as necessary
import penerimaanReducer from "./features/penerimaanSlice";
import mutasiReducer from "./features/mustasiSlice";
import spkReducer from "./features/spkSlice";
import purchaseReducer from "./features/purchaseSlice";
import kasReducer from "./features/kasSlice";
import bankReducer from "./features/bankSlice";
import jurnalReducer from "./features/jurnalSlice";
export const makeStore = () => {
  return configureStore({
    reducer: {
      produksi: produksiReducer,
      lbm: lbmReducer,
      lbk: lbkReducer,
      penerimaan: penerimaanReducer,
      mutasi: mutasiReducer,
      spk: spkReducer,
      purchase: purchaseReducer,
      kas: kasReducer,
      bank: bankReducer,
      jurnal: jurnalReducer
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

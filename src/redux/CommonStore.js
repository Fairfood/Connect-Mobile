import { createSlice } from '@reduxjs/toolkit';
import defaultTheme from '../themes/defualt';

export const initialState = {
  footerItems: {},
  nfcSupported: null,
  theme: defaultTheme,
  migration: false,
  migrationInProgress: false,
  migrationPercentage: 10,
  buyTnxStatus: [],
  sendTnxStatus: [],
  forceClearDatabase: false,
};

// A slice for recipes with our three reducers
const CommonStore = createSlice({
  name: 'common',
  initialState,
  reducers: {
    changeFooterItems: (state, { payload }) => {
      state.footerItems = payload;
    },
    updateNfcSupported: (state, { payload }) => {
      state.nfcSupported = payload;
    },
    updateTheme: (state, { payload }) => {
      state.theme = payload;
    },
    startMigrationProcess: (state) => {
      state.migrationInProgress = true;
      state.migrationPercentage = 10;
    },
    updateMigrationPercentage: (state, { payload }) => {
      state.migrationPercentage = payload;
    },
    migrationCompleted: (state) => {
      state.migration = true;
      state.migrationInProgress = false;
      state.migrationPercentage = 100;
    },
    resetMigration: (state) => {
      state.migration = false;
      state.migrationInProgress = false;
      state.migrationPercentage = 10;
    },
    updateBuyTnxStatus: (state, { payload }) => {
      state.buyTnxStatus = [...state.buyTnxStatus, payload];
    },
    updateSendTnxStatus: (state, { payload }) => {
      state.sendTnxStatus = [...state.sendTnxStatus, payload];
    },
    clearTransactionStatus: (state) => {
      state.buyTnxStatus = [];
      state.sendTnxStatus = [];
    },
    updateForceClearDatabase: (state, { payload }) => {
      state.forceClearDatabase = payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  changeFooterItems,
  updateNfcSupported,
  updateTheme,
  startMigrationProcess,
  updateMigrationPercentage,
  migrationCompleted,
  resetMigration,
  updateBuyTnxStatus,
  updateSendTnxStatus,
  clearTransactionStatus,
  updateForceClearDatabase,
} = CommonStore.actions;

// A selector
export const commonSelector = (state) => state.common;

export default CommonStore.reducer;

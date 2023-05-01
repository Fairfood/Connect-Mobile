import { createSlice } from '@reduxjs/toolkit';
import defaultTheme from '../themes/defualt';

export const initialState = {
  footerItems: {},
  nfcSupported: null,
  theme: defaultTheme,
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
  },
});

// Action creators are generated for each case reducer function
export const {
  changeFooterItems,
  updateNfcSupported,
  updateTheme,
} = CommonStore.actions;

// A selector
export const commonSelector = (state) => state.common;

export default CommonStore.reducer;

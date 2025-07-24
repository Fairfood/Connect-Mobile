import { createSlice } from '@reduxjs/toolkit';
import defaultTheme from '../themes/default';
import {
  CURRENCY_FORMAT,
  DEFAULT_TEXT_TO_SPEECH_STATUS,
} from '../utils/constants';

export const initialState = {
  footerItems: {},
  nfcSupported: null,
  theme: defaultTheme,
  buyTnxStatus: [],
  sendTnxStatus: [],
  forceClearDatabase: false,
  appUpdate: false,
  appForceUpdate: false,
  appUpdateClicked: false,
  currencyFormat: CURRENCY_FORMAT.DOT_COMA,
  speechEnabled: DEFAULT_TEXT_TO_SPEECH_STATUS,
  farmerSearchText: '',
  tnxSearchText: '',
  paymentSearchText: '',
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
    changeAppUpdateStatus: (state, { payload }) => {
      state.appUpdate = payload.appUpdate;
      state.appForceUpdate = payload.appForceUpdate;
      state.appUpdateClicked = false;
    },
    changeAppUpdateClicked: (state, { payload }) => {
      state.appUpdateClicked = payload;
    },
    changeCurrencyFormat: (state, { payload }) => {
      state.currencyFormat = payload;
    },
    updateSpeechEnabled: (state, { payload }) => {
      state.speechEnabled = payload;
    },
    updateFarmerSearchText: (state, { payload }) => {
      state.farmerSearchText = payload;
    },
    updateTnxSearchText: (state, { payload }) => {
      state.tnxSearchText = payload;
    },
    updatePaymentSearchText: (state, { payload }) => {
      state.paymentSearchText = payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  changeFooterItems,
  updateNfcSupported,
  updateTheme,
  updateBuyTnxStatus,
  updateSendTnxStatus,
  clearTransactionStatus,
  updateForceClearDatabase,
  changeAppUpdateStatus,
  changeAppUpdateClicked,
  changeCurrencyFormat,
  updateSpeechEnabled,
  updateFarmerSearchText,
  updateTnxSearchText,
  updatePaymentSearchText,
} = CommonStore.actions;

// A selector
export const commonSelector = (state) => state.common;

export default CommonStore.reducer;

import { createSlice } from '@reduxjs/toolkit';
import apiConfig from '../api/config';

export const initialState = {
  isConnected: false,
  apiConfig,
  servers: [apiConfig],
};

// A slice for recipes with our three reducers
const ConnectionStore = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    setConnectionStatus: (state, { payload }) => {
      state.isConnected = payload;
    },
    setApiConfig: (state, { payload }) => {
      state.apiConfig = payload;
    },
    updateServers: (state, { payload }) => {
      state.servers = payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setConnectionStatus, setApiConfig, updateServers } =
  ConnectionStore.actions;

// A selector
export const connectionSelector = (state) => state.connection;

export default ConnectionStore.reducer;

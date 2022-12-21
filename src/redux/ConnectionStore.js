import { createSlice } from '@reduxjs/toolkit';

export const initialState = {
  isConnected: false,
};

// A slice for recipes with our three reducers
const ConnectionStore = createSlice({
  name: 'connection',
  initialState,
  reducers: {
    setConnectionStatus: (state, { payload }) => {
      state.isConnected = payload;
    },
  },
});

// Action creators are generated for each case reducer function
export const { setConnectionStatus } = ConnectionStore.actions;

// A selector
export const connectionSelector = (state) => state.connection;

export default ConnectionStore.reducer;

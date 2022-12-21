import { createSlice } from '@reduxjs/toolkit';

export const initialState = {
  FARMERS: [],
  FARMERS_LOADING: false,
  FARMERS_ERROR: { error: false, message: '' },
};

// A slice for recipes with our three reducers
const FarmersStore = createSlice({
  name: 'Farmers',
  initialState,
  reducers: {
    getAllFarmers: (state) => {
      state.FARMERS_LOADING = true;
    },
    farmersResponseSuccess: (state, { payload }) => {
      state.FARMERS = payload;
      state.FARMERS_LOADING = false;
      state.FARMERS_ERROR = { error: false, message: '' };
    },
    farmersResponseFailure: (state) => {
      state.FARMERS_LOADING = false;
      state.FARMERS_ERROR = {
        error: false,
        message: 'Failed to fetch farmers',
      };
    },
  },
});

// Action creators are generated for each case reducer function
export const { getAllFarmers, farmersResponseSuccess, farmersResponseFailure } =
  FarmersStore.actions;

// A selector
export const farmerSelector = (state) => state.Farmers;

export default FarmersStore.reducer;

import { createSlice } from '@reduxjs/toolkit';

export const initialState = {
  syncStage: 0,
  tnxSyncing: false,
  tnxSyncCount: 0,
  tnxSyncTotal: 0,
  tnxSyncStatus: 'completed',
  tnxSyncPrevTotal: 0,
  tnxSyncNextUrl: null,
  tnxSyncStage: 0,
  tnxUpdatedBefore: null,
  farmerSyncingInProgress: false,
  cardSyncingInProgress: false,
  buyTnxSyncingInProgress: false,
  sendTnxSyncingInProgress: false,
  farmerSyncing: false,
  farmerSyncCount: 0,
  farmerSyncTotal: 0,
  farmerSyncStatus: 'completed',
  farmerSyncPrevTotal: 0,
  farmerSyncNextUrl: null,
  syncIconStatus: 'completed',
};

// A slice for recipes with our three reducers
const SyncStore = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    startTnxSyncing: (state) => {
      state.tnxSyncing = true;
      state.tnxSyncCount = 0;
      state.tnxSyncTotal = 0;
      state.tnxSyncStatus = 'inprogress';
    },
    updateTnxSyncCount: (state, { payload }) => {
      state.tnxSyncCount = payload;
    },
    updateTnxSyncTotal: (state, { payload }) => {
      state.tnxSyncTotal = payload;
    },
    tnxSyncCompleted: (state) => {
      state.tnxSyncing = false;
      state.tnxSyncCount = 0;
      state.tnxSyncTotal = 0;
      state.tnxSyncStatus = 'completed';
      state.tnxSyncPrevTotal = 0;
      state.tnxSyncNextUrl = null;
      state.tnxUpdatedBefore = null;
      state.tnxSyncStage = 2;
    },
    resetTnxSync: (state) => {
      state.tnxSyncing = false;
      state.tnxSyncCount = 0;
      state.tnxSyncTotal = 0;
      state.tnxSyncStatus = 'completed';
      state.tnxSyncPrevTotal = 0;
      state.tnxSyncNextUrl = null;
      state.tnxUpdatedBefore = null;
      state.tnxSyncStage = 0;
    },
    tnxSyncFailed: (state) => {
      state.tnxSyncing = false;
      state.tnxSyncCount = 0;
      state.tnxSyncTotal = 0;
      state.tnxSyncStatus = 'failed';
    },
    updateSyncStage: (state, { payload }) => {
      state.syncStage = payload;
    },
    updateTnxSyncPrevTotal: (state, { payload }) => {
      state.tnxSyncPrevTotal = payload;
    },
    updateTnxSyncNextUrl: (state, { payload }) => {
      state.tnxSyncNextUrl = payload;
    },
    updateTnxSyncStage: (state, { payload }) => {
      state.tnxSyncStage = payload;
    },
    updateTnxUpdatedBefore: (state, { payload }) => {
      state.tnxUpdatedBefore = payload;
    },
    updateFarmerSyncingStatus: (state, { payload }) => {
      state.farmerSyncingInProgress = payload;
    },
    updateCardSyncingStatus: (state, { payload }) => {
      state.cardSyncingInProgress = payload;
    },
    updateBuyTnxSyncingStatus: (state, { payload }) => {
      state.buyTnxSyncingInProgress = payload;
    },
    updateSendTnxSyncingStatus: (state, { payload }) => {
      state.sendTnxSyncingInProgress = payload;
    },
    openIndividualSyncingStatus: (state) => {
      state.farmerSyncingInProgress = true;
      state.cardSyncingInProgress = true;
      state.buyTnxSyncingInProgress = true;
      state.sendTnxSyncingInProgress = true;
    },
    closeIndividualSyncingStatus: (state) => {
      state.farmerSyncingInProgress = false;
      state.cardSyncingInProgress = false;
      state.buyTnxSyncingInProgress = false;
      state.sendTnxSyncingInProgress = false;
    },
    startFarmerSyncing: (state) => {
      state.farmerSyncing = true;
      state.farmerSyncCount = 0;
      state.farmerSyncTotal = 0;
      state.farmerSyncStatus = 'inprogress';
    },
    updateFarmerSyncCount: (state, { payload }) => {
      state.farmerSyncCount = payload;
    },
    updateFarmerSyncTotal: (state, { payload }) => {
      state.farmerSyncTotal = payload;
    },
    completeFarmerSyncing: (state) => {
      state.farmerSyncing = false;
      state.farmerSyncCount = 0;
      state.farmerSyncTotal = 0;
      state.farmerSyncStatus = 'completed';
      state.farmerSyncPrevTotal = 0;
      state.farmerSyncNextUrl = null;
      state.farmerUpdatedBefore = null;
    },
    updateFarmerSyncPrevTotal: (state, { payload }) => {
      state.farmerSyncPrevTotal = payload;
    },
    updateFarmerSyncNextUrl: (state, { payload }) => {
      state.farmerSyncNextUrl = payload;
    },
    updateSyncIconStatus: (state, { payload }) => {
      state.syncIconStatus = payload;
    },
  },
});

export const addTnxSyncCount = () => {
  return async (dispatch, getState) => {
    let tnxCount = getState().sync.tnxSyncCount;
    tnxCount = parseInt(tnxCount) + 1;
    dispatch(updateTnxSyncCount(tnxCount));
  };
};

export const addFarmerSyncCount = () => {
  return async (dispatch, getState) => {
    let farmerCount = getState().sync.farmerSyncCount;
    farmerCount = parseInt(farmerCount) + 1;
    dispatch(updateFarmerSyncCount(farmerCount));
  };
};

// Action creators are generated for each case reducer function
export const {
  startTnxSyncing,
  updateTnxSyncCount,
  updateTnxSyncTotal,
  tnxSyncCompleted,
  tnxSyncFailed,
  updateSyncStage,
  updateTnxSyncPrevTotal,
  updateTnxSyncNextUrl,
  updateTnxSyncStage,
  updateTnxUpdatedBefore,
  updateFarmerSyncingStatus,
  updateCardSyncingStatus,
  updateBuyTnxSyncingStatus,
  updateSendTnxSyncingStatus,
  openIndividualSyncingStatus,
  closeIndividualSyncingStatus,
  resetTnxSync,
  startFarmerSyncing,
  updateFarmerSyncCount,
  updateFarmerSyncTotal,
  completeFarmerSyncing,
  updateFarmerSyncPrevTotal,
  updateFarmerSyncNextUrl,
  updateSyncIconStatus,
} = SyncStore.actions;

// A selector
export const syncSelector = (state) => state.sync;

export default SyncStore.reducer;

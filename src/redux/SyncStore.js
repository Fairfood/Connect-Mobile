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
  },
});

export const addTnxSyncCount = () => {
  return async (dispatch, getState) => {
    let tnxCount = getState().sync.tnxSyncCount;
    tnxCount = parseInt(tnxCount) + 1;
    dispatch(updateTnxSyncCount(tnxCount));
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
} = SyncStore.actions;

// A selector
export const syncSelector = (state) => state.sync;

export default SyncStore.reducer;

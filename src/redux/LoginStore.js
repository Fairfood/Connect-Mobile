import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SYNC_DATA } from '../utils/constants';

export const initialState = {
  isLoggedIn: false,
  loggedInUser: null,
  userCompanyDetails: null,
  syncInProgress: false,
  syncSuccessful: true,
  syncPercentage: 0,
  syncTotalCount: 0,
  loginButtonLoading: false,
  loginLoadingText: 'Continue',
};

// A slice for recipes with our three reducers
const LoginStore = createSlice({
  name: 'login',
  initialState,
  reducers: {
    signInSuccess: (state, { payload }) => {
      state.loggedInUser = payload;
      state.isLoggedIn = false;
    },
    updateForceLogin: (state) => {
      state.loggedInUser = null;
    },
    signOutUser: (state) => {
      state.loggedInUser = null;
      state.isLoggedIn = false;
      state.userCompanyDetails = null;
      state.syncInProgress = false;
      state.syncSuccessful = false;
    },
    updateCompanyDetails: (state, { payload }) => {
      state.userCompanyDetails = payload;
    },
    updateUserDetails: (state, { payload }) => {
      state.loggedInUser = {
        ...state.loggedInUser,
        ...payload,
      };
    },
    setSyncInProgress: (state) => {
      state.syncInProgress = true;
      state.syncSuccessful = false;
    },
    setSyncInProgressSuccess: (state) => {
      state.syncInProgress = false;
      state.syncSuccessful = true;
    },
    setSyncInProgressFailure: (state) => {
      state.syncInProgress = false;
      state.syncSuccessful = false;
    },
    onBoardingComplete: (state) => {
      state.isLoggedIn = true;
    },
    updateSyncPercentage: (state, { payload }) => {
      const [syncPercentage, syncTotalCount] = payload;
      state.syncPercentage = syncPercentage;
      state.syncTotalCount = syncTotalCount;
    },
    updateLoginButtonLoading: (state, { payload }) => {
      state.loginButtonLoading = payload;
    },
    updateLoginLoadingText: (state, { payload }) => {
      state.loginLoadingText = payload;
    },
  },
});

export const initSyncProcess = () => {
  return async (dispatch) => {
    dispatch(setSyncInProgress());
  };
};

export const SyncProcessComplete = () => {
  return async (dispatch) => {
    await AsyncStorage.setItem('syncData', JSON.stringify(DEFAULT_SYNC_DATA));

    dispatch(setSyncInProgressSuccess());
  };
};

export const SyncProcessFailed = () => {
  return async (dispatch) => {
    dispatch(setSyncInProgressFailure());
  };
};

export const updateLoginLoadingStatus = (loading, text = '') => {
  return async (dispatch) => {
    dispatch(updateLoginButtonLoading(loading));
    dispatch(updateLoginLoadingText(text));
  };
};

export const manageSyncData = (type, syncStatus) => {
  return async (dispatch, getState) => {
    let obj = await AsyncStorage.getItem('syncData');
    obj = JSON.parse(obj);
    const totalCount = getState().login.syncTotalCount;
    let percentage = getState().login.syncPercentage;

    if (obj[type]) {
      const pending = parseInt(obj[type].pending);
      let finished = parseInt(obj[type].finished);
      let failed = parseInt(obj[type].failed);

      if (syncStatus === 'success') {
        if (finished < pending) {
          finished += 1;
        }
        obj[type].finished = finished;
      } else if (syncStatus === 'failed') {
        if (failed < pending) {
          failed += 1;
        }
        obj[type].failed = failed;
      }

      if (finished + failed < pending) {
        obj[type].status = 'syncing';
        await AsyncStorage.setItem('syncData', JSON.stringify(obj));

        percentage += 100 / totalCount;
        percentage = Math.round(percentage);
        if (percentage > 100) {
          percentage = 100;
        }
        dispatch(updateSyncPercentage([percentage, totalCount]));
      } else if (finished + failed >= pending) {
        if (failed > 0) {
          obj[type].status = 'failed';
        } else {
          obj[type].status = 'completed';
        }

        await AsyncStorage.setItem('syncData', JSON.stringify(obj));
        dispatch(updateSyncPercentage([100, totalCount]));
      }
    }
  };
};

// Action creators are generated for each case reducer function
export const {
  signInSuccess,
  signOutUser,
  updateForceLogin,
  updateCompanyDetails,
  setSyncInProgress,
  setSyncInProgressSuccess,
  setSyncInProgressFailure,
  updateUserDetails,
  onBoardingComplete,
  updateSyncPercentage,
  updateLoginButtonLoading,
  updateLoginLoadingText,
} = LoginStore.actions;

// A selector
export const loginSelector = (state) => state.login;

export default LoginStore.reducer;

import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SYNC_DATA } from '../services/constants';

export const initialState = {
  isLoggedIn: false,
  loggedInUser: null,
  loginLoading: false,
  loginError: { error: false, message: '' },
  userCompanyDetails: null,
  userProjectDetails: null,
  syncInProgress: false,
  syncSuccessfull: true,
  showForceLogin: false,
  syncPercentage: 0,
  syncTotalCount: 0,
  onBoardingError: false,
};

// A slice for recipes with our three reducers
const LoginStore = createSlice({
  name: 'login',
  initialState,
  reducers: {
    signInUser: (state) => {
      state.loginLoading = true;
      state.loginError = { error: false, message: '' };
    },
    signInSuccess: (state, { payload }) => {
      state.loggedInUser = payload;
      state.isLoggedIn = false;
      state.loginLoading = false;
      state.showForceLogin = true;
    },
    signInFailure: (state, { payload }) => {
      state.loginLoading = false;
      state.loginError = {
        error: true,
        message: payload,
      };
    },
    updateForceLogin: (state) => {
      state.showForceLogin = false;
      state.loggedInUser = null;
    },
    signOutUser: (state) => {
      state.loginLoading = false;
      state.loginError = { error: false, message: '' };
      state.loggedInUser = null;
      state.isLoggedIn = false;
      state.syncInProgress = false;
      state.syncSuccessfull = false;
    },
    updateCompanyDetails: (state, { payload }) => {
      state.loggedInUser = {
        ...state.loggedInUser,
        project_id: payload.projects[0],
      };
      state.loginLoading = false;
      state.userCompanyDetails = payload;
    },
    updateProjectDetails: (state, { payload }) => {
      state.loggedInUser = {
        ...state.loggedInUser,
        premiums: payload.premiums,
      };
      state.loginLoading = false;
      state.userProjectDetails = payload;
    },
    updateUserDetails: (state, { payload }) => {
      state.loggedInUser = {
        ...state.loggedInUser,
        ...payload,
      };
    },
    clearError: (state) => {
      state.loginLoading = false;
      state.loginError = {
        error: false,
        message: '',
      };
    },
    setSyncInProgress: (state) => {
      state.syncInProgress = true;
      state.syncSuccessfull = false;
    },
    setSyncInProgressSuccess: (state) => {
      state.syncInProgress = false;
      state.syncSuccessfull = true;
    },
    setSyncInProgressFailure: (state) => {
      state.syncInProgress = false;
      state.syncSuccessfull = false;
    },
    onBoardingComplete: (state) => {
      state.isLoggedIn = true;
    },
    updateSyncPercentage: (state, { payload }) => {
      [syncPercentage, syncTotalCount] = payload;
      state.syncPercentage = syncPercentage;
      state.syncTotalCount = syncTotalCount;
    },
    updateOnBoardingError: (state, { payload }) => {
      state.onBoardingError = payload;
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
  signInUser,
  signInFailure,
  signInSuccess,
  signOutUser,
  updateForceLogin,
  updateCompanyDetails,
  updateProjectDetails,
  clearError,
  setSyncInProgress,
  setSyncInProgressSuccess,
  setSyncInProgressFailure,
  updateUserDetails,
  onBoardingComplete,
  updateSyncPercentage,
  updateOnBoardingError,
} = LoginStore.actions;

// A selector
export const loginSelector = (state) => state.login;

export default LoginStore.reducer;

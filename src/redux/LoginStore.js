import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

import { database } from '../../App';
import { CommonFetchRequest } from '../api/middleware';
import I18n from '../i18n/i18n';
import {
  findPremiumByServerId,
  getAllPremiums,
  savePremium,
  updatePremium,
} from '../services/premiumsHelper';
import { removeLocalStorage } from '../services/commonFunctions';
import { DEFAULT_SYNC_DATA } from '../services/constants';
import api from '../api/config';

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
  footerItems: {},
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
    changeFooterItems: (state, { payload }) => {
      state.footerItems = payload;
    },
  },
});

/**
 * login api
 *
 * @param   {string}  email       user email
 * @param   {string}  password    user password
 * @param   {boolean} forceLogout need a new access token or not
 * @returns {object}              user object
 */
export function loginUser(email, password, forceLogout = false) {
  return async (dispatch) => {
    const deviceId = DeviceInfo.getDeviceId();
    const previousUser = await AsyncStorage.getItem('previousUser');
    const deviceName = await DeviceInfo.getDeviceName();
    dispatch(signInUser());

    const timestamp = Math.round(new Date() / 1000);

    const headers = {
      'Content-Type': 'application/json',
      Version: DeviceInfo.getVersion(),
      'Client-Code': api.API_CLIENT_CODE,
    };

    const data = {
      username: email,
      password,
      device_id: deviceId.toString(),
      type: '1',
      force_logout: forceLogout,
      registration_id: timestamp.toString(),
      name: deviceName,
    };

    const config = {
      method: 'POST',
      url: `${api.API_URL}${api.API_VERSION}/projects/login/`,
      headers,
      data: JSON.stringify(data),
    };

    const response = await CommonFetchRequest(config);
    if (response.success) {
      const user = response.data;

      if (!previousUser) {
        await AsyncStorage.setItem('first_time_sync', 'true');

        database.action(async () => {
          await database.unsafeResetDatabase();
        });
        return user;
      }
      if (previousUser && previousUser !== user.id) {
        await AsyncStorage.setItem('first_time_sync', 'true');

        database.action(async () => {
          await database.unsafeResetDatabase();
        });
        AsyncStorage.setItem('previousUser', user.id);
        return user;
      }
      return user;
    }
    if (response.error) {
      dispatch(signInFailure(response.error));
    }
    return null;
  };
}

/**
 * fetches user details
 *
 * @param   {object} user user object
 * @returns {void}
 */
export function getUserDetails(user) {
  return async (dispatch) => {
    try {
      const config = {
        method: 'GET',
        url: `${api.API_URL}${api.API_VERSION}/accounts/user/${user.id}/`,
        headers: {
          Bearer: user.token,
          'User-ID': user.id,
          'Content-Type': 'application/json',
          Version: DeviceInfo.getVersion(),
          'Client-Code': api.API_CLIENT_CODE,
        },
      };

      const result = await CommonFetchRequest(config);

      const userDetails = result.data;
      const finalUserObj = {
        ...user,
        ...userDetails,
      };

      await removeLocalStorage();
      await AsyncStorage.setItem('loggedInUser', JSON.stringify(finalUserObj));

      if (result.success) {
        dispatch(signInSuccess(finalUserObj));
      } else {
        dispatch(signInFailure(finalUserObj));
      }
    } catch (error) {
      dispatch(signInFailure(I18n.t('something_went_wrong')));
    }
  };
}

/**
 * fetches company details
 *
 * @returns {void}
 */
export function getCompanyDetails() {
  return async (dispatch, getState) => {
    let loggedInUser = await AsyncStorage.getItem('loggedInUser');
    if (loggedInUser) {
      loggedInUser = JSON.parse(loggedInUser);
    } else {
      loggedInUser = getState().login.loggedInUser;
    }

    const headers = {
      Bearer: loggedInUser.token,
      'User-ID': loggedInUser.id,
      'Content-Type': 'application/json',
      'Node-ID': loggedInUser.default_node,
      Version: DeviceInfo.getVersion(),
      'Client-Code': api.API_CLIENT_CODE,
    };

    const config = {
      method: 'GET',
      url: `${api.API_URL}${api.API_VERSION}/supply-chain/company/${loggedInUser.default_node}/`,
      headers,
    };

    const response = await CommonFetchRequest(config);

    if (response.success) {
      const { data } = response;

      const finalUserObj = {
        ...loggedInUser,
        project_id: data.projects[0],
      };

      await AsyncStorage.setItem('loggedInUser', JSON.stringify(finalUserObj));
      dispatch(updateCompanyDetails(response.data));
      return response;
    }
    return response;
  };
}

/**
 * fetches project details
 *
 * @returns {void}
 */
export function getProjectDetails() {
  return async (dispatch, getState) => {
    let loggedInUser = await AsyncStorage.getItem('loggedInUser');
    if (loggedInUser) {
      loggedInUser = JSON.parse(loggedInUser);
    } else {
      loggedInUser = getState().login.loggedInUser;
    }

    const headers = {
      Bearer: loggedInUser.token,
      'User-ID': loggedInUser.id,
      'Content-Type': 'application/json',
      'Node-ID': loggedInUser.default_node,
      Version: DeviceInfo.getVersion(),
      'Client-Code': api.API_CLIENT_CODE,
    };

    const config = {
      method: 'GET',
      url: `${api.API_URL}${api.API_VERSION}/projects/project/${loggedInUser.project_id}/`,
      headers,
    };

    const response = await CommonFetchRequest(config);

    if (response.success) {
      const { premiums } = response.data;
      const projectDetails = {
        ...loggedInUser,
        currency: response.data.currency,
        premiums,
      };

      const allPremiums = await getAllPremiums();

      if (allPremiums.length === 0) {
        premiums.map(async (premium) => {
          const filterPremiums = await findPremiumByServerId(premium.id);
          if (filterPremiums.length === 0) {
            await savePremium(premium);
          } else {
            await updatePremium(filterPremiums[0], premium);
          }
        });
      }
      await AsyncStorage.setItem(
        'loggedInUser',
        JSON.stringify(projectDetails),
      );
      dispatch(updateProjectDetails(response.data));
      return response;
    }
    return response;
  };
}

/**
 * logout api
 *
 * @param   {object} user user object
 * @returns {void}
 */
export function logoutUser(user) {
  return async (dispatch, getState) => {
    let loggedInUser = user;

    if (!loggedInUser) {
      loggedInUser = await AsyncStorage.getItem('loggedInUser');
      if (loggedInUser) {
        loggedInUser = JSON.parse(loggedInUser);
      } else {
        loggedInUser = getState().login.loggedInUser;
      }
    }

    const headers = {
      Bearer: loggedInUser.token,
      'User-ID': loggedInUser.id,
      'Content-Type': 'application/json',
    };

    const data = {
      device_id: loggedInUser.device_id,
    };

    const config = {
      method: 'POST',
      url: `${api.API_URL}${api.API_VERSION}/projects/logout/`,
      headers,
      data: JSON.stringify(data),
      redirect: 'follow',
    };

    await CommonFetchRequest(config);

    await removeLocalStorage();
    dispatch(signOutUser());
  };
}

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
  changeFooterItems,
} = LoginStore.actions;

// A selector
export const loginSelector = (state) => state.login;

export default LoginStore.reducer;

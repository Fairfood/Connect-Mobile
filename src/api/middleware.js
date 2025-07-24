/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-alert */
/**
 * middleware
 */
import { Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from './axios';
import I18n from '../translations/text/i18n';
import { signOutUser, updateLoginLoadingStatus } from '../redux/LoginStore';
import { tnxSyncFailed } from '../redux/SyncStore';
import { store } from '../redux/store';
import { handleErrors } from '../utils/commonFunctions';
import {
  authenticateSSOUser,
  fetchAccessToken,
  fetchIdToken,
  revokeRefreshToken,
} from '../sync/SyncAuth';
import { AUTH_EXTERNAL, AUTH_PASSWORD_GRANT } from '../utils/constants';
import { getMockApiResponse } from '../../__test__/detox/__mocks__/mockApiResponse';

const commonErrorResponse = {
  success: false,
  error: I18n.t('something_went_wrong'),
};

/**
 * Middleware for connecting all APIs
 * @param   {object}  configValue API data and configurations
 * @returns {object}              returns updated API response data
 */
export const Middleware = async (configValue) => {
  try {
    const {
      method,
      urlKey,
      url = null,
      contentType,
      data,
      authorized = true,
      user = null,
      testingKey = null,
    } = configValue;

    const { apiConfig } = store.getState().connection;

    if (apiConfig.APP_ENVIRONMENT === 'testing') {
      const res = await getMockApiResponse(testingKey);
      return res;
    }

    const headers = {
      'Content-Type': contentType,
      Version: DeviceInfo.getVersion(),
    };

    if (authorized) {
      const { loggedInUser } = store.getState().login;
      const sso = JSON.parse((await AsyncStorage.getItem('sso')) || 'null');
      const currentUser = user || loggedInUser;

      if (sso) {
        headers['Auth-Type'] = AUTH_EXTERNAL;
        headers.Authorization = `Bearer ${currentUser?.id_token ?? ''}`;
        headers['Client-Nonce'] = sso.client_nonce;
        headers['Server-Nonce'] = sso.server_nonce;
      } else {
        headers['Auth-Type'] = AUTH_PASSWORD_GRANT;
        headers.Authorization = `Bearer ${currentUser?.access ?? ''}`;
      }
    }

    const fetchUrl = url || `${apiConfig.API_BASE_URL}${urlKey}`;

    const config = {
      method,
      url: fetchUrl,
      headers,
    };

    if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
      if (contentType === 'application/json') {
        config.data = JSON.stringify(data);
      } else {
        config.data = data;
      }
    }

    const response = await CommonFetchRequest(config);
    return response;
  } catch (error) {
    handleErrors(error, {
      ref: 'middleware_Middleware',
    });
    return commonErrorResponse;
  }
};

/**
 * Common axios fetch function for all APIs
 * @param   {object} config axios api configurations
 * @returns {object}        returns updated API response data
 */
export const CommonFetchRequest = async (config) => {
  try {
    const response = await axios(config);
    const res = await ErrorHandler(response, config);
    return res;
  } catch (error) {
    handleErrors(error, {
      ref: 'middleware_CommonFetchRequest',
    });
    return { success: false, error: I18n.t('something_went_wrong') };
  }
};

/**
 * Handling API response errors
 * @param   {object} response API response
 * @param   {object} config   axios api configurations
 * @returns {object}          returns updated API response data
 */
export const ErrorHandler = async (response, config) => {
  try {
    const { syncStage } = store.getState().sync;

    if (response?.data?.success === true) {
      return response.data;
    }

    if (response?.status === 200) {
      return { success: true, data: response.data, error: null };
    }

    // some errors occurs

    if (!response) {
      Toast.show({
        type: 'error',
        text1: I18n.t('connection_error'),
        text2: I18n.t('bad_internet_connection'),
      });

      if (syncStage === 2) {
        store.dispatch(tnxSyncFailed());
      }

      return { success: false, error: I18n.t('bad_internet_connection') };
    }

    if (response?.status === 404 || response?.status === 502) {
      Toast.show({
        type: 'error',
        text1: I18n.t('not_found'),
        text2: I18n.t('requested_content_not_found'),
      });

      if (syncStage === 2) {
        store.dispatch(tnxSyncFailed());
      }

      return { success: false, error: I18n.t('requested_content_not_found') };
    }

    const { detail, message, error } = response.data;
    const errorObj = detail || message || error || null;

    const errorMsg = await setErrorMsg(errorObj);
    if (errorMsg) {
      const { isLoggedIn } = store.getState().login;
      if (errorMsg.includes('Device deactivated') && isLoggedIn) {
        if (!config.url.includes('auth/logout/')) {
          Alert.alert(I18n.t('logged_out'), I18n.t('force_logout'), [
            {
              text: I18n.t('ok'),
              onPress: handleAlert,
            },
          ]);
        }

        return { success: false };
      }

      if (
        errorMsg.includes('Authentication credentials were not provided') ||
        errorMsg.includes('Given token not valid for any token type')
      ) {
        const sso = JSON.parse((await AsyncStorage.getItem('sso')) || 'null');

        if (sso) {
          const res = await fetchIdToken(config);
          return res;
        }

        const res = await fetchAccessToken(config);
        return res;
      }

      if (!errorMsg.includes('User is already logged in another device')) {
        Toast.show({
          type: 'error',
          text1: I18n.t('error'),
          text2: errorMsg,
        });

        handleErrors(new Error(`fetch_error_1 at ${config.url}: ${errorMsg}`), {
          ref: 'middleware_ErrorHandler',
          config,
          response,
        });
      }

      if (syncStage === 2) {
        store.dispatch(tnxSyncFailed());
        return { success: false };
      }

      return { success: false, error: errorMsg };
    }

    if (syncStage === 2) {
      store.dispatch(tnxSyncFailed());
      return { success: false };
    }

    Toast.show({
      type: 'error',
      text1: I18n.t('error'),
      text2: I18n.t('something_went_wrong'),
    });

    handleErrors(new Error(`fetch_error_2: at ${config.url}`), {
      ref: 'middleware_ErrorHandler',
      config,
      response,
    });

    return commonErrorResponse;
  } catch (error) {
    handleErrors(error, {
      ref: 'middleware_ErrorHandler',
    });
    return commonErrorResponse;
  }
};

/**
 * Making readable error message for users
 * @param   {object}        errorObj error object from api response
 * @returns {string | null}          readable error message
 */
const setErrorMsg = async (errorObj) => {
  try {
    if (!errorObj) {
      return null;
    }

    if (typeof errorObj === 'string') {
      return errorObj;
    }

    const { detail } = errorObj;

    if (detail) {
      return typeof detail === 'string' ? detail : JSON.stringify(detail);
    }

    return JSON.stringify(errorObj);
  } catch (error) {
    handleErrors(error, {
      ref: 'middleware_setErrorMsg',
    });
    return null;
  }
};

const handleAlert = async () => {
  const { loggedInUser } = store.getState().login;
  const userCopy = { ...loggedInUser };

  const sso = JSON.parse((await AsyncStorage.getItem('sso')) || 'null');
  if (sso) {
    store.dispatch(updateLoginLoadingStatus(true, 'redirecting'));
    await revokeRefreshToken(userCopy);
    await authenticateSSOUser(sso);
  }
  store.dispatch(signOutUser());
};

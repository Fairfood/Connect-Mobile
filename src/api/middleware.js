/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-alert */
/**
 * middleware
 */
import Toast from 'react-native-toast-message';
import { signOutUser } from '../redux/LoginStore';
import { tnxSyncFailed } from '../redux/SyncStore';
import { store } from '../redux/store';
import axios from './axios';
import I18n from '../i18n/i18n';
import captureSentry from '../services/sentryHelper';

// common fetch request
export const CommonFetchRequest = async (config) => {
  const response = await axios(config);
  const res = await ErrorHandler(response);
  return res;
};

// error handler
export const ErrorHandler = async (response) => {
  const { syncStage } = store.getState().sync;

  if (response?.data?.success === true) {
    return response.data;
  }

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

  const { detail } = response.data;
  const errorObj = detail ?? {};

  if (syncStage === 2) {
    store.dispatch(tnxSyncFailed());
    return { success: false };
  }

  const errorMsg = await setErrorMsg(errorObj);
  if (errorMsg) {
    if (errorMsg.includes('Invalid Bearer token')) {
      const { isLoggedIn } = store.getState().login;
      if (isLoggedIn) {
        alert(I18n.t('force_logout'));
        store.dispatch(signOutUser());
        return { success: false };
      }
    } else {
      Toast.show({
        type: 'error',
        text1: I18n.t('error'),
        text2: errorMsg,
      });
      captureSentry('message', `fetch_error_2: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  }

  Toast.show({
    type: 'error',
    text1: I18n.t('error'),
    text2: I18n.t('something_went_wrong'),
  });

  captureSentry('message', `fetch_error_3: ${response._response}`);
  return { success: false, error: I18n.t('something_went_wrong') };
};

// modifying error object into readable form
const setErrorMsg = async (errorObj) => {
  if (!errorObj) {
    return null;
  }

  if (typeof errorObj === 'string') {
    return errorObj;
  }

  const { detail, batches } = errorObj;

  if (detail) {
    return typeof detail === 'string' ? detail : JSON.stringify(detail);
  }

  if (batches) {
    return typeof batches === 'string'
      ? batches
      : I18n.t('error_based_batches');
  }

  return JSON.stringify(errorObj);
};

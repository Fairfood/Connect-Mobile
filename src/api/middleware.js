/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-alert */
/**
 * middleware
 */
import * as Sentry from '@sentry/react-native';
import Toast from 'react-native-toast-message';
import { signOutUser } from '../redux/LoginStore';
import { tnxSyncFailed } from '../redux/SyncStore';
import { store } from '../redux/store';
import axios from '../axios';
import I18n from '../i18n/i18n';

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
  const { status } = response;
  const { detail } = response.data;

  const errorObj = detail ?? {};

  if (!status) {
    Toast.show({
      type: 'error',
      text1: I18n.t('error'),
      text2: I18n.t('something_went_wrong'),
    });

    Sentry.captureMessage(`fetch_error_1: ${JSON.stringify(errorObj)}`);

    if (syncStage === 2) {
      store.dispatch(tnxSyncFailed());
    }

    return { success: false, error: I18n.t('something_went_wrong') };
  }

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
      return { success: false, error: errorMsg };
    }
  }

  Toast.show({
    type: 'error',
    text1: I18n.t('error'),
    text2: I18n.t('something_went_wrong'),
  });
  Sentry.captureMessage(`fetch_error_4: ${JSON.stringify(errorObj)}`);
  return { success: false, error: I18n.t('something_went_wrong') };
};

// modifying error object into readable form
const setErrorMsg = async (errorObj) => {
  if (errorObj) {
    const { detail, batches } = errorObj;
    if (detail) {
      const details = detail;
      if (typeof details === 'string') {
        return details;
      }
      return JSON.stringify(details);
    }
    if (batches) {
      if (typeof batches === 'string') {
        return batches;
      }
      return I18n.t('error_based_batches');
    }
    if (typeof errorObj === 'string') {
      return errorObj;
    }
    if (typeof errorObj === 'object') {
      let errorMsg = '';
      for (const [key, value] of Object.entries(errorObj)) {
        if (Array.isArray(value)) {
          if (value.length > 1) {
            for (j = 0; j < value.length; j++) {
              const msgText = await combineAttribute(key, value[j]);
              errorMsg += msgText;
            }
          } else {
            const msgText = await combineAttribute(key, value[0]);
            errorMsg = msgText;
          }
        }
      }
      return errorMsg;
    }
    return JSON.stringify(errorObj);
  }
  return null;
};

// combining error attribute into the error message
const combineAttribute = async (key, value) => {
  let keyText = key;
  let valueText = value;
  if (valueText.includes('This field') && keyText !== 'non_field_errors') {
    keyText = keyText.toString().replace('_', ' ');
    const firstLetter = keyText.substr(0, 1);
    keyText = firstLetter.toUpperCase() + keyText.substr(1);

    valueText = valueText.replace('This field', keyText);
    return valueText;
  }
  return value;
};

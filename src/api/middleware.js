/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-alert */
/**
 * middlwware
 */

import { ToastAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sentry from '@sentry/react-native';
import { signOutUser } from '../redux/LoginStore';
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
  const firstTimeSync = await AsyncStorage.getItem('first_time_sync');

  if (!response) {
    ToastAndroid.show(I18n.t('bad_internet_connection'), ToastAndroid.SHORT);
    if (firstTimeSync && firstTimeSync === 'true') {
      alert(I18n.t('contact_support'));
    }
    return { success: false, error: I18n.t('bad_internet_connection') };
  }
  const { status } = response;
  const { success, detail } = response.data;

  if (success === true) {
    return response.data;
  }

  const errorObj = detail ?? {};

  if (!status) {
    ToastAndroid.show(I18n.t('something_went_wrong'), ToastAndroid.SHORT);
    Sentry.captureMessage(`fetch_error_1: + ${errorObj}`);
    return { success: false, error: I18n.t('something_went_wrong') };
  }
  if (
    firstTimeSync &&
    firstTimeSync === 'true' &&
    status !== 200 &&
    status !== 201
  ) {
    ToastAndroid.show(I18n.t('something_went_wrong'), ToastAndroid.SHORT);
    Sentry.captureMessage(`fetch_error_2: ${errorObj}`);
    alert(I18n.t('contact_support'));
    store.dispatch(signOutUser());
    return { success: false };
  }
  const errorMsg = await setErrorMsg(errorObj);
  if (errorMsg) {
    if (errorMsg.includes('Invalid Bearer token')) {
      alert(I18n.t('force_logout'));
      store.dispatch(signOutUser());
      return { success: false };
    }
    ToastAndroid.show(errorMsg, ToastAndroid.SHORT);
    return { success: false, error: errorMsg };
  }
  ToastAndroid.show(I18n.t('something_went_wrong'), ToastAndroid.SHORT);
  Sentry.captureMessage(`fetch_error_3: ${errorObj}`);
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
              const msgText = await compainAttribute(key, value[j]);
              errorMsg += msgText;
            }
          } else {
            const msgText = await compainAttribute(key, value[0]);
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

// compaining error attribute into the error message
const compainAttribute = async (key, value) => {
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

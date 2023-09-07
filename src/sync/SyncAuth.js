import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { database } from '../../App';
import { CommonFetchRequest } from '../api/middleware';
import { tnxSyncCompleted, updateSyncStage } from '../redux/SyncStore';
import { removeLocalStorage } from '../services/commonFunctions';
import {
  signInFailure,
  signInSuccess,
  signInUser,
  signOutUser,
} from '../redux/LoginStore';
import { realm } from '../db/Configuration';
import { migrationCompleted, updateForceClearDatabase } from '../redux/CommonStore';
import { store } from '../redux/store';
import I18n from '../i18n/i18n';
import api from '../api/config';

/**
 * login api
 * @param   {string}  email       user email
 * @param   {string}  password    user password
 * @param   {boolean} forceLogout need a new access token or not
 * @returns {object}              user object
 */
export const userLogin = async (email, password, forceLogout = false) => {
  const { forceClearDatabase } = store.getState().common;
  const deviceId = DeviceInfo.getDeviceId();
  const previousUser = await AsyncStorage.getItem('previousUser');
  const deviceName = await DeviceInfo.getDeviceName();
  store.dispatch(signInUser());

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

    if ((previousUser && previousUser !== user.id) || forceClearDatabase) {
      await removeLocalStorage();

      database.action(async () => {
        await database.unsafeResetDatabase();
      });

      realm.write(() => {
        realm.deleteAll();
      });

      store.dispatch(migrationCompleted());
      store.dispatch(tnxSyncCompleted());
      store.dispatch(updateSyncStage(0));
      store.dispatch(updateForceClearDatabase(false));
    }

    AsyncStorage.setItem('previousUser', user.id);
    return user;
  }

  if (response.error) {
    store.dispatch(signInFailure(response.error));
  }
  return null;
};

/**
 * fetches user details
 * @param   {object} user user object
 * @returns {void}
 */
export const fetchUserDetails = async (user) => {
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
    if (result.success) {
      const userDetails = result.data;
      const finalUserObj = {
        ...user,
        ...userDetails,
      };

      await AsyncStorage.setItem('loggedInUser', JSON.stringify(finalUserObj));

      const { syncStage } = store.getState().sync;
      if (syncStage === 0) {
        store.dispatch(updateSyncStage(1));
      }

      store.dispatch(signInSuccess(finalUserObj));
    } else {
      store.dispatch(signInFailure('Error in user details fetch.'));
    }
  } catch (error) {
    store.dispatch(signInFailure(I18n.t('something_went_wrong')));
  }
};

/**
 * logout api
 * @param   {object} user user object
 * @returns {void}
 */
export const userLogout = async (user) => {
  let loggedInUser = user;

  if (!loggedInUser) {
    loggedInUser = await AsyncStorage.getItem('loggedInUser');
    if (loggedInUser) {
      loggedInUser = JSON.parse(loggedInUser);
    } else {
      loggedInUser = store.getState().login.loggedInUser;
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

  store.dispatch(signOutUser());
};

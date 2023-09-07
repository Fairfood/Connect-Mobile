import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { database } from '../../App';
import { CommonFetchRequest } from '../api/middleware';
import { tnxSyncCompleted, updateSyncStage } from '../redux/SyncStore';
import { removeLocalStorage } from './commonFunctions';
import {
  signInFailure,
  signInSuccess,
  signInUser,
  signOutUser,
  updateCompanyDetails,
  updateProjectDetails,
} from '../redux/LoginStore';
import { store } from '../redux/store';
import I18n from '../i18n/i18n';
import api from '../api/config';
import { realm } from '../db/Configuration';
import { migrationCompleted } from '../redux/CommonStore';

/**
 * login api
 * @param   {string}  email       user email
 * @param   {string}  password    user password
 * @param   {boolean} forceLogout need a new access token or not
 * @returns {object}              user object
 */
export const loginUser = async (email, password, forceLogout = false) => {
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

    if (previousUser && previousUser !== user.id) {
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
export const getUserDetails = async (user) => {
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
 * fetches company details
 * @returns {boolean} true if success, false otherwise
 */
export const getCompanyDetails = async () => {
  let loggedInUser = await AsyncStorage.getItem('loggedInUser');
  if (loggedInUser) {
    loggedInUser = JSON.parse(loggedInUser);
  } else {
    loggedInUser = store.getState().login.loggedInUser;
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
    store.dispatch(updateCompanyDetails(data));
    return true;
  }
  return false;
};

/**
 * fetches project details
 * @returns {boolean} true if success, false otherwise
 */
export const getProjectDetails = async () => {
  let loggedInUser = await AsyncStorage.getItem('loggedInUser');
  if (loggedInUser) {
    loggedInUser = JSON.parse(loggedInUser);
  } else {
    loggedInUser = store.getState().login.loggedInUser;
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

    await AsyncStorage.setItem('loggedInUser', JSON.stringify(projectDetails));
    store.dispatch(updateProjectDetails(response.data));
    return true;
  }
  return false;
};

/**
 * logout api
 * @param   {object} user user object
 * @returns {void}
 */
export const logoutUser = async (user) => {
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

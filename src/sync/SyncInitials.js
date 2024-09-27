import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import Toast from 'react-native-toast-message';
import I18n from '../i18n/i18n';
import { CommonFetchRequest } from '../api/middleware';
import {
  SyncProcessFailed,
  initSyncProcess,
  updateCompanyDetails,
  updateProjectDetails,
} from '../redux/LoginStore';
import { store } from '../redux/store';
import { startTnxSyncing, updateTnxSyncStage } from '../redux/SyncStore';
import { syncAllFarmers } from './SyncFarmers';
import api from '../api/config';

export const initiateSync = async () => {
  const { syncInProgress } = store.getState().login;
  const { isConnected } = store.getState().connection;
  const { syncStage } = store.getState().sync;

  if (!isConnected) {
    Toast.show({
      type: 'error',
      text1: I18n.t('connection_error'),
      text2: I18n.t('no_active_internet_connection'),
    });
    return;
  }

  if (syncInProgress) {
    // Toast.show({
    //   type: 'warning',
    //   text1: I18n.t('in_progress'),
    //   text2: I18n.t('sync_already_in_progress'),
    // });
    return;
  }

  await store.dispatch(initSyncProcess());

  if (syncStage === 2) {
    store.dispatch(startTnxSyncing());
    store.dispatch(updateTnxSyncStage(1));
  }

  syncCompanyDetails();
};

/**
 * fetches company details
 * @returns {boolean} true if success, false otherwise
 */
export const syncCompanyDetails = async () => {
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

    syncProjectDetails();
  } else {
    store.dispatch(SyncProcessFailed('sync Failed'));
  }
};

/**
 * fetches project details
 * @returns {boolean} true if success, false otherwise
 */
export const syncProjectDetails = async () => {
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

    const date = new Date();
    await AsyncStorage.setItem(
      'user_details_last_update',
      date.getTime().toString(),
    );

    syncAllFarmers();
  } else {
    store.dispatch(SyncProcessFailed('sync Failed'));
  }
};

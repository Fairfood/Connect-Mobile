import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import I18n from '../translations/text/i18n';
import { Middleware } from '../api/middleware';
import {
  SyncProcessFailed,
  initSyncProcess,
  updateCompanyDetails,
} from '../redux/LoginStore';
import { store } from '../redux/store';
import {
  closeIndividualSyncingStatus,
  openIndividualSyncingStatus,
  startTnxSyncing,
  updateTnxSyncStage,
} from '../redux/SyncStore';
import { syncAllFarmers } from './SyncFarmers';
import { handleErrors } from '../utils/commonFunctions';

/**
 * Starting sync process
 */
export const initiateSync = async () => {
  try {
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
      // sync already in progress
      return;
    }

    store.dispatch(openIndividualSyncingStatus());
    await store.dispatch(initSyncProcess());

    if (syncStage === 2) {
      store.dispatch(startTnxSyncing());
      store.dispatch(updateTnxSyncStage(1));
    }

    syncCompanyDetails();
  } catch (error) {
    handleErrors(error, {
      ref: 'SyncInitials_initiateSync',
    });
  }
};

/**
 * fetches company details
 */
export const syncCompanyDetails = async () => {
  try {
    const { loggedInUser } = store.getState().login;

    const config = {
      method: 'GET',
      urlKey: `supply-chains/companies/${loggedInUser.entity_id}`,
      contentType: 'application/json',
    };

    const response = await Middleware(config);
    if (!response.success) {
      throw new Error(response.error);
    }

    const { buyer, currency } = response.data;
    await AsyncStorage.setItem('buyer', JSON.stringify(buyer || null));

    if (!currency) {
      const defaultCurrency = await fetchCurrency();
      if (!defaultCurrency) {
        throw new Error('Fetching default currency failed.');
      }
      response.data.currency = defaultCurrency;
    }

    store.dispatch(updateCompanyDetails(response.data));
    syncAllFarmers();
  } catch (error) {
    store.dispatch(closeIndividualSyncingStatus());
    store.dispatch(SyncProcessFailed());
    handleErrors(error, {
      ref: 'SyncInitials_syncCompanyDetails',
    });
  }
};

export const fetchCurrency = async () => {
  try {
    const config = {
      method: 'GET',
      urlKey: `catalogs/currencies/?code=IDR`,
      contentType: 'application/json',
    };

    const response = await Middleware(config);
    const currency = response?.data?.results?.[0] ?? null;
    return currency;
  } catch (error) {
    store.dispatch(closeIndividualSyncingStatus());
    store.dispatch(SyncProcessFailed());
    handleErrors(error, {
      ref: 'SyncInitials_fetchCurrency',
    });
  }
};

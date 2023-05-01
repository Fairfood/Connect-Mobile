import React, { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NfcManager from 'react-native-nfc-manager';
import { useDispatch } from 'react-redux';
import { LogBox } from 'react-native';
import { setConnectionStatus } from '../redux/ConnectionStore';
import { DEFAULT_SYNC_DATA } from '../services/constants';
import { updateSyncStage, updateTnxSyncStage } from '../redux/SyncStore';
import { updateNfcSupported } from '../redux/CommonStore';
import Navigator from '../navigation/Navigator';
import I18n from '../i18n/i18n';

const Root = () => {
  const dispatch = useDispatch();

  const ignoreWarns = [
    'Animated: `useNativeDriver`',
    'ViewPropTypes',
    '[WatermelonDB]',
    'JSI SQLiteAdapter',
  ];

  useEffect(() => {
    setupInitialValues();
    setupConnection();
  }, []);

  const setupInitialValues = async () => {
    if (__DEV__) {
      LogBox.ignoreLogs(ignoreWarns);
    }

    const appLanguage = await AsyncStorage.getItem('app_language');

    if (appLanguage) {
      I18n.locale = appLanguage;
    } else {
      I18n.locale = 'en-GB';
      await AsyncStorage.setItem('app_language', 'en-GB');
    }

    await AsyncStorage.setItem('syncData', JSON.stringify(DEFAULT_SYNC_DATA));
    const firstTimeSync = await AsyncStorage.getItem('first_time_sync');
    if (firstTimeSync && firstTimeSync === 'false') {
      dispatch(updateSyncStage(3));
      dispatch(updateTnxSyncStage(3));
    }

    NfcManager.isSupported().then(async (supported) => {
      if (supported) {
        dispatch(updateNfcSupported(true));
      } else {
        dispatch(updateNfcSupported(false));
      }
    });
  };

  const setupConnection = async () => {
    NetInfo.addEventListener((state) => {
      dispatch(setConnectionStatus(state.isConnected));
    });
  };

  return <Navigator />;
};

export default Root;

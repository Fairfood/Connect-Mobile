import React, { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NfcManager from 'react-native-nfc-manager';
import Tts from 'react-native-tts';
import { useDispatch, useSelector } from 'react-redux';
import { LogBox } from 'react-native';
import { setApiConfig, setConnectionStatus } from '../redux/ConnectionStore';
import {
  changeCurrencyFormat,
  updateFarmerSearchText,
  updateNfcSupported,
  updatePaymentSearchText,
  updateTnxSearchText,
} from '../redux/CommonStore';
import { checkAppUpdateAvailable } from '../utils/commonFunctions';
import Navigator from '../navigation/Navigator';
import I18n from '../translations/text/i18n';
import Speech from '../translations/textToSpeech/speech';
import { CURRENCY_FORMAT } from '../utils/constants';
import apiConfig from '../api/config';
import { updateLoginLoadingStatus } from '../redux/LoginStore';

const Root = () => {
  const { currencyFormat } = useSelector((state) => state.common);
  const dispatch = useDispatch();

  const ignoreWarns = [
    'Animated: `useNativeDriver`',
    'ViewPropTypes',
    '[Reanimated]',
  ];

  useEffect(() => {
    setupInitialValues();
    setupConnection();
  }, []);

  /**
   * Setting default values
   */
  const setupInitialValues = async () => {
    if (global.__DEV__) {
      LogBox.ignoreLogs(ignoreWarns);
    }

    NfcManager.isSupported().then(async (supported) => {
      dispatch(updateNfcSupported(supported));
    });

    await checkAppUpdateAvailable();

    dispatch(updateLoginLoadingStatus(true, 'loading'));
    clearFilterItems();

    if (!currencyFormat) {
      dispatch(changeCurrencyFormat(CURRENCY_FORMAT.DOT_COMA));
    }

    const appLanguage = await AsyncStorage.getItem('app_language');
    I18n.locale = appLanguage || 'en-GB';
    Speech.locale = 'en-GB';
    Tts.getInitStatus().then(() => {
      Tts.setDefaultLanguage('en-GB');
    });

    if (!appLanguage) {
      await AsyncStorage.setItem('app_language', 'en-GB');
    }
  };

  const clearFilterItems = () => {
    dispatch(updateFarmerSearchText(''));
    dispatch(updateTnxSearchText(''));
    dispatch(updatePaymentSearchText(''));
  };

  const setupConnection = async () => {
    const patchV410 = await AsyncStorage.getItem('patchV410');
    if (!patchV410) {
      dispatch(setApiConfig(apiConfig));
      await AsyncStorage.setItem('patchV410', 'true');
    }

    NetInfo.addEventListener((state) => {
      dispatch(setConnectionStatus(state.isConnected));
    });
  };

  return <Navigator />;
};

export default Root;

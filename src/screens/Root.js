import React, { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { LogBox } from 'react-native';
import { setConnectionStatus } from '../redux/ConnectionStore';
import { DEFAULT_SYNC_DATA } from '../services/constants';
import Navigator from '../navigation/Navigator';
import I18n from '../i18n/i18n';

const Root = () => {
  const dispatch = useDispatch();

  const ignoreWarns = [
    'Animated: `useNativeDriver`',
    'ViewPropTypes will be removed from React Native. Migrate to ViewPropTypes exported from \'deprecated-react-native-prop-types.',
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
  };

  const setupConnection = async () => {
    NetInfo.addEventListener((state) => {
      dispatch(setConnectionStatus(state.isConnected));
    });
  };

  return <Navigator />;
};

export default Root;

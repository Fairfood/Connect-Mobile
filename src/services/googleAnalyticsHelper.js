/* eslint-disable import/prefer-default-export */
import analytics from '@react-native-firebase/analytics';

export const logAnalytics = async (key, data = {}) => {
  await analytics().logEvent(key, data);
};

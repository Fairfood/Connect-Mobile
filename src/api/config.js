/**
 * CONFIG
 */

import Config from 'react-native-config';

const apiConfig = {
  API_BASE_URL: Config.API_BASE_URL,
  APP_ENVIRONMENT: Config.APP_ENVIRONMENT,
  API_SERVER_NAME: Config.API_SERVER_NAME,
  DEFAULT_SERVER: true,
  SENTRY_URL: Config.SENTRY_URL,
  GOOGLE_PLAY_STORE_URL: Config.GOOGLE_PLAY_STORE_URL,
  APP_LINK_REDIRECT_URI: Config.APP_LINK_REDIRECT_URI,
};

export default apiConfig;

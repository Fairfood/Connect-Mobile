import React from 'react';
import * as Sentry from '@sentry/react-native';
import Toast from 'react-native-toast-message';
import codePush from 'react-native-code-push';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { store, persistor } from './src/redux/store';
import { checkAppUpdateAvailable } from './src/utils/commonFunctions';
// screens
import Root from './src/screens/Root';
import ToastConfig from './src/components/toastConfig';
import api from './src/api/config';
import { configureReanimatedLogger } from 'react-native-reanimated';

const { apiConfig } = store.getState().connection;
const sentryUrl = apiConfig?.SENTRY_URL ?? api.SENTRY_URL;

configureReanimatedLogger({
  strict: false, // Reanimated runs in strict mode by default
});

Sentry.init({
  dsn: sentryUrl,
});

const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
};

checkAppUpdateAvailable();

const MyApp = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Root />
      </PersistGate>
      <Toast config={ToastConfig} visibilityTime={3500} />
    </Provider>
  );
};

const App = codePush(codePushOptions)(MyApp);
export default Sentry.wrap(App);

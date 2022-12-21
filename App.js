/* eslint-disable import/no-named-as-default-member */
/* eslint-disable import/no-named-as-default */
import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/lib/integration/react';
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import DatabaseProvider from '@nozbe/watermelondb/DatabaseProvider';
import codePush from 'react-native-code-push';
import * as Sentry from '@sentry/react-native';
import { store, persistor } from './src/redux/store';
import api from './src/api/config';
import schema from './src/models/schema';
import migrations from './src/models/migrations';
import Node from './src/models/Node';
import Transaction from './src/models/Transaction';
import Product from './src/models/Product';
import Batch from './src/models/Batch';
import SourceBatch from './src/models/SourceBatch';
import TransactionPremium from './src/models/TransactionPremium';
import ProductPremium from './src/models/ProductPremium';
import Premium from './src/models/Premium';
import Root from './src/screens/Root';
import Card from './src/models/Card';

if (__DEV__) {
  import('./ReactotronConfig').then(() => 'Reactotron Configured');
} else {
  Sentry.init({
    dsn: api.SENTRY_URL,
  });
}

const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
};

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: true,
  onSetUpError: () => {
    // console.log('error', error);
  },
});

// Then, make a Watermelon database from it!
export const database = new Database({
  adapter,
  modelClasses: [
    Node,
    Transaction,
    Product,
    Batch,
    TransactionPremium,
    Premium,
    SourceBatch,
    Card,
    ProductPremium,
  ],
  actionsEnabled: true,
});

const MyApp = () => {
  return (
    <DatabaseProvider database={database}>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <Root />
        </PersistGate>
      </Provider>
    </DatabaseProvider>
  );
};

const App = codePush(codePushOptions)(MyApp);
export default Sentry.wrap(App);

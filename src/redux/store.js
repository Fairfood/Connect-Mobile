import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import { combineReducers } from 'redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginStore from './LoginStore';
import ConnectionStore from './ConnectionStore';
import FarmersStore from './FarmersStore';

const reducers = combineReducers({
  login: LoginStore,
  farmers: FarmersStore,
  connection: ConnectionStore,
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
};

const persistedReducer = persistReducer(persistConfig, reducers);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
    },
  }),
});
export const persistor = persistStore(store);

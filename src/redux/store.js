import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import { combineReducers } from 'redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginStore from './LoginStore';
import ConnectionStore from './ConnectionStore';
import SyncStore from './SyncStore';
import CommonStore from './CommonStore';

const reducers = combineReducers({
  login: LoginStore,
  sync: SyncStore,
  connection: ConnectionStore,
  common: CommonStore,
});

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
};

const persistedReducer = persistReducer(persistConfig, reducers);

export const store = configureStore({
  reducer: persistedReducer,
});

export const persistor = persistStore(store);

/**
 Common functions
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  PERMISSIONS,
  requestMultiple,
  request,
  RESULTS,
} from 'react-native-permissions';
import Toast from 'react-native-toast-message';
import RNFS from 'react-native-fs';
import SpInAppUpdates from 'sp-react-native-in-app-updates';
import DeviceInfo from 'react-native-device-info';
import { store } from '../redux/store';
import I18n from '../translations/text/i18n';
import {
  APP_FORCE_UPDATE,
  APP_TRANS_TYPE_OUTGOING,
  DEFAULT_CURRENCY,
} from './constants';
import {
  deleteTransactionPremiumById,
  fetchAllPremiumsByTransaction,
} from '../db/services/TransactionPremiumHelper';
import {
  countDeletedTransactions,
  countNewTransactions,
  deleteTransactionById,
  findTransaction,
  updateTransactionCurrentQuantity,
} from '../db/services/TransactionsHelper';
import {
  changeAppUpdateStatus,
  updateForceClearDatabase,
} from '../redux/CommonStore';
import {
  captureSentry,
  recordCrashlytics,
  textToSpeech,
} from './serviceHelper';
import { stringToJson } from './helperFunctions';
import { AlertConfig } from './alertConfig';
import { countFarmerSyncPending } from '../db/services/FarmerHelper';
import {
  resetTnxSync,
  updateSyncIconStatus,
  updateSyncStage,
} from '../redux/SyncStore';
import { realm } from '../db/Configuration';

/**
 * Removing cache variables
 */
export const removeLocalStorage = async () => {
  await AsyncStorage.multiRemove([
    'last_updated_premiums',
    'last_updated_products',
    'last_updated_farmers',
    'last_updated_transactions',
    'last_updated_payments',
    'last_synced_time',
    'country',
    'province',
    'syncData',
    'LocalPrice',
    'buyer',
  ]);
};

/**
 * converting dates to different format
 * @param   {string}  type  request type
 * @returns {boolean}       permission granted status
 */
export const requestPermission = async (type = null) => {
  try {
    if (Platform.OS === 'android') {
      let granted = true;

      if (type === 'location') {
        granted = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
      } else if (type === 'external-storage') {
        granted = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
      } else if (type === 'camera') {
        const result = await requestMultiple([
          PERMISSIONS.ANDROID.CAMERA,
          PERMISSIONS.ANDROID.RECORD_AUDIO,
        ]);

        granted =
          result['android.permission.CAMERA'] === RESULTS.GRANTED &&
          result['android.permission.RECORD_AUDIO'] === RESULTS.GRANTED
            ? RESULTS.GRANTED
            : RESULTS.DENIED;
      } else if (type === 'bluetooth') {
        const result = await requestMultiple([
          PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
          PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
        ]);

        granted =
          result['android.permission.BLUETOOTH_CONNECT'] === RESULTS.GRANTED &&
          result['android.permission.BLUETOOTH_SCAN'] === RESULTS.GRANTED
            ? RESULTS.GRANTED
            : RESULTS.DENIED;
      } else {
        return true;
      }

      if (granted === RESULTS.GRANTED) {
        return true;
      }

      return false;
    }

    return true;
  } catch (error) {
    handleErrors(error, {
      ref: 'commonFunctions_requestPermission',
    });
    return false;
  }
};

/**
 * converting dates to different format
 * @param   {object} transaction  transaction object
 * @param   {string} type         transaction type
 */
export const deleteTransaction = async (transaction, type) => {
  try {
    const transactionId = transaction.id;

    if (!transactionId) {
      throw new Error('transaction id is not found for delete transaction.');
    }

    // delete transaction
    await deleteTransactionById(transactionId);

    // reset current quantity
    if (type === APP_TRANS_TYPE_OUTGOING) {
      const parents = transaction?.parents ?? [];
      await Promise.all(
        parents.map(async (parent) => {
          const buyTransaction = await findTransaction(parent);

          if (buyTransaction) {
            await updateTransactionCurrentQuantity(buyTransaction.id, {
              current_quantity_corrected: buyTransaction.quantity_corrected,
            });
          }
        }),
      );
    }

    // delete transaction premiums
    const premiums = await fetchAllPremiumsByTransaction(transactionId);
    await Promise.all(
      premiums.map(async (premium) => {
        await deleteTransactionPremiumById(premium.id);
      }),
    );
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: I18n.t('error'),
      text2: I18n.t('something_went_wrong'),
    });

    handleErrors(error, {
      ref: 'commonFunctions_deleteTransaction',
    });
  }
};

/**
 * Creating skip card button text
 * @param   {string} actionType type of action button
 * @returns {string}            button text
 */
export const getSkipCardText = (actionType) => {
  switch (actionType) {
    case 'buy':
      return I18n.t('no_farmer_card');
    case 'send':
      return I18n.t('no_buyer_card');
    case 'issue_card':
    case 'reissue_card':
      return I18n.t('skip_the_card');
    default:
      return I18n.t('skip');
  }
};

const combineCsvData = (data) => {
  const header = `${Object.keys(data[0]).join(',')}\n`;
  const rows = data.map((obj) => `${Object.values(obj).join(',')}\n`);

  return header + rows.join('');
};

export const exportCsv = async (data, type) => {
  try {
    const csvData = combineCsvData(data);
    const timestamp = new Date().getTime();
    const path = `${RNFS.DownloadDirectoryPath}/${type}_${timestamp}.csv`;

    await RNFS.writeFile(path, csvData, 'utf8').then(() => {
      Toast.show({
        type: 'success',
        text1: 'Export successfully.',
        text2: `CSV file created at: ${path}`,
      });
    });

    return path;
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: I18n.t('error'),
      text2: I18n.t('something_went_wrong'),
    });

    handleErrors(error, {
      ref: 'commonFunctions_exportCsv',
    });

    return null;
  }
};

// export const importCsv = async (path) => {
//   try {
//     // const path = `${RNFS.DownloadDirectoryPath}/transactions.csv`;

//     // Check if the file exists
//     const fileExists = await RNFS.exists(path);

//     if (!fileExists) {
//       Toast.show({
//         type: 'error',
//         text1: 'File not found.',
//         text2: 'The CSV file does not exist on the device.',
//       });
//       return;
//     }

//     // Read the CSV file
//     const fileContent = await RNFS.readFile(path, 'utf8');

//     // Parse the CSV data using papaparse
//     const parsedData = Papa.parse(fileContent, {
//       header: true, // Set this to true if your CSV file has headers
//     });

//     // Access your CSV data from the parsedData object
//     return parsedData.data;
//   } catch (error) {
//     Toast.show({
//       type: 'error',
//       text1: I18n.t('something_went_wrong'),
//       text2: String(error),
//     });
//   }
// };

/**
 * Creating reference id for group transactions
 * @returns {string}  reference_id
 */
export const createReferenceId = () => {
  return `TCR${new Date().getTime()}`;
};

/**
 * Checking new update available at play sore and update data accordingly
 * @returns {boolean}  update available or not
 */
export const checkAppUpdateAvailable = async () => {
  try {
    const inAppUpdates = new SpInAppUpdates(false);
    const result = await inAppUpdates.checkNeedsUpdate();
    const shouldUpdate = result?.shouldUpdate ?? false;

    const update = {
      appUpdate: shouldUpdate,
      appForceUpdate: shouldUpdate ? APP_FORCE_UPDATE : false,
    };

    store.dispatch(changeAppUpdateStatus(update));
    return shouldUpdate;
  } catch (error) {
    handleErrors(error, {
      ref: 'commonFunctions_checkAppUpdateAvailable',
    });

    return false;
  }
};

/**
 * Checking valid based on app force update
 * @returns {boolean}  valid status
 */
export const appUpdateValidation = async () => {
  try {
    const { syncInProgress } = store.getState().login;
    const { appForceUpdate } = store.getState().common;

    if (!appForceUpdate) {
      return true;
    }

    if (syncInProgress) {
      Toast.show({
        type: 'error',
        text1: I18n.t('in_progress'),
        text2: I18n.t('try_after_sync'),
      });
      return false;
    }

    Toast.show({
      type: 'error',
      text1: I18n.t('app_update_require'),
      text2: I18n.t('app_force_update_msg'),
    });
    return false;
  } catch (error) {
    handleErrors(error, {
      ref: 'commonFunctions_appUpdateValidation',
    });

    return false;
  }
};

/**
 * Current environment and version text
 * @returns {string}  version text
 */
export const getVersionText = () => {
  try {
    const { apiConfig } = store.getState().connection;
    const env = apiConfig.APP_ENVIRONMENT;
    const version = DeviceInfo.getVersion();

    if (env === 'development') {
      return `Version: Dev v${version}`;
    }

    if (env === 'staging') {
      return `Version: Staging v${version}`;
    }

    return `Version: v${version}`;
  } catch (error) {
    handleErrors(error, {
      ref: 'commonFunctions_getVersionText',
    });

    return '';
  }
};

/**
 * Getting currency code text
 * @param   {string} key  currency id
 * @returns {string}      currency code
 */
export const getCurrency = (key) => {
  try {
    const { currency } = store.getState().login.userCompanyDetails;
    if (!currency) {
      throw new Error('Could not get currency.');
    }

    if (typeof currency === 'string') {
      return currency;
    }

    if (typeof currency === 'object') {
      return currency[key];
    }

    return currency;
  } catch (error) {
    handleErrors(error, {
      ref: 'commonFunctions_getCurrency',
    });

    return '';
  }
};

export const createSpeech = async (text = '', arg = []) => {
  const { speechEnabled } = store.getState().common;

  if (speechEnabled) {
    let speechText = text;
    for (let i = 0; i < arg.length; i++) {
      speechText = speechText.replace(`$${i}`, arg[i]);
    }

    await textToSpeech(speechText);
  }
};

/**
 * Handling and sending error logs to different servers
 * @param {error}  error  error captured
 * @param {object} extras object contains custom data
 */
export const handleErrors = (error, extras = null) => {
  const { loggedInUser } = store.getState().login;
  const userFeedback = {
    name: loggedInUser?.user_id ?? 'Connect user',
    email: 'support@fairfood.org',
    comments: JSON.stringify(extras),
  };

  captureSentry(error, userFeedback);
  recordCrashlytics(error, extras);
};

export const imageTypeValidation = async (image) => {
  if (image.mime && !image.mime.includes('image')) {
    Toast.show({
      type: 'error',
      text1: I18n.t('invalid'),
      text2: I18n.t('only_image_files_allowed'),
    });
    return false;
  }

  return true;
};

export const getAndroidVersion = () => {
  const androidVersion = DeviceInfo.getSystemVersion();
  return parseFloat(androidVersion);
};

export const NumberFormatter = {
  currency: (number, showCurrencyCode = false) => {
    if (!number) {
      return number;
    }

    const { currencyFormat } = store.getState().common;
    const { thousandSeparator, decimalSeparator } = currencyFormat;

    const fixedNumber = parseFloat(number).toFixed(2);
    const parts = fixedNumber.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
    if (!showCurrencyCode) {
      return parts.join(decimalSeparator);
    }

    const currencyCode =
      store?.getState()?.login?.userCompanyDetails?.currency?.code ??
      DEFAULT_CURRENCY.code;
    return `${parts.join(decimalSeparator)} ${currencyCode}`;
  },
  quantity: (number, showQuantityText = false) => {
    if (!number) {
      return number;
    }

    const { currencyFormat } = store.getState().common;
    const { decimalSeparator } = currencyFormat;

    const fixedNumber = parseFloat(number).toFixed(2);
    if (!showQuantityText) {
      return fixedNumber.replace('.', decimalSeparator);
    }

    return `${fixedNumber.replace('.', decimalSeparator)} Kg`;
  },
  numberToFormat: (number, format) => {
    if (!number) {
      return number;
    }

    if (!format) {
      return number;
    }

    const { thousandSeparator, decimalSeparator } = format;

    const parts = number.toString().split('.');
    if (thousandSeparator !== '') {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);
    }

    if (parts.length > 1) {
      return parts.join(decimalSeparator);
    }
    return parts[0];
  },
  formatToNumber: (number, format) => {
    if (!number) {
      return number;
    }

    if (!format) {
      return number;
    }

    const { thousandSeparator, decimalSeparator } = format;

    const parts = number.toString().split(decimalSeparator);
    if (thousandSeparator !== '') {
      parts[0] = parts[0].replace(thousandSeparator, '');
    }

    if (parts.length > 1) {
      return parts.join('.');
    }
    return parts[0];
  },
};

export const getAlertConfig = (key) => {
  return AlertConfig.find((x) => x.key === key);
};

export const getBuyer = async () => {
  const buyer = await AsyncStorage.getItem('buyer');
  if (buyer) {
    return JSON.parse(buyer);
  }
  return null;
};

export const getBuyerCard = async (id, key) => {
  const savedBuyer = await getBuyer();
  const buyerCards = savedBuyer?.entity_card ?? [];
  const cardFound = buyerCards.find((x) => x?.card?.[key] === id);
  return cardFound?.card ?? null;
};

export const getSubmissionFields = async (formFields) => {
  if (!formFields) {
    return [];
  }

  let extraFields = formFields;

  if (typeof extraFields === 'string') {
    extraFields = stringToJson(extraFields);
  }

  const submissionFields = [];
  for (const fields of extraFields) {
    for (const values of fields.values) {
      submissionFields.push({
        label: values.field_details.label,
        value: values.value,
        key: values.field_details.key,
        type: values.field_details.type,
      });
    }
  }

  const filterFields = submissionFields.filter(
    (x) => x.key !== 'transaction_date' && x.value !== null,
  );

  return filterFields;
};

/**
 * setting sync icons based on sync counts
 */
export const updateSyncIcon = async () => {
  const { syncInProgress, syncSuccessful } = store.getState().login;

  if (syncInProgress) {
    store.dispatch(updateSyncIconStatus('pending'));
    return;
  }

  if (!syncInProgress && !syncSuccessful) {
    store.dispatch(updateSyncIconStatus('failed'));
    return;
  }

  const farmerPending = await countFarmerSyncPending();
  const newTransactions = await countNewTransactions();
  const deletedTransactions = await countDeletedTransactions();
  const totalCount = farmerPending + newTransactions + deletedTransactions;

  if (totalCount === 0) {
    store.dispatch(updateSyncIconStatus('success'));
    return;
  }

  store.dispatch(updateSyncIconStatus('pending'));
};

export const manageUserDatabase = async (user) => {
  const { forceClearDatabase } = store.getState().common;
  const previousUser = await AsyncStorage.getItem('previousUser');

  if ((previousUser && previousUser !== user.user_id) || forceClearDatabase) {
    await removeLocalStorage();

    realm.write(() => {
      realm.deleteAll();
    });

    store.dispatch(resetTnxSync());
    store.dispatch(updateSyncStage(0));
    store.dispatch(updateForceClearDatabase(false));
  }

  AsyncStorage.setItem('previousUser', user.user_id);
};

export const getQueryParam = (url, param) => {
  const queryString = url.split('?')[1];
  if (!queryString) {
    return null;
  }

  const params = queryString.split('&');
  for (let i = 0; i < params.length; i++) {
    const [key, value] = params[i].split('=');
    if (key === param) {
      return decodeURIComponent(value);
    }
  }
  return null;
};

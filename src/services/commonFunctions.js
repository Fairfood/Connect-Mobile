/* eslint-disable array-callback-return */
/**
 Common functions
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid } from 'react-native';
import Toast from 'react-native-toast-message';
import I18n from '../i18n/i18n';
import {
  APP_TRANS_TYPE_INCOMING,
  APP_TRANS_TYPE_OUTGOING,
  SAVE_DELETE_TRANSACTION_INVOICE,
  VERIFICATION_METHOD_MANUAL,
} from './constants';
import {
  deleteAllBatchesByTransactionId,
  findAndUpdateBatchQuantity,
  findBatch,
} from '../db/services/BatchHelper';
import {
  deleteSourceBatchesByTransactionId,
  fetchSourceBatchesByTransaction,
} from '../db/services/SourceBatchHelper';
import {
  deleteTransactionPremiumById,
  fetchAllPremiumsByTransaction,
} from '../db/services/TransactionPremiumHelper';
import { deleteTransactionById } from '../db/services/TransactionsHelper';

export const getCustomFieldValue = (field) => {
  if (!field || !field.value) {
    return null;
  }

  if (field.type === 'bool') {
    return field.value === 'true' ? I18n.t('yes') : I18n.t('no');
  }

  if (field.type === 'date') {
    const newDate = new Date(field.value);
    return ISOdateConvert(newDate);
  }

  return field.value;
};

export const stringToJson = (stringValue) => {
  if (stringValue) {
    const value = JSON.parse(stringValue);
    if (typeof value === 'object') {
      return value;
    }

    if (typeof value === 'string') {
      return stringToJson(value);
    }
  }

  return stringValue;
};

export const jsonToString = (jsonValue) => {
  if (jsonValue) {
    const value = JSON.stringify(jsonValue);
    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object') {
      return jsonToString(value);
    }
  }

  return jsonValue;
};

export const removeLocalStorage = async () => {
  await AsyncStorage.multiRemove([
    'loggedInUser',
    'last_updated_products',
    'last_updated_farmers',
    'last_updated_transactions',
    'last_updated_batches',
    'last_synced_time',
    'last_updated_premiums',
    'first_time_sync',
    'second_time_sync',
    'country',
    'province',
    'syncData',
    'patch_v120_070723',
    'patch_200723',
  ]);
};

export const requestPermission = async (type = null) => {
  try {
    if (Platform.OS === 'android') {
      let granted = true;

      if (type === 'camera') {
        granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
        );
      } else if (type === 'microphone') {
        granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        );
      } else if (type === 'location') {
        granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
      } else if (type === 'external-storage') {
        granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        );
      } else {
        return true;
      }

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      }

      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

export const deleteTransaction = async (transaction, type) => {
  const transactionId = transaction.id;

  if (!transactionId) {
    Toast.show({
      type: 'error',
      text1: I18n.t('error'),
      text2: I18n.t('something_went_wrong'),
    });
    return;
  }

  // delete transaction
  await deleteTransactionById(transactionId);

  // delete batches
  if (type === APP_TRANS_TYPE_INCOMING) {
    await deleteAllBatchesByTransactionId(transactionId);
  } else if (type === APP_TRANS_TYPE_OUTGOING) {
    const sourceBatches = await fetchSourceBatchesByTransaction(transactionId);

    // setting buy transaction batch current_quantity to initial_quantity for buy again.
    await Promise.all(
      sourceBatches.map(async (sourceBatch) => {
        const batch = await findBatch(sourceBatch.batch_id);

        if (batch.length > 0) {
          await findAndUpdateBatchQuantity(batch[0].id, {
            current_quantity: batch[0].initial_quantity,
          });
        }
      }),
    );

    // deleting all source batches
    await deleteSourceBatchesByTransactionId(transactionId);
  }

  // delete transaction premiums
  const premiums = await fetchAllPremiumsByTransaction(transactionId);
  await Promise.all(
    premiums.map(async (premium) => {
      await deleteTransactionPremiumById(premium.id);
    }),
  );

  // saving transaction invoice in local storage
  if (SAVE_DELETE_TRANSACTION_INVOICE) {
    if (
      transaction.verification_method === VERIFICATION_METHOD_MANUAL &&
      transaction.invoice_file !== ''
    ) {
      let savedInvoices =
        (await AsyncStorage.getItem('saved_invoices')) || '[]';
      savedInvoices = JSON.parse(savedInvoices);

      const obj = {
        id: transaction.id,
        invoice_file: transaction.invoice_file,
        node_id: transaction.node_id,
        product_id: transaction.product_id,
        quantity: transaction.quantity,
        created_on: transaction.created_on,
      };

      savedInvoices.push(obj);
      savedInvoices = JSON.stringify(savedInvoices);
      await AsyncStorage.setItem('saved_invoices', savedInvoices);
    }
  }
};

/**
 * converting dates to different format
 * @param   {string} date   current date string
 * @param   {string} format needed format for date
 * @returns {string}        formatted date
 */
export function ISOdateConvert(date = null, format = 'date') {
  let covertDate = new Date();

  if (date) {
    covertDate = new Date(date);
  }

  switch (format) {
    case 'Mon Jan 10 2021':
      return covertDate.toDateString();
    case 'date':
      return covertDate.toLocaleDateString();
    case 'time':
      return covertDate.toTimeString();
    case 'GMT format':
      return covertDate.toGMTString();
    case '2021-01-10T10:12:50.500Z':
      return covertDate.toISOString();
    case 'Local date Format':
      return covertDate.toLocaleString();
    case 'Locale time format':
      return covertDate.toLocaleTimeString();
    case 'Mon Jan 10 2021 15:42:50':
      return covertDate.toString('YYYY-MM-dd');
    case 'UTC format':
      return covertDate.toUTCString();
    default:
      return covertDate;
  }
}

export const avatarText = (name) => {
  if (!name) {
    return 'AA';
  }

  const fullName = name.toString().trim();

  if (fullName.includes(' ')) {
    const nameArr = fullName.split(' ');
    const firstLetter = nameArr[0].charAt(0);
    const secondLetter = nameArr[1].charAt(0);
    return (firstLetter + secondLetter).toUpperCase();
  }

  const firstLetter = fullName.charAt(0);
  const secondLetter = fullName.charAt(1);
  return (firstLetter + secondLetter).toUpperCase();
};

export const checkEmojis = async (fields) => {
  let valid = true;
  let errMsg = '';
  await Promise.all(
    fields.map(async (field) => {
      const value = await removeEmojis(field.value);

      if (value.length !== field.value.length) {
        valid = false;
        errMsg = `${field.name} ${I18n.t('cannot_contain_emoji')}`;
      }
    }),
  );

  return [valid, errMsg];
};

export const removeEmojis = async (text) => {
  return text
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      '',
    )
    .trim();
};

// check mandatory fields
export const checkMandatory = async (fields) => {
  let valid = true;
  let errMsg = '';
  await Promise.all(
    fields.map((field) => {
      if (!field.value) {
        valid = false;
        errMsg = `${field.name} ${I18n.t('is_mandatory')}`;
      }
    }),
  );

  return [valid, errMsg];
};

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

export const removeNullValues = async (obj) => {
  Object.entries(obj).forEach(([key, value]) => {
    if (value === null) {
      delete obj[key];
    }
  });
  return obj;
};

export const convertCurrency = (currencyText, rounded = true) => {
  if (!currencyText) {
    return 0;
  }

  const fixedNumber = parseFloat(currencyText).toFixed(2);
  const parsedNumber = parseFloat(fixedNumber);
  const convertedText = rounded ? Math.round(parsedNumber) : parsedNumber;
  return convertedText.toLocaleString('id');
};

export const convertQuantity = (quantityText, rounded = false) => {
  if (!quantityText) {
    return 0;
  }

  const fixedNumber = parseFloat(quantityText).toFixed(2);
  const parsedNumber = parseFloat(fixedNumber);
  const convertedText = rounded ? Math.round(parsedNumber) : parsedNumber;
  return convertedText.toString().replace('.', ',');
};

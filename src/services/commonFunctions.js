/* eslint-disable array-callback-return */
/**
 Common functions
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid, ToastAndroid } from 'react-native';
import I18n from '../i18n/i18n';
import {
  findAllPremiumsByTransaction,
  deleteTransactionPremiumById,
} from './transactionPremiumHelper';
import {
  clearAllBatchesByTransactionId,
  findAndupdateBatchQuantity,
  findBatchById,
} from './batchesHelper';
import { deleteTransactionById } from './transactionsHelper';
import {
  clearAllSourceBatchesByTransactionId,
  getAllSourceBatchesByTransaction,
} from './sourceBatchesHelper';
import * as consts from './constants';

export const getCustomFieldValue = (field) => {
  if (field?.value) {
    if (field.type === 'bool') {
      if (field.value === 'true') {
        return I18n.t('yes');
      }
      return I18n.t('no');
    }

    if (field.type === 'date') {
      const newDate = new Date(field.value);
      return ISOdateConvert(newDate);
    }
    return field.value;
  }
  return null;
};

export const stringToJson = (stringValue) => {
  if (stringValue) {
    value = JSON.parse(stringValue);
    if (typeof value === 'object') {
      return value;
    }

    if (typeof value === 'string') {
      stringToJson(value);
    }

    return value;
  }
  return stringValue;
};

export const jsonToString = (jsonValue) => {
  if (jsonValue) {
    value = JSON.stringify(jsonValue);
    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object') {
      jsonToString(value);
    }

    return value;
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
    'first_time_sync',
    'country',
    'province',
    'syncData',
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
    ToastAndroid.show(I18n.t('something_went_wrong'), ToastAndroid.SHORT);
    return;
  }

  // delete transaction
  await deleteTransactionById(transactionId);

  // delete batches
  if (type === consts.APP_TRANS_TYPE_INCOMING) {
    await clearAllBatchesByTransactionId(transactionId);
  } else if (type === consts.APP_TRANS_TYPE_OUTGOING) {
    const sourceBatches = await getAllSourceBatchesByTransaction(transactionId);

    // setting buy transaction batch current_quantity to initial_quantity for buy again.
    await Promise.all(
      sourceBatches.map(async (sourceBatch) => {
        const batch = await findBatchById(sourceBatch.batch_id);
        if (batch.length > 0) {
          await findAndupdateBatchQuantity(batch[0].id, {
            current_quantity: batch[0].initial_quantity,
          });
        }
      }),
    );

    // deleting all source batches
    await clearAllSourceBatchesByTransactionId(transactionId);
  }

  // delete transaction premiums
  const premiums = await findAllPremiumsByTransaction(transactionId);
  await Promise.all(
    premiums.map(async (premium) => {
      await deleteTransactionPremiumById(premium.id);
    }),
  );

  // saving transaction invoice in local storage
  if (consts.SAVE_DELETE_TRANSACTION_INVOICE) {
    if (
      transaction.verification_method === consts.VERIFICATION_METHOD_MANUAL &&
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
 *
 * @param   {string} date   current date string
 * @param   {string} format needed format for date
 * @returns {string}        formated date
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

// check mandatory fields
export const updateTransactionStatus = async (productId) => {
  if (productId) {
    let transationStatus =
      (await AsyncStorage.getItem('transationStatus')) || '{}';
    transationStatus = JSON.parse(transationStatus);

    transationStatus.push(productId);
    await AsyncStorage.setItem(
      'transationStatus',
      JSON.stringify(transationStatus),
    );
  } else {
    await AsyncStorage.setItem('transationStatus', JSON.stringify({}));
  }
};

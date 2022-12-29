import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { findFarmerById } from './farmersHelper';
import {
  findAllNewTransactions,
  findAllUnUploadedTransactionsInvoices,
  findAndupdateTransaction,
  findAndupdateTransactionInvoice,
  findTransactionById,
  findTransactionByServerId,
  saveTransaction,
  updateTransactionError,
} from './transactionsHelper';
import { CommonFetchRequest } from '../api/middleware';
import { findProductById } from './productsHelper';
import {
  findAndupdateBatch,
  findBatchById,
  getAllBatchesByTransaction,
} from './batchesHelper';
import { findAllPremiumsByTransaction } from './transactionPremiumHelper';
import { findPremiumById } from './premiumsHelper';
import { store } from '../redux/store';
import {
  SyncProcessFailed,
  initSyncProcess,
  manageSyncData,
} from '../redux/LoginStore';
import { updateAllFarmerDetails } from './syncFarmers';
import {
  clearAllSourceBatchesByTransactionId,
  getAllSourceBatchesByTransaction,
} from './sourceBatchesHelper';
import { getAllBatches } from './populateDatabase';
import { stringToJson } from './commonFunctions';
import api from '../api/config';
import * as consts from './constants';

export const syncTransactions = async () => {
  store.dispatch(initSyncProcess());
  let transactions = await findAllNewTransactions();
  transactions = transactions.filter((tx) => {
    return tx.type === consts.APP_TRANS_TYPE_INCOMING;
  });

  if (transactions.length === 0) {
    await syncSendTransactions();
  } else {
    let loggedInUser = await AsyncStorage.getItem('loggedInUser');
    loggedInUser = JSON.parse(loggedInUser);

    const headers = {
      Bearer: loggedInUser.token,
      'Content-Type': 'application/json',
      'User-ID': loggedInUser.id,
      'Node-ID': loggedInUser.default_node,
      Version: DeviceInfo.getVersion(),
      'Client-Code': api.API_CLIENT_CODE,
    };

    const transactionStatusArr = [];

    await Promise.all(
      transactions.map(async (transaction) => {
        const tx = await findTransactionById(transaction.id);
        if (tx.server_id !== '') {
          store.dispatch(manageSyncData('transaction', 'success'));
          return transaction;
        }

        const farmer = await findFarmerById(transaction.node_id);
        const product = await findProductById(transaction.product_id);
        const premiums = await getIncludedPremiums(transaction.id);
        const productId = product.server_id;

        let extraFields = transaction.extra_fields;
        if (extraFields) {
          if (typeof extraFields === 'string') {
            extraFields = JSON.stringify(stringToJson(extraFields));
          } else if (typeof extraFields === 'object') {
            extraFields = JSON.stringify(extraFields);
          }
        }

        const data = {
          node: farmer.server_id,
          unit: 1,
          type: consts.APP_TRANS_TYPE_INCOMING,
          product: productId,
          quantity: transaction.quantity,
          price: transaction.price,
          currency: loggedInUser.currency,
          created_on: parseInt(transaction.created_on),
          premiums,
          quality_correction: transaction.quality_correction,
          product_price: transaction.product_price,
          verification_method: transaction.verification_method,
          verification_longitude: transaction.verification_longitude,
          verification_latitude: transaction.verification_latitude,
          extra_fields: extraFields,
        };

        const config = {
          method: 'POST',
          url: `${api.API_URL}${api.API_VERSION}/projects/transaction/`,
          headers,
          data,
        };

        const response = await CommonFetchRequest(config);

        if (!response?.success) {
          if (response.error) {
            Sentry.captureMessage(
              `buy transaction syncing error: ${response.error}`,
            );

            if (consts.DELETE_TRANSACTION_ENABLED) {
              await updateTransactionError(transaction.id, response.error);
            }
          }
          store.dispatch(manageSyncData('transaction', 'failed'));
          return transaction;
        }

        const responseId = response?.data?.id ?? null;
        const responseNumber = response?.data?.number ?? null;
        const responseDate = response?.data?.date ?? null;
        const responseCreatedOn = response?.data?.created_on ?? null;
        const responseDestinationBatch =
          response?.data?.destination_batches?.[0] ?? null;

        if (
          !responseId ||
          !responseNumber ||
          !responseDate ||
          !responseCreatedOn ||
          !responseDestinationBatch
        ) {
          Sentry.captureMessage(
            `error in buy transaction syncing - response: ${response}`,
          );

          if (consts.DELETE_TRANSACTION_ENABLED) {
            await updateTransactionError(
              transaction.id,
              'Data missing from backeknd, contact admin.',
            );
          }

          store.dispatch(manageSyncData('transaction', 'failed'));
          return transaction;
        }

        const isExisting = await findTransactionByServerId(responseId);
        if (isExisting.length > 0) {
          Sentry.captureMessage(
            `duplicates in buy transaction syncing - server_id: ${responseId}`,
          );

          store.dispatch(manageSyncData('transaction', 'success'));
          transactionStatusArr.push(product.id);
          return transaction;
        }

        const updates = {
          server_id: responseId,
          ref_number: responseNumber,
          date: responseDate,
          created_on: parseInt(responseCreatedOn),
          unit: 1,
          error: '',
        };

        const batch = responseDestinationBatch;

        await findAndupdateTransaction(transaction.id, updates);

        const batchUpdate = {
          server_id: batch.id,
          ref_number: batch.number,
        };

        const [batchesAssociated] = await getAllBatchesByTransaction(
          transaction.id,
        );

        await findAndupdateBatch(batchesAssociated.id, batchUpdate);

        store.dispatch(manageSyncData('transaction', 'success'));
        transactionStatusArr.push(product.id);
        return transaction;
      }),
    )
      .then(async () => {
        let transactionStatus =
          (await AsyncStorage.getItem('transactionStatus')) || '{}';
        transactionStatus = JSON.parse(transactionStatus);
        transactionStatus.buy = transactionStatusArr;
        transactionStatus = JSON.stringify(transactionStatus);
        await AsyncStorage.setItem('transactionStatus', transactionStatus);

        await syncSendTransactions();
      })
      .catch((error) => {
        Sentry.captureMessage(`error in buy transaction syncing - ${error}`);
        store.dispatch(SyncProcessFailed());
      });
  }
};

const getSourceBatches = async (batches) => {
  const arrayOfObj = [];
  let valid = true;
  await Promise.all(
    batches.map(async (e) => {
      const batch = await findBatchById(e.batch_id);
      if (batch.length > 0) {
        const obj = {
          batch: batch[0].server_id,
          quantity: e.quantity,
        };
        arrayOfObj.push(obj);
      } else {
        valid = false;
      }
    }),
  );

  if (valid) {
    return arrayOfObj;
  }

  return null;
};

const syncSendTransactions = async () => {
  store.dispatch(initSyncProcess());
  let transactions = await findAllNewTransactions();
  transactions = transactions.filter((tx) => {
    return tx.type === consts.APP_TRANS_TYPE_OUTGOING;
  });

  let loggedInUser = await AsyncStorage.getItem('loggedInUser');
  loggedInUser = JSON.parse(loggedInUser);

  const headers = {
    Bearer: loggedInUser.token,
    'User-ID': loggedInUser.id,
    'Node-ID': loggedInUser.default_node,
    Version: DeviceInfo.getVersion(),
    'Client-Code': api.API_CLIENT_CODE,
  };

  const transactionStatusArr = [];

  await Promise.all(
    transactions.map(async (transaction) => {
      const tx = await findTransactionById(transaction.id);
      if (tx.server_id !== '') {
        store.dispatch(manageSyncData('transaction', 'success'));
        return transaction;
      }

      const batches = await getAllSourceBatchesByTransaction(transaction.id);
      const product = await findProductById(transaction.product_id);
      const premiums = await getIncludedPremiums(transaction.id);
      const productId = product.server_id;
      const sourceBatches = await getSourceBatches(batches);
      if (!sourceBatches) {
        if (consts.DELETE_TRANSACTION_ENABLED) {
          await updateTransactionError(
            transaction.id,
            'Cannot find transaction batch',
          );
        }

        store.dispatch(manageSyncData('transaction', 'failed'));
        return transaction;
      }

      let extraFields = transaction.extra_fields;
      if (extraFields) {
        if (typeof extraFields === 'string') {
          extraFields = JSON.stringify(stringToJson(extraFields));
        } else if (typeof extraFields === 'object') {
          extraFields = JSON.stringify(extraFields);
        }
      }

      const data = {
        node: transaction.node_id,
        unit: 1,
        type: consts.APP_TRANS_TYPE_OUTGOING,
        product: productId,
        quantity: transaction.quantity,
        price: transaction.price,
        currency: loggedInUser.currency,
        created_on: parseInt(transaction.created_on),
        verification_method: transaction.verification_method,
        verification_longitude: transaction.verification_longitude,
        verification_latitude: transaction.verification_latitude,
        batches: sourceBatches,
        is_bal_loss: transaction.transaction_type === 1,
        premiums,
        extra_fields: extraFields,
      };

      const config = {
        method: 'POST',
        url: `${api.API_URL}${api.API_VERSION}/projects/transaction-sent/`,
        headers,
        data,
      };

      const response = await CommonFetchRequest(config);

      if (!response?.success) {
        if (response.error) {
          Sentry.captureMessage(
            `send transaction syncing error: ${response.error}`,
          );

          if (consts.DELETE_TRANSACTION_ENABLED) {
            await updateTransactionError(transaction.id, response.error);
          }
        }

        store.dispatch(manageSyncData('transaction', 'failed'));
        return transaction;
      }

      const responseId = response?.data?.id ?? null;
      const responseNumber = response?.data?.number ?? null;
      const responseDate = response?.data?.date ?? null;
      const responseCreatedOn = response?.data?.created_on ?? null;

      if (
        !responseId ||
        !responseNumber ||
        !responseDate ||
        !responseCreatedOn
      ) {
        Sentry.captureMessage(
          `error in send transaction syncing - response: ${response}`,
        );
        if (consts.DELETE_TRANSACTION_ENABLED) {
          await updateTransactionError(
            transaction.id,
            'Data missing from backeknd, contact admin.',
          );
        }

        store.dispatch(manageSyncData('transaction', 'failed'));
        return transaction;
      }

      const isExisting = await findTransactionByServerId(responseId);
      if (isExisting.length > 0) {
        Sentry.captureMessage(
          `duplicates in sent transaction syncing - server_id: ${responseId}`,
        );

        store.dispatch(manageSyncData('transaction', 'success'));
        transactionStatusArr.push(product.id);
        return transaction;
      }

      const transactionDetails = response.data;
      if (
        transactionDetails?.loss_transaction &&
        transactionDetails.loss_transaction != null
      ) {
        const lossTransaction = response.data.loss_transaction;
        lossTransaction.server_id = lossTransaction.id;
        lossTransaction.node_id = '';
        lossTransaction.currency = loggedInUser.currency;
        lossTransaction.product_id = product.id;
        lossTransaction.product_name = product.name;
        lossTransaction.ref_number = lossTransaction.number;
        lossTransaction.created_on = lossTransaction.logged_time;
        lossTransaction.transaction_type = 3;
        lossTransaction.type = consts.APP_TRANS_TYPE_LOSS;
        lossTransaction.quantity = lossTransaction.source_quantity;
        await saveTransaction(lossTransaction);
      }

      const updates = {
        server_id: responseId,
        ref_number: responseNumber,
        date: responseDate,
        created_on: parseInt(responseCreatedOn),
        unit: 1,
        error: '',
      };

      await findAndupdateTransaction(transaction.id, updates);
      await clearAllSourceBatchesByTransactionId(transaction.id);

      store.dispatch(manageSyncData('transaction', 'success'));
      transactionStatusArr.push(product.id);
      return transaction;
    }),
  )
    .then(async () => {
      let transactionStatus =
        (await AsyncStorage.getItem('transactionStatus')) || '{}';
      transactionStatus = JSON.parse(transactionStatus);
      transactionStatus.send = transactionStatusArr;
      transactionStatus = JSON.stringify(transactionStatus);
      await AsyncStorage.setItem('transactionStatus', transactionStatus);

      let pendingTransactions = await findAllNewTransactions();
      pendingTransactions = pendingTransactions.filter((tx) => {
        return tx.type === consts.APP_TRANS_TYPE_OUTGOING;
      });

      if (pendingTransactions.length > 0) {
        store.dispatch(SyncProcessFailed());
        return;
      }

      await updateAllFarmerDetails();
      syncTransactionsInvoices();
    })
    .catch((error) => {
      Sentry.captureMessage(`error in send transaction syncing - ${error}`);
      store.dispatch(SyncProcessFailed());
    });
};

const getIncludedPremiums = async (id) => {
  const premiums = await findAllPremiumsByTransaction(id);
  return Promise.all(
    premiums.map(async (premium) => {
      const premiumObj = await findPremiumById(premium.premium_id);
      return {
        premium: premiumObj.server_id,
        amount: premium.amount,
      };
    }),
  );
};

export const syncTransactionsInvoices = async () => {
  let loggedInUser = await AsyncStorage.getItem('loggedInUser');
  loggedInUser = JSON.parse(loggedInUser);

  const invoices = await findAllUnUploadedTransactionsInvoices();

  const headers = {
    Bearer: loggedInUser.token,
    'User-ID': loggedInUser.id,
    'Node-ID': loggedInUser.default_node,
    Version: DeviceInfo.getVersion(),
    'Client-Code': api.API_CLIENT_CODE,
    'Content-Type': 'multipart/form-data',
    Accept: 'application/json',
  };

  Promise.all(
    invoices.map(async (invoice) => {
      const filename = invoice.invoice_file.replace(/^.*[\\/]/, '');
      const image = {
        name: filename,
        type: 'image/jpg',
        uri: invoice.invoice_file,
      };

      const data = new FormData();
      data.append('invoice', image);

      const config = {
        method: 'PATCH',
        url: `${api.API_URL}${api.API_VERSION}/projects/transaction/${invoice.server_id}/invoice/`,
        headers,
        data,
      };

      const response = await CommonFetchRequest(config);

      if (!response?.success) {
        store.dispatch(SyncProcessFailed());
        return;
      }

      const invoiceUrl = response.data.invoice;
      findAndupdateTransactionInvoice(invoice.id, invoiceUrl);
    }),
  ).then(async () => {
    await getAllBatches(null);
  });
};

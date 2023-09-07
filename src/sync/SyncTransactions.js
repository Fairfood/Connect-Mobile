/* eslint-disable camelcase */
import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import {
  findAllNewTransactions,
  findAllUnUploadedTransactionsInvoices,
  findAndUpdateTransaction,
  findAndUpdateTransactionInvoice,
  findTransaction,
  fetchTransactionByServerId,
  createTransaction,
  updateTransactionError,
} from '../db/services/TransactionsHelper';
import { CommonFetchRequest } from '../api/middleware';
import { findProduct } from '../db/services/ProductsHelper';
import {
  findAndUpdateBatch,
  findBatch,
  fetchBatchesByTransaction,
} from '../db/services/BatchHelper';
import {
  findAllNewPayments,
  fetchPremiumsByTransactionAndCategory,
  findAllUnUploadedPaymentInvoices,
  findAndUpdatePaymentInvoice,
  findUnSyncedBasePricePremium,
  findUnSyncedTransactionPremium,
  updateTransactionPremiumServerId,
  updateTransactionPremiumDestination,
} from '../db/services/TransactionPremiumHelper';
import {
  findPremium,
  searchPremiumByServerId,
} from '../db/services/PremiumsHelper';
import { store } from '../redux/store';
import { SyncProcessFailed, manageSyncData } from '../redux/LoginStore';
import { syncUpdatedFarmers } from './SyncFarmers';
import {
  deleteSourceBatchesByTransactionId,
  fetchSourceBatchesByTransaction,
} from '../db/services/SourceBatchHelper';
import { stringToJson } from '../services/commonFunctions';
import { findCard, findCardByServerId } from '../db/services/CardHelper';
import { findFarmer } from '../db/services/FarmerHelper';
import api from '../api/config';
import * as consts from '../services/constants';
import { updateBuyTnxStatus, updateSendTnxStatus } from '../redux/CommonStore';

export const syncTransactions = async () => {
  const transactions = await findAllNewTransactions();
  const newTransactions = transactions.filtered(
    'type == $0',
    consts.APP_TRANS_TYPE_INCOMING,
  );

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

  if (newTransactions.length === 0) {
    await syncSendTransactions(headers);
  } else {
    await Promise.all(
      newTransactions.map(async (transaction) => {
        const tx = await findTransaction(transaction.id);
        if (tx.server_id !== '') {
          store.dispatch(manageSyncData('transaction', 'success'));
          return transaction;
        }

        const farmer = await findFarmer(transaction.node_id);
        const product = await findProduct(transaction.product_id);
        const premiums = await getIncludedPremiums(transaction.id);

        const productId = product.server_id;
        let cardId = null;

        if (transaction.card_id !== '') {
          const card = await findCard(transaction.card_id);
          cardId = card.server_id;
        }

        // checking empty node server_id
        const nodeId = farmer.server_id || null;
        if (!nodeId) {
          if (consts.DELETE_TRANSACTION_ENABLED) {
            await updateTransactionError(
              transaction.id,
              'Could not find farmer id in the transaction.',
            );
          }

          store.dispatch(manageSyncData('transaction', 'failed'));
          return transaction;
        }

        let extraFields = transaction.extra_fields || '';
        if (extraFields) {
          if (typeof extraFields === 'string') {
            extraFields = JSON.stringify(stringToJson(extraFields));
          } else if (typeof extraFields === 'object') {
            extraFields = JSON.stringify(extraFields);
          }
        }

        const data = {
          node: nodeId,
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

        if (cardId) {
          data.card = cardId;
        }

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
              'Data missing from backend, contact admin.',
            );
          }

          store.dispatch(manageSyncData('transaction', 'failed'));
          return transaction;
        }

        const isExisting = await fetchTransactionByServerId(responseId);
        if (isExisting.length > 0) {
          Sentry.captureMessage(
            `duplicates in buy transaction syncing - server_id: ${responseId}`,
          );

          store.dispatch(manageSyncData('transaction', 'success'));
          // transactionStatusArr.push(product.id);
          store.dispatch(updateBuyTnxStatus(product.id));
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

        await findAndUpdateTransaction(transaction.id, updates);

        const batchUpdate = {
          server_id: batch.id,
          ref_number: batch.number,
        };

        const [batchesAssociated] = await fetchBatchesByTransaction(
          transaction.id,
        );

        /// updating batch
        await findAndUpdateBatch(batchesAssociated.id, batchUpdate);

        /// updating transaction_premiums
        const responsePremiums = response.data.premiums;
        responsePremiums.map(async (p) => {
          const existingPremium = await searchPremiumByServerId(p.premium.id);
          const existingTransactionPremium =
            await findUnSyncedTransactionPremium(
              transaction.id,
              existingPremium[0].id,
            );
          if (existingTransactionPremium.length > 0) {
            const { destination, node_id, id } = existingTransactionPremium[0];

            await updateTransactionPremiumServerId(id, p.id);

            // updating destination if the transaction was direct_buy
            if (destination === node_id) {
              const destinationFarmer = await findFarmer(destination);
              if (destinationFarmer) {
                const farmerServerId = destinationFarmer.server_id;
                await updateTransactionPremiumDestination(id, farmerServerId);
              }
            }
          }
        });

        /// updating base_price_premium
        const existingBasePricePremium = await findUnSyncedBasePricePremium(
          transaction.id,
        );
        if (existingBasePricePremium.length > 0) {
          const { destination, node_id, id } = existingBasePricePremium[0];

          await updateTransactionPremiumServerId(
            id,
            response.data.base_payment_id,
          );

          // updating destination if the transaction was direct_buy
          if (destination === node_id) {
            const destinationFarmer = await findFarmer(destination);
            if (destinationFarmer) {
              const farmerServerId = destinationFarmer.server_id;
              await updateTransactionPremiumDestination(id, farmerServerId);
            }
          }
        }

        store.dispatch(manageSyncData('transaction', 'success'));
        // transactionStatusArr.push(product.id);
        store.dispatch(updateBuyTnxStatus(product.id));
        return transaction;
      }),
    )
      .then(async () => {
        syncSendTransactions(headers);
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
      const batch = await findBatch(e.batch_id);
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

const syncSendTransactions = async (headers) => {
  let loggedInUser = await AsyncStorage.getItem('loggedInUser');
  loggedInUser = JSON.parse(loggedInUser);

  const transactions = await findAllNewTransactions();
  const newTransactions = transactions.filtered(
    'type == $0',
    consts.APP_TRANS_TYPE_OUTGOING,
  );

  await Promise.all(
    newTransactions.map(async (transaction) => {
      const tx = await findTransaction(transaction.id);
      if (tx.server_id !== '') {
        store.dispatch(manageSyncData('transaction', 'success'));
        return transaction;
      }

      const batches = await fetchSourceBatchesByTransaction(transaction.id);
      const product = await findProduct(transaction.product_id);
      const premiums = await getIncludedPremiums(transaction.id);
      const productId = product.server_id;
      const sourceBatches = await getSourceBatches(batches);

      // checking empty source batches
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

      // checking empty node server_id
      const nodeId = transaction.node_id || null;
      if (!nodeId) {
        if (consts.DELETE_TRANSACTION_ENABLED) {
          await updateTransactionError(
            transaction.id,
            'Could not find farmer id in the transaction.',
          );
        }

        store.dispatch(manageSyncData('transaction', 'failed'));
        return transaction;
      }

      let extraFields = transaction.extra_fields || '';
      if (extraFields) {
        if (typeof extraFields === 'string') {
          extraFields = JSON.stringify(stringToJson(extraFields));
        } else if (typeof extraFields === 'object') {
          extraFields = JSON.stringify(extraFields);
        }
      }

      const data = {
        node: nodeId,
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

      const cardId = transaction?.card_id ?? null;
      if (cardId) {
        data.card = cardId;
      }

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
            'Data missing from backend, contact admin.',
          );
        }

        store.dispatch(manageSyncData('transaction', 'failed'));
        return transaction;
      }

      const isExisting = await fetchTransactionByServerId(responseId);
      if (isExisting.length > 0) {
        Sentry.captureMessage(
          `duplicates in sent transaction syncing - server_id: ${responseId}`,
        );

        store.dispatch(manageSyncData('transaction', 'success'));
        store.dispatch(updateSendTnxStatus(product.id));

        return transaction;
      }

      const transactionDetails = response.data;
      if (
        transactionDetails?.loss_transaction &&
        transactionDetails.loss_transaction != null
      ) {
        const lossTransaction = transactionDetails.loss_transaction;
        lossTransaction.server_id = lossTransaction.id;
        lossTransaction.node_id = '';
        lossTransaction.currency = loggedInUser.currency;
        lossTransaction.product_id = product.id;
        lossTransaction.product_name = product.name;
        lossTransaction.ref_number = lossTransaction.number;
        lossTransaction.created_on = parseFloat(lossTransaction.logged_time);
        lossTransaction.transaction_type = 3;
        lossTransaction.type = consts.APP_TRANS_TYPE_LOSS;
        lossTransaction.quantity = lossTransaction.source_quantity;
        await createTransaction(lossTransaction);
      }

      const updates = {
        server_id: responseId,
        ref_number: responseNumber,
        date: responseDate,
        created_on: parseInt(responseCreatedOn),
        unit: 1,
        error: '',
      };

      await findAndUpdateTransaction(transaction.id, updates);
      await deleteSourceBatchesByTransactionId(transaction.id);

      // updating transaction_premiums
      const responsePremiums = transactionDetails.premiums;
      responsePremiums.map(async (p) => {
        const existingPremium = await searchPremiumByServerId(p.premium.id);
        const existingTransactionPremium = await findUnSyncedTransactionPremium(
          transaction.id,
          existingPremium[0].id,
        );
        if (existingTransactionPremium.length > 0) {
          const { id } = existingTransactionPremium[0];

          await updateTransactionPremiumServerId(id, p.id);
        }
      });

      /// updating base_price_premium
      const existingBasePricePremium = await findUnSyncedBasePricePremium(
        transaction.id,
      );

      if (existingBasePricePremium.length > 0) {
        const { id } = existingBasePricePremium[0];

        await updateTransactionPremiumServerId(
          id,
          transactionDetails.base_payment_id,
        );
      }

      store.dispatch(manageSyncData('transaction', 'success'));
      store.dispatch(updateSendTnxStatus(product.id));
      return transaction;
    }),
  )
    .then(async () => {
      const AllPendingTransactions = await findAllNewTransactions();
      const pendingTransactions = AllPendingTransactions.filtered(
        'type == $0',
        consts.APP_TRANS_TYPE_OUTGOING,
      );

      if (pendingTransactions.length > 0) {
        store.dispatch(SyncProcessFailed());
        return;
      }

      syncTransactionsInvoices(headers);
    })
    .catch((error) => {
      Sentry.captureMessage(`error in send transaction syncing - ${error}`);
      store.dispatch(SyncProcessFailed());
    });
};

const getIncludedPremiums = async (id) => {
  const premiums = await fetchPremiumsByTransactionAndCategory(
    id,
    consts.TYPE_TRANSACTION_PREMIUM,
  );

  return Promise.all(
    premiums.map(async (premium) => {
      const premiumObj = await findPremium(premium.premium_id);
      const obj = {
        premium: premiumObj.server_id,
        amount: premium.amount,
      };

      let { options } = premium;
      if (options !== '') {
        options = stringToJson(options);
        if (options.id) {
          obj.selected_option = options.id;
        }
      }
      return obj;
    }),
  );
};

export const syncTransactionsInvoices = async (headers) => {
  const invoices = await findAllUnUploadedTransactionsInvoices();

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

      headers['Content-Type'] = 'multipart/form-data';

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
      await findAndUpdateTransactionInvoice(invoice.id, invoiceUrl);
    }),
  )
    .then(async () => {
      syncPayments();
    })
    .catch((error) => {
      Sentry.captureMessage(`error transaction invoice syncing - ${error}`);
      store.dispatch(SyncProcessFailed());
    });
};

export const syncPayments = async () => {
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

  const payments = await findAllNewPayments();

  await Promise.all(
    payments.map(async (payment) => {
      let cardId = null;
      const premium = await findPremium(payment.premium_id);

      if (payment?.card_id) {
        const card = await findCardByServerId(payment.card_id);
        cardId = card?.[0]?.server_id ?? '';
      }

      const data = {
        premium: premium.server_id,
        amount: payment.amount,
        currency: payment.currency,
        verification_latitude: payment.verification_latitude,
        verification_longitude: payment.verification_longitude,
        source: payment.source,
        destination: payment.destination,
        direction: payment.type,
        extra_fields: payment.extra_fields,
      };

      if (cardId) {
        data.card = cardId;
      }

      const config = {
        method: 'POST',
        url: `${api.API_URL}${api.API_VERSION}/projects/projects/payments/`,
        headers,
        data,
      };

      const response = await CommonFetchRequest(config);
      if (!response?.success) {
        if (response.error) {
          Sentry.captureMessage(`payment syncing error: ${response.error}`);
        }
        return payment;
      }

      await updateTransactionPremiumServerId(payment.id, response.data.id);
      return payment;
    }),
  )
    .then(async () => {
      syncPaymentInvoices(headers);
    })
    .catch((error) => {
      Sentry.captureMessage(`error in payment syncing - ${error}`);
      store.dispatch(SyncProcessFailed());
    });
};

export const syncPaymentInvoices = async (headers) => {
  const invoices = await findAllUnUploadedPaymentInvoices();

  await Promise.all(
    invoices.map(async (invoice) => {
      const invoiceFile = invoice.receipt;

      const filename = invoiceFile.replace(/^.*[\\/]/, '');
      const image = {
        name: filename,
        type: 'image/jpg',
        uri: invoiceFile,
      };

      const formData = new FormData();
      formData.append('invoice', image);

      headers['Content-Type'] = 'multipart/form-data';

      const config = {
        method: 'PATCH',
        url: `${api.API_URL}${api.API_VERSION}/projects/projects/payments/${invoice.server_id}/invoice/`,
        headers,
        data: formData,
      };

      const response = await CommonFetchRequest(config);

      if (!response?.success) {
        if (response.error) {
          Sentry.captureMessage(`payment invoice error: ${response.error}`);
        }
        return invoice;
      }

      const invoiceUrl = response.data.invoice;
      findAndUpdatePaymentInvoice(invoice.id, invoiceUrl);
    }),
  )
    .then(async () => {
      syncUpdatedFarmers();
    })
    .catch((error) => {
      Sentry.captureMessage(`error in payment invoice syncing - ${error}`);
      store.dispatch(SyncProcessFailed());
    });
};

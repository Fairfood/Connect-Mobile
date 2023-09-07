/* eslint-disable no-shadow */
import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SyncProcessComplete, SyncProcessFailed } from '../redux/LoginStore';
import {
  updateTnxSyncTotal,
  addTnxSyncCount,
  tnxSyncCompleted,
  updateSyncStage,
  updateTnxSyncPrevTotal,
  updateTnxSyncNextUrl,
  updateTnxSyncStage,
  updateTnxSyncCount,
  updateTnxUpdatedBefore,
} from '../redux/SyncStore';
import { store } from '../redux/store';
import { CommonFetchRequest } from '../api/middleware';
import { fetchFarmerByServerId } from '../db/services/FarmerHelper';
import { fetchProductByServerId } from '../db/services/ProductsHelper';
import {
  fetchTransactionByServerId,
  createTransaction,
} from '../db/services/TransactionsHelper';
import { updateBatchByServerId, createBatch } from '../db/services/BatchHelper';
import {
  searchPremiumByServerId,
  createPremium,
} from '../db/services/PremiumsHelper';
import {
  fetchTransactionPremiumByServerId,
  createTransactionPremium,
} from '../db/services/TransactionPremiumHelper';
import { findCardByServerId, createCard } from '../db/services/CardHelper';
import api from '../api/config';
import * as consts from '../services/constants';
import { jsonToString } from '../services/commonFunctions';

const transactionLimit = 50;

const getTnxUpdateAfterDate = async () => {
  const limitedDays = consts.TRANSACTION_LIMIT_DAYS;
  const today = new Date();
  let priorDate = new Date(new Date().setDate(today.getDate() - limitedDays));
  priorDate = parseInt(priorDate / 1000);
  return priorDate;
};

export const startTransactionSync = async (headers) => {
  const { syncStage, tnxSyncNextUrl } = store.getState().sync;
  let loggedInUser = await AsyncStorage.getItem('loggedInUser');
  loggedInUser = JSON.parse(loggedInUser);

  let params = '';
  params += `?limit=${transactionLimit}&offset=0&project_id=${loggedInUser.project_id}`;
  const defaultUrl = `${api.API_URL}${api.API_VERSION}/projects/transaction/list/`;

  // checking tnxSync already completed
  if (syncStage === 3) {
    const lastUpdatedTransactions = await AsyncStorage.getItem(
      'last_updated_transactions',
    );

    if (lastUpdatedTransactions) {
      params += `&updated_after=${lastUpdatedTransactions}`;
    }

    const fetchUrl = `${defaultUrl}${params}`;
    getTransactionsList(headers, fetchUrl);
  } else {
    const { tnxSyncStage, tnxUpdatedBefore } = store.getState().sync;
    const { userProjectDetails } = store.getState().login;

    if (!userProjectDetails?.sell_enabled || tnxSyncStage === 1) {
      const updatedAfter = await getTnxUpdateAfterDate();
      params += `&updated_after=${updatedAfter}`;
      store.dispatch(updateTnxUpdatedBefore(updatedAfter));

      const fetchUrl = tnxSyncNextUrl ?? `${defaultUrl}${params}`;
      getTransactionsList(headers, fetchUrl);
    } else {
      params += `&updated_before=${tnxUpdatedBefore}&only_quantity_available=true`;
      const fetchUrl = tnxSyncNextUrl ?? `${defaultUrl}${params}`;
      getBalanceTransactionsList(headers, fetchUrl);
    }
  }
};

const getTransactionsList = async (headers, url) => {
  let fetchUrl = '';

  if (url) {
    fetchUrl = url;
  } else {
    let loggedInUser = await AsyncStorage.getItem('loggedInUser');
    loggedInUser = JSON.parse(loggedInUser);

    const lastUpdatedTransactions = await AsyncStorage.getItem(
      'last_updated_transactions',
    );

    let params = '';
    params += `?limit=${transactionLimit}&offset=0&project_id=${loggedInUser.project_id}`;
    if (lastUpdatedTransactions) {
      params += `&updated_after=${lastUpdatedTransactions}`;
    }

    const defaultUrl = `${api.API_URL}${api.API_VERSION}/projects/transaction/list/${params}`;
    fetchUrl = defaultUrl;
  }

  const config = {
    url: fetchUrl,
    headers,
  };

  const response = await CommonFetchRequest(config);

  if (response.success) {
    saveAllTransactions(headers, response);
  } else {
    store.dispatch(SyncProcessFailed());
  }
};

const getBalanceTransactionsList = async (headers, url) => {
  let fetchUrl = '';

  if (url) {
    fetchUrl = url;
  } else {
    let loggedInUser = await AsyncStorage.getItem('loggedInUser');
    loggedInUser = JSON.parse(loggedInUser);

    const { tnxUpdatedBefore } = store.getState().sync;

    let params = '';
    params += `?limit=${transactionLimit}&offset=0&project_id=${loggedInUser.project_id}`;
    if (tnxUpdatedBefore) {
      params += `&updated_before=${tnxUpdatedBefore}&only_quantity_available=true`;
    }

    const defaultUrl = `${api.API_URL}${api.API_VERSION}/projects/transaction/list/${params}`;
    fetchUrl = defaultUrl;
  }

  const config = {
    url: fetchUrl,
    headers,
  };

  const response = await CommonFetchRequest(config);

  if (response.success) {
    saveAllTransactions(headers, response);
  } else {
    store.dispatch(SyncProcessFailed());
  }
};

const getTotalPrice = async (basePrice, premiumsTotal) => {
  const allPremiums = premiumsTotal.map((p) => ({
    ...p.premium,
    amount: p.amount,
  }));

  const total = allPremiums.reduce(
    (acc, premium) => acc + parseFloat(premium.amount),
    parseFloat(basePrice),
  );

  return Math.round(total);
};

const getNodeId = async (id) => {
  const node = await fetchFarmerByServerId(id);
  if (node.length > 0) {
    return node[0].id;
  }

  return '';
};

const saveAllTransactions = async (headers, response) => {
  const { next, results, count } = response.data;
  const nextUrl = next ?? null;
  const transactions = results ?? [];

  const tnxCount = count ?? 0;
  const { syncStage, tnxSyncTotal, tnxSyncPrevTotal } = store.getState().sync;

  if (syncStage === 2) {
    if (tnxSyncTotal === 0) {
      const currentTotal = tnxSyncPrevTotal !== 0 ? tnxSyncPrevTotal : tnxCount;
      await store.dispatch(updateTnxSyncTotal(currentTotal));
    }
    await store.dispatch(updateTnxSyncNextUrl(nextUrl));
  }

  Promise.all(
    transactions.map(async (transaction) => {
      let nodeId = '';
      if (transaction.category === consts.APP_TRANS_TYPE_INCOMING) {
        nodeId = await getNodeId(transaction.source.id);
      } else if (transaction.category === consts.APP_TRANS_TYPE_OUTGOING) {
        nodeId = await getNodeId(transaction.destination.id);
      }

      const isExisting = await fetchTransactionByServerId(transaction.id);

      if (isExisting.length > 0) {
        // no changes
        if (syncStage === 2) {
          await store.dispatch(addTnxSyncCount());
        }
        return transaction;
      }

      let productId = '';
      const sourceBatches = transaction?.source_batches;
      if (sourceBatches && sourceBatches.length > 0) {
        const productID = sourceBatches[0]?.product_id || '';
        if (productID) {
          const fetchedProduct = await fetchProductByServerId(productID);
          if (fetchedProduct && fetchedProduct.length > 0) {
            productId = fetchedProduct[0].id;
          }
        }
      }

      let total = 0;
      const allPremiums = transaction.premiums;

      if (allPremiums.length > 0) {
        total = await getTotalPrice(transaction.price, transaction.premiums);
      } else {
        total = transaction.price;
      }

      let cardId = '';
      if (transaction.card_details) {
        // if transaction type incoming then saving farmer card
        // buyer card currently not saving in db, so just saving card server_id instead
        // skipping for loss transaction
        if (transaction.category === consts.APP_TRANS_TYPE_INCOMING) {
          const existingCard = await findCardByServerId(
            transaction.card_details.id,
          );
          if (existingCard.length > 0) {
            cardId = existingCard[0].id;
          } else {
            const cardDetails = {
              node_id: '',
              server_id: transaction.card_details.id,
              card_id: transaction.card_details.card_id,
              fair_id: transaction?.card_details?.fairid ?? '',
              created_at: Math.floor(Date.now() / 1000),
              updated_at: Math.floor(Date.now() / 1000),
            };

            const savedCard = await createCard(cardDetails);
            cardId = savedCard?.id ?? '';
          }
        } else if (transaction.category === consts.APP_TRANS_TYPE_OUTGOING) {
          cardId = transaction.card_details.id;
        }
      }

      let extraFields = transaction.extra_fields || '';
      if (extraFields && typeof extraFields === 'object') {
        extraFields = jsonToString(extraFields);
      }

      const transactionItem = {
        node_id: nodeId,
        server_id: transaction.id,
        product_id: productId,
        product_price: transaction.product_price,
        price: transaction.price,
        currency: transaction.currency,
        type: transaction.category,
        quantity:
          transaction.category === consts.APP_TRANS_TYPE_LOSS
            ? transaction.source_quantity
            : transaction.quantity,
        ref_number: transaction.number,
        date: transaction.date,
        invoice_file: transaction.invoice,
        created_on: parseInt(transaction.created_on),
        is_verified: false,
        is_deleted: false,
        card_id: cardId,
        total,
        quality_correction: transaction.quality_correction,
        verification_method: transaction.verification_method,
        verification_longitude: transaction.verification_longitude,
        verification_latitude: transaction.verification_latitude,
        transaction_type: transaction.category,
        extra_fields: extraFields,
      };

      const transactionId = await createTransaction(transactionItem);

      if (syncStage === 2) {
        await store.dispatch(addTnxSyncCount());
      }
      if (transaction.category === consts.APP_TRANS_TYPE_INCOMING) {
        const batch = {
          server_id: transaction.destination_batches[0].id,
          product_id: productId,
          transaction_id: transactionId,
          initial_quantity: transaction.destination_batches[0].quantity,
          current_quantity: transaction.destination_batches[0].current_quantity,
          ref_number: transaction.destination_batches[0].number,
          unit: 1,
        };
        await createBatch(batch);
      }

      /// saving transaction premium
      if (transaction.category !== consts.APP_TRANS_TYPE_LOSS) {
        const { premiums } = transaction;
        premiums.map(async (p) => {
          const { premium, id, amount } = p;
          const isTransactionPremiumExist =
            await fetchTransactionPremiumByServerId(id);

          if (isTransactionPremiumExist.length === 0) {
            const existingPremium = await searchPremiumByServerId(premium.id);
            let premiumId = existingPremium?.[0]?.id ?? '';

            const options = premium.options || [];
            premium.options = jsonToString(options);

            if (premiumId === '') {
              premium.is_active = false;
              premiumId = await createPremium(premium);
            }

            const transactionPremium = {
              premium_id: premiumId,
              transaction_id: transactionId,
              amount,
              server_id: id,
              category: premium.category,
              type:
                transaction.category === consts.APP_TRANS_TYPE_INCOMING
                  ? consts.PAYMENT_OUTGOING
                  : consts.PAYMENT_INCOMING,
              verification_method: transaction.verification_method,
              receipt: transaction?.invoice ?? '',
              card_id: cardId,
              node_id: nodeId,
              date: parseInt(transaction.created_on),
              currency: transaction.currency,
              source: transaction.destination.id,
              destination: transaction.source.id,
              verification_longitude: transaction.verification_longitude,
              verification_latitude: transaction.verification_latitude,
              options: premium.options,
            };

            await createTransactionPremium(transactionPremium);
          }
        });
      }

      /// saving base price premium
      if (transaction.category !== consts.APP_TRANS_TYPE_LOSS) {
        const isBasePricePremiumExist = await fetchTransactionPremiumByServerId(
          transaction.id,
        );
        if (isBasePricePremiumExist.length === 0) {
          const basePricePremium = {
            premium_id: '',
            transaction_id: transactionId,
            amount: transaction.price,
            server_id: transaction.base_payment_id,
            category: consts.TYPE_BASE_PRICE,
            type:
              transaction.category === consts.APP_TRANS_TYPE_INCOMING
                ? consts.PAYMENT_OUTGOING
                : consts.PAYMENT_INCOMING,
            verification_method: transaction.verification_method,
            receipt: transaction?.invoice ?? '',
            card_id: cardId,
            node_id: nodeId,
            date: parseInt(transaction.created_on),
            currency: transaction.currency,
            source: transaction.destination.id,
            destination: transaction.source.id,
            verification_longitude: transaction.verification_longitude,
            verification_latitude: transaction.verification_latitude,
          };

          await createTransactionPremium(basePricePremium);
        }
      }
    }),
  )
    .then(async () => {
      concludeTransactionSync(headers, nextUrl);
    })
    .catch((error) => {
      Sentry.captureMessage(`error in incoming transaction syncing - ${error}`);
      store.dispatch(SyncProcessFailed());
    });
};

const concludeTransactionSync = async (headers, nextUrl) => {
  const { syncStage, tnxSyncTotal, tnxSyncCount, tnxSyncStage } =
    store.getState().sync;
  const { userProjectDetails } = store.getState().login;
  const alreadySyncedCount = parseInt(tnxSyncTotal) - parseInt(tnxSyncCount);
  store.dispatch(updateTnxSyncPrevTotal(alreadySyncedCount));

  if (nextUrl) {
    if (
      syncStage !== 3 &&
      tnxSyncStage === 2 &&
      userProjectDetails?.sell_enabled
    ) {
      getBalanceTransactionsList(headers, nextUrl);
    } else {
      getTransactionsList(headers, nextUrl);
    }
  } else if (
    syncStage !== 3 &&
    tnxSyncStage === 1 &&
    userProjectDetails?.sell_enabled
  ) {
    store.dispatch(updateTnxSyncPrevTotal(0));
    store.dispatch(updateTnxSyncTotal(0));
    store.dispatch(updateTnxSyncCount(0));
    store.dispatch(updateTnxSyncStage(2));

    getBalanceTransactionsList(headers);
  } else {
    if (tnxSyncStage === 2) {
      store.dispatch(updateTnxSyncStage(3));
    }

    let lastUpdatedTransactions = new Date();
    lastUpdatedTransactions = parseInt(
      lastUpdatedTransactions.getTime() / 1000,
    );
    await AsyncStorage.setItem(
      'last_updated_transactions',
      lastUpdatedTransactions.toString(),
    );

    getAllBatches(headers, null);
  }
};

export const getAllBatches = async (headers, url) => {
  const lastUpdatedBatches = await AsyncStorage.getItem('last_updated_batches');
  const { tnxUpdatedBefore } = store.getState().sync;

  let params = '?limit=50&offset=0';

  if (lastUpdatedBatches) {
    params += `&updated_after=${lastUpdatedBatches}`;
  } else if (tnxUpdatedBefore) {
    params += `&updated_after=${tnxUpdatedBefore}`;
  }

  const defaultUrl = `${api.API_URL}${api.API_VERSION}/projects/batch/details/${params}`;

  const config = {
    url: url ?? defaultUrl,
    headers,
  };

  const response = await CommonFetchRequest(config);

  if (response.success) {
    saveAllBatches(headers, response, 'all_batches');
  } else {
    store.dispatch(SyncProcessFailed());
  }
};

export const getAllBalanceBatches = async (headers, url) => {
  const lastUpdatedBatches = await AsyncStorage.getItem('last_updated_batches');
  const { tnxUpdatedBefore } = store.getState().sync;

  let params = '?limit=50&offset=0';

  if (lastUpdatedBatches) {
    params += `&updated_after=${lastUpdatedBatches}`;
  } else if (tnxUpdatedBefore) {
    params += `&updated_before=${tnxUpdatedBefore}&only_quantity_available=true`;
  }

  const defaultUrl = `${api.API_URL}${api.API_VERSION}/projects/batch/details/${params}`;

  const config = {
    url: url ?? defaultUrl,
    headers,
  };

  const response = await CommonFetchRequest(config);

  if (response.success) {
    saveAllBatches(headers, response, 'balance_batches');
  } else {
    store.dispatch(SyncProcessFailed());
  }
};

const saveAllBatches = async (headers, response, type) => {
  const { next, results } = response.data;
  const nextUrl = next ?? null;
  const batches = results ?? [];

  Promise.all(
    batches.map(async (batch) => {
      await updateBatchByServerId(batch.id, batch.current_quantity);
      return batch;
    }),
  ).then(async () => {
    if (nextUrl) {
      if (type === 'all_batches') {
        getAllBatches(headers, nextUrl);
      } else {
        getAllBalanceBatches(headers, nextUrl);
      }
    } else if (type === 'all_batches') {
      getAllBalanceBatches(headers, nextUrl);
    } else {
      let lastUpdatedBatches = new Date();
      lastUpdatedBatches = parseInt(lastUpdatedBatches.getTime() / 1000);
      await AsyncStorage.setItem(
        'last_updated_batches',
        lastUpdatedBatches.toString(),
      );

      completeSyncing();
    }
  });
};

export const getAllPayments = async (headers, url) => {
  const lastUpdatedPayments = await AsyncStorage.getItem(
    'last_updated_payments',
  );
  const { tnxUpdatedBefore } = store.getState().sync;

  let params = '?limit=50&offset=0';

  if (lastUpdatedPayments) {
    params += `&updated_after=${lastUpdatedPayments}`;
  } else if (tnxUpdatedBefore) {
    params += `&updated_after=${tnxUpdatedBefore}`;
  }

  const defaultUrl = `${api.API_URL}${api.API_VERSION}/projects/projects/payments/${params}`;

  const config = {
    url: url ?? defaultUrl,
    headers,
  };

  const response = await CommonFetchRequest(config);

  if (response.success) {
    saveAllPayments(headers, response, 'all_payments');
  } else {
    store.dispatch(SyncProcessFailed());
  }
};

export const getAllBalancePayments = async (headers, url) => {
  const lastUpdatedPayments = await AsyncStorage.getItem(
    'last_updated_payments',
  );
  const { tnxUpdatedBefore } = store.getState().sync;

  let params = '?limit=50&offset=0';

  if (lastUpdatedPayments) {
    params += `&updated_after=${lastUpdatedPayments}`;
  } else if (tnxUpdatedBefore) {
    params += `&updated_before=${tnxUpdatedBefore}&only_quantity_available=true`;
  }

  const defaultUrl = `${api.API_URL}${api.API_VERSION}/projects/projects/payments/${params}`;

  const config = {
    url: url ?? defaultUrl,
    headers,
  };

  const response = await CommonFetchRequest(config);

  if (response.success) {
    saveAllPayments(headers, response, 'balance_payments');
  } else {
    store.dispatch(SyncProcessFailed());
  }
};

const saveAllPayments = async (headers, response, type) => {
  const { next, results } = response.data;
  const nextUrl = next ?? null;
  const payments = results ?? [];

  Promise.all(
    payments.map(async (payment) => {
      const isExisting = await fetchTransactionPremiumByServerId(payment.id);
      if (isExisting.length === 0) {
        let premiumId = '';
        let transactionId = '';

        const premium = await searchPremiumByServerId(payment.premium);
        if (premium.length !== 0) {
          premiumId = premium.id;
        }

        const transaction = await fetchTransactionByServerId(
          payment.transaction,
        );
        if (transaction.length !== 0) {
          transactionId = transaction.id;
        }
        const transactionPremium = {
          premium_id: premiumId,
          transaction_id: transactionId,
          amount: payment.amount,
          server_id: payment.server_id,
          category: payment.direction,
          type: payment.payment_type,
          verification_method: payment?.card
            ? consts.VERIFICATION_METHOD_CARD
            : consts.VERIFICATION_METHOD_MANUAL,
          receipt: payment?.invoice ?? '',
          card_id: payment?.card ?? '',
          node_id: payment.source,
          date: parseInt(payment.created_on),
          currency: payment.currency,
          source: payment.source,
          destination: payment.destination,
          verification_longitude: payment.verification_longitude,
          verification_latitude: payment.verification_latitude,
        };
        await createTransactionPremium(transactionPremium);
      }
      return premium;
    }),
  ).then(async () => {
    if (nextUrl) {
      if (type === 'all_payments') {
        getAllPayments(headers, nextUrl);
      } else {
        getAllBalancePayments(headers, nextUrl);
      }
    } else if (type === 'all_payments') {
      getAllBalanceBatches(headers, nextUrl);
    } else {
      let lastUpdatedPayments = new Date();
      lastUpdatedPayments = parseInt(lastUpdatedPayments.getTime() / 1000);
      await AsyncStorage.setItem(
        'last_updated_payments',
        lastUpdatedPayments.toString(),
      );

      completeSyncing();
    }
  });
};

const completeSyncing = async () => {
  const { syncStage } = store.getState().sync;
  if (syncStage === 2) {
    store.dispatch(tnxSyncCompleted());
    store.dispatch(updateSyncStage(3));
  }
  store.dispatch(SyncProcessComplete());
};

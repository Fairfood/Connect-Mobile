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
  closeIndividualSyncingStatus,
} from '../redux/SyncStore';
import { store } from '../redux/store';
import { Middleware } from '../api/middleware';
import { fetchFarmerByServerId } from '../db/services/FarmerHelper';
import { fetchProductByServerId } from '../db/services/ProductsHelper';
import {
  fetchTransactionByServerId,
  createTransaction,
  findTransaction,
  updateTransaction,
} from '../db/services/TransactionsHelper';
import {
  searchPremiumByServerId,
  createPremium,
} from '../db/services/PremiumsHelper';
import {
  fetchTransactionPremiumByServerId,
  createTransactionPremium,
} from '../db/services/TransactionPremiumHelper';
import { createCard, findCardByServerId } from '../db/services/CardHelper';
import { handleErrors } from '../utils/commonFunctions';
import { jsonToString } from '../utils/helperFunctions';
import {
  API_DEFAULT_LIMIT,
  APP_TRANS_TYPE_INCOMING,
  DEFAULT_CURRENCY,
  PAYMENT_INCOMING,
  PAYMENT_OUTGOING,
  PREMIUM_OPTIONS,
  PREMIUM_RANGE,
  TRANSACTION_LIMIT_DAYS,
  TYPE_BASE_PRICE,
  TYPE_GENERIC_PREMIUM,
  VERIFICATION_METHOD_CARD,
  VERIFICATION_METHOD_MANUAL,
} from '../utils/constants';

const getTnxUpdateAfterDate = async () => {
  const today = new Date();
  let priorDate = new Date(
    new Date().setDate(today.getDate() - TRANSACTION_LIMIT_DAYS),
  );
  priorDate = parseInt(priorDate / 1000);
  return priorDate;
};

export const startTransactionSync = async () => {
  try {
    const { syncStage, tnxSyncNextUrl } = store.getState().sync;
    const { apiConfig } = store.getState().connection;

    let params = `?limit=${API_DEFAULT_LIMIT}&offset=0`;
    const defaultUrl = `${apiConfig.API_BASE_URL}transactions/product-transactions/`;

    // checking tnxSync already completed
    if (syncStage === 3) {
      const lastUpdatedTransactions = await AsyncStorage.getItem(
        'last_updated_transactions',
      );

      if (lastUpdatedTransactions) {
        params += `&updated_after=${lastUpdatedTransactions}`;
      }

      const fetchUrl = `${defaultUrl}${params}`;
      getTransactionsList(fetchUrl);
    } else {
      const { tnxSyncStage, tnxUpdatedBefore } = store.getState().sync;
      const { userCompanyDetails } = store.getState().login;

      if (!userCompanyDetails?.sell_enabled || tnxSyncStage === 1) {
        const updatedAfter = await getTnxUpdateAfterDate();
        params += `&updated_after=${updatedAfter}`;
        store.dispatch(updateTnxUpdatedBefore(updatedAfter));

        const fetchUrl = tnxSyncNextUrl ?? `${defaultUrl}${params}`;
        getTransactionsList(fetchUrl);
      } else {
        params += `&updated_before=${tnxUpdatedBefore}&only_quantity_available=true`;
        const fetchUrl = tnxSyncNextUrl ?? `${defaultUrl}${params}`;
        getBalanceTransactionsList(fetchUrl);
      }
    }
  } catch (error) {
    handleErrors(error, {
      ref: 'SyncServerTransactions_startTransactionSync',
    });
  }
};

const getTransactionsList = async (url) => {
  try {
    let params = '';

    if (!url) {
      const lastUpdatedTransactions = await AsyncStorage.getItem(
        'last_updated_transactions',
      );

      params += `?limit=${API_DEFAULT_LIMIT}&offset=0`;
      if (lastUpdatedTransactions) {
        params += `&updated_after=${lastUpdatedTransactions}`;
      }
    }

    const config = {
      method: 'GET',
      urlKey: `transactions/product-transactions/${params}`,
      url,
      contentType: 'application/json',
    };

    const response = await Middleware(config);

    if (!response.success) {
      throw new Error(response.error);
    }

    saveAllTransactions(response);
  } catch (error) {
    handleErrors(error, {
      ref: 'SyncServerTransactions_getTransactionsList',
    });

    store.dispatch(closeIndividualSyncingStatus());
    store.dispatch(SyncProcessFailed());
  }
};

const getBalanceTransactionsList = async (url) => {
  try {
    let params = '';

    if (!url) {
      const { tnxUpdatedBefore } = store.getState().sync;
      params += `?limit=${API_DEFAULT_LIMIT}&offset=0`;
      if (tnxUpdatedBefore) {
        params += `&updated_before=${tnxUpdatedBefore}&only_quantity_available=true`;
      }
    }

    const config = {
      method: 'GET',
      urlKey: `transactions/product-transactions/${params}`,
      url,
      contentType: 'application/json',
    };

    const response = await Middleware(config);

    if (!response.success) {
      throw new Error(response.error);
    }

    saveAllTransactions(response);
  } catch (error) {
    store.dispatch(closeIndividualSyncingStatus());
    store.dispatch(SyncProcessFailed());

    handleErrors(error, {
      ref: 'SyncServerTransactions_getBalanceTransactionsList',
    });
  }
};

const getTotalPrice = async (premiums) => {
  const total = premiums.reduce(
    (amount, premium) => amount + parseFloat(premium.amount),
    parseFloat(0),
  );

  return total;
};

const getNodeId = async (id) => {
  try {
    const node = await fetchFarmerByServerId(id);
    if (node.length > 0) {
      return node[0].id;
    }
    return '';
  } catch (error) {
    handleErrors(error, {
      ref: 'SyncServerTransactions_getNodeId',
    });
  }
};

const handleCardActions = async (card, card_details, type) => {
  try {
    if (!card) {
      return ['', '', false];
    }

    // if transaction type incoming then saving farmer card
    // buyer card currently not saving in db, so just saving card server_id instead
    if (type !== APP_TRANS_TYPE_INCOMING || !card_details) {
      return [card, card, false];
    }

    const existingCard = await findCardByServerId(card);
    if (existingCard.length > 0) {
      return [existingCard[0].id, existingCard[0].server_id, false];
    }

    return ['', card, true];
  } catch (error) {
    handleErrors(error, {
      ref: 'SyncServerTransactions_handleCardActions',
    });
  }
};

const handleTransactionPayments = ({
  transaction,
  transactionId,
  transactionPayments,
  cardServerId,
  referenceId,
  nodeId,
  currency,
}) => {
  try {
    transactionPayments.map(async (p) => {
      const {
        premium,
        id,
        amount,
        payment_type,
        selected_option,
        premium_details,
      } = p;
      const isTransactionPremiumExist = await fetchTransactionPremiumByServerId(
        id,
      );

      if (isTransactionPremiumExist.length === 0) {
        let premiumId = '';

        if (payment_type !== TYPE_BASE_PRICE) {
          const existingPremium = await searchPremiumByServerId(premium);
          premiumId = existingPremium?.[0]?.id ?? '';

          // if premium not found, assuming its old premium with inactive status
          if (premiumId === '' && premium_details) {
            let options = null;
            if (premium_details.calculation_type === PREMIUM_OPTIONS) {
              options = premium_details.options;
            } else if (premium_details.calculation_type === PREMIUM_RANGE) {
              options = premium_details.options;
            }

            premium_details.options = options;
            premium_details.is_active = false;
            premium_details.amount_corrected = premium_details.amount;

            const createdPremium = await createPremium(premium_details);
            premiumId = createdPremium?.id ?? '';
          }
        }

        const transactionPremiumObj = {
          premium_id: premiumId,
          transaction_id: transactionId,
          amount_corrected: amount,
          server_id: id,
          category: payment_type,
          type:
            transaction.type === APP_TRANS_TYPE_INCOMING
              ? PAYMENT_OUTGOING
              : PAYMENT_INCOMING,
          verification_method: transaction.method,
          receipt: transaction?.invoice ?? '',
          card_id: cardServerId,
          node_id: nodeId,
          date: parseInt(transaction.created_on),
          currency: currency.code,
          source: transaction.destination,
          destination: transaction.source,
          verification_longitude_corrected: transaction.verification_longitude,
          verification_latitude_corrected: transaction.verification_latitude,
          reference_id: referenceId,
          options: selected_option ? String(selected_option) : null,
        };

        await createTransactionPremium(transactionPremiumObj);
      }
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'SyncServerTransactions_handleTransactionPayments',
    });
  }
};

const createMissingCards = async (missingCards) => {
  for (const card of missingCards) {
    const obj = {
      card_id: card.card_details.card_id,
      display_id: card.card_details.display_id,
      server_id: card.card_details.id,
      is_active: false,
    };

    const cardCreated = await createCard(obj);
    const tnx = await findTransaction(card.transaction_id);
    await updateTransaction(tnx.id, { card_id: cardCreated.id });
  }
};

const saveAllTransactions = async (response) => {
  try {
    const { next, results, count } = response.data;
    const nextUrl = next ?? null;
    const transactions = results ?? [];
    const tnxCount = count ?? 0;
    const { syncStage, tnxSyncTotal, tnxSyncPrevTotal } = store.getState().sync;
    const { loggedInUser, userCompanyDetails } = store.getState().login;
    const currency = userCompanyDetails?.currency ?? DEFAULT_CURRENCY;

    if (syncStage === 2) {
      if (tnxSyncTotal === 0) {
        const currentTotal =
          tnxSyncPrevTotal !== 0 ? tnxSyncPrevTotal : tnxCount;
        await store.dispatch(updateTnxSyncTotal(currentTotal));
      }
      await store.dispatch(updateTnxSyncNextUrl(nextUrl));
    }

    const missingCards = [];

    await Promise.all(
      transactions.map(async (transaction) => {
        const isExisting = await fetchTransactionByServerId(transaction.id);

        if (isExisting.length > 0) {
          // no changes
          if (syncStage === 2) {
            await store.dispatch(addTnxSyncCount());
          }
          return transaction;
        }

        const transactionType = transaction.type;
        const nodeId =
          transaction.type === APP_TRANS_TYPE_INCOMING
            ? await getNodeId(transaction.source)
            : transaction.destination;

        let productId = transaction?.product ?? null;
        if (productId) {
          const fetchedProduct = await fetchProductByServerId(productId);
          if (fetchedProduct?.[0]?.id) {
            productId = fetchedProduct[0].id;
          }
        }

        const transactionPayments = transaction.transaction_payments;
        const total = await getTotalPrice(transactionPayments);

        let productPrice = 0;
        let price = 0;
        const baseTransactionPremiums = transactionPayments.filter((x) => {
          return x.payment_type === TYPE_BASE_PRICE;
        });

        if (baseTransactionPremiums.length > 0) {
          price = parseFloat(baseTransactionPremiums[0].amount);
        }

        const transactionQuantity = parseFloat(transaction.quantity);
        productPrice = price / transactionQuantity;

        const [cardId, cardServerId, missing] = await handleCardActions(
          transaction.card,
          transaction.card_details,
          transaction.type,
        );

        let extraFields = transaction.submissions || '';
        if (typeof extraFields === 'object') {
          extraFields = jsonToString(extraFields);
        }

        const referenceId = transaction.invoice_number || '';
        const currencyValue = currency.code;

        const transactionItem = {
          node_id: nodeId,
          server_id: transaction.id,
          product_id: productId,
          product_price_corrected: productPrice,
          price_corrected: price,
          currency: currencyValue,
          quantity_corrected: transactionQuantity,
          date: transaction.date,
          invoice_file: transaction.invoice,
          created_on: parseInt(transaction.created_on),
          card_id: cardId,
          total_corrected: total,
          quality_correction: transaction.quality_correction,
          verification_method: transaction.method,
          verification_longitude_corrected: transaction.verification_longitude,
          verification_latitude_corrected: transaction.verification_latitude,
          extra_fields: extraFields,
          reference_id: referenceId,
          source:
            transactionType === APP_TRANS_TYPE_INCOMING
              ? nodeId
              : loggedInUser.entity_id,
          destination:
            transactionType === APP_TRANS_TYPE_INCOMING
              ? loggedInUser.entity_id
              : nodeId,
          current_quantity_corrected: parseFloat(
            transaction?.current_quantity ?? 0,
          ),
          transaction_type: 3,
          type: transactionType,
          parents: transaction.parents || [],
        };

        const transactionId = await createTransaction(transactionItem);

        if (syncStage === 2) {
          await store.dispatch(addTnxSyncCount());
        }

        /// saving transaction premium
        await handleTransactionPayments({
          transaction,
          transactionId,
          transactionPayments,
          cardServerId,
          referenceId,
          nodeId,
          currency,
        });

        if (
          missing &&
          !missingCards.some(
            (x) => x.card_details.id === transaction.card_details.id,
          )
        ) {
          missingCards.push({
            transaction_id: transactionId,
            card_details: transaction.card_details,
          });
        }
      }),
    );

    await createMissingCards(missingCards);
    concludeTransactionSync(nextUrl);
  } catch (error) {
    store.dispatch(closeIndividualSyncingStatus());
    store.dispatch(SyncProcessFailed());

    handleErrors(error, {
      ref: 'SyncServerTransactions_saveAllTransactions',
    });
  }
};

const concludeTransactionSync = async (nextUrl) => {
  try {
    const { syncStage, tnxSyncTotal, tnxSyncCount, tnxSyncStage } =
      store.getState().sync;
    const { userCompanyDetails } = store.getState().login;
    const alreadySyncedCount = parseInt(tnxSyncTotal) - parseInt(tnxSyncCount);
    store.dispatch(updateTnxSyncPrevTotal(alreadySyncedCount));

    if (nextUrl) {
      if (
        syncStage !== 3 &&
        tnxSyncStage === 2 &&
        userCompanyDetails?.sell_enabled
      ) {
        getBalanceTransactionsList(nextUrl);
      } else {
        getTransactionsList(nextUrl);
      }
    } else if (
      syncStage !== 3 &&
      tnxSyncStage === 1 &&
      userCompanyDetails?.sell_enabled
    ) {
      store.dispatch(updateTnxSyncPrevTotal(0));
      store.dispatch(updateTnxSyncTotal(0));
      store.dispatch(updateTnxSyncCount(0));
      store.dispatch(updateTnxSyncStage(2));

      getBalanceTransactionsList();
    } else {
      if (tnxSyncStage === 2) {
        store.dispatch(updateTnxSyncStage(3));
      }

      await AsyncStorage.setItem(
        'last_updated_transactions',
        Math.floor(new Date().getTime() / 1000).toString(),
      );

      getAllPayments(null);
    }
  } catch (error) {
    handleErrors(error, {
      ref: 'SyncServerTransactions_concludeTransactionSync',
    });
  }
};

export const getAllPayments = async (url) => {
  try {
    let params = `?limit=${API_DEFAULT_LIMIT}&offset=0&payment_type=${TYPE_GENERIC_PREMIUM}`;

    if (!url) {
      const lastUpdatedPayments = await AsyncStorage.getItem(
        'last_updated_payments',
      );
      const { tnxUpdatedBefore } = store.getState().sync;

      if (lastUpdatedPayments) {
        params += `&updated_after=${lastUpdatedPayments}`;
      } else if (tnxUpdatedBefore) {
        params += `&updated_after=${tnxUpdatedBefore}`;
      }
    }

    const config = {
      method: 'GET',
      urlKey: `transactions/payment-transactions/${params}`,
      url,
      contentType: 'application/json',
    };

    const response = await Middleware(config);

    if (!response.success) {
      throw new Error(response.error);
    }
    saveAllPayments(response);
  } catch (error) {
    store.dispatch(closeIndividualSyncingStatus());
    store.dispatch(SyncProcessFailed());

    handleErrors(error, {
      ref: 'SyncServerTransactions_getAllPayments',
    });
  }
};

const saveAllPayments = async (response) => {
  try {
    const { next, results } = response.data;
    const nextUrl = next ?? null;
    const payments = results ?? [];
    const { userCompanyDetails } = store.getState().login;
    const currency = userCompanyDetails?.currency ?? DEFAULT_CURRENCY;

    await Promise.all(
      payments.map(async (payment) => {
        const isExisting = await fetchTransactionPremiumByServerId(payment.id);
        if (isExisting.length === 0) {
          let premiumId = '';
          let transactionId = '';

          const premium = await searchPremiumByServerId(payment.premium);
          if (premium.length !== 0) {
            premiumId = premium[0].id;
          }

          const transaction = await fetchTransactionByServerId(
            payment.transaction,
          );
          if (transaction.length !== 0) {
            transactionId = transaction[0].id;
          }

          const currencyValue = currency.code;

          let extraFields = payment.submissions || '';
          if (typeof extraFields === 'object') {
            extraFields = jsonToString(extraFields);
          }

          const transactionPremium = {
            premium_id: premiumId,
            transaction_id: transactionId,
            amount_corrected: payment.amount,
            server_id: payment.id,
            category: payment.payment_type,
            type: payment.type,
            verification_method: payment?.card
              ? VERIFICATION_METHOD_CARD
              : VERIFICATION_METHOD_MANUAL,
            receipt: payment.invoice || '',
            card_id: payment.card || '',
            node_id: payment.source,
            date: parseInt(payment.created_on),
            currency: currencyValue,
            source: payment.source,
            destination: payment.destination,
            verification_longitude_corrected: payment.verification_longitude,
            verification_latitude_corrected: payment.verification_latitude,
            reference_id: payment.invoice_number || '',
            options: payment.selected_option
              ? String(payment.selected_option)
              : null,
            comment: payment.comment,
            extra_fields: extraFields,
          };
          await createTransactionPremium(transactionPremium);
        }
        return payment;
      }),
    );

    if (nextUrl) {
      getAllPayments(nextUrl);
    } else {
      await AsyncStorage.setItem(
        'last_updated_payments',
        Math.floor(new Date().getTime() / 1000).toString(),
      );

      completeSyncing();
    }
  } catch (error) {
    store.dispatch(closeIndividualSyncingStatus());
    store.dispatch(SyncProcessFailed());

    handleErrors(error, {
      ref: 'SyncServerTransactions_saveAllPayments',
    });
  }
};

const completeSyncing = async () => {
  try {
    const { syncStage } = store.getState().sync;
    if (syncStage === 2) {
      store.dispatch(tnxSyncCompleted());
      store.dispatch(updateSyncStage(3));
    }
    store.dispatch(SyncProcessComplete());
    store.dispatch(closeIndividualSyncingStatus());
  } catch (error) {
    handleErrors(error, {
      ref: 'SyncServerTransactions_completeSyncing',
    });
  }
};

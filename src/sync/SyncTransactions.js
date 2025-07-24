import {
  findAllNewTransactions,
  findAllUnUploadedTransactionsInvoices,
  findAndUpdateTransaction,
  findAndUpdateTransactionInvoice,
  findTransaction,
  fetchTransactionByServerId,
  updateTransactionError,
  findAllNewBuyTransactions,
  findAllNewSendTransactions,
  findAllDeletedTransactions,
  updateTransaction,
} from '../db/services/TransactionsHelper';
import { Middleware } from '../api/middleware';
import { findProduct } from '../db/services/ProductsHelper';
import {
  findAllNewPayments,
  fetchPremiumsByTransactionAndCategory,
  findAllUnUploadedPaymentInvoices,
  findAndUpdatePaymentInvoice,
  findUnSyncedBasePricePremium,
  findUnSyncedTransactionPremium,
  updateTransactionPremiumServerId,
  updateTransactionPremiumDestination,
  fetchAllPremiumsByTransaction,
  updateTransactionPremium,
} from '../db/services/TransactionPremiumHelper';
import {
  findPremium,
  searchPremiumByServerId,
} from '../db/services/PremiumsHelper';
import { store } from '../redux/store';
import { SyncProcessFailed, manageSyncData } from '../redux/LoginStore';
import { handleErrors } from '../utils/commonFunctions';
import { stringToJson } from '../utils/helperFunctions';
import { findCard } from '../db/services/CardHelper';
import { findFarmer } from '../db/services/FarmerHelper';
import { updateBuyTnxStatus, updateSendTnxStatus } from '../redux/CommonStore';
import {
  closeIndividualSyncingStatus,
  updateBuyTnxSyncingStatus,
  updateSendTnxSyncingStatus,
} from '../redux/SyncStore';
import { getPremiumList } from './SyncServerInitials';
import {
  APP_TRANS_TYPE_INCOMING,
  APP_TRANS_TYPE_OUTGOING,
  DEFAULT_CURRENCY,
  TYPE_BASE_PRICE,
  TYPE_TRANSACTION_PREMIUM,
} from '../utils/constants';

const updateError = async (id, error, extraData = {}) => {
  await updateTransactionError(id, error);

  handleErrors(new Error(error), {
    ref: 'SyncTransactions_updateError',
    ...extraData,
  });

  store.dispatch(manageSyncData('transaction', 'failed'));
};

const getIncludedPremiums = async (id) => {
  const premiums = await fetchPremiumsByTransactionAndCategory(
    id,
    TYPE_TRANSACTION_PREMIUM,
  );

  return Promise.all(
    premiums.map(async (premium) => {
      const premiumObj = await findPremium(premium.premium_id);
      const obj = {
        premium: premiumObj.server_id,
        amount: premium.amount_corrected,
      };

      if (premium?.options !== '') {
        obj.selected_option = premium.options;
      }
      return obj;
    }),
  );
};

export const syncDeletedTransactions = async () => {
  try {
    const transactions = await findAllDeletedTransactions();
    if (transactions.length === 0) {
      syncTransactions();
      return;
    }

    store.dispatch(updateBuyTnxSyncingStatus(true));

    await Promise.all(
      transactions.map(async (transaction) => {
        const serverId = transaction.server_id;
        const transactionId = transaction.id;

        const config = {
          method: 'DELETE',
          urlKey: `transactions/product-transactions/${serverId}/`,
          contentType: 'application/json',
        };

        const response = await Middleware(config);

        if (!response?.success) {
          handleErrors(
            new Error('deleting transaction failed, contact admin.'),
            {
              ref: 'SyncTransactions_syncDeletedTransactions',
              server_id: serverId,
            },
          );
          store.dispatch(manageSyncData('transaction', 'failed'));
          return transaction;
        }

        // update transaction
        await updateTransaction(transactionId, { is_edited: false });

        // update transaction premiums
        const transactionPremiums = await fetchAllPremiumsByTransaction(
          transactionId,
        );
        await Promise.all(
          transactionPremiums.map(async (premium) => {
            await updateTransactionPremium(premium.id, { is_edited: false });
          }),
        );

        store.dispatch(manageSyncData('transaction', 'success'));
        return transaction;
      }),
    );

    const pendingTransactions = await findAllDeletedTransactions();
    if (pendingTransactions.length > 0) {
      store.dispatch(SyncProcessFailed());
      store.dispatch(closeIndividualSyncingStatus());
      return;
    }

    syncTransactions();
  } catch (error) {
    store.dispatch(closeIndividualSyncingStatus());
    store.dispatch(SyncProcessFailed());
    handleErrors(error, {
      ref: 'SyncTransactions_syncDeletedTransactions',
    });
  }
};

export const syncTransactions = async () => {
  try {
    const transactions = await findAllNewBuyTransactions();

    if (transactions.length === 0) {
      syncSendTransactions();
      return;
    }

    store.dispatch(updateBuyTnxSyncingStatus(true));
    const { userCompanyDetails } = store.getState().login;
    const currency = userCompanyDetails?.currency ?? DEFAULT_CURRENCY;

    await Promise.all(
      transactions.map(async (transaction) => {
        const transactionId = transaction.id;
        const farmer = await findFarmer(transaction.node_id);
        const product = await findProduct(transaction.product_id);
        const premiums = await getIncludedPremiums(transactionId);

        const productId = product.server_id;
        let cardId = null;

        if (transaction.card_id !== '') {
          const card = await findCard(transaction.card_id);
          cardId = card.server_id;
        }

        // checking empty node server_id
        const nodeId = farmer.server_id || null;
        if (!nodeId) {
          await updateError(
            transactionId,
            'Could not find farmer id in the transaction.',
          );

          return transaction;
        }

        let extraFields = transaction.extra_fields;
        if (extraFields !== '' && typeof extraFields === 'string') {
          extraFields = stringToJson(extraFields);
        }

        const data = {
          node: nodeId,
          product: productId,
          quantity: transaction.quantity_corrected,
          currency: currency.id,
          quality_correction: transaction.quality_correction,
          base_price: transaction.product_price_corrected,
          verification_longitude: transaction.verification_longitude_corrected,
          verification_latitude: transaction.verification_latitude_corrected,
          invoice_number: transaction.reference_id,
          source: nodeId,
          destination: transaction.destination,
          current_quantity: transaction.current_quantity_corrected,
          amount: transaction.price_corrected,
          transaction_payments: premiums,
          date: parseInt(transaction.created_on),
          verification_method: transaction.verification_method,
          type: APP_TRANS_TYPE_INCOMING,
        };

        if (extraFields) {
          data.submissions = extraFields;
        }

        if (cardId) {
          data.card = cardId;
        }

        const config = {
          method: 'POST',
          urlKey: 'transactions/product-transactions/',
          contentType: 'application/json',
          data,
        };

        const response = await Middleware(config);

        if (!response?.success) {
          await updateError(transactionId, response.error);
          return transaction;
        }

        const transactionDetails = response.data;
        const responseId = transactionDetails?.id ?? null;
        const responseDate = transactionDetails?.date ?? null;
        const responseCreatedOn = transactionDetails?.created_on ?? null;

        if (!responseId || !responseDate || !responseCreatedOn) {
          await updateError(
            transactionId,
            'Buy transaction data missing from backend, contact admin.',
          );
          return transaction;
        }

        const isExisting = await fetchTransactionByServerId(responseId);
        if (isExisting.length > 0) {
          store.dispatch(manageSyncData('transaction', 'success'));
          store.dispatch(updateBuyTnxStatus(product.id));
          return transaction;
        }

        const updates = {
          server_id: responseId,
          date: responseDate,
          created_on: parseInt(responseCreatedOn),
          error: '',
        };

        await findAndUpdateTransaction(transactionId, updates);

        /// updating transaction_premiums
        transactionDetails.transaction_payments.map(async (p) => {
          const { premium, payment_type } = p;
          const paymentServerId = p.id;
          if (payment_type === TYPE_BASE_PRICE) {
            /// updating base_price_premium
            const existingBasePricePremium = await findUnSyncedBasePricePremium(
              transactionId,
            );
            if (existingBasePricePremium.length > 0) {
              const { destination, node_id, id } = existingBasePricePremium[0];
              await updateTransactionPremiumServerId(id, paymentServerId);

              // updating destination if the transaction was direct_buy
              if (destination === node_id) {
                const destinationFarmer = await findFarmer(destination);
                if (destinationFarmer) {
                  const farmerServerId = destinationFarmer.server_id;
                  await updateTransactionPremiumDestination(id, farmerServerId);
                }
              }
            }
          } else {
            const existingPremium = await searchPremiumByServerId(premium);
            const existingTransactionPremium =
              await findUnSyncedTransactionPremium(
                transactionId,
                existingPremium[0].id,
              );
            if (existingTransactionPremium.length > 0) {
              const { destination, node_id, id } =
                existingTransactionPremium[0];

              await updateTransactionPremiumServerId(id, paymentServerId);

              // updating destination if the transaction was direct_buy
              if (destination === node_id) {
                const destinationFarmer = await findFarmer(destination);
                if (destinationFarmer) {
                  const farmerServerId = destinationFarmer.server_id;
                  await updateTransactionPremiumDestination(id, farmerServerId);
                }
              }
            }
          }
        });

        store.dispatch(manageSyncData('transaction', 'success'));
        store.dispatch(updateBuyTnxStatus(product.id));
        return transaction;
      }),
    );

    store.dispatch(updateBuyTnxSyncingStatus(false));
    syncSendTransactions();
  } catch (error) {
    store.dispatch(closeIndividualSyncingStatus());
    store.dispatch(SyncProcessFailed());
    handleErrors(error, {
      ref: 'SyncTransactions_syncTransactions',
    });
  }
};

const syncSendTransactions = async () => {
  try {
    store.dispatch(updateSendTnxSyncingStatus(true));
    const { userCompanyDetails } = store.getState().login;
    const currency = userCompanyDetails?.currency ?? DEFAULT_CURRENCY;
    const transactions = await findAllNewSendTransactions();

    await Promise.all(
      transactions.map(async (transaction) => {
        const transactionId = transaction.id;
        const premiums = await getIncludedPremiums(transactionId);
        const product = await findProduct(transaction.product_id);
        const productId = product.server_id;

        // checking empty node server_id
        const nodeId = transaction.node_id || null;
        if (!nodeId) {
          await updateError(
            transactionId,
            'Could not find buyer id in the transaction.',
          );
          return transaction;
        }

        let extraFields = transaction.extra_fields;
        if (extraFields !== '' && typeof extraFields === 'string') {
          extraFields = stringToJson(extraFields);
        }

        const parentsServerIds = [];
        const { parents } = transaction;

        if (parents.length === 0) {
          await updateError(
            transactionId,
            'Parent transactions are empty. Retry sync again or contact admin.',
          );
          return transaction;
        }

        for (const tx of parents) {
          const parent = await findTransaction(tx);

          if (!parent) {
            await updateError(
              transactionId,
              'Could not find parent transaction. Retry sync again or contact admin.',
            );
            return transaction;
          }

          if (parent && parent?.server_id === '') {
            await updateError(
              transactionId,
              'Parent transaction not synced yet. Retry sync again or contact admin.',
            );
            return transaction;
          }

          parentsServerIds.push(parent.server_id);
        }

        const data = {
          node: nodeId,
          product: productId,
          quantity: transaction.quantity_corrected,
          currency: currency.id,
          verification_longitude: transaction.verification_longitude_corrected,
          verification_latitude: transaction.verification_latitude_corrected,
          invoice_number: transaction.reference_id || '',
          source: transaction.source,
          destination: nodeId,
          current_quantity: transaction.current_quantity_corrected,
          amount: transaction.price_corrected,
          transaction_payments: premiums,
          date: parseInt(transaction.created_on),
          verification_method: transaction.verification_method,
          type: APP_TRANS_TYPE_OUTGOING,
          parents: parentsServerIds,
        };

        if (extraFields) {
          data.submissions = extraFields;
        }

        const cardId = transaction?.card_id ?? null;
        if (cardId) {
          data.card = cardId;
        }

        const config = {
          method: 'POST',
          urlKey: 'transactions/product-transactions/',
          contentType: 'application/json',
          data,
        };

        const response = await Middleware(config);

        if (!response?.success) {
          await updateError(transactionId, response.error);
          return transaction;
        }

        const transactionDetails = response.data;
        const responseId = transactionDetails?.id ?? null;
        const responseDate = transactionDetails?.date ?? null;
        const responseCreatedOn = transactionDetails?.created_on ?? null;

        if (!responseId || !responseDate || !responseCreatedOn) {
          await updateError(
            transactionId,
            'Sent transaction data missing from backend, contact admin.',
          );
          return transaction;
        }

        const isExisting = await fetchTransactionByServerId(responseId);
        if (isExisting.length > 0) {
          store.dispatch(manageSyncData('transaction', 'success'));
          store.dispatch(updateSendTnxStatus(product.id));

          return transaction;
        }

        const updates = {
          server_id: responseId,
          date: responseDate,
          created_on: parseInt(responseCreatedOn),
          error: '',
        };

        await findAndUpdateTransaction(transactionId, updates);

        // updating transaction_premiums
        transactionDetails.transaction_payments.map(async (p) => {
          if (p.payment_type === TYPE_BASE_PRICE) {
            /// updating base_price_premium
            const existingBasePricePremium = await findUnSyncedBasePricePremium(
              transactionId,
            );

            if (existingBasePricePremium.length > 0) {
              const { id } = existingBasePricePremium[0];

              await updateTransactionPremiumServerId(id, p.id);
            }
          } else {
            const existingPremium = await searchPremiumByServerId(p.premium);
            const existingTransactionPremium =
              await findUnSyncedTransactionPremium(
                transactionId,
                existingPremium[0].id,
              );

            if (existingTransactionPremium.length > 0) {
              const { id } = existingTransactionPremium[0];
              await updateTransactionPremiumServerId(id, p.id);
            }
          }
        });

        store.dispatch(manageSyncData('transaction', 'success'));
        store.dispatch(updateSendTnxStatus(product.id));
        return transaction;
      }),
    );

    store.dispatch(updateSendTnxSyncingStatus(false));

    const AllPendingTransactions = await findAllNewTransactions();
    const pendingTransactions = AllPendingTransactions.filter((x) => {
      return x.type === APP_TRANS_TYPE_OUTGOING;
    });

    if (pendingTransactions.length > 0) {
      store.dispatch(closeIndividualSyncingStatus());
      store.dispatch(SyncProcessFailed());
      return;
    }

    syncTransactionsInvoices();
  } catch (error) {
    store.dispatch(closeIndividualSyncingStatus());
    store.dispatch(SyncProcessFailed());
    handleErrors(error, {
      ref: 'SyncTransactions_syncSendTransactions',
    });
  }
};

const syncTransactionsInvoices = async () => {
  try {
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

        const config = {
          method: 'PATCH',
          urlKey: `transactions/product-transactions/${invoice.server_id}/invoice/`,
          contentType: 'multipart/form-data',
          data,
        };

        const response = await Middleware(config);

        if (!response?.success) {
          store.dispatch(SyncProcessFailed());
          return;
        }

        const invoiceUrl = response.data.invoice;
        await findAndUpdateTransactionInvoice(invoice.id, invoiceUrl);
      }),
    );

    syncPayments();
  } catch (error) {
    store.dispatch(closeIndividualSyncingStatus());
    store.dispatch(SyncProcessFailed());
    handleErrors(error, {
      ref: 'SyncTransactions_syncTransactionsInvoices',
    });
  }
};

export const syncPayments = async () => {
  try {
    const { userCompanyDetails } = store.getState().login;
    const currency = userCompanyDetails?.currency ?? DEFAULT_CURRENCY;
    const payments = await findAllNewPayments();

    await Promise.all(
      payments.map(async (payment) => {
        const premium = await findPremium(payment.premium_id);

        let extraFields = payment.extra_fields;
        if (extraFields !== '' && typeof extraFields === 'string') {
          extraFields = stringToJson(extraFields);
        }

        const data = {
          premium: premium.server_id,
          amount: payment.amount_corrected,
          currency: currency.id,
          verification_latitude: payment.verification_latitude_corrected,
          verification_longitude: payment.verification_longitude_corrected,
          source: payment.source,
          destination: payment.destination,
          direction: payment.type,
          invoice_number: payment.reference_id,
          selected_option: payment.options,
          comment: payment.comment,
        };

        if (extraFields) {
          data.submissions = extraFields;
        }

        if (payment.card_id) {
          data.card = payment.card_id;
        }

        const config = {
          method: 'POST',
          urlKey: 'transactions/payment-transactions/',
          contentType: 'application/json',
          data,
        };

        const response = await Middleware(config);
        if (!response?.success) {
          handleErrors(new Error('payment syncing error'), {
            ref: 'SyncTransactions_syncPayments',
            error: response.error,
            data,
          });
          return payment;
        }

        await updateTransactionPremiumServerId(payment.id, response.data.id);
        return payment;
      }),
    );

    syncPaymentInvoices();
  } catch (error) {
    store.dispatch(SyncProcessFailed());
    store.dispatch(closeIndividualSyncingStatus());
    handleErrors(error, {
      ref: 'SyncTransactions_syncPayments',
    });
  }
};

export const syncPaymentInvoices = async () => {
  try {
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

        const data = new FormData();
        data.append('invoice', image);

        const config = {
          method: 'PATCH',
          urlKey: `transactions/payment-transactions/${invoice.server_id}/invoice/`,
          contentType: 'multipart/form-data',
          data,
        };

        const response = await Middleware(config);

        if (!response?.success) {
          handleErrors(new Error('payment invoice syncing error'), {
            ref: 'SyncTransactions_syncPayments',
            error: response.error,
          });
          return invoice;
        }

        const invoiceUrl = response.data.invoice;
        findAndUpdatePaymentInvoice(invoice.id, invoiceUrl);
      }),
    );

    getPremiumList();
  } catch (error) {
    handleErrors(error, {
      ref: 'SyncTransactions_syncPaymentInvoices',
    });
    store.dispatch(SyncProcessFailed());
    store.dispatch(closeIndividualSyncingStatus());
  }
};

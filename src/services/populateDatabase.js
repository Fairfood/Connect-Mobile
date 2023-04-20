/* eslint-disable no-shadow */
import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import Toast from 'react-native-toast-message';

import {
  initSyncProcess,
  SyncProcessComplete,
  SyncProcessFailed,
} from '../redux/LoginStore';
import { getCompanyDetails, getProjectDetails } from './syncInitials';
import {
  startTnxSyncing,
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
import {
  findAndUpdateFarmerDetails,
  findFarmerByServerId,
  getAllFarmers,
  saveFarmer,
} from './farmersHelper';
import {
  findProductByServerId,
  saveProduct,
  updateProduct,
} from './productsHelper';
import {
  findTransactionByServerId,
  saveTransaction,
} from './transactionsHelper';
import { getBatchByServerId, saveBatch } from './batchesHelper';
import {
  findPremiumByServerId,
  savePremium,
  updatePremium,
} from './premiumsHelper';
import {
  findAllTransactionPremiumByServerId,
  saveTransactionPremium,
} from './transactionPremiumHelper';
import { syncFarmers } from './syncFarmers';
import {
  getAllCards,
  getAllCardsByNodeId,
  saveCard,
  updateCardNodeIDById,
} from './cardsHelper';
import {
  findAllPremiumsByProduct,
  saveProductPremium,
  deleteProductPremiumByID,
} from './productPremiumHelper';
import I18n from '../i18n/i18n';
import api from '../api/config';
import * as consts from './constants';

const transactionLimit = 50;

export const populateDatabase = async () => {
  const { syncInProgress } = store.getState().login;
  const { isConnected } = store.getState().connection;
  const { syncStage } = store.getState().sync;

  if (!isConnected) {
    Toast.show({
      type: 'error',
      text1: I18n.t('connection_error'),
      text2: I18n.t('no_active_internet_connection'),
    });
    return;
  }

  if (syncInProgress) {
    // Toast.show({
    //   type: 'warning',
    //   text1: I18n.t('in_progress'),
    //   text2: I18n.t('sync_already_in_progress'),
    // });
    return;
  }

  await store.dispatch(initSyncProcess());

  if (syncStage === 2) {
    store.dispatch(startTnxSyncing());
    store.dispatch(updateTnxSyncStage(1));
  }

  const companyDetails = await getCompanyDetails();
  if (companyDetails) {
    const projectDetails = await getProjectDetails();
    if (projectDetails) {
      const date = new Date();
      await AsyncStorage.setItem(
        'user_details_last_update',
        date.getTime().toString(),
      );
      await syncFarmers();
    } else {
      store.dispatch(SyncProcessFailed('sync Failed'));
    }
  } else {
    store.dispatch(SyncProcessFailed('sync Failed'));
  }
};

export const getPremiumList = async () => {
  let loggedInUser = await AsyncStorage.getItem('loggedInUser');
  loggedInUser = JSON.parse(loggedInUser);

  const headers = {
    Bearer: loggedInUser.token,
    'User-ID': loggedInUser.id,
    'Node-ID': loggedInUser.default_node,
    Version: DeviceInfo.getVersion(),
    'Client-Code': api.API_CLIENT_CODE,
  };

  let lastUpdatedPremiums = await AsyncStorage.getItem('last_updated_premiums');
  let updatedAfter = '';
  if (lastUpdatedPremiums) {
    updatedAfter = `?updated_after=${parseInt(lastUpdatedPremiums)}`;
  }

  const config = {
    url: `${api.API_URL}${api.API_VERSION}/projects/projects/premiums/${updatedAfter}`,
    headers,
  };

  const response = await CommonFetchRequest(config);
  if (response.success) {
    const premiums = response.data.results;
    premiums.map(async (premium) => {
      const isExisting = await findPremiumByServerId(premium.id);
      if (isExisting.length === 0) {
        await savePremium(premium);
      } else {
        await updatePremium(isExisting[0].id, premium);
      }
    });

    lastUpdatedPremiums = new Date();
    lastUpdatedPremiums = parseInt(lastUpdatedPremiums.getTime() / 1000);
    await AsyncStorage.setItem(
      'last_updated_premiums',
      lastUpdatedPremiums.toString(),
    );

    getProductsList(headers, null);
  } else {
    store.dispatch(SyncProcessFailed());
  }
};

export const getProductsList = async () => {
  let loggedInUser = await AsyncStorage.getItem('loggedInUser');
  loggedInUser = JSON.parse(loggedInUser);

  const headers = {
    Bearer: loggedInUser.token,
    'User-ID': loggedInUser.id,
    'Node-ID': loggedInUser.default_node,
    Version: DeviceInfo.getVersion(),
    'Client-Code': api.API_CLIENT_CODE,
  };

  let lastUpdatedProducts = await AsyncStorage.getItem('last_updated_products');
  let updatedAfter = '';
  if (lastUpdatedProducts) {
    updatedAfter = `&updated_after=${parseInt(lastUpdatedProducts)}`;
  }

  const config = {
    url: `${api.API_URL}${api.API_VERSION}/projects/project/${loggedInUser.project_id}/product/?status=all${updatedAfter}`,
    headers,
  };

  const response = await CommonFetchRequest(config);
  if (response.success) {
    const products = response.data.results;

    products.map(async (product) => {
      const isExisting = await findProductByServerId(product.id);
      if (isExisting.length === 0) {
        await saveProduct(product);
      } else {
        await updateProduct(isExisting[0].id, product);
      }

      // updating product_premiums
      if (product?.premiums) {
        const { premiums } = product;
        const existingPremiums = await findAllPremiumsByProduct(product.id);

        await Promise.all(
          existingPremiums.map(async (p) => {
            await deleteProductPremiumByID(p.id);
          }),
        );

        premiums.map(async (premium) => {
          await saveProductPremium(product.id, premium);
        });
      }
    });

    lastUpdatedProducts = new Date();
    lastUpdatedProducts = parseInt(lastUpdatedProducts.getTime() / 1000);
    await AsyncStorage.setItem(
      'last_updated_products',
      lastUpdatedProducts.toString(),
    );

    getBuyersList(headers, null);
  } else {
    store.dispatch(SyncProcessFailed());
  }
};

const getBuyersList = async (headers, url) => {
  let loggedInUser = await AsyncStorage.getItem('loggedInUser');
  loggedInUser = JSON.parse(loggedInUser);

  let lastUpdatedBuyers = await AsyncStorage.getItem('last_updated_buyers');
  // let updatedAfter = '';
  // if (lastUpdatedBuyers) {
  //   updatedAfter = `&updated_after=${parseInt(lastUpdatedBuyers)}`;
  // }

  const defaultUrl = `${api.API_URL}${api.API_VERSION}/projects/project/${loggedInUser.project_id}/buyer/`;

  const config = {
    url: url == null ? defaultUrl : url,
    headers,
  };

  const response = await CommonFetchRequest(config);

  if (response.success) {
    const buyers = response.data.results;
    await AsyncStorage.setItem('buyers', JSON.stringify(buyers));

    lastUpdatedBuyers = new Date();
    lastUpdatedBuyers = parseInt(lastUpdatedBuyers.getTime() / 1000);
    await AsyncStorage.setItem(
      'last_updated_buyers',
      lastUpdatedBuyers.toString(),
    );

    getFarmersList(headers, null);
  } else {
    store.dispatch(SyncProcessFailed());
  }
};

const getFarmersList = async (headers, url) => {
  let loggedInUser = await AsyncStorage.getItem('loggedInUser');
  loggedInUser = JSON.parse(loggedInUser);

  const lastUpdatedFarmers = await AsyncStorage.getItem('last_updated_farmers');
  let updatedAfter = '';
  if (lastUpdatedFarmers) {
    updatedAfter = `&updated_after=${parseInt(lastUpdatedFarmers)}`;
  }

  const defaultUrl = `${api.API_URL}${api.API_VERSION}/projects/project/${loggedInUser.project_id}/supplier/?limit=50&offset=0${updatedAfter}`;
  const config = {
    url: url == null ? defaultUrl : url,
    headers,
  };

  const response = await CommonFetchRequest(config);
  if (response.success) {
    saveFarmers(headers, response);
  } else {
    store.dispatch(SyncProcessFailed());
  }
};

const saveFarmers = async (headers, response) => {
  const { next, results } = response.data;
  const nextUrl = next ?? null;
  const farmers = results ?? [];
  const allFarmers = await getAllFarmers();
  const allCards = await getAllCards();

  Promise.all(
    farmers.map(async (farmer) => {
      farmer.ktp = farmer.id_no;

      const isExisting = allFarmers.filter((f) => {
        return f.server_id === farmer.id;
      });

      if (isExisting.length > 0) {
        let cardId = null;

        if (farmer.cards !== undefined && farmer.cards.length > 0) {
          cardId = farmer.cards[0].card_id;

          await findAndUpdateFarmerDetails(isExisting[0].id, farmer, cardId);

          const { cards } = farmer;
          await saveAllCards(allCards, cards, isExisting[0].id);
        } else {
          // removing already assigned card for this node
          const alreadyAssignedCards = await getAllCardsByNodeId(
            isExisting[0].id,
          );
          if (alreadyAssignedCards.length > 0) {
            const updates = {
              node_id: '',
              server_id: alreadyAssignedCards[0].server_id,
              fair_id: alreadyAssignedCards[0].fair_id,
            };
            await updateCardNodeIDById(alreadyAssignedCards[0].id, updates);
          }

          await findAndUpdateFarmerDetails(isExisting[0].id, farmer, cardId);
        }
      } else if (farmer?.cards && farmer.cards.length > 0) {
        farmer.card_id = farmer.cards[0].card_id;
        const farmerResponse = await saveFarmer(farmer);

        const { cards } = farmer;
        await saveAllCards(allCards, cards, farmerResponse.id);
      } else {
        farmer.card_id = null;
        await saveFarmer(farmer);
      }
      return farmer;
    }),
  ).then(async () => {
    if (nextUrl != null) {
      getFarmersList(headers, nextUrl);
    } else {
      let lastUpdatedFarmers = new Date();
      lastUpdatedFarmers = parseInt(lastUpdatedFarmers.getTime() / 1000);
      await AsyncStorage.setItem(
        'last_updated_farmers',
        lastUpdatedFarmers.toString(),
      );

      const { syncStage } = store.getState().sync;

      if (syncStage === 1) {
        store.dispatch(updateSyncStage(2));
        store.dispatch(SyncProcessComplete());
      } else {
        startTransactionSync(headers, null);
      }
    }
  });
};

const saveAllCards = async (allCards, cards, nodeId) => {
  const card = cards[0]; // assuming 1 farmer has 1 card
  const isCardExisting = allCards.filter((f) => {
    return f.card_id === card.card_id;
  });
  const alreadyAssignedCards = await getAllCardsByNodeId(nodeId);

  // removing already assigned card for this node
  if (alreadyAssignedCards.length > 0) {
    const updates = {
      node_id: '',
      server_id: alreadyAssignedCards[0].server_id,
      fair_id: alreadyAssignedCards[0].fair_id,
    };

    await updateCardNodeIDById(alreadyAssignedCards[0].id, updates);
  }

  if (isCardExisting.length === 0) {
    const cardDetails = {
      node_id: nodeId,
      server_id: card.id,
      card_id: card.card_id,
      fair_id: card.fairid ?? '',
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000),
    };

    await saveCard(cardDetails);
  } else {
    const updates = {
      node_id: nodeId,
      server_id: alreadyAssignedCards[0].server_id,
      fair_id: card?.fairid ?? '',
    };

    await updateCardNodeIDById(isCardExisting[0].id, updates);
  }
};

const getTnxUpdateAfterDate = async () => {
  const limitedDays = consts.TRANSACTION_LIMIT_DAYS;
  const today = new Date();
  let priorDate = new Date(new Date().setDate(today.getDate() - limitedDays));
  priorDate = parseInt(priorDate / 1000);
  return priorDate;
};

const startTransactionSync = async (headers) => {
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

const getTotalPrice = async (basePrice, premiums) => {
  const total = premiums.reduce((a, b) => {
    return a + b.amount;
  }, parseFloat(basePrice));
  return Math.round(total);
};

const getNodeId = async (id) => {
  const node = await findFarmerByServerId(id);
  if (node.length > 0) {
    return node[0].id;
  }

  return null;
};

const getProductId = async (product) => {
  if (!product || product.product_id === '') {
    return '';
  }

  const fetchedProduct = await findProductByServerId(product.product_id);
  if (fetchedProduct.length === 0) {
    return '';
  }

  return fetchedProduct[0].id;
};

const saveAllTransactions = async (headers, response) => {
  const { next, results, count } = response.data;
  const nextUrl = next ?? null;
  const transactions = results ?? [];

  const tnxCount = count ?? 0;
  const { syncStage, tnxSyncTotal, tnxSyncPrevTotal } = store.getState().sync;

  if (syncStage === 2) {
    if (tnxSyncTotal === 0) {
      const currenTotal = tnxSyncPrevTotal !== 0 ? tnxSyncPrevTotal : tnxCount;
      await store.dispatch(updateTnxSyncTotal(currenTotal));
    }
    await store.dispatch(updateTnxSyncNextUrl(nextUrl));
  }

  Promise.all(
    transactions.map(async (transaction) => {
      const nodeId =
        transaction.category === consts.APP_TRANS_TYPE_LOSS
          ? ''
          : await getNodeId(
              transaction.category === consts.APP_TRANS_TYPE_INCOMING
                ? transaction.source.id
                : transaction.destination.id,
            );

      const isExisting = await findTransactionByServerId(transaction.id);

      if (isExisting.length > 0) {
        // no changes
        if (syncStage === 2) {
          await store.dispatch(addTnxSyncCount());
        }
        return transaction;
      }

      const premiumsTotal = transaction.premiums;
      const allPremiums = premiumsTotal.map((p) => {
        p.premium.amount = p.amount;
        return p.premium;
      });
      const productId = await getProductId(transaction.source_batches[0]);
      const total = await getTotalPrice(transaction.price, allPremiums);

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
        created_on: transaction.created_on,
        is_verified: false,
        is_deleted: false,
        card_id: transaction.card_id,
        total,
        quality_correction: transaction.quality_correction,
        verification_method: transaction.verification_method,
        verification_longitude: transaction.verification_longitude,
        verification_latitude: transaction.verification_latitude,
        transaction_type: transaction.category,
        extra_fields: transaction.extra_fields,
      };

      const transactionId = await saveTransaction(transactionItem);
      if (syncStage === 2) {
        await store.dispatch(addTnxSyncCount());
      }
      if (transaction.category === consts.APP_TRANS_TYPE_INCOMING) {
        const batch = {
          server_id: transaction.destination_batches[0].id,
          transaction_id: transactionId,
          initial_quantity: transaction.destination_batches[0].quantity,
          current_quantity: transaction.destination_batches[0].current_quantity,
          ref_number: transaction.destination_batches[0].number,
          unit: 1,
          product_id: productId,
        };
        await saveBatch(batch);
      }

      /// saving transaction premium
      if (transaction.category !== consts.APP_TRANS_TYPE_LOSS) {
        const { premiums } = transaction;
        premiums.map(async (p) => {
          const { premium, id } = p;
          const isTransactionPremiumExist =
            await findAllTransactionPremiumByServerId(id);

          if (isTransactionPremiumExist.length === 0) {
            const existingPremium = await findPremiumByServerId(premium.id);
            const premiumId = existingPremium?.[0]?.id ?? null;

            if (premiumId) {
              const transactionPremium = {
                premium_id: existingPremium[0].id,
                transaction_id: transactionId,
                amount: premium.amount,
                server_id: id,
                category: premium.category,
                type:
                  transaction.category === consts.APP_TRANS_TYPE_INCOMING
                    ? consts.PAYMENT_OUTGOING
                    : consts.PAYMENT_INCOMING,
                verification_method: transaction.verification_method,
                receipt: transaction?.invoice ?? '',
                card_id: transaction?.card_id ?? '',
                node_id: nodeId,
                date: parseInt(transaction.created_on),
                currency: transaction.currency,
                source: transaction.destination.id,
                destination: transaction.source.id,
                verification_longitude: transaction.verification_longitude,
                verification_latitude: transaction.verification_latitude,
              };
              await saveTransactionPremium(transactionPremium);
            }
          }
        });
      }

      /// saving base price premium
      if (transaction.category !== consts.APP_TRANS_TYPE_LOSS) {
        const isBasePricePremiumExist =
          await findAllTransactionPremiumByServerId(transaction.id);
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
            card_id: transaction?.card_id ?? '',
            node_id: nodeId,
            date: parseInt(transaction.created_on),
            currency: transaction.currency,
            source: transaction.destination.id,
            destination: transaction.source.id,
            verification_longitude: transaction.verification_longitude,
            verification_latitude: transaction.verification_latitude,
          };
          await saveTransactionPremium(basePricePremium);
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
      await getBatchByServerId(batch.id, {
        current_quantity: batch.current_quantity,
      });
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
      const isExisting = await findAllTransactionPremiumByServerId(payment.id);
      if (isExisting.length === 0) {
        let premiumId = '';
        let transactionId = '';

        const premium = await findPremiumByServerId(payment.premium);
        if (premium.length !== 0) {
          premiumId = premium.id;
        }

        const transaction = await findTransactionByServerId(
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
          node_id: node.source,
          date: parseInt(payment.created_on),
          currency: payment.currency,
          source: payment.source,
          destination: payment.destination,
          verification_longitude: payment.verification_longitude,
          verification_latitude: payment.verification_latitude,
        };
        await saveTransactionPremium(transactionPremium);
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

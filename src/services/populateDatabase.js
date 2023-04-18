import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { ToastAndroid } from 'react-native';
import {
  getCompanyDetails,
  getProjectDetails,
  initSyncProcess,
  SyncProcessComplete,
  SyncProcessFailed,
} from '../redux/LoginStore';
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
  // updateTransaction,
} from './transactionsHelper';
import {
  getBatchByServerId,
  saveBatch,
  // updateBatch,
  // getAllBatchesByTransaction,
} from './batchesHelper';
import { findPremiumByServerId } from './premiumsHelper';
import { saveTransactionPremium } from './transactionPremiumHelper';
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

export const populateDatabase = async () => {
  const { syncInProgress } = store.getState().login;
  const { isConnected } = store.getState().connection;

  if (!isConnected) {
    ToastAndroid.show(
      I18n.t('no_active_internet_connection'),
      ToastAndroid.SHORT,
    );
    return;
  }

  if (syncInProgress) {
    // ToastAndroid.show(I18n.t("sync_already_in_progress"), ToastAndroid.SHORT);
    return;
  }

  await store.dispatch(initSyncProcess());

  const companyDetails = await store.dispatch(getCompanyDetails());
  if (companyDetails?.success) {
    const projectDetails = await store.dispatch(getProjectDetails());
    if (projectDetails?.success) {
      const date = new Date();
      await AsyncStorage.setItem(
        'user_details_last_update',
        date.getTime().toString(),
      );
      await syncFarmers();
    }

    store.dispatch(SyncProcessFailed('sync Failed'));
    return;
  }

  store.dispatch(SyncProcessFailed('sync Failed'));
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

    await getBuyersList(null);
    getFarmersList(null);
  } else {
    store.dispatch(SyncProcessFailed());
  }
};

const getBuyersList = async (url) => {
  let loggedInUser = await AsyncStorage.getItem('loggedInUser');
  loggedInUser = JSON.parse(loggedInUser);

  const headers = {
    Bearer: loggedInUser.token,
    'User-ID': loggedInUser.id,
    'Node-ID': loggedInUser.default_node,
    Version: DeviceInfo.getVersion(),
    'Client-Code': api.API_CLIENT_CODE,
  };

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
    return;
  }

  store.dispatch(SyncProcessFailed());
};

const getFarmersList = async (url) => {
  let loggedInUser = await AsyncStorage.getItem('loggedInUser');
  loggedInUser = JSON.parse(loggedInUser);

  const headers = {
    Bearer: loggedInUser.token,
    'User-ID': loggedInUser.id,
    'Node-ID': loggedInUser.default_node,
    Version: DeviceInfo.getVersion(),
    'Client-Code': api.API_CLIENT_CODE,
  };

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
    saveFarmers(response);
  } else {
    store.dispatch(SyncProcessFailed());
  }
};

const saveFarmers = async (response) => {
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
          await saveAllcards(allCards, cards, isExisting[0].id);
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
        await saveAllcards(allCards, cards, farmerResponse.id);
      } else {
        farmer.card_id = null;
        await saveFarmer(farmer);
      }
      return farmer;
    }),
  ).then(async () => {
    if (nextUrl != null) {
      getFarmersList(nextUrl);
    } else {
      let lastUpdatedFarmers = new Date();
      lastUpdatedFarmers = parseInt(lastUpdatedFarmers.getTime() / 1000);
      await AsyncStorage.setItem(
        'last_updated_farmers',
        lastUpdatedFarmers.toString(),
      );
      getTransactionsList(null);
    }
  });
};

const saveAllcards = async (allCards, cards, nodeId) => {
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

const getTransactionsList = async (url) => {
  let loggedInUser = await AsyncStorage.getItem('loggedInUser');
  loggedInUser = JSON.parse(loggedInUser);

  const headers = {
    Bearer: loggedInUser.token,
    'User-ID': loggedInUser.id,
    'Node-ID': loggedInUser.default_node,
    Version: DeviceInfo.getVersion(),
    'Client-Code': api.API_CLIENT_CODE,
  };

  const lastUpdatedTransactions = await AsyncStorage.getItem(
    'last_updated_transactions',
  );

  let updatedAfter = '';
  if (lastUpdatedTransactions) {
    updatedAfter = `&updated_after=${lastUpdatedTransactions}`;
  }

  const projectIdParam = `&project_id=${loggedInUser.project_id}`;

  const defaultUrl = `${api.API_URL}${api.API_VERSION}/projects/transaction/list/?limit=200&offset=0${updatedAfter}${projectIdParam}`;

  const config = {
    url: url == null ? defaultUrl : url,
    headers,
  };

  const response = await CommonFetchRequest(config);

  if (response.success) {
    saveAllTransactions(response);
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

const saveAllTransactions = async (response) => {
  // const nextUrl = response?.data?.next ?? null;
  const transactions = response?.data?.results ?? [];

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
        return transaction;
      }

      const premiumsTotal = transaction.premiums;
      const allpremiums = premiumsTotal.map((p) => {
        p.premium.amount = p.amount;
        return p.premium;
      });
      const productId = await getProductId(transaction.source_batches[0]);
      const total = await getTotalPrice(transaction.price, allpremiums);

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

      if (transaction.category !== consts.APP_TRANS_TYPE_LOSS) {
        const { premiums } = transaction;
        premiums.map(async (premium) => {
          const ids = await findPremiumByServerId(premium.premium.id);
          if (ids.length > 0) {
            const premiumId = ids[0];
            await saveTransactionPremium(
              premiumId.id,
              transactionId,
              premium.amount,
            );
          }
        });
      }
    }),
  )
    .then(async () => {
      let lastUpdatedTransactions = new Date();
      lastUpdatedTransactions = parseInt(
        lastUpdatedTransactions.getTime() / 1000,
      );
      await AsyncStorage.setItem(
        'last_updated_transactions',
        lastUpdatedTransactions.toString(),
      );
      await getAllBatches(null);
      await AsyncStorage.setItem('first_time_sync', 'false');
      store.dispatch(SyncProcessComplete());
    })
    .catch((error) => {
      Sentry.captureMessage(`error in incoming transaction syncing - ${error}`);
      store.dispatch(SyncProcessFailed());
    });
};

export const getAllBatches = async (url) => {
  let loggedInUser = await AsyncStorage.getItem('loggedInUser');
  loggedInUser = JSON.parse(loggedInUser);

  const headers = {
    Bearer: loggedInUser.token,
    'User-ID': loggedInUser.id,
    'Node-ID': loggedInUser.default_node,
    Version: DeviceInfo.getVersion(),
    'Client-Code': api.API_CLIENT_CODE,
  };

  const lastUpdatedBatches = await AsyncStorage.getItem('last_updated_batches');
  let updatedAfter = '';
  if (lastUpdatedBatches) {
    updatedAfter = `&updated_after=${lastUpdatedBatches}`;
  }

  const defaultUrl = `${api.API_URL}${api.API_VERSION}/projects/batch/details/?limit=50&offset=0${updatedAfter}`;

  const config = {
    url: url == null ? defaultUrl : url,
    headers,
  };

  const response = await CommonFetchRequest(config);

  if (response.success) {
    saveAllBatches(response);
  } else {
    store.dispatch(SyncProcessFailed());
  }
};

const saveAllBatches = async (response) => {
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
    if (nextUrl != null) {
      getAllBatches(nextUrl);
    } else {
      let lastUpdatedBatches = new Date();
      lastUpdatedBatches = parseInt(lastUpdatedBatches.getTime() / 1000);
      await AsyncStorage.setItem(
        'last_updated_batches',
        lastUpdatedBatches.toString(),
      );
    }
  });
};

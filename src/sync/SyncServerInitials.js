/* eslint-disable no-shadow */
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { SyncProcessComplete, SyncProcessFailed } from '../redux/LoginStore';
import { updateSyncStage } from '../redux/SyncStore';
import { store } from '../redux/store';
import { CommonFetchRequest } from '../api/middleware';
import {
  updateFarmer,
  fetchAllFarmers,
  createFarmer,
} from '../db/services/FarmerHelper';
import {
  fetchProductByServerId,
  createProduct,
  updateProduct,
} from '../db/services/ProductsHelper';
import {
  searchPremiumByServerId,
  createPremium,
  updatePremium,
} from '../db/services/PremiumsHelper';
import {
  fetchAllCards,
  fetchCardsByNodeId,
  createCard,
  updateCard,
} from '../db/services/CardHelper';
import {
  createProductPremium,
  deleteAllPremiumByProduct,
} from '../db/services/ProductPremiumHelper';
import { startTransactionSync } from './SyncServerTransactions';
import api from '../api/config';
import { jsonToString } from '../services/commonFunctions';
import { PREMIUM_OPTIONS } from '../services/constants';
import captureSentry from '../services/sentryHelper';

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

  const patch200723 = await AsyncStorage.getItem('patch_200723');
  if (!patch200723 || patch200723 !== 'true') {
    updatedAfter = '';
    await AsyncStorage.setItem('patch_200723', 'true');
  }

  const config = {
    url: `${api.API_URL}${api.API_VERSION}/projects/projects/premiums/${updatedAfter}`,
    headers,
  };

  const response = await CommonFetchRequest(config);
  if (response.success) {
    const premiums = response.data.results;

    premiums.map(async (premium) => {
      const premiumOptions = premium.options || [];
      const options = jsonToString(premiumOptions);
      premium.options = options;

      if (
        premium?.calculation_type === PREMIUM_OPTIONS &&
        premiumOptions.length === 0
      ) {
        captureSentry('message', `option premium without options found: ${premium.id}`);
        premium.is_active = false;
      }

      const isExisting = await searchPremiumByServerId(premium.id);
      if (isExisting.length === 0) {
        await createPremium(premium);
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
      const { premiums, id } = product;

      const isExisting = await fetchProductByServerId(id);
      if (isExisting.length === 0) {
        await createProduct(product);
      } else {
        await updateProduct(isExisting[0].id, product);
      }

      // updating product_premiums
      if (premiums) {
        // there is change in premiums, so recreating premiums for this product
        await deleteAllPremiumByProduct(id);
        premiums.map(async (premium) => {
          await createProductPremium(id, premium);
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
  const allFarmers = await fetchAllFarmers();
  const allCards = await fetchAllCards();

  Promise.all(
    farmers.map(async (farmer) => {
      const updates = farmer;

      let phone = updates.phone || '';
      if (typeof phone === 'object') {
        phone = `${phone?.dial_code ?? ''} ${phone?.phone ?? ''}`.trim();
        updates.phone = phone;
      }

      updates.ktp = farmer.id_no;
      updates.phone = phone;
      updates.name = updates.name.trim();
      updates.updated_on = Math.round(Date.now() / 1000);
      updates.created_on = parseInt(updates.created_on);
      updates.server_id = updates.id;

      const isExisting = allFarmers.filtered('server_id == $0', farmer.id);

      if (isExisting.length > 0) {
        if (farmer.cards !== undefined && farmer.cards.length > 0) {
          updates.card_id = farmer.cards[0].card_id;

          await updateFarmer(isExisting[0].id, updates);

          const { cards } = farmer;
          await saveAllCards(allCards, cards, isExisting[0].id);
        } else {
          // removing already assigned card for this node
          const alreadyAssignedCards = await fetchCardsByNodeId(
            isExisting[0].id,
          );
          if (alreadyAssignedCards.length > 0) {
            const update = {
              node_id: '',
            };
            await updateCard(alreadyAssignedCards[0].id, update);
          }

          await updateFarmer(isExisting[0].id, updates);
        }
      } else if (farmer?.cards && farmer.cards.length > 0) {
        farmer.card_id = farmer.cards[0].card_id;
        const farmerResponse = await createFarmer(farmer);

        const { cards } = farmer;
        await saveAllCards(allCards, cards, farmerResponse.id);
      } else {
        farmer.card_id = '';
        await createFarmer(farmer);
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
  const isCardExisting = allCards.filtered('card_id == $0', card.card_id);

  const alreadyAssignedCards = await fetchCardsByNodeId(nodeId);

  // removing already assigned card for this node
  if (alreadyAssignedCards.length > 0) {
    const updates = {
      node_id: '',
    };

    await updateCard(alreadyAssignedCards[0].id, updates);
  }

  if (isCardExisting.length === 0) {
    const cardDetails = {
      node_id: nodeId,
      server_id: card.id,
      card_id: card.card_id,
      fair_id: card?.fairid ?? '',
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000),
    };

    await createCard(cardDetails);
  } else {
    const updates = {
      node_id: nodeId,
      fair_id: card?.fairid ?? '',
      server_id: card.id,
    };

    await updateCard(isCardExisting[0].id, updates);
  }
};

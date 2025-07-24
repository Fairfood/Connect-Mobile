import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncProcessComplete, SyncProcessFailed } from '../redux/LoginStore';
import {
  addFarmerSyncCount,
  closeIndividualSyncingStatus,
  completeFarmerSyncing,
  startFarmerSyncing,
  updateFarmerSyncNextUrl,
  updateFarmerSyncPrevTotal,
  updateFarmerSyncTotal,
  updateSyncStage,
} from '../redux/SyncStore';
import { store } from '../redux/store';
import { Middleware } from '../api/middleware';
import {
  updateFarmer,
  createFarmer,
  fetchFarmerByServerId,
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
  fetchCardsByNodeId,
  createCard,
  updateCard,
  fetchCardWithCombo,
} from '../db/services/CardHelper';
import {
  createProductPremium,
  deleteAllPremiumByProduct,
} from '../db/services/ProductPremiumHelper';
import { startTransactionSync } from './SyncServerTransactions';
import { handleErrors } from '../utils/commonFunctions';
import { jsonToString } from '../utils/helperFunctions';
import {
  API_DEFAULT_LIMIT,
  PREMIUM_OPTIONS,
  PREMIUM_RANGE,
} from '../utils/constants';

const updatePremiumValues = async (premium) => {
  const calculationType = premium?.calculation_type ?? null;
  if (
    calculationType === PREMIUM_OPTIONS ||
    calculationType === PREMIUM_RANGE
  ) {
    let premiumOptions = [];
    if (calculationType === PREMIUM_OPTIONS && premium.options) {
      premiumOptions = premium.options;
    } else if (calculationType === PREMIUM_RANGE && premium.ranges) {
      premiumOptions = premium.ranges;
    }

    const options = jsonToString(premiumOptions);
    premium.options = options;

    if (premiumOptions.length === 0) {
      handleErrors(
        new Error(
          `option/range premium without options/ranges found: ${premium.id}`,
        ),
        {
          ref: 'SyncServerInitials_getPremiumList',
        },
      );
      premium.is_active = false;
    }
  } else {
    premium.options = jsonToString([]);
  }
  premium.amount_corrected = premium.amount;

  return premium;
};

export const getPremiumList = async (url = null) => {
  try {
    const lastUpdatedPremiums = await AsyncStorage.getItem(
      'last_updated_premiums',
    );

    const updatedAfter = lastUpdatedPremiums
      ? `?updated_after=${parseInt(lastUpdatedPremiums)}`
      : '';

    const config = {
      method: 'GET',
      urlKey: `catalogs/premiums/${updatedAfter}`,
      url,
      contentType: 'application/json',
    };

    const response = await Middleware(config);
    if (!response.success) {
      throw new Error(response.error);
    }

    const nextUrl = response?.data?.next ?? null;
    const premiums = response?.data?.results ?? [];
    await Promise.all(
      premiums.map(async (premium) => {
        const updatedPremium = await updatePremiumValues(premium);
        const isExisting = await searchPremiumByServerId(updatedPremium.id);

        if (isExisting.length === 0) {
          await createPremium(updatedPremium);
        } else {
          await updatePremium(isExisting[0].id, updatedPremium);
        }
      }),
    );

    if (nextUrl !== null) {
      getPremiumList(nextUrl);
    } else {
      await AsyncStorage.setItem(
        'last_updated_premiums',
        Math.floor(new Date().getTime() / 1000).toString(),
      );
      getProductsList(null);
    }
  } catch (error) {
    store.dispatch(closeIndividualSyncingStatus());
    store.dispatch(SyncProcessFailed());
    handleErrors(error, {
      ref: 'SyncServerInitials_getPremiumList',
    });
  }
};

export const getProductsList = async (url = null) => {
  try {
    const lastUpdatedProducts = await AsyncStorage.getItem(
      'last_updated_products',
    );
    const updatedAfter = lastUpdatedProducts
      ? `&updated_after=${parseInt(lastUpdatedProducts)}`
      : '';

    const config = {
      method: 'GET',
      urlKey: `catalogs/products/?status=all${updatedAfter}`,
      url,
      contentType: 'application/json',
    };

    const response = await Middleware(config);
    if (!response.success) {
      throw new Error(response.error);
    }

    const nextUrl = response?.data?.next ?? null;
    const products = response?.data?.results ?? [];

    await Promise.all(
      products.map(async (product) => {
        const { premiums, id } = product;
        product.price_corrected = product.price;

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
      }),
    );

    if (nextUrl !== null) {
      getProductsList(nextUrl);
    } else {
      await AsyncStorage.setItem(
        'last_updated_products',
        Math.floor(new Date().getTime() / 1000).toString(),
      );

      const { syncStage, farmerSyncNextUrl } = store.getState().sync;
      if (syncStage === 1) {
        await store.dispatch(startFarmerSyncing());
      }

      getFarmersList(farmerSyncNextUrl);
    }
  } catch (error) {
    store.dispatch(closeIndividualSyncingStatus());
    store.dispatch(SyncProcessFailed());
    handleErrors(error, {
      ref: 'SyncServerInitials_getProductsList',
    });
  }
};

const getFarmersList = async (url) => {
  try {
    const lastUpdatedFarmers = await AsyncStorage.getItem(
      'last_updated_farmers',
    );
    const updatedAfter = lastUpdatedFarmers
      ? `&updated_after=${parseInt(lastUpdatedFarmers)}`
      : '';

    const config = {
      method: 'GET',
      urlKey: `supply-chains/farmers/?limit=${API_DEFAULT_LIMIT}&offset=0${updatedAfter}`,
      url,
      contentType: 'application/json',
    };

    const response = await Middleware(config);
    if (!response.success) {
      throw new Error(response.error);
    }
    saveFarmers(response);
  } catch (error) {
    store.dispatch(closeIndividualSyncingStatus());
    store.dispatch(SyncProcessFailed());
    handleErrors(error, {
      ref: 'SyncServerInitials_getFarmersList',
    });
  }
};

const extractPhoneNumber = async (phone, type = 'number') => {
  let userPhoneNumber = phone;
  if (!userPhoneNumber || !userPhoneNumber.includes(' ')) {
    return userPhoneNumber;
  }

  const userCountryCode = userPhoneNumber.trim().split(' ')[0];
  if (type === 'code') {
    return userCountryCode.replace('+', '');
  }

  if (type === 'number') {
    userPhoneNumber = userPhoneNumber.replace(userCountryCode, '');
    userPhoneNumber = userPhoneNumber.replace(/ /g, '');
    userPhoneNumber = userPhoneNumber.replace(/-/g, '');
    return userPhoneNumber;
  }
};

const saveFarmers = async (response) => {
  try {
    const nextUrl = response?.data?.next ?? null;
    const farmers = response?.data?.results ?? [];
    const farmerCount = response?.data?.count ?? 0;
    const { syncStage, farmerSyncTotal, farmerSyncPrevTotal } =
      store.getState().sync;

    if (syncStage === 1) {
      if (farmerSyncTotal === 0) {
        const currentTotal =
          farmerSyncPrevTotal !== 0 ? farmerSyncPrevTotal : farmerCount;
        await store.dispatch(updateFarmerSyncTotal(currentTotal));
      }
      await store.dispatch(updateFarmerSyncNextUrl(nextUrl));
    }

    await Promise.all(
      farmers.map(async (farmer) => {
        const updates = farmer;

        const userPhone = farmer.phone || '';
        if (userPhone) {
          if (typeof userPhone === 'object') {
            updates.phone = `${userPhone?.dial_code ?? ''} ${
              userPhone?.phone ?? ''
            }`.trim();
          } else {
            const code = (await extractPhoneNumber(userPhone, 'code')) || null;
            const number =
              (await extractPhoneNumber(userPhone, 'number')) || null;
            updates.phone = code && number ? `+${code} ${number}`.trim() : '';
          }
        }

        updates.name = farmer.first_name ? farmer.first_name.trim() : '';
        updates.updated_on = Math.round(Date.now() / 1000);
        updates.created_on = parseInt(farmer.created_on);
        updates.server_id = updates.id;
        updates.card_id = farmer?.entity_card?.card?.card_id ?? '';
        updates.display_id = farmer?.entity_card?.card?.display_id ?? '';

        let extraFields = farmer.submission || '';
        if (typeof extraFields === 'object') {
          extraFields = jsonToString([extraFields]);
        }
        updates.extra_fields = extraFields;

        const isExisting = await fetchFarmerByServerId(farmer.id);
        if (isExisting.length > 0) {
          await updateFarmer(isExisting[0].id, updates);
          await handleFarmerCard(isExisting[0].id, farmer.entity_card);
        } else {
          const farmerResponse = await createFarmer(updates);
          await handleFarmerCard(farmerResponse.id, farmer.entity_card);
        }

        if (syncStage === 1) {
          await store.dispatch(addFarmerSyncCount());
        }

        return farmer;
      }),
    );

    concludeFarmerSync(nextUrl);
  } catch (error) {
    handleErrors(error, {
      ref: 'SyncServerInitials_saveFarmers',
    });
  }
};

const concludeFarmerSync = async (nextUrl) => {
  const { syncStage, farmerSyncTotal, farmerSyncCount } = store.getState().sync;

  if (syncStage === 1) {
    const alreadySyncedCount =
      parseInt(farmerSyncTotal) - parseInt(farmerSyncCount);
    store.dispatch(updateFarmerSyncPrevTotal(alreadySyncedCount));
  }

  if (nextUrl !== null) {
    getFarmersList(nextUrl);
  } else {
    await AsyncStorage.setItem(
      'last_updated_farmers',
      Math.floor(new Date().getTime() / 1000).toString(),
    );

    if (syncStage === 1) {
      store.dispatch(completeFarmerSyncing());
      store.dispatch(updateSyncStage(2));
      store.dispatch(SyncProcessComplete());
    } else {
      startTransactionSync(null);
    }
  }
};

const handleFarmerCard = async (farmerId, cardDetails = null) => {
  try {
    const id = cardDetails?.card?.id ?? '';
    const cardId = cardDetails?.card?.card_id ?? '';
    const displayId = cardDetails?.card?.display_id ?? '';

    const alreadyAssignedCards = await fetchCardsByNodeId(farmerId);

    if (alreadyAssignedCards.length > 0) {
      const updates = {
        node_id: '',
      };

      if (
        !cardDetails ||
        (cardDetails && alreadyAssignedCards[0].card_id !== cardId) ||
        (cardDetails && alreadyAssignedCards[0].display_id !== displayId)
      ) {
        await updateCard(alreadyAssignedCards[0].id, updates);
      }
    }

    if (cardDetails) {
      const isCardExist = await fetchCardWithCombo(cardId, displayId);

      if (isCardExist.length === 0) {
        const cardDetails = {
          node_id: farmerId,
          server_id: id,
          card_id: cardId,
          display_id: displayId,
          is_active: true,
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
        };

        await createCard(cardDetails);
      } else {
        const updates = {
          node_id: farmerId,
          server_id: id,
        };

        await updateCard(isCardExist[0].id, updates);
      }
    }
  } catch (error) {
    handleErrors(error, {
      ref: 'SyncServerInitials_handleFarmerCard',
    });
  }
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Middleware } from '../api/middleware';
import { SyncProcessFailed, manageSyncData } from '../redux/LoginStore';
import { store } from '../redux/store';
import {
  findAllNewFarmers,
  findAllUpdatedFarmers,
  findAndUpdateFarmerImage,
  findFarmer,
  fetchFarmerByServerId,
  findAllUnUploadedFarmerPictures,
  updateFarmerServerId,
  updateFarmerModifiedStatus,
} from '../db/services/FarmerHelper';
import { syncDeletedTransactions } from './SyncTransactions';
import {
  getAllUnSyncCards,
  updateCardServerID,
} from '../db/services/CardHelper';
import { handleErrors } from '../utils/commonFunctions';
import { stringToJson } from '../utils/helperFunctions';
import {
  findAllTransactionPremiumByCardID,
  findAllTransactionPremiumByDestination,
  updateTransactionPremiumCard,
  updateTransactionPremiumDestination,
} from '../db/services/TransactionPremiumHelper';
import {
  closeIndividualSyncingStatus,
  updateCardSyncingStatus,
  updateFarmerSyncingStatus,
} from '../redux/SyncStore';

export const syncAllFarmers = async () => {
  try {
    let lastSyncedTime = new Date();
    lastSyncedTime = parseInt(lastSyncedTime.getTime() / 1000);
    await AsyncStorage.setItem('last_synced_time', lastSyncedTime.toString());

    const nodes = await findAllNewFarmers();

    await Promise.all(
      nodes.map(async (node) => {
        let phone = node.phone.trim();
        phone = phone.includes(' ') ? phone : '';

        let extraFields = node.extra_fields;
        if (extraFields !== '' && typeof extraFields === 'string') {
          extraFields = stringToJson(extraFields);
          extraFields = extraFields.length > 0 ? extraFields[0] : null;
        }

        const data = {
          first_name: node.name,
          last_name: '',
          street: node.street,
          city: node.city,
          province: node.province,
          country: node.country,
          latitude: node.latitude_corrected_corrected,
          longitude: node.longitude_corrected_corrected,
          zipcode: node.zipcode,
          phone,
          email: null,
          reference_number: node.reference_number,
        };

        if (extraFields) {
          data.submission = extraFields;
        }

        const config = {
          method: 'POST',
          urlKey: 'supply-chains/farmers/',
          contentType: 'application/json',
          data,
        };

        const response = await Middleware(config);

        if (!response.success) {
          store.dispatch(manageSyncData('farmer', 'failed'));
          return node;
        }

        const serverId = response.data.id;
        const isExisting = await fetchFarmerByServerId(serverId);
        if (isExisting.length === 0) {
          // updating farmer server_id in node table
          await updateFarmerServerId(node.id, serverId);

          // finding all transaction premium with local node_id and updating with server_id
          const destinations = await findAllTransactionPremiumByDestination(
            node.id,
          );
          if (destinations.length > 0) {
            await destinations.map(async (destination) => {
              await updateTransactionPremiumDestination(
                destination.id,
                serverId,
              );
            });
          }
        }
        store.dispatch(manageSyncData('farmer', 'success'));
        return node;
      }),
    );

    store.dispatch(updateFarmerSyncingStatus(false));

    const pendingNodes = await findAllNewFarmers();
    if (pendingNodes.length > 0) {
      store.dispatch(SyncProcessFailed());
      store.dispatch(closeIndividualSyncingStatus());
      return;
    }

    syncFarmerPictures();
  } catch (error) {
    store.dispatch(closeIndividualSyncingStatus());
    store.dispatch(SyncProcessFailed());
    handleErrors(error, {
      ref: 'SyncFarmers_syncAllFarmers',
    });
  }
};

export const syncFarmerPictures = async () => {
  try {
    const data = new FormData();
    const nodes = await findAllUnUploadedFarmerPictures();
    await Promise.all(
      nodes.map(async (node) => {
        const { image } = node;

        if (image.includes('file://')) {
          const filename = image.replace(/^.*[\\/]/, '');
          const imageData = { name: filename, type: 'image/jpg', uri: image };
          data.append('image', imageData);
        }

        const config = {
          method: 'PATCH',
          urlKey: `supply-chains/farmers/${node.server_id}/`,
          contentType: 'multipart/form-data',
          data,
        };

        const response = await Middleware(config);

        if (response?.success) {
          await findAndUpdateFarmerImage(node.id, response?.data?.image ?? '');
        }

        return node;
      }),
    );

    syncCards();
  } catch (error) {
    store.dispatch(closeIndividualSyncingStatus());
    store.dispatch(SyncProcessFailed());
    handleErrors(error, {
      ref: 'SyncFarmers_syncFarmerPictures',
    });
  }
};

export const syncCards = async () => {
  try {
    const cards = await getAllUnSyncCards();

    await Promise.all(
      cards.map(async (card) => {
        const node = await findFarmer(card.node_id);

        const cardObj = {};
        if (card.card_id) {
          cardObj.card_id = card.card_id;
        }
        if (card.display_id) {
          cardObj.display_id = card.display_id;
        }
        const data = {
          entity: node.server_id,
          card: cardObj,
        };

        const config = {
          method: 'POST',
          urlKey: 'supply-chains/entity-cards/',
          contentType: 'application/json',
          data,
        };

        const response = await Middleware(config);

        if (response.success) {
          const serverId = response?.data?.card?.id ?? '';
          await updateCardServerID(card.id, serverId);

          // finding all transaction premium with local card_id and updating with server_id
          const transactions = await findAllTransactionPremiumByCardID(card.id);

          if (transactions.length > 0) {
            await transactions.map(async (tx) => {
              await updateTransactionPremiumCard(tx.id, serverId);
            });
          }
        }

        return card;
      }),
    );

    store.dispatch(updateCardSyncingStatus(false));

    const pendingCards = await getAllUnSyncCards();
    if (pendingCards.length > 0) {
      store.dispatch(SyncProcessFailed());
      store.dispatch(closeIndividualSyncingStatus());
      return;
    }

    syncUpdatedFarmers();
  } catch (error) {
    store.dispatch(SyncProcessFailed());
    store.dispatch(closeIndividualSyncingStatus());
    handleErrors(error, {
      ref: 'SyncFarmers_syncCards',
    });
  }
};

export const syncUpdatedFarmers = async () => {
  try {
    const nodes = await findAllUpdatedFarmers();

    await Promise.all(
      nodes.map(async (node) => {
        let phone = node.phone.trim();
        phone = phone.includes(' ') ? phone : '';

        const formData = new FormData();
        formData.append('first_name', node.name);
        formData.append('last_name', '');
        formData.append('phone', phone);
        formData.append('street', node.street);
        formData.append('city', node.city);
        formData.append('province', node.province);
        formData.append('country', node.country);
        formData.append('zipcode', node.zipcode);
        formData.append('updated_on', node.updated_on / 1000);
        formData.append('reference_number', node.reference_number);

        const { image } = node;
        if (image.includes('file://')) {
          const filename = image.replace(/^.*[\\/]/, '');
          const imageData = { name: filename, type: 'image/jpg', uri: image };
          formData.append('image', imageData);
        }

        const config = {
          method: 'PATCH',
          urlKey: `supply-chains/farmers/${node.server_id}/`,
          contentType: 'multipart/form-data',
          data: formData,
        };

        const response = await Middleware(config);

        if (!response.success) {
          store.dispatch(manageSyncData('farmer', 'failed'));
          return node;
        }

        await updateFarmerModifiedStatus(node.id, false);
        store.dispatch(manageSyncData('farmer', 'success'));
        return node;
      }),
    );

    const pendingNodes = await findAllUpdatedFarmers();

    if (pendingNodes.length > 0) {
      store.dispatch(SyncProcessFailed());
      store.dispatch(closeIndividualSyncingStatus());
      return;
    }

    syncDeletedTransactions();
  } catch (error) {
    store.dispatch(closeIndividualSyncingStatus());
    store.dispatch(SyncProcessFailed());
    handleErrors(error, {
      ref: 'SyncFarmers_syncCards',
    });
  }
};

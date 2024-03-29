import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { CommonFetchRequest } from '../api/middleware';
import { SyncProcessFailed, manageSyncData } from '../redux/LoginStore';
import { store } from '../redux/store';
import {
  findAllNewFarmers,
  findAllUpdatedFarmers,
  findAndUpdateFarmer,
  findAndUpdateFarmerDetails,
  findAndUpdateFarmerImage,
  findFarmerById,
  findFarmerByServerId,
} from './farmersHelper';
import { getPremiumList } from './populateDatabase';
import { syncTransactions } from './syncTransactions';
import { getAllUnSyncCards, updateCardServerID } from './cardsHelper';
import { stringToJson } from './commonFunctions';
import api from '../api/config';
import {
  findAllTransactionPremiumByDestination,
  updateTransactionPremiumDestination,
} from './transactionPremiumHelper';

export const syncFarmers = async () => {
  let lastSyncedTime = new Date();
  lastSyncedTime = parseInt(lastSyncedTime.getTime() / 1000);
  await AsyncStorage.setItem('last_synced_time', lastSyncedTime.toString());

  const nodes = await findAllNewFarmers();

  let loggedInUser = await AsyncStorage.getItem('loggedInUser');
  loggedInUser = JSON.parse(loggedInUser);

  const headers = {
    Bearer: loggedInUser.token,
    'Content-Type': 'application/json',
    'User-ID': loggedInUser.id,
    'Node-ID': loggedInUser.default_node,
    'Project-ID': loggedInUser.project_id,
    Version: DeviceInfo.getVersion(),
    'Client-Code': api.API_CLIENT_CODE,
  };

  return Promise.all(
    nodes.map(async (node) => {
      let phone = node.phone.trim();
      phone = phone.includes(' ') ? phone : '';

      let extraFields = node.extra_fields;
      if (extraFields) {
        if (typeof extraFields === 'string') {
          extraFields = JSON.stringify(stringToJson(extraFields));
        } else if (typeof extraFields === 'object') {
          extraFields = JSON.stringify(extraFields);
        }
      }

      const data = {
        first_name: node.name,
        last_name: '',
        identification_no: 'PK19CKNB0026090600700101',
        street: node.street,
        city: node.city,
        province: node.province,
        country: node.country,
        latitude: node.latitude,
        longitude: node.longitude,
        zipcode: node.zipcode,
        phone,
        email: null,
        id_no: node.ktp,
        extra_fields: extraFields,
      };

      const config = {
        method: 'POST',
        url: `${api.API_URL}${api.API_VERSION}/projects/farmer/invite/`,
        headers,
        data,
      };

      const response = await CommonFetchRequest(config);

      if (response?.success) {
        const serverId = response.data.id;
        const isExisting = await findFarmerByServerId(serverId);
        if (isExisting.length === 0) {
          // updating farmer server_id in node table
          await findAndUpdateFarmer(node.id, serverId);

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

          // uploading farmer image
          if (node.image !== '') {
            await uploadProfilePicture(serverId, node);
          }
        }
        store.dispatch(manageSyncData('farmer', 'success'));
      } else {
        store.dispatch(manageSyncData('farmer', 'failed'));
      }

      return node;
    }),
  )
    .then(async () => {
      const pendingNodes = await findAllNewFarmers();
      if (pendingNodes.length > 0) {
        store.dispatch(SyncProcessFailed());
        return;
      }

      syncCards(headers);
    })
    .catch(() => {
      store.dispatch(SyncProcessFailed());
    });
};

export const syncCards = async (headers) => {
  const cards = await getAllUnSyncCards();

  Promise.all(
    cards.map(async (card) => {
      const node = await findFarmerById(card.node_id);

      const data = JSON.stringify({
        node: node.server_id,
        card_id: card.card_id,
      });

      const config = {
        method: 'POST',
        url: `${api.API_URL}${api.API_VERSION}/projects/card/`,
        headers,
        data,
      };

      const response = await CommonFetchRequest(config);

      if (response?.success) {
        await updateCardServerID(card.id, response.data.id);
      }

      return card;
    }),
  )
    .then(async () => {
      const pendingCards = await getAllUnSyncCards();
      if (pendingCards.length > 0) {
        store.dispatch(SyncProcessFailed());
        return;
      }

      syncTransactions();
    })
    .catch(() => {
      store.dispatch(SyncProcessFailed());
    });
};

export const uploadProfilePicture = async (userId, node) => {
  let loggedInUser = await AsyncStorage.getItem('loggedInUser');
  loggedInUser = JSON.parse(loggedInUser);

  const headers = {
    Bearer: loggedInUser.token,
    'Content-Type': 'application/json',
    'User-ID': loggedInUser.id,
    'Node-ID': loggedInUser.default_node,
    'Project-ID': loggedInUser.project_id,
    Version: DeviceInfo.getVersion(),
    'Client-Code': api.API_CLIENT_CODE,
  };

  const formData = new FormData();

  const { image } = node;
  if (image.includes('file://')) {
    const filename = image.replace(/^.*[\\/]/, '');
    const imageData = { name: filename, type: 'image/jpg', uri: image };
    formData.append('image', imageData);
  }

  const config = {
    method: 'PATCH',
    url: `${api.API_URL}${api.API_VERSION}/projects/farmer/${userId}/`,
    headers,
    data: formData,
  };

  const response = await CommonFetchRequest(config);

  if (response?.success) {
    await findAndUpdateFarmerImage(node.id, response.data.image);
  }
};

export const updateAllFarmerDetails = async () => {
  const nodes = await findAllUpdatedFarmers();
  nodes.reverse();

  let loggedInUser = await AsyncStorage.getItem('loggedInUser');
  loggedInUser = JSON.parse(loggedInUser);

  const headers = {
    Bearer: loggedInUser.token,
    'Content-Type': 'application/json',
    'User-ID': loggedInUser.id,
    'Node-ID': loggedInUser.default_node,
    'Project-ID': loggedInUser.project_id,
    Version: DeviceInfo.getVersion(),
    'Client-Code': api.API_CLIENT_CODE,
  };

  return Promise.all(
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
      formData.append('id_no', node.ktp);

      let extraFields = node.extra_fields;
      if (extraFields) {
        if (typeof extraFields === 'string') {
          extraFields = JSON.stringify(stringToJson(extraFields));
          formData.append('extra_fields', extraFields);
        } else if (typeof extraFields === 'object') {
          extraFields = JSON.stringify(extraFields);
          formData.append('extra_fields', extraFields);
        }
      }

      const { image } = node;
      if (image.includes('file://')) {
        const filename = image.replace(/^.*[\\/]/, '');
        const imageData = { name: filename, type: 'image/jpg', uri: image };
        formData.append('image', imageData);
      }

      const config = {
        method: 'PATCH',
        url: `${api.API_URL}${api.API_VERSION}/projects/farmer/${node.server_id}/`,
        headers,
        data: formData,
      };

      const response = await CommonFetchRequest(config);
      const { success, data } = response;

      if (success) {
        data.is_modified = false;

        if (data.cards.length > 0) {
          findAndUpdateFarmerDetails(node.id, data, data.cards[0].card_id);
        } else {
          findAndUpdateFarmerDetails(node.id, data, '');
        }
        store.dispatch(manageSyncData('farmer', 'success'));
      } else {
        store.dispatch(manageSyncData('farmer', 'failed'));
        return node;
      }
    }),
  )
    .then(async () => {
      const pendingNodes = await findAllUpdatedFarmers();

      if (pendingNodes.length > 0) {
        store.dispatch(SyncProcessFailed());
        return;
      }

      getPremiumList();
    })
    .catch(() => {
      store.dispatch(SyncProcessFailed());
    });
};

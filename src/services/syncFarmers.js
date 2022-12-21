import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { CommonFetchRequest } from '../api/middleware';
import {
  initSyncProcess,
  SyncProcessFailed,
  manageSyncData,
} from '../redux/LoginStore';
import { store } from '../redux/store';
import {
  findAllNewFarmers,
  findAllUpdatedFarmers,
  findAndupdateFarmer,
  findAndUpdateFarmerDetails,
  findAndUpdateFarmerImage,
  findFarmerById,
  findFarmerByServerId,
} from './farmersHelper';
import { getProductsList } from './populateDatabase';
import { syncTransactions } from './syncTransactions';
import { getAllUnSyncCards, updateCardServerID } from './cardsHelper';
import { stringToJson } from './commonFunctions';
import api from '../api/config';

export const syncFarmers = async () => {
  store.dispatch(initSyncProcess());

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
    'Client-Code': api.CLIENT_CODE,
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
          await findAndupdateFarmer(node.id, serverId);
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

      await syncCards();
    })
    .catch(() => {
      store.dispatch(SyncProcessFailed());
    });
};

export const syncCards = async () => {
  let loggedInUser = await AsyncStorage.getItem('loggedInUser');
  loggedInUser = JSON.parse(loggedInUser);

  const headers = {
    Bearer: loggedInUser.token,
    'Content-Type': 'application/json',
    'User-ID': loggedInUser.id,
    'Node-ID': loggedInUser.default_node,
    'Project-ID': loggedInUser.project_id,
    Version: DeviceInfo.getVersion(),
    'Client-Code': api.CLIENT_CODE,
  };

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

      await syncTransactions();
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
    'Client-Code': api.CLIENT_CODE,
  };

  const formdata = new FormData();

  const { image } = node;
  if (image.includes('file://')) {
    const filename = image.replace(/^.*[\\/]/, '');
    const imageData = { name: filename, type: 'image/jpg', uri: image };
    formdata.append('image', imageData);
  }

  const config = {
    method: 'PATCH',
    url: `${api.API_URL}${api.API_VERSION}/projects/farmer/${userId}/`,
    headers,
    data: formdata,
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
    'Client-Code': api.CLIENT_CODE,
  };

  return Promise.all(
    nodes.map(async (node) => {
      let phone = node.phone.trim();
      phone = phone.includes(' ') ? phone : '';

      const formdata = new FormData();
      formdata.append('first_name', node.name);
      formdata.append('last_name', '');
      formdata.append('phone', phone);
      formdata.append('street', node.street);
      formdata.append('city', node.city);
      formdata.append('province', node.province);
      formdata.append('country', node.country);
      formdata.append('zipcode', node.zipcode);
      formdata.append('updated_on', node.updated_on / 1000);
      formdata.append('id_no', node.ktp);

      let extraFields = node.extra_fields;
      if (extraFields) {
        if (typeof extraFields === 'string') {
          extraFields = JSON.stringify(stringToJson(extraFields));
          formdata.append('extra_fields', extraFields);
        } else if (typeof extraFields === 'object') {
          extraFields = JSON.stringify(extraFields);
          formdata.append('extra_fields', extraFields);
        }
      }

      const { image } = node;
      if (image.includes('file://')) {
        const filename = image.replace(/^.*[\\/]/, '');
        const imageData = { name: filename, type: 'image/jpg', uri: image };
        formdata.append('image', imageData);
      }

      const config = {
        method: 'PATCH',
        url: `${api.API_URL}${api.API_VERSION}/projects/farmer/${node.server_id}/`,
        headers,
        data: formdata,
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

      getProductsList();
    })
    .catch(() => {
      store.dispatch(SyncProcessFailed());
    });
};

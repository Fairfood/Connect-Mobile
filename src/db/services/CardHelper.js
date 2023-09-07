/* eslint-disable camelcase */
import { realm } from '../Configuration';
import captureSentry from '../../services/sentryHelper';
import { removeNullValues } from '../../services/commonFunctions';

export const fetchAllCards = async () => {
  // _getAllCards
  try {
    const cards = realm.objects('Card');
    return cards;
  } catch (error) {
    captureSentry('error', error);
  }
};

export const createCard = async (obj) => {
  try {
    const cardObj = await removeNullValues(obj);
    if (cardObj.id) {
      delete cardObj.id;
    }

    const response = realm.write(() => {
      return realm.create('Card', cardObj);
    });

    return response.id;
  } catch (error) {
    captureSentry('error', error);
  }
};

export const updateCard = async (id, updates) => {
  try {
    const obj = realm.objectForPrimaryKey('Card', id);
    if (!obj) {
      throw new Error(`Card with ID ${id} not found`);
    }

    const updateObj = await removeNullValues(updates);
    updateObj.id = obj.id;

    realm.write(() => {
      realm.create('Card', updateObj, 'modified');
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const updateCardServerID = async (id, serverId) => {
  try {
    const obj = realm.objectForPrimaryKey('Card', id);
    if (!obj) {
      throw new Error(`Card with ID ${id} not found`);
    }

    realm.write(() => {
      obj.server_id = serverId;
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const getAllUnSyncCards = async () => {
  try {
    return realm.objects('Card').filtered('server_id == "" && node_id != ""');
  } catch (error) {
    captureSentry('error', error);
  }
};

export const fetchCardsByNodeId = async (nodeId) => {
  try {
    return realm.objects('Card').filtered('node_id == $0', nodeId);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const fetchCardByCardId = async (cardId) => {
  try {
    return realm.objects('Card').filtered('card_id == $0', cardId);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findCardByServerId = async (serverId) => {
  try {
    return realm.objects('Card').filtered('server_id == $0', serverId);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const updateCardNodeID = async (id, updates) => {
  try {
    const obj = realm.objectForPrimaryKey('Card', id);
    if (!obj) {
      throw new Error(`Card with ID ${id} not found`);
    }

    const { node_id, fair_id, server_id } = updates;

    realm.write(() => {
      obj.node_id = node_id;
      obj.fair_id = fair_id;
      obj.server_id = server_id;
      obj.updated_at = Math.round(new Date().getTime() / 1000);
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findCard = async (id) => {
  try {
    const obj = realm.objectForPrimaryKey('Card', id);
    if (!obj) {
      throw new Error(`Card with ID ${id} not found`);
    }

    return obj;
  } catch (error) {
    captureSentry('error', error);
  }
};

export const searchCardById = async (id) => {
  try {
    return realm.objects('Card').filtered('id == $0', id);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const countUnSyncCards = async () => {
  try {
    const obj = realm.objects('Card').filtered('server_id == "" && node_id != ""');
    return obj.length;
  } catch (error) {
    captureSentry('error', error);
  }
};

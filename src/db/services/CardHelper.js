import { reInitRealm, realm } from '../Configuration';
import { handleErrors } from '../../utils/commonFunctions';
import { removeNullValues } from '../../utils/helperFunctions';

const createRealm = async () => {
  if (realm.isClosed) {
    reInitRealm();
  }
};

export const fetchAllCards = async () => {
  // _getAllCards
  try {
    await createRealm();
    const cards = realm.objects('Card');
    return JSON.parse(JSON.stringify(cards));
  } catch (error) {
    handleErrors(error, {
      ref: 'CardHelper_fetchAllCards',
    });
  }
};

export const createCard = async (obj) => {
  try {
    await createRealm();
    const cardObj = await removeNullValues(obj);
    if (cardObj.id) {
      delete cardObj.id;
    }

    const response = realm.write(() => {
      const result = realm.create('Card', cardObj);
      return JSON.parse(JSON.stringify(result));
    });

    return JSON.parse(JSON.stringify(response));
  } catch (error) {
    handleErrors(error, {
      ref: 'CardHelper_createCard',
    });
  }
};

export const updateCard = async (id, updates) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('Card', id);
    if (!obj) {
      throw new Error(`Card with ID ${id} not found`);
    }

    const updateObj = await removeNullValues(updates);
    updateObj.id = obj.id;
    updateObj.updated_at = Math.floor(Date.now() / 1000);

    realm.write(() => {
      realm.create('Card', updateObj, 'modified');
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'CardHelper_updateCard',
    });
  }
};

export const updateCardServerID = async (id, serverId) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('Card', id);
    if (!obj) {
      throw new Error(`Card with ID ${id} not found`);
    }

    realm.write(() => {
      obj.server_id = serverId;
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'CardHelper_updateCardServerID',
    });
  }
};

export const getAllUnSyncCards = async () => {
  try {
    await createRealm();
    const result = realm
      .objects('Card')
      .filtered('server_id == "" && node_id != "" && is_active == true');
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'CardHelper_getAllUnSyncCards',
    });
  }
};

export const fetchCardsByNodeId = async (nodeId) => {
  try {
    await createRealm();
    const result = realm
      .objects('Card')
      .filtered('node_id == $0 && is_active == true', nodeId);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'CardHelper_fetchCardsByNodeId',
    });
  }
};

export const fetchCardByCardId = async (cardId) => {
  try {
    await createRealm();
    const result = realm
      .objects('Card')
      .filtered('card_id == $0 && is_active == true', cardId);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'CardHelper_fetchCardByCardId',
    });
  }
};

export const fetchCardByDisplayId = async (id) => {
  try {
    await createRealm();
    const result = realm
      .objects('Card')
      .filtered('display_id == $0 && is_active == true', id);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'CardHelper_fetchCardByDisplayId',
    });
  }
};

export const findCardByServerId = async (serverId) => {
  try {
    await createRealm();
    const result = realm.objects('Card').filtered('server_id == $0', serverId);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'CardHelper_findCardByServerId',
    });
  }
};

export const findActiveCardByServerId = async (serverId) => {
  try {
    await createRealm();
    const result = realm
      .objects('Card')
      .filtered('server_id == $0 && is_active == true', serverId);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'CardHelper_findCardByServerId',
    });
  }
};

export const findCard = async (id) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('Card', id);
    if (!obj) {
      throw new Error(`Card with ID ${id} not found`);
    }

    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    handleErrors(error, {
      ref: 'CardHelper_findCard',
    });
  }
};

export const countUnSyncCards = async () => {
  try {
    await createRealm();
    const obj = realm
      .objects('Card')
      .filtered('server_id == "" && node_id != ""');
    return JSON.parse(JSON.stringify(obj.length));
  } catch (error) {
    handleErrors(error, {
      ref: 'CardHelper_countUnSyncCards',
    });
  }
};

export const fetchCardWithFarmerAndCardId = async (cardId) => {
  try {
    await createRealm();
    const result = realm
      .objects('Card')
      .filtered('card_id == $0 && node_id != "" && is_active == true', cardId);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'CardHelper_fetchCardByCardId',
    });
  }
};

export const fetchCardWithFarmerAndDisplayId = async (displayId) => {
  try {
    await createRealm();
    const result = realm
      .objects('Card')
      .filtered(
        'display_id == $0 && node_id != "" && is_active == true',
        displayId,
      );
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'CardHelper_fetchCardByCardId',
    });
  }
};

export const fetchCardWithFarmerIdAndCardId = async (cardId, farmerId) => {
  try {
    await createRealm();
    const result = realm
      .objects('Card')
      .filtered(
        'card_id == $0 && node_id == $1 && is_active == true',
        cardId,
        farmerId,
      );
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'CardHelper_fetchCardByCardId',
    });
  }
};

export const fetchCardWithFarmerIdAndDisplayId = async (
  displayId,
  farmerId,
) => {
  try {
    await createRealm();
    const result = realm
      .objects('Card')
      .filtered(
        'display_id == $0 && node_id == $1 && is_active == true',
        displayId,
        farmerId,
      );
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'CardHelper_fetchCardByCardId',
    });
  }
};

export const fetchCardWithCombo = async (cardId, displayId) => {
  try {
    await createRealm();
    const result = realm
      .objects('Card')
      .filtered(
        'card_id == $0 && display_id == $1 && is_active == true',
        cardId,
        displayId,
      );
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'CardHelper_fetchCardByCardId',
    });
  }
};

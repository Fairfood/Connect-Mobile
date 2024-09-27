/* eslint-disable camelcase */
import { realm } from '../Configuration';
import captureSentry from '../../services/sentryHelper';
import { jsonToString, removeNullValues } from '../../services/commonFunctions';

export const fetchAllFarmers = async () => {
  // _getAllFarmers
  try {
    const nodes = realm.objects('Node');
    return nodes;
  } catch (error) {
    captureSentry('error', error);
  }
};

export const createFarmer = async (obj) => {
  try {
    const nodeObj = await removeNullValues(obj);

    if (!nodeObj.updated_on) {
      nodeObj.updated_on = Math.round(new Date().getTime() / 1000);
    }

    let extraFields = nodeObj?.extra_fields ?? '{}';
    if (extraFields && typeof extraFields === 'object') {
      extraFields = jsonToString(extraFields);
    }

    let phone = nodeObj?.phone ?? '';
    if (typeof phone === 'object') {
      phone = `${phone?.dial_code ?? ''} ${phone?.phone ?? ''}`.trim();
    }

    nodeObj.name = nodeObj.name.trim();
    nodeObj.phone = phone;
    nodeObj.extra_fields = extraFields;
    nodeObj.created_on = parseInt(nodeObj.created_on);
    nodeObj.updated_on = parseInt(nodeObj.updated_on);
    nodeObj.server_id = nodeObj.id;
    if (nodeObj.id) {
      delete nodeObj.id;
    }

    // creating node object
    const response = realm.write(() => {
      return realm.create('Node', nodeObj);
    });

    return response;
  } catch (error) {
    captureSentry('error', error);
  }
};

export const updateFarmer = async (id, updates) => {
  try {
    const obj = realm.objectForPrimaryKey('Node', id);
    if (!obj) {
      throw new Error(`Node with ID ${id} not found`);
    }

    const updateObj = await removeNullValues(updates);

    // let phone = updateObj.phone || '';
    // if (typeof phone === 'object') {
    //   phone = `${phone?.dial_code ?? ''} ${phone?.phone ?? ''}`.trim();
    //   updateObj.phone = phone;
    // }

    // updateObj.phone = phone;
    // updateObj.name = updateObj.name.trim();
    // updateObj.updated_on = Math.round(Date.now() / 1000);
    // updateObj.created_on = parseInt(updateObj.created_on);
    // updateObj.server_id = updateObj.id;
    updateObj.id = obj.id;

    realm.write(() => {
      realm.create('Node', updateObj, 'modified');
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findFarmer = async (id, pass) => {
  try {
    const obj = realm.objectForPrimaryKey('Node', id);
    if (!obj) {
      if (pass) {
        return null;
      }
      throw new Error(`Node with ID ${id} not found`);
    }

    return obj;
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findFarmerByIdId = async (id) => {
  try {
    return realm.objects('Node').filtered('id == $0', id);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const fetchFarmerByServerId = async (serverId) => {
  try {
    return realm.objects('Node').filtered('server_id == $0', serverId);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const updateNodeCardId = async (id, cardId, isCardModified) => {
  try {
    const obj = realm.objectForPrimaryKey('Node', id);
    if (!obj) {
      throw new Error(`Node with ID ${id} not found`);
    }

    realm.write(() => {
      obj.card_id = cardId;
      obj.is_card_modified = isCardModified;
      obj.updated_on = Math.round(new Date().getTime() / 1000);
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findAndUpdateFarmer = async (id, serverId) => {
  try {
    const obj = realm.objectForPrimaryKey('Node', id);
    if (!obj) {
      throw new Error(`Node with ID ${id} not found`);
    }

    realm.write(() => {
      obj.server_id = serverId;
      obj.is_modified = false;
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findAndUpdateFarmerImage = async (id, image) => {
  try {
    const obj = realm.objectForPrimaryKey('Node', id);
    if (!obj) {
      throw new Error(`Node with ID ${id} not found`);
    }

    realm.write(() => {
      obj.image = image;
      obj.is_modified = false;
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findAllNewFarmers = async () => {
  try {
    return realm.objects('Node').filtered('server_id == ""');
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findAllUpdatedFarmers = async () => {
  try {
    return realm.objects('Node').filtered('is_modified == true');
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findAllUpdatedCards = async () => {
  try {
    return realm.objects('Node').filtered('is_card_modified == true');
  } catch (error) {
    captureSentry('error', error);
  }
};

export const countNewFarmers = async () => {
  try {
    const nodes = realm.objects('Node').filtered('server_id == ""');
    return nodes.length;
  } catch (error) {
    captureSentry('error', error);
  }
};

export const countUpdatedFarmers = async () => {
  try {
    const nodes = realm.objects('Node').filtered('is_modified == true');
    return nodes.length;
  } catch (error) {
    captureSentry('error', error);
  }
};

export const searchFarmersByName = async (name) => {
  try {
    return realm.objects('Node').filtered('name == $0', name);
  } catch (error) {
    captureSentry('error', error);
  }
};

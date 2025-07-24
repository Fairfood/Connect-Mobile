import { reInitRealm, realm } from '../Configuration';
import { handleErrors } from '../../utils/commonFunctions';
import { removeNullValues } from '../../utils/helperFunctions';

const createRealm = async () => {
  if (realm.isClosed) {
    reInitRealm();
  }
};

export const fetchAllFarmers = async () => {
  try {
    await createRealm();
    const nodes = realm.objects('Node');
    return JSON.parse(JSON.stringify(nodes));
  } catch (error) {
    handleErrors(error, {
      ref: 'FarmerHelper_fetchAllFarmers',
    });
  }
};

export const createFarmer = async (obj) => {
  try {
    await createRealm();
    const nodeObj = await removeNullValues(obj);

    if (!nodeObj.updated_on) {
      nodeObj.updated_on = Math.round(new Date().getTime() / 1000);
    }

    let phone = nodeObj?.phone ?? '';
    if (typeof phone === 'object') {
      phone = `${phone?.dial_code ?? ''} ${phone?.phone ?? ''}`.trim();
    }

    nodeObj.name = nodeObj.name.trim();
    nodeObj.phone = phone;
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

    return JSON.parse(JSON.stringify(response));
  } catch (error) {
    handleErrors(error, {
      ref: 'FarmerHelper_createFarmer',
    });
  }
};

export const updateFarmer = async (id, updates) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('Node', id);
    if (!obj) {
      throw new Error(`Node with ID ${id} not found`);
    }

    const updateObj = await removeNullValues(updates);
    updateObj.id = obj.id;
    updateObj.updated_at = Math.floor(Date.now() / 1000);

    realm.write(() => {
      realm.create('Node', updateObj, 'modified');
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'FarmerHelper_updateFarmer',
    });
  }
};

export const findFarmer = async (id, pass) => {
  try {
    await createRealm();
    const result = realm.objectForPrimaryKey('Node', id);
    if (!result) {
      if (pass) {
        return null;
      }
      throw new Error(`Node with ID ${id} not found`);
    }

    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'FarmerHelper_findFarmer',
    });
  }
};

export const findFarmerByIdId = async (id) => {
  try {
    await createRealm();
    const result = realm.objects('Node').filtered('id == $0', id);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'FarmerHelper_findFarmerByIdId',
    });
  }
};

export const fetchFarmerByServerId = async (serverId) => {
  try {
    await createRealm();
    const result = realm.objects('Node').filtered('server_id == $0', serverId);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'FarmerHelper_fetchFarmerByServerId',
    });
  }
};

export const updateNodeCardId = async (id, cardId) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('Node', id);
    if (!obj) {
      throw new Error(`Node with ID ${id} not found`);
    }

    realm.write(() => {
      obj.card_id = cardId;
      obj.updated_on = Math.round(new Date().getTime() / 1000);
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'FarmerHelper_updateNodeCardId',
    });
  }
};

export const updateNodeDisplayId = async (id, displayId) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('Node', id);
    if (!obj) {
      throw new Error(`Node with ID ${id} not found`);
    }

    realm.write(() => {
      obj.display_id = displayId;
      obj.updated_on = Math.round(new Date().getTime() / 1000);
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'FarmerHelper_updateNodeCardId',
    });
  }
};

export const updateFarmerServerId = async (id, serverId) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('Node', id);
    if (!obj) {
      throw new Error(`Node with ID ${id} not found`);
    }

    realm.write(() => {
      obj.server_id = serverId;
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'FarmerHelper_updateFarmerServerId',
    });
  }
};

export const updateFarmerModifiedStatus = async (id, status) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('Node', id);
    if (!obj) {
      throw new Error(`Node with ID ${id} not found`);
    }

    realm.write(() => {
      obj.is_modified = status;
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'FarmerHelper_updateFarmerModifiedStatus',
    });
  }
};

export const findAndUpdateFarmerImage = async (id, image) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('Node', id);
    if (!obj) {
      throw new Error(`Node with ID ${id} not found`);
    }

    realm.write(() => {
      obj.image = image;
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'FarmerHelper_findAndUpdateFarmerImage',
    });
  }
};

export const findAllNewFarmers = async () => {
  try {
    await createRealm();
    const result = realm.objects('Node').filtered('server_id == ""');
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'FarmerHelper_findAllNewFarmers',
    });
  }
};

export const findAllUpdatedFarmers = async () => {
  try {
    await createRealm();
    const result = realm.objects('Node').filtered('is_modified == true');
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'FarmerHelper_findAllUpdatedFarmers',
    });
  }
};

export const findAllUpdatedCards = async () => {
  try {
    await createRealm();
    const result = realm.objects('Node').filtered('is_card_modified == true');
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'FarmerHelper_findAllUpdatedCards',
    });
  }
};

export const countFarmerSyncPending = async () => {
  try {
    await createRealm();
    const nodes = realm
      .objects('Node')
      .filtered('server_id == "" || is_modified == true');
    return JSON.parse(JSON.stringify(nodes.length));
  } catch (error) {
    handleErrors(error, {
      ref: 'FarmerHelper_countFarmerSyncPending',
    });
  }
};

export const searchFarmersByName = async (name) => {
  try {
    await createRealm();
    const result = realm.objects('Node').filtered('name == $0', name);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'FarmerHelper_searchFarmersByName',
    });
  }
};

export const findAllUnUploadedFarmerPictures = async () => {
  try {
    await createRealm();
    const result = realm
      .objects('Node')
      .filtered(
        'server_id != "" && image CONTAINS[c] "file://"  && is_modified == false',
      );
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'FarmerHelper_findAllUnUploadedFarmerPictures',
    });
  }
};

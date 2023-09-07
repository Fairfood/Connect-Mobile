import { Q } from '@nozbe/watermelondb';
import { database } from '../../App';
import { stringToJson } from './commonFunctions';

const nodes = database.collections.get('nodes');

export const getAllFarmers = async () => {
  const allNodes = await nodes.query().fetch();
  return allNodes;
};

export const observeFarmers = () => {
  return nodes.query().observe();
};

export const saveFarmer = async (farmer) => {
  farmer.updated_on = parseInt(farmer.updated_on) * 1000;

  const updatedOn =
    farmer.updated_on !== undefined
      ? farmer.updated_on
      : Math.floor(Date.now() / 10);

  let extraFields = farmer.extra_fields;
  if (extraFields && typeof extraFields === 'string') {
    extraFields = stringToJson(extraFields);
  }

  const res = await database.action(async () => {
    const response = await nodes.create((entry) => {
      entry.server_id = farmer.id;
      entry.name = farmer.name.trim();
      entry.type = 2;
      entry.phone = farmer.phone;
      entry.street = farmer.street;
      entry.city = farmer.city;
      entry.country = farmer.country;
      entry.province = farmer.province;
      entry.zipcode = farmer.zipcode;
      entry.image = farmer.image;
      entry.latitude = farmer.latitude;
      entry.longitude = farmer.longitude;
      entry.card_id = farmer.card_id;
      entry.is_modified = farmer.is_modified;
      entry.last_synced = parseInt(updatedOn);
      entry.updated_on = parseInt(updatedOn);
      entry.created_on = parseInt(farmer.created_on);
      entry.is_modified = false;
      entry.ktp = farmer.ktp;
      entry.extra_fields = extraFields ?? '';
    });
    return response;
  });
  return res;
};

export const findFarmerById = async (id) => {
  return nodes.find(id);
};

export const findFarmerByServerId = async (id) => {
  return nodes.query(Q.where('server_id', id));
};

export const findAndUpdateCard = async (nodeId, cardId, isCardModified) => {
  await database.action(async () => {
    const node = await nodes.find(nodeId);
    await node.update((tx) => {
      tx.card_id = cardId;
      tx.is_card_modified = isCardModified;
      tx.updated_on = Math.round(Date.now());
    });
  });
};

export const findAndUpdateFarmer = async (nodeId, serverId) => {
  await database.action(async () => {
    const node = await nodes.find(nodeId);
    await node.update((tx) => {
      tx.server_id = serverId;
      tx.is_modified = false;
      tx.last_synced = Math.round(Date.now() / 1000);
    });
  });
};

export const findAndUpdateFarmerImage = async (nodeId, image) => {
  await database.action(async () => {
    const node = await nodes.find(nodeId);
    await node.update((tx) => {
      tx.image = image;
      tx.is_modified = false;
      tx.last_synced = Math.round(Date.now() / 1000);
    });
  });
};

export const findAndUpdateFarmerDetails = async (nodeId, farmer, cardId) => {
  await database.action(async () => {
    let extraFields = farmer.extra_fields;
    if (extraFields && typeof extraFields === 'string') {
      extraFields = stringToJson(extraFields);
    }

    const phone = `${farmer.phone.dial_code} ${farmer.phone.phone}`.trim();
    const node = await nodes.find(nodeId);

    await node.update((entry) => {
      entry.server_id = farmer.id;
      entry.name = farmer.name.trim();
      entry.type = 2;
      entry.phone = phone;
      entry.street = farmer.street;
      entry.city = farmer.city;
      entry.country = farmer.country;
      entry.province = farmer.province;
      entry.zipcode = farmer.zipcode;
      entry.image = farmer.image;
      entry.latitude = farmer.latitude;
      entry.longitude = farmer.longitude;
      entry.card_id = cardId;
      entry.is_modified = farmer.is_modified;
      entry.last_synced = farmer.last_synced;
      entry.updated_on = Math.round(Date.now());
      entry.created_on = parseInt(farmer.created_on);
      entry.is_card_modified = farmer.is_card_modified;
      entry.ktp = farmer.ktp;
      entry.extra_fields = extraFields ?? '';
    });
  });
};

export const findAllNewFarmers = async () => {
  return nodes.query(Q.where('server_id', ''));
};

export const findAllUpdatedFarmers = async () => {
  return nodes.query(Q.where('is_modified', true));
};

export const findAllUpdatedCards = async () => {
  return nodes.query(Q.where('is_card_modified', true));
};

export const newFarmersCount = async () => {
  return nodes.query(Q.where('server_id', '')).fetchCount();
};

export const updatedFarmersCount = async () => {
  return nodes.query(Q.where('is_modified', true)).fetchCount();
};

export const findFarmerByName = async (name) => {
  return nodes.query(Q.where('name', name));
};

export const findNodeByCardId = async (cardId) => {
  return nodes.query(Q.where('card_id', cardId));
};

/* eslint-disable camelcase */
import { realm } from '../Configuration';
import captureSentry from '../../services/sentryHelper';
import { removeNullValues } from '../../services/commonFunctions';

export const fetchAllPremiums = async () => {
  // _getAllPremiums
  try {
    const premiums = realm.objects('Premium');
    return premiums;
  } catch (error) {
    captureSentry('error', error);
  }
};

export const createPremium = async (obj) => {
  try {
    const premiumObj = await removeNullValues(obj);
    premiumObj.included_in_amt = premiumObj.included;
    premiumObj.is_card_dependent = premiumObj.dependant_on_card;
    premiumObj.server_id = premiumObj.id;
    if (premiumObj.id) {
      delete premiumObj.id;
    }

    const response = realm.write(() => {
      return realm.create('Premium', premiumObj);
    });

    return response.id;
  } catch (error) {
    captureSentry('error', error);
  }
};

export const updatePremium = async (premiumId, updates) => {
  try {
    const obj = realm.objectForPrimaryKey('Premium', premiumId);
    if (!obj) {
      throw new Error(`Premium with ID ${premiumId} not found`);
    }

    const updateObj = await removeNullValues(updates);
    updateObj.included_in_amt = updateObj.included;
    updateObj.is_card_dependent = updateObj.dependant_on_card;
    updateObj.server_id = updateObj.id;
    updateObj.id = obj.id;

    realm.write(() => {
      realm.create('Premium', updateObj, 'modified');
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findPremium = async (id, pass) => {
  try {
    const obj = realm.objectForPrimaryKey('Premium', id);
    if (!obj) {
      if (pass) {
        return null;
      }
      throw new Error(`Premium with ID ${id} not found`);
    }

    return obj;
  } catch (error) {
    captureSentry('error', error);
  }
};

export const searchPremiumByServerId = async (serverId) => {
  try {
    return realm.objects('Premium').filtered('server_id == $0', serverId);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const fetchPremiumByCategory = async (category) => {
  try {
    return realm.objects('Premium').filtered('category == $0', category);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const getAllActivePremiums = async () => {
  try {
    return realm.objects('Premium').filtered('is_active == true');
  } catch (error) {
    captureSentry('error', error);
  }
};

export const updatePremiumActiveStatus = async (id, status) => {
  try {
    const obj = realm.objectForPrimaryKey('Premium', id);
    if (!obj) {
      throw new Error(`Premium with ID ${id} not found`);
    }

    realm.write(() => {
      obj.is_active = status;
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const fetchPremiumsByCalculationType = async (calculationType) => {
  try {
    return realm
      .objects('Premium')
      .filtered('calculation_type == $0', calculationType);
  } catch (error) {
    captureSentry('error', error);
  }
};

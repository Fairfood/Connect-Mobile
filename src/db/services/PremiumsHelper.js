import { reInitRealm, realm } from '../Configuration';
import { handleErrors } from '../../utils/commonFunctions';
import { removeNullValues } from '../../utils/helperFunctions';
import { PREMIUM_CATEGORY_PAYOUT } from '../../utils/constants';

const createRealm = async () => {
  if (realm.isClosed) {
    reInitRealm();
  }
};

export const fetchAllPremiums = async () => {
  // _getAllPremiums
  try {
    await createRealm();
    const result = realm.objects('Premium');
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'PremiumsHelper_fetchAllPremiums',
    });
  }
};

export const createPremium = async (obj) => {
  try {
    await createRealm();
    const premiumObj = await removeNullValues(obj);
    premiumObj.server_id = premiumObj.id;
    if (premiumObj.id) {
      delete premiumObj.id;
    }
    const response = realm.write(() => {
      return realm.create('Premium', premiumObj);
    });

    return JSON.parse(JSON.stringify(response));
  } catch (error) {
    handleErrors(error, {
      ref: 'PremiumsHelper_createPremium',
    });
  }
};

export const updatePremium = async (premiumId, updates) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('Premium', premiumId);
    if (!obj) {
      throw new Error(`Premium with ID ${premiumId} not found`);
    }

    const updateObj = await removeNullValues(updates);
    updateObj.server_id = updateObj.id;
    updateObj.id = obj.id;

    realm.write(() => {
      realm.create('Premium', updateObj, 'modified');
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'PremiumsHelper_updatePremium',
    });
  }
};

export const findPremium = async (id, pass) => {
  try {
    await createRealm();
    const result = realm.objectForPrimaryKey('Premium', id);
    if (!result) {
      if (pass) {
        return null;
      }
      throw new Error(`Premium with ID ${id} not found`);
    }

    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'PremiumsHelper_findPremium',
    });
  }
};

export const searchPremiumByServerId = async (serverId) => {
  try {
    await createRealm();
    const result = realm
      .objects('Premium')
      .filtered('server_id == $0', serverId);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'PremiumsHelper_searchPremiumByServerId',
    });
  }
};

export const fetchActivePayoutPremiums = async () => {
  try {
    await createRealm();
    const result = realm
      .objects('Premium')
      .filtered(
        'category == $0 && is_active == $1',
        PREMIUM_CATEGORY_PAYOUT,
        true,
      );
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'PremiumsHelper_fetchActivePayoutPremiums',
    });
  }
};

export const getAllActivePremiums = async () => {
  try {
    await createRealm();
    const result = realm.objects('Premium').filtered('is_active == true');
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'PremiumsHelper_getAllActivePremiums',
    });
  }
};

export const updatePremiumActiveStatus = async (id, status) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('Premium', id);
    if (!obj) {
      throw new Error(`Premium with ID ${id} not found`);
    }

    realm.write(() => {
      obj.is_active = status;
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'PremiumsHelper_updatePremiumActiveStatus',
    });
  }
};

export const fetchPremiumsByCalculationType = async (calculationType) => {
  try {
    await createRealm();
    const result = realm
      .objects('Premium')
      .filtered(
        'calculation_type == $0 && is_active == $1',
        calculationType,
        true,
      );
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'PremiumsHelper_fetchPremiumsByCalculationType',
    });
  }
};

export const fetchPremiumsByCategory = async (category) => {
  try {
    await createRealm();
    const result = realm
      .objects('Premium')
      .filtered('category == $0', category);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'PremiumsHelper_fetchPremiumsByCategory',
    });
  }
};

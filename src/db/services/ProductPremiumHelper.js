import { reInitRealm, realm } from '../Configuration';
import { handleErrors } from '../../utils/commonFunctions';
import { removeNullValues } from '../../utils/helperFunctions';

const createRealm = async () => {
  if (realm.isClosed) {
    reInitRealm();
  }
};

export const fetchAllProductPremiums = async () => {
  // _getAllProductPremiums
  try {
    await createRealm();
    const result = realm.objects('ProductPremium');
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'ProductPremiumsHelper_fetchAllProductPremiums',
    });
  }
};

export const createProductPremium = async (productId, premiumId) => {
  // _saveProductPremium
  try {
    await createRealm();
    realm.write(() => {
      realm.create('ProductPremium', {
        product_id: productId,
        premium_id: premiumId,
      });
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'ProductPremiumsHelper_createProductPremium',
    });
  }
};

export const updateProductPremium = async (id, updates) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('ProductPremium', id);
    if (!obj) {
      throw new Error(`ProductPremium with ID ${id} not found`);
    }

    const updateObj = await removeNullValues(updates);
    updateObj.id = obj.id;

    realm.write(() => {
      realm.create('ProductPremium', updateObj, 'modified');
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'ProductPremiumsHelper_updateProductPremium',
    });
  }
};

export const findAllPremiumsByProductAndPremium = async (
  productId,
  premiumId,
) => {
  try {
    await createRealm();
    const result = realm
      .objects('ProductPremium')
      .filtered('product_id == $0 && premium_id == $1', productId, premiumId);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'ProductPremiumsHelper_findAllPremiumsByProductAndPremium',
    });
  }
};

export const fetchAllPremiumsByProduct = async (productId) => {
  try {
    await createRealm();
    const result = realm
      .objects('ProductPremium')
      .filtered('product_id == $0', productId);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'ProductPremiumsHelper_fetchAllPremiumsByProduct',
    });
  }
};

export const deleteProductPremium = async (id) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('ProductPremium', id);
    if (obj) {
      realm.write(() => {
        realm.delete(obj);
      });
    }
  } catch (error) {
    handleErrors(error, {
      ref: 'ProductPremiumsHelper_deleteProductPremium',
    });
  }
};

export const deleteAllPremiumByProduct = async (productId) => {
  try {
    await createRealm();
    const obj = realm
      .objects('ProductPremium')
      .filtered('product_id == $0', productId);

    if (obj) {
      realm.write(() => {
        realm.delete(obj);
      });
    }
  } catch (error) {
    handleErrors(error, {
      ref: 'ProductPremiumsHelper_deleteAllPremiumByProduct',
    });
  }
};

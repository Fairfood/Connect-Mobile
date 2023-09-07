/* eslint-disable camelcase */
import { realm } from '../Configuration';
import captureSentry from '../../services/sentryHelper';

export const fetchAllProductPremiums = async () => {
  // _getAllProductPremiums
  try {
    const productPremiums = realm.objects('ProductPremium');
    return productPremiums;
  } catch (error) {
    captureSentry('error', error);
  }
};

export const createProductPremium = async (productId, premiumId) => {
  // _saveProductPremium
  try {
    realm.write(() => {
      realm.create('ProductPremium', {
        product_id: productId,
        premium_id: premiumId,
      });
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const updateProductPremium = async (id, updates) => {
  try {
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
    captureSentry('error', error);
  }
};

export const findAllPremiumsByProductAndPremium = async (
  productId,
  premiumId,
) => {
  try {
    return realm
      .objects('ProductPremium')
      .filtered('product_id == $0 && premium_id == $1', productId, premiumId);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const fetchAllPremiumsByProduct = async (productId) => {
  try {
    return realm
      .objects('ProductPremium')
      .filtered('product_id == $0', productId);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const deleteProductPremium = async (id) => {
  try {
    const obj = realm.objectForPrimaryKey('ProductPremium', id);
    if (obj) {
      realm.write(() => {
        realm.delete(obj);
      });
    }
  } catch (error) {
    captureSentry('error', error);
  }
};

export const deleteAllPremiumByProduct = async (productId) => {
  try {
    const obj = realm
      .objects('ProductPremium')
      .filtered('product_id == $0', productId);

    if (obj) {
      realm.write(() => {
        realm.delete(obj);
      });
    }
  } catch (error) {
    captureSentry('error', error);
  }
};

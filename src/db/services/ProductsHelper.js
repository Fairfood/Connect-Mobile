/* eslint-disable camelcase */
import { realm } from '../Configuration';
import captureSentry from '../../services/sentryHelper';
import { removeNullValues } from '../../services/commonFunctions';

export const fetchAllProducts = async () => {
  // _getAllProducts
  try {
    const products = realm.objects('Product');
    return products;
  } catch (error) {
    captureSentry('error', error);
  }
};

export const createProduct = async (obj) => {
  try {
    const productObj = await removeNullValues(obj);
    productObj.server_id = productObj.id;
    if (productObj.id) {
      delete productObj.id;
    }

    realm.write(() => {
      realm.create('Product', productObj);
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const updateProduct = async (id, updates) => {
  try {
    const obj = realm.objectForPrimaryKey('Product', id);
    if (!obj) {
      throw new Error(`Product with ID ${id} not found`);
    }

    const updateObj = await removeNullValues(updates);
    updateObj.server_id = updateObj.id;
    updateObj.id = obj.id;

    realm.write(() => {
      realm.create('Product', updateObj, 'modified');
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findProduct = async (id, pass) => {
  // _findProductById
  try {
    const obj = realm.objectForPrimaryKey('Product', id);
    if (!obj) {
      if (pass) {
        return null;
      }
      throw new Error(`Product with ID ${id} not found`);
    }

    return obj;
  } catch (error) {
    captureSentry('error', error);
  }
};

export const fetchProductByServerId = async (serverId) => {
  // _findProductByServerId
  try {
    return realm.objects('Product').filtered('server_id == $0', serverId);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const updateProductActiveStatus = async (id, status) => {
  try {
    const obj = realm.objectForPrimaryKey('Product', id);
    if (!obj) {
      throw new Error(`Product with ID ${id} not found`);
    }

    realm.write(() => {
      obj.is_active = status;
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

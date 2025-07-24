import { reInitRealm, realm } from '../Configuration';
import { handleErrors } from '../../utils/commonFunctions';
import { removeNullValues } from '../../utils/helperFunctions';

const createRealm = async () => {
  if (realm.isClosed) {
    reInitRealm();
  }
};

export const fetchAllProducts = async () => {
  try {
    await createRealm();
    const result = realm.objects('Product');
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'ProductsHelper_fetchAllProducts',
    });
  }
};

export const fetchAllActiveProducts = async () => {
  try {
    await createRealm();
    const result = realm.objects('Product').filtered('is_active == $0', true);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'ProductsHelper_fetchAllActiveProducts',
    });
  }
};

export const createProduct = async (obj) => {
  try {
    await createRealm();
    const productObj = await removeNullValues(obj);
    productObj.server_id = productObj.id;
    if (productObj.id) {
      delete productObj.id;
    }

    realm.write(() => {
      realm.create('Product', productObj);
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'ProductsHelper_createProduct',
    });
  }
};

export const updateProduct = async (id, updates) => {
  try {
    await createRealm();
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
    handleErrors(error, {
      ref: 'ProductsHelper_updateProduct',
    });
  }
};

export const findProduct = async (id, pass) => {
  try {
    await createRealm();
    const result = realm.objectForPrimaryKey('Product', id);
    if (!result) {
      if (pass) {
        return null;
      }
      throw new Error(`Product with ID ${id} not found`);
    }

    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'ProductsHelper_findProduct',
    });
  }
};

export const fetchProductByServerId = async (serverId) => {
  try {
    await createRealm();
    const result = realm
      .objects('Product')
      .filtered('server_id == $0', serverId);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'ProductsHelper_fetchProductByServerId',
    });
  }
};

export const updateProductActiveStatus = async (id, status) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('Product', id);
    if (!obj) {
      throw new Error(`Product with ID ${id} not found`);
    }

    realm.write(() => {
      obj.is_active = status;
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'ProductsHelper_updateProductActiveStatus',
    });
  }
};

/* eslint-disable camelcase */
import { realm } from '../Configuration';
import captureSentry from '../../services/sentryHelper';
import { removeNullValues } from '../../services/commonFunctions';

export const fetchAllBatches = async () => {
  // _getAllBatches
  try {
    const batches = realm.objects('Batch');
    return batches;
  } catch (error) {
    captureSentry('error', error);
  }
};

export const createBatch = async (obj) => {
  try {
    const batchObj = await removeNullValues(obj);
    if (batchObj.id) {
      delete batchObj.id;
    }

    realm.write(() => {
      realm.create('Batch', batchObj);
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const updateBatchNew = async (id, updates) => {
  try {
    const obj = realm.objectForPrimaryKey('Batch', id);
    if (!obj) {
      throw new Error(`Batch with ID ${id} not found`);
    }

    const updateObj = await removeNullValues(updates);
    updateObj.id = obj.id;

    realm.write(() => {
      realm.create('Batch', updateObj, 'modified');
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const deleteAllBatchesByTransactionId = async (transactionId) => {
  try {
    const batches = realm
      .objects('Batch')
      .filtered('transaction_id == $0', transactionId);

    realm.write(() => {
      realm.delete(batches);
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findAndUpdateBatch = async (id, updates) => {
  try {
    const obj = realm.objectForPrimaryKey('Batch', id);
    if (!obj) {
      throw new Error(`Batch with ID ${id} not found`);
    }

    const { server_id, ref_number } = updates;
    realm.write(() => {
      obj.server_id = server_id;
      obj.ref_number = ref_number;
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findAndUpdateBatchQuantity = async (id, updates) => {
  try {
    const obj = realm.objectForPrimaryKey('Batch', id);
    if (!obj) {
      throw new Error(`Batch with ID ${id} not found`);
    }

    const { current_quantity } = updates;

    realm.write(() => {
      obj.current_quantity = current_quantity;
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const deleteBatchByID = async (id) => {
  try {
    const obj = realm.objectForPrimaryKey('Batch', id);
    if (obj) {
      realm.write(() => {
        realm.delete(obj);
      });
    }
  } catch (error) {
    captureSentry('error', error);
  }
};

export const fetchBatchesByTransaction = async (transactionId) => {
  try {
    return realm
      .objects('Batch')
      .filtered('transaction_id == $0', transactionId);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findBatch = async (id) => {
  try {
    return realm.objects('Batch').filtered('id == $0', id);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const updateBatchByServerId = async (serverId, currentQuantity) => {
  try {
    const batch = realm.objects('Batch').filtered('server_id == $0', serverId);
    if (batch.length === 0) {
      // throw new Error(`Batch with server_id ${serverId} not found`);
      return;
    }

    realm.write(() => {
      batch.current_quantity = currentQuantity;
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const fetchBatchByProductId = async (productId) => {
  try {
    return realm
      .objects('Batch')
      .filtered('product_id == $0 && current_quantity != 0', productId);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findBatchesByServerId = async (serverId) => {
  try {
    return realm.objects('Batch').filtered('server_id == $0', serverId);
  } catch (error) {
    captureSentry('error', error);
  }
};

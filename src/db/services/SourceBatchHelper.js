/* eslint-disable camelcase */
import { realm } from '../Configuration';
import captureSentry from '../../services/sentryHelper';
import { removeNullValues } from '../../services/commonFunctions';

export const fetchAllSourceBatches = async () => { // _getAllSourceBatches
  try {
    const sourceBatches = realm.objects('SourceBatch');
    return sourceBatches;
  } catch (error) {
    captureSentry('error', error);
  }
};

export const createSourceBatch = async (obj) => { // _saveSourceBatch
  try {
    const sourceBatchObj = await removeNullValues(obj);
    if (sourceBatchObj.id) {
      delete sourceBatchObj.id;
    }

    realm.write(() => {
      realm.create('SourceBatch', sourceBatchObj);
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const updateSourceBatch = async (id, updates) => {
  try {
    const obj = realm.objectForPrimaryKey('SourceBatch', id);
    if (!obj) {
      throw new Error(`SourceBatch with ID ${id} not found`);
    }

    const updateObj = await removeNullValues(updates);
    updateObj.id = obj.id;

    realm.write(() => {
      realm.create('SourceBatch', updateObj, 'modified');
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const clearAllSourceBatches = async () => {
  try {
    const sourceBatches = realm.objects('SourceBatch');

    realm.write(() => {
      realm.delete(sourceBatches);
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const deleteSourceBatchesByTransactionId = async (transactionId) => {
  try {
    const batches = realm
      .objects('SourceBatch')
      .filtered('transaction_id == $0', transactionId);

    realm.write(() => {
      realm.delete(batches);
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const fetchSourceBatchesByTransaction = async (transactionId) => {
  try {
    return realm
      .objects('SourceBatch')
      .filtered('transaction_id == $0', transactionId);
  } catch (error) {
    captureSentry('error', error);
  }
};

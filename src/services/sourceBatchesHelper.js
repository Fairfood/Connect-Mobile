import { Q } from '@nozbe/watermelondb';
import { database } from '../../App';

const sourceBatches = database.collections.get('source_batches');

export const getAllSourceBatches = async () => {
  const allBatches = await sourceBatches.query().fetch();
  return allBatches[0];
};

export const observeBatches = () => {
  return sourceBatches.query().observe();
};

export const saveSourceBatch = async (batch) => {
  await database.action(async () => {
    await sourceBatches.create((entry) => {
      entry.transaction_id = batch.transaction_id;
      entry.quantity = batch.quantity;
      entry.batch_id = batch.batch_id;
    });
  });
};

export const clearAllSourceBatches = async () => {
  const allSourceBatches = await database.collections
    .get('source_batches')
    .query()
    .fetch();
  await database.action(async () => {
    const deleted = allSourceBatches.map((product) => {
      return product.prepareDestroyPermanently();
    });

    database.batch(...deleted);
  });
};

export const clearAllSourceBatchesByTransactionId = async (transactionId) => {
  const allSourceBatches = await database.collections
    .get('source_batches')
    .query(Q.where('transaction_id', transactionId))
    .fetch();
  await database.action(async () => {
    const deleted = allSourceBatches.map((product) => {
      return product.prepareDestroyPermanently();
    });

    database.batch(...deleted);
  });
};

export const getAllSourceBatchesByTransaction = async (transactionId) => {
  return sourceBatches.query(Q.where('transaction_id', transactionId));
};

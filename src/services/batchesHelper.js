import { Q } from '@nozbe/watermelondb';
import { database } from '../../App';

const batches = database.collections.get('batches');

export const getAllBatches = async () => {
  const allBatches = await batches.query().fetch();
  return allBatches[0];
};

export const observeBatches = () => {
  return batches.query().observe();
};

export const saveBatch = async (batch) => {
  await database.action(async () => {
    await batches.create((entry) => {
      entry.server_id = batch.server_id;
      entry.product_id = batch.product_id;
      entry.transaction_id = batch.transaction_id;
      entry.initial_quantity = batch.initial_quantity;
      entry.current_quantity = batch.current_quantity;
      entry.ref_number = batch.ref_number;
      entry.unit = batch.unit;
    });
  });
};

export const updateBatch = async (batchId, batch) => {
  await database.action(async () => {
    const fetchedBatch = await batches.find(batchId);

    await fetchedBatch.create((entry) => {
      entry.server_id = batch.server_id;
      entry.product_id = batch.product_id;
      entry.transaction_id = batch.transaction_id;
      entry.initial_quantity = batch.initial_quantity;
      entry.current_quantity = batch.current_quantity;
      entry.ref_number = batch.ref_number;
      entry.unit = batch.unit;
    });
  });
};

export const clearAllBatchesByTransactionId = async (transactionId) => {
  const filteredBatches = await database.collections
    .get('batches')
    .query(Q.where('transaction_id', transactionId))
    .fetch();

  await database.action(async () => {
    const deleted = filteredBatches.map((product) => {
      return product.prepareDestroyPermanently();
    });

    database.batch(...deleted);
  });
};

export const findAndUpdateBatch = async (batchId, updates) => {
  await database.action(async () => {
    const batch = await batches.find(batchId);
    await batch.update((tx) => {
      tx.server_id = updates.server_id;
      tx.ref_number = updates.ref_number;
    });
  });
};

export const findAndUpdateBatchQuantity = async (batchId, updates) => {
  await database.action(async () => {
    const batch = await batches.find(batchId);
    await batch.update((tx) => {
      tx.current_quantity = updates.current_quantity;
    });
  });
};

export const deleteBatchByID = async (batchId) => {
  await database.action(async () => {
    const batch = await batches.find(batchId);
    await batch.destroyPermanently();
  });
};

export const getAllBatchesByTransaction = async (transactionId) => {
  return batches.query(Q.where('transaction_id', transactionId));
};

export const getBatchById = async (batchId) => {
  return batches.find(batchId);
};

export const findBatchById = async (batchId) => {
  return batches.query(Q.where('id', batchId));
};

export const getBatchByServerId = async (serverId, updates) => {
  await database.action(async () => {
    const batch = batches.query(Q.where('server_id', serverId));
    if (batch.length > 0) {
      await batch[0].update((tx) => {
        tx.current_quantity = updates.current_quantity;
      });
    }
  });
};

export const findBatchByProductId = async (productId) => {
  return batches.query(
    Q.where('product_id', productId),
    Q.where('current_quantity', Q.notEq(0)),
  );
};

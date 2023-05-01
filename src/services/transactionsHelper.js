import { Q } from '@nozbe/watermelondb';
import { database } from '../../App';
import { stringToJson } from './commonFunctions';

const transactions = database.collections.get('transactions');

export const observeTransactions = () => {
  return transactions.query().observe();
};

export const getAllTransactions = async () => {
  const allTransactions = await transactions.query().fetch();
  return allTransactions;
};

export const saveTransaction = async (transaction) => {
  let extraFields = transaction.extra_fields;
  if (extraFields && typeof extraFields === 'string') {
    extraFields = stringToJson(extraFields);
  }

  const res = await database.action(async () => {
    const response = await transactions.create((entry) => {
      entry.node_id = transaction.node_id;
      entry.server_id = transaction.server_id;
      entry.product_price = parseFloat(transaction.product_price);
      entry.product_id = transaction.product_id;
      entry.currency = transaction.currency;
      entry.type = transaction.type;
      entry.quantity = parseFloat(transaction.quantity);
      entry.ref_number = transaction.ref_number;
      entry.price = transaction.price;
      entry.date = transaction.date;
      entry.invoice_file = transaction.invoice_file;
      entry.created_on = parseInt(transaction.created_on);
      entry.is_verified = false;
      entry.is_deleted = false;
      entry.card_id = transaction.card_id;
      entry.total = parseFloat(transaction.total);
      entry.quality_correction = parseFloat(transaction.quality_correction);
      entry.verification_method = transaction.verification_method;
      entry.verification_latitude = transaction.verification_latitude;
      entry.verification_longitude = transaction.verification_longitude;
      entry.transaction_type = transaction.transaction_type;
      entry.is_loss = transaction.is_loss;
      entry.extra_fields = extraFields ?? '';
      entry.error = transaction.error;
      entry.reported = transaction.reported;
    });
    return response;
  });
  return res.id;
};

export const updateTransaction = async (transactionId, transaction) => {
  let extraFields = transaction.extra_fields;
  if (extraFields && typeof extraFields === 'string') {
    extraFields = stringToJson(extraFields);
  }

  await database.action(async () => {
    const fetchedTransaction = await transactions.find(transactionId);

    await fetchedTransaction.update((entry) => {
      entry.node_id = transaction.node_id;
      entry.server_id = transaction.server_id;
      entry.product_price = parseFloat(transaction.product_price);
      entry.product_id = transaction.product_id;
      entry.currency = transaction.currency;
      entry.type = transaction.type;
      entry.quantity = parseFloat(transaction.quantity);
      entry.ref_number = transaction.ref_number;
      entry.price = transaction.price;
      entry.date = transaction.date;
      entry.invoice_file = transaction.invoice_file;
      entry.created_on = parseInt(transaction.created_on);
      entry.is_verified = false;
      entry.is_deleted = false;
      entry.card_id = transaction.card_id;
      entry.total = parseFloat(transaction.total);
      entry.quality_correction = parseFloat(transaction.quality_correction);
      entry.verification_method = transaction.verification_method;
      entry.verification_latitude = transaction.verification_latitude;
      entry.verification_longitude = transaction.verification_longitude;
      entry.transaction_type = transaction.transaction_type;
      entry.is_loss = transaction.is_loss;
      entry.extra_fields = extraFields ?? '';
      entry.error = transaction.error;
      entry.reported = transaction.reported;
    });
  });
};

export const findAllNewTransactions = async () => {
  return transactions.query(Q.where('server_id', ''));
};

export const findAllTransactionsById = async (id) => {
  return transactions.query(Q.where('node_id', id));
};

export const findAndUpdateTransaction = async (transactionId, updates) => {
  await database.action(async () => {
    const transaction = await transactions.find(transactionId);
    await transaction.update((tx) => {
      tx.server_id = updates.server_id;
      tx.ref_number = updates.ref_number;
      tx.date = updates.date;
      tx.unit = updates.unit;
      tx.error = updates.error;
    });
  });
};

export const findAndUpdateTransactionInvoice = async (
  transactionId,
  invoiceFile,
) => {
  await database.action(async () => {
    const transaction = await transactions.find(transactionId);
    await transaction.update((tx) => {
      tx.invoice_file = invoiceFile;
    });
  });
};

export const deleteTransactionById = async (transactionId) => {
  await database.action(async () => {
    const transaction = await transactions.find(transactionId);
    await transaction.destroyPermanently();
  });
};

export const findTransactionById = async (transactionId) => {
  return transactions.find(transactionId);
};

export const findTransactionByServerId = async (transactionId) => {
  return transactions.query(Q.where('server_id', transactionId));
};

export const findAllUnUploadedTransactionsInvoices = async () => {
  return transactions.query(
    Q.where('server_id', Q.notEq('')),
    Q.where('invoice_file', Q.like('%file%')),
  );
};

export const newTransactionsCount = async () => {
  return transactions.query(Q.where('server_id', '')).fetchCount();
};

export const updateTransactionError = async (transactionId, error) => {
  await database.action(async () => {
    const transaction = await transactions.find(transactionId);
    await transaction.update((tx) => {
      tx.error = error;
    });
  });
};

export const erroredTransactionsCount = async () => {
  return transactions
    .query(Q.where('server_id', ''), Q.where('error', Q.notEq('')))
    .fetchCount();
};

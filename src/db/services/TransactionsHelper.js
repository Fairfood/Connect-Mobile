import { reInitRealm, realm } from '../Configuration';
import { handleErrors } from '../../utils/commonFunctions';
import { jsonToString, removeNullValues } from '../../utils/helperFunctions';
import {
  APP_TRANS_TYPE_INCOMING,
  APP_TRANS_TYPE_OUTGOING,
} from '../../utils/constants';

const createRealm = async () => {
  if (realm.isClosed) {
    reInitRealm();
  }
};

export const fetchAllTransactions = async () => {
  try {
    await createRealm();
    const result = realm.objects('Transaction');
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_fetchAllTransactions',
    });
  }
};

export const createTransaction = async (obj) => {
  try {
    await createRealm();
    const transactionObj = await removeNullValues(obj);
    if (transactionObj.id) {
      delete transactionObj.id;
    }

    const response = realm.write(() => {
      return realm.create('Transaction', transactionObj);
    });

    return response.id;
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_createTransaction',
    });
  }
};

export const updateTransaction = async (id, updates) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('Transaction', id);
    if (!obj) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    const updateObj = await removeNullValues(updates);
    updateObj.id = obj.id;

    realm.write(() => {
      realm.create('Transaction', updateObj, 'modified');
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_updateTransaction',
    });
  }
};

export const findAllNewTransactions = async () => {
  try {
    await createRealm();
    const result = realm
      .objects('Transaction')
      .filtered('server_id == "" && is_deleted = false');
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_findAllNewTransactions',
    });
  }
};

export const findAllNewBuyTransactions = async () => {
  try {
    await createRealm();
    const result = realm
      .objects('Transaction')
      .filtered(
        'server_id == "" && type = $0 && is_deleted = false',
        APP_TRANS_TYPE_INCOMING,
      );
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_findAllNewBuyTransactions',
    });
  }
};

export const findAllNewSendTransactions = async () => {
  try {
    await createRealm();
    const result = realm
      .objects('Transaction')
      .filtered('server_id == "" && type = $0', APP_TRANS_TYPE_OUTGOING);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_findAllNewSendTransactions',
    });
  }
};

export const fetchTransactionsByNodId = async (id) => {
  try {
    await createRealm();
    const result = realm.objects('Transaction').filtered('node_id == $0', id);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_fetchTransactionsByNodId',
    });
  }
};

export const findAndUpdateTransaction = async (id, updates) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('Transaction', id);
    if (!obj) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    const { server_id, date, error } = updates;

    realm.write(() => {
      obj.server_id = server_id;
      obj.date = date;
      obj.error = error;
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_findAndUpdateTransaction',
    });
  }
};

export const findAndUpdateTransactionInvoice = async (id, invoiceFile) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('Transaction', id);
    if (!obj) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    realm.write(() => {
      obj.invoice_file = invoiceFile;
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_findAndUpdateTransactionInvoice',
    });
  }
};

export const deleteTransactionById = async (id) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('Transaction', id);
    if (obj) {
      realm.write(() => {
        realm.delete(obj);
      });
    }
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_deleteTransactionById',
    });
  }
};

export const updateTransactionDeleteStatus = async (id, status) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('Transaction', id);
    if (!obj) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    realm.write(() => {
      obj.is_deleted = status;
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_updateDeleteStatus',
    });
  }
};

export const findTransaction = async (id) => {
  try {
    await createRealm();
    const result = realm.objectForPrimaryKey('Transaction', id);
    if (!result) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_findTransaction',
    });
  }
};

export const fetchTransactionByServerId = async (serverId) => {
  try {
    await createRealm();
    const result = realm
      .objects('Transaction')
      .filtered('server_id == $0', serverId);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_fetchTransactionByServerId',
    });
  }
};

export const findAllUnUploadedTransactionsInvoices = async () => {
  try {
    await createRealm();
    const result = realm
      .objects('Transaction')
      .filtered(
        'server_id != "" && invoice_file CONTAINS[c] "file://" && is_deleted = false',
      );
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_findAllUnUploadedTransactionsInvoices',
    });
  }
};

export const countNewTransactions = async () => {
  try {
    await createRealm();
    const result = realm
      .objects('Transaction')
      .filtered('server_id == "" && is_deleted = false');
    return JSON.parse(JSON.stringify(result.length));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_countNewTransactions',
    });
  }
};

export const updateTransactionError = async (id, transactionError) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('Transaction', id);
    if (!obj) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    realm.write(() => {
      obj.error = transactionError;
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_updateTransactionError',
    });
  }
};

export const countErroredTransactions = async () => {
  try {
    await createRealm();
    const result = realm
      .objects('Transaction')
      .filtered('server_id == "" && error != ""');
    return JSON.parse(JSON.stringify(result.length));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_countErroredTransactions',
    });
  }
};

export const updateTransactionReport = async (
  id,
  reportedStatus,
  reportedData,
) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('Transaction', id);
    if (!obj) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    let data = reportedData;
    if (data && typeof data === 'object') {
      data = jsonToString(data);
    }

    realm.write(() => {
      obj.reported = data;
      obj.is_reported = reportedStatus;
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_updateTransactionReport',
    });
  }
};

export const getTransactionByReference = async (referenceId) => {
  try {
    await createRealm();
    const result = realm
      .objects('Transaction')
      .filtered('reference_id == $0', referenceId);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_getTransactionByReference',
    });
  }
};

export const findAllUnSendTransactions = async () => {
  try {
    await createRealm();
    const result = realm
      .objects('Transaction')
      .filtered(
        'current_quantity_corrected != $0 && type == $1',
        0,
        APP_TRANS_TYPE_INCOMING,
      );
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_findAllUnSendTransactions',
    });
  }
};

export const findAllUnSendTransactionByProduct = async (productId) => {
  try {
    await createRealm();
    const result = realm
      .objects('Transaction')
      .filtered(
        'current_quantity_corrected != $0 && type == $1 && product_id == $2 && is_deleted == false',
        0,
        APP_TRANS_TYPE_INCOMING,
        productId,
      );
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_findAllUnSendTransactionByProduct',
    });
  }
};

export const updateTransactionCurrentQuantity = async (id, updates) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('Transaction', id);
    if (!obj) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    const { current_quantity_corrected } = updates;

    realm.write(() => {
      obj.current_quantity_corrected = current_quantity_corrected;
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_updateTransactionCurrentQuantity',
    });
  }
};

export const findAllDeletedTransactions = async () => {
  try {
    await createRealm();
    const result = realm
      .objects('Transaction')
      .filtered(
        'server_id != "" && type = $0 && is_deleted = true && is_edited = true',
        APP_TRANS_TYPE_INCOMING,
      );
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_findAllNewBuyTransactions',
    });
  }
};

export const countDeletedTransactions = async () => {
  try {
    await createRealm();
    const result = realm
      .objects('Transaction')
      .filtered('server_id != "" && is_deleted = true && is_edited = true');
    return JSON.parse(JSON.stringify(result.length));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_findAllNewBuyTransactions',
    });
  }
};

export const fetchUnSyncedTransactionsByCardIds = async (ids) => {
  try {
    await createRealm();
    const result = realm
      .objects('Transaction')
      .filtered('card_id IN $0 && server_id == "" && is_deleted = false', ids);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionsHelper_fetchTransactionsByNodId',
    });
  }
};

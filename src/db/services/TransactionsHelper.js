/* eslint-disable camelcase */
import { realm } from '../Configuration';
import captureSentry from '../../services/sentryHelper';
import { jsonToString, removeNullValues } from '../../services/commonFunctions';
import { APP_TRANS_TYPE_LOSS } from '../../services/constants';

export const fetchAllTransactions = async () => {
  // _getAllTransactions
  try {
    const transactions = realm.objects('Transaction');
    return transactions;
  } catch (error) {
    captureSentry('error', error);
  }
};

export const createTransaction = async (obj) => {
  try {
    const transactionObj = await removeNullValues(obj);
    if (transactionObj.id) {
      delete transactionObj.id;
    }

    const response = realm.write(() => {
      return realm.create('Transaction', transactionObj);
    });

    return response.id;
  } catch (error) {
    captureSentry('error', error);
  }
};

export const updateTransaction = async (id, updates) => {
  try {
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
    captureSentry('error', error);
  }
};

export const findAllNewTransactions = async () => {
  try {
    return realm.objects('Transaction').filtered('server_id == ""');
  } catch (error) {
    captureSentry('error', error);
  }
};

export const fetchTransactionsByNodId = async (id) => {
  try {
    return realm.objects('Transaction').filtered('node_id == $0', id);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findAndUpdateTransaction = async (id, updates) => {
  try {
    const obj = realm.objectForPrimaryKey('Transaction', id);
    if (!obj) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    const { server_id, ref_number, date, unit, error } = updates;

    realm.write(() => {
      obj.server_id = server_id;
      obj.ref_number = ref_number;
      obj.date = date;
      obj.unit = unit;
      obj.error = error;
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findAndUpdateTransactionInvoice = async (id, invoiceFile) => {
  try {
    const obj = realm.objectForPrimaryKey('Transaction', id);
    if (!obj) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    realm.write(() => {
      obj.invoice_file = invoiceFile;
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const deleteTransactionById = async (id) => {
  try {
    const obj = realm.objectForPrimaryKey('Transaction', id);
    if (obj) {
      realm.write(() => {
        realm.delete(obj);
      });
    }
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findTransaction = async (id) => {
  try {
    const obj = realm.objectForPrimaryKey('Transaction', id);
    if (!obj) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    return obj;
  } catch (error) {
    captureSentry('error', error);
  }
};

export const fetchTransactionByServerId = async (serverId) => {
  try {
    return realm.objects('Transaction').filtered('server_id == $0', serverId);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findAllUnUploadedTransactionsInvoices = async () => {
  try {
    return realm
      .objects('Transaction')
      .filtered('server_id != "" && invoice_file CONTAINS[c] "file://"');
  } catch (error) {
    captureSentry('error', error);
  }
};

export const countNewTransactions = async () => {
  try {
    const transactions = realm
      .objects('Transaction')
      .filtered('server_id == ""');
    return transactions.length;
  } catch (error) {
    captureSentry('error', error);
  }
};

export const updateTransactionError = async (id, transactionError) => {
  try {
    const obj = realm.objectForPrimaryKey('Transaction', id);
    if (!obj) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    realm.write(() => {
      obj.error = transactionError;
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const countErroredTransactions = async () => {
  try {
    const transactions = realm
      .objects('Transaction')
      .filtered('server_id == "" && error != ""');
    return transactions.length;
  } catch (error) {
    captureSentry('error', error);
  }
};

export const updateTransactionReport = async (
  id,
  reportedStatus,
  reportedData,
) => {
  try {
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
    captureSentry('error', error);
  }
};

export const getAllTotalZeroTransactions = async () => {
  try {
    return realm
      .objects('Transaction')
      .filtered('transaction_type != $0 && total == 0', APP_TRANS_TYPE_LOSS);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const updateTransactionTotal = async (id, total) => {
  try {
    const obj = realm.objectForPrimaryKey('Transaction', id);
    if (!obj) {
      throw new Error(`Transaction with ID ${id} not found`);
    }

    realm.write(() => {
      obj.total = total;
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

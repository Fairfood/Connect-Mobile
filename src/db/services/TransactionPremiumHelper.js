import { reInitRealm, realm } from '../Configuration';
import {
  TYPE_BASE_PRICE,
  TYPE_GENERIC_PREMIUM,
  TYPE_TRANSACTION_PREMIUM,
} from '../../utils/constants';
import { handleErrors } from '../../utils/commonFunctions';
import { jsonToString, removeNullValues } from '../../utils/helperFunctions';

const createRealm = async () => {
  if (realm.isClosed) {
    reInitRealm();
  }
};

export const fetchAllTransactionPremiums = async () => {
  // _getAllTransactionPremiums
  try {
    await createRealm();
    const result = realm.objects('TransactionPremium');
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionPremiumHelper_fetchAllTransactionPremiums',
    });
  }
};

export const createTransactionPremium = async (obj) => {
  // _saveTransactionPremium
  try {
    await createRealm();
    const transactionPremiumObj = await removeNullValues(obj);
    if (transactionPremiumObj.id) {
      delete transactionPremiumObj.id;
    }

    realm.write(() => {
      realm.create('TransactionPremium', transactionPremiumObj);
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionPremiumHelper_createTransactionPremium',
    });
  }
};

export const updateTransactionPremium = async (id, updates) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('TransactionPremium', id);

    if (!obj) {
      throw new Error(`TransactionPremium with ID ${id} not found`);
    }

    const updateObj = await removeNullValues(updates);

    let extraFields = updateObj?.extra_fields ?? '{}';
    if (extraFields && typeof extraFields === 'object') {
      extraFields = jsonToString(extraFields);
    }

    updateObj.extra_fields = extraFields;
    updateObj.id = obj.id;

    realm.write(() => {
      realm.create('TransactionPremium', updateObj, 'modified');
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionPremiumHelper_updateTransactionPremium',
    });
  }
};

export const updateTransactionPremiumServerId = async (id, serverId) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('TransactionPremium', id);
    if (!obj) {
      throw new Error(`TransactionPremium with ID ${id} not found`);
    }

    realm.write(() => {
      obj.server_id = serverId;
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionPremiumHelper_updateTransactionPremiumServerId',
    });
  }
};

export const deleteTransactionPremiumById = async (id) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('TransactionPremium', id);
    if (obj) {
      realm.write(() => {
        realm.delete(obj);
      });
    }
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionPremiumHelper_deleteTransactionPremiumById',
    });
  }
};

export const fetchAllPremiumsByTransaction = async (transactionId) => {
  try {
    await createRealm();
    const result = realm
      .objects('TransactionPremium')
      .filtered('transaction_id == $0', transactionId);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionPremiumHelper_fetchAllPremiumsByTransaction',
    });
  }
};

export const fetchPremiumsByTransactionAndCategory = async (
  transactionId,
  category,
) => {
  try {
    await createRealm();
    const result = realm
      .objects('TransactionPremium')
      .filtered(
        'transaction_id == $0 && category == $1',
        transactionId,
        category,
      );
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionPremiumHelper_fetchPremiumsByTransactionAndCategory',
    });
  }
};

export const fetchTransactionPremiumByServerId = async (serverId) => {
  try {
    await createRealm();
    const result = realm
      .objects('TransactionPremium')
      .filtered('server_id == $0', serverId);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionPremiumHelper_fetchTransactionPremiumByServerId',
    });
  }
};

export const findAllNewPayments = async () => {
  try {
    await createRealm();
    const result = realm
      .objects('TransactionPremium')
      .filtered('server_id == "" && category == $0', TYPE_GENERIC_PREMIUM);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionPremiumHelper_findAllNewPayments',
    });
  }
};

export const findAllTransactionPremiumByDestination = async (destination) => {
  try {
    await createRealm();
    const result = realm
      .objects('TransactionPremium')
      .filtered('destination == $0', destination);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionPremiumHelper_findAllTransactionPremiumByDestination',
    });
  }
};

export const findAllTransactionPremiumByCardID = async (cardId) => {
  try {
    await createRealm();
    const result = realm
      .objects('TransactionPremium')
      .filtered('card_id == $0', cardId);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionPremiumHelper_findAllTransactionPremiumByCardID',
    });
  }
};

export const updateTransactionPremiumDestination = async (id, destination) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('TransactionPremium', id);
    if (!obj) {
      throw new Error(`TransactionPremium with ID ${id} not found`);
    }

    realm.write(() => {
      obj.destination = destination;
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionPremiumHelper_updateTransactionPremiumDestination',
    });
  }
};

export const updateTransactionPremiumCard = async (id, cardId) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('TransactionPremium', id);
    if (!obj) {
      throw new Error(`TransactionPremium with ID ${id} not found`);
    }

    realm.write(() => {
      obj.card_id = cardId;
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionPremiumHelper_updateTransactionPremiumCard',
    });
  }
};

// need_unit_test
export const findAllUnUploadedPaymentInvoices = async () => {
  try {
    await createRealm();
    const result = realm
      .objects('TransactionPremium')
      .filtered(
        'server_id != "" && receipt CONTAINS[c] "file://" && category == $0',
        TYPE_GENERIC_PREMIUM,
      );
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionPremiumHelper_findAllUnUploadedPaymentInvoices',
    });
  }
};

export const findAndUpdatePaymentInvoice = async (id, invoiceFile) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('TransactionPremium', id);
    if (!obj) {
      throw new Error(`TransactionPremium with ID ${id} not found`);
    }

    realm.write(() => {
      obj.receipt = invoiceFile;
    });
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionPremiumHelper_findAndUpdatePaymentInvoice',
    });
  }
};

export const findUnSyncedTransactionPremium = async (
  transactionId,
  premiumId,
) => {
  try {
    await createRealm();
    const result = realm
      .objects('TransactionPremium')
      .filtered(
        'transaction_id == $0 && premium_id == $1 && server_id == "" && category == $2',
        transactionId,
        premiumId,
        TYPE_TRANSACTION_PREMIUM,
      );
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionPremiumHelper_findUnSyncedTransactionPremium',
    });
  }
};

export const findUnSyncedBasePricePremium = async (transactionId) => {
  try {
    await createRealm();
    const result = realm
      .objects('TransactionPremium')
      .filtered(
        'transaction_id == $0 && server_id == "" && category == $1',
        transactionId,
        TYPE_BASE_PRICE,
      );
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionPremiumHelper_findUnSyncedBasePricePremium',
    });
  }
};

export const updatePaymentReport = async (id, reportedStatus, reportedData) => {
  try {
    await createRealm();
    const obj = realm.objectForPrimaryKey('TransactionPremium', id);
    if (!obj) {
      throw new Error(`TransactionPremium with ID ${id} not found`);
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
      ref: 'TransactionPremiumHelper_updatePaymentReport',
    });
  }
};

export const getPaymentByReference = async (referenceId) => {
  try {
    await createRealm();
    const result = realm
      .objects('TransactionPremium')
      .filtered('reference_id == $0', referenceId);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionPremiumHelper_getPaymentByReference',
    });
  }
};

export const fetchUnSyncedTransactionPremiumWithCardIds = async (ids) => {
  try {
    await createRealm();
    const result = realm
      .objects('TransactionPremium')
      .filtered('card_id IN $0 && server_id == "" && is_deleted = false', ids);
    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    handleErrors(error, {
      ref: 'TransactionPremiumHelper_findUnSyncedTransactionPremium',
    });
  }
};

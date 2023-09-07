/* eslint-disable camelcase */
import { realm } from '../Configuration';
import captureSentry from '../../services/sentryHelper';
import {
  TYPE_BASE_PRICE,
  TYPE_GENERIC_PREMIUM,
  TYPE_TRANSACTION_PREMIUM,
} from '../../services/constants';
import { removeNullValues } from '../../services/commonFunctions';

export const fetchAllTransactionPremiums = async () => {
  // _getAllTransactionPremiums
  try {
    const transactionPremiums = realm.objects('TransactionPremium');
    return transactionPremiums;
  } catch (error) {
    captureSentry('error', error);
  }
};

export const createTransactionPremium = async (obj) => {
  // _saveTransactionPremium
  try {
    const transactionPremiumObj = await removeNullValues(obj);

    let extraFields = transactionPremiumObj?.extra_fields ?? '{}';
    if (extraFields && typeof extraFields === 'object') {
      extraFields = jsonToString(extraFields);
    }

    transactionPremiumObj.extra_fields = extraFields;
    if (transactionPremiumObj.id) {
      delete transactionPremiumObj.id;
    }

    realm.write(() => {
      realm.create('TransactionPremium', transactionPremiumObj);
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const updateTransactionPremium = async (id, updates) => {
  try {
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
    captureSentry('error', error);
  }
};

export const updateTransactionPremiumServerId = async (id, serverId) => {
  try {
    const obj = realm.objectForPrimaryKey('TransactionPremium', id);
    if (!obj) {
      throw new Error(`TransactionPremium with ID ${id} not found`);
    }

    realm.write(() => {
      obj.server_id = serverId;
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const deleteTransactionPremiumById = async (id) => {
  try {
    const obj = realm.objectForPrimaryKey('TransactionPremium', id);
    if (obj) {
      realm.write(() => {
        realm.delete(obj);
      });
    }
  } catch (error) {
    captureSentry('error', error);
  }
};

export const fetchAllPremiumsByTransaction = async (transactionId) => {
  try {
    return realm
      .objects('TransactionPremium')
      .filtered('transaction_id == $0', transactionId);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const fetchPremiumsByTransactionAndCategory = async (
  transactionId,
  category,
) => {
  try {
    return realm
      .objects('TransactionPremium')
      .filtered(
        'transaction_id == $0 && category == $1',
        transactionId,
        category,
      );
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findAllTransactionByPremium = async (premiumId) => {
  try {
    return realm
      .objects('TransactionPremium')
      .filtered('premium_id == $0', premiumId);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const fetchTransactionPremiumByServerId = async (serverId) => {
  try {
    return realm
      .objects('TransactionPremium')
      .filtered('server_id == $0', serverId);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findAllNewPayments = async () => {
  try {
    return realm
      .objects('TransactionPremium')
      .filtered('server_id == "" && category == $0', TYPE_GENERIC_PREMIUM);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findAllTransactionPremiumByDestination = async (destination) => {
  try {
    return realm
      .objects('TransactionPremium')
      .filtered('destination == $0', destination);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findAllTransactionPremiumByCardID = async (cardId) => {
  try {
    return realm
      .objects('TransactionPremium')
      .filtered('card_id == $0', cardId);
  } catch (error) {
    captureSentry('error', error);
  }
};

export const updateTransactionPremiumDestination = async (id, destination) => {
  try {
    const obj = realm.objectForPrimaryKey('TransactionPremium', id);
    if (!obj) {
      throw new Error(`TransactionPremium with ID ${id} not found`);
    }

    realm.write(() => {
      obj.destination = destination;
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const updateTransactionPremiumCard = async (id, cardId) => {
  try {
    const obj = realm.objectForPrimaryKey('TransactionPremium', id);
    if (!obj) {
      throw new Error(`TransactionPremium with ID ${id} not found`);
    }

    realm.write(() => {
      obj.card_id = cardId;
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

// need_unit_test
export const findAllUnUploadedPaymentInvoices = async () => {
  try {
    return realm
      .objects('TransactionPremium')
      .filtered(
        'server_id != "" && receipt CONTAINS[c] "file://" && category == $0',
        TYPE_GENERIC_PREMIUM,
      );
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findAndUpdatePaymentInvoice = async (id, invoiceFile) => {
  try {
    const obj = realm.objectForPrimaryKey('TransactionPremium', id);
    if (!obj) {
      throw new Error(`TransactionPremium with ID ${id} not found`);
    }

    realm.write(() => {
      obj.receipt = invoiceFile;
    });
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findUnSyncedTransactionPremium = async (
  transactionId,
  premiumId,
) => {
  try {
    return realm
      .objects('TransactionPremium')
      .filtered(
        'transaction_id == $0 && premium_id == $1 && server_id == "" && category == $2',
        transactionId,
        premiumId,
        TYPE_TRANSACTION_PREMIUM,
      );
  } catch (error) {
    captureSentry('error', error);
  }
};

export const findUnSyncedBasePricePremium = async (transactionId) => {
  try {
    return realm
      .objects('TransactionPremium')
      .filtered(
        'transaction_id == $0 && server_id == "" && category == $1',
        transactionId,
        TYPE_BASE_PRICE,
      );
  } catch (error) {
    captureSentry('error', error);
  }
};

export const updatePaymentReport = async (id, reportedStatus, reportedData) => {
  try {
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
    captureSentry('error', error);
  }
};

export const fetchAllTransactionPremiumByAmount = async () => {
  try {
    return realm.objects('TransactionPremium').filtered('amount == 0');
  } catch (error) {
    captureSentry('error', error);
  }
};

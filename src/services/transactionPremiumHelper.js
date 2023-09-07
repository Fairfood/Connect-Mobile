import { Q } from '@nozbe/watermelondb';
import { database } from '../../App';
import { TYPE_BASE_PRICE, TYPE_GENERIC_PREMIUM, TYPE_TRANSACTION_PREMIUM } from './constants';
import { jsonToString } from './commonFunctions';

const transactionPremiums = database.collections.get('transaction_premiums');

export const observeTransactionPremiums = () => {
  return transactionPremiums.query().observe();
};

export const saveTransactionPremium = async (data) => {
  let extraFields = data.extra_fields;
  if (extraFields && typeof extraFields === 'object') {
    extraFields = jsonToString(extraFields);
  }

  await database.action(async () => {
    await transactionPremiums.create((entry) => {
      entry.premium_id = data.premium_id;
      entry.transaction_id = data.transaction_id;
      entry.amount = data.amount;
      entry._raw.server_id = data.server_id;
      entry._raw.category = data.category;
      entry._raw.type = data.type;
      entry._raw.verification_method = data.verification_method;
      entry._raw.receipt = data.receipt;
      entry._raw.card_id = data.card_id;
      entry._raw.node_id = data.node_id;
      entry._raw.date = data.date;
      entry._raw.currency = data.currency;
      entry._raw.source = data.source;
      entry._raw.destination = data.destination;
      entry._raw.verification_longitude = data.verification_longitude;
      entry._raw.verification_latitude = data.verification_latitude;
      entry._raw.reported = data.reported;
      entry._raw.is_reported = data.is_reported;
      entry._raw.extra_fields = extraFields;
    });
  });
};

export const updateTransactionPremium = async (id, updates) => {
  let extraFields = updates.extra_fields;
  if (extraFields && typeof extraFields === 'object') {
    extraFields = jsonToString(extraFields);
  }

  await database.action(async () => {
    const transactionPremium = await transactionPremiums.find(id);

    await transactionPremium.update((entry) => {
      entry.premium_id = updates.premium_id;
      entry.transaction_id = updates.transaction_id;
      entry.amount = updates.amount;
      entry._raw.server_id = updates.server_id;
      entry._raw.category = updates.category;
      entry._raw.type = updates.type;
      entry._raw.verification_method = updates.verification_method;
      entry._raw.receipt = updates.receipt;
      entry._raw.card_id = updates.card_id;
      entry._raw.node_id = updates.node_id;
      entry._raw.date = updates.date;
      entry._raw.currency = updates.currency;
      entry._raw.source = updates.source;
      entry._raw.destination = updates.destination;
      entry._raw.verification_longitude = updates.verification_longitude;
      entry._raw.verification_latitude = updates.verification_latitude;
      entry._raw.reported = updates.reported;
      entry._raw.is_reported = updates.is_reported;
      entry._raw.extra_fields = extraFields;
    });
  });
};

export const updateTransactionPremiumServerId = async (id, serverId) => {
  await database.action(async () => {
    const transactionPremium = await transactionPremiums.find(id);

    await transactionPremium.update((entry) => {
      entry._raw.server_id = serverId;
    });
  });
};

export const deleteTransactionPremiumById = async (id) => {
  await database.action(async () => {
    const transactionPremium = await transactionPremiums.find(id);
    await transactionPremium.destroyPermanently();
  });
};

export const findAllPremiumsByTransaction = async (id) => {
  return transactionPremiums.query(Q.where('transaction_id', id));
};

export const findAllPremiumsByTransactionAndCategory = async (
  transactionId,
  category,
) => {
  return transactionPremiums.query(
    Q.where('transaction_id', transactionId),
    Q.where('category', category),
  );
};

export const getAllTransactionPremiums = async () => {
  return transactionPremiums.query().fetch();
};

export const findAllTransactionByPremium = async (id) => {
  return transactionPremiums.query(Q.where('premium_id', id));
};

export const findAllTransactionPremiumByServerId = async (id) => {
  return transactionPremiums.query(Q.where('server_id', id));
};

export const findAllNewPayments = async () => {
  return transactionPremiums.query(
    Q.where('server_id', ''),
    Q.where('category', TYPE_GENERIC_PREMIUM),
  );
};

export const findAllTransactionPremiumByDestination = async (destination) => {
  return transactionPremiums.query(Q.where('destination', destination));
};

export const findAllTransactionPremiumByCardID = async (cardId) => {
  return transactionPremiums.query(Q.where('card_id', cardId));
};

export const updateTransactionPremiumDestination = async (id, destination) => {
  await database.action(async () => {
    const transactionPremium = await transactionPremiums.find(id);

    await transactionPremium.update((entry) => {
      entry._raw.destination = destination;
    });
  });
};

export const updateTransactionPremiumCard = async (id, card) => {
  await database.action(async () => {
    const transactionPremium = await transactionPremiums.find(id);

    await transactionPremium.update((entry) => {
      entry._raw.card_id = card;
    });
  });
};

export const findAllUnUploadedPaymentInvoices = async () => {
  return transactionPremiums.query(
    Q.where('server_id', Q.notEq('')),
    Q.where('receipt', Q.like('%file%')),
    Q.where('category', TYPE_GENERIC_PREMIUM),
  );
};

export const findAndUpdatePaymentInvoice = async (
  paymentId,
  invoiceFile,
) => {
  await database.action(async () => {
    const transactionPremium = await transactionPremiums.find(paymentId);
    await transactionPremium.update((tx) => {
      tx._raw.receipt = invoiceFile;
    });
  });
};

export const findUnSyncedTransactionPremium = async (transactionId, premiumId) => {
  return transactionPremiums.query(
    Q.where('transaction_id', transactionId),
    Q.where('premium_id', premiumId),
    Q.where('server_id', ''),
    Q.where('category', TYPE_TRANSACTION_PREMIUM),
  );
};

export const findUnSyncedBasePricePremium = async (transactionId) => {
  return transactionPremiums.query(
    Q.where('transaction_id', transactionId),
    Q.where('server_id', ''),
    Q.where('category', TYPE_BASE_PRICE),
  );
};

export const updatePaymentReport = async (
  id,
  reportedStatus,
  reportedData,
) => {
  let data = reportedData;
  if (data && typeof data === 'object') {
    data = jsonToString(data);
  }

  await database.action(async () => {
    const transactionPremium = await transactionPremiums.find(id);

    await transactionPremium.update((entry) => {
      entry._raw.reported = data;
      entry._raw.is_reported = reportedStatus;
    });
  });
};

import { Q } from '@nozbe/watermelondb';
import { database } from '../../App';

const transactionPremiums = database.collections.get('transaction_premiums');

export const saveTransactionPremium = async (
  premiumId,
  transactionId,
  amount,
) => {
  await database.action(async () => {
    await transactionPremiums.create((entry) => {
      entry.premium_id = premiumId;
      entry.transaction_id = transactionId;
      entry.amount = amount;
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

export const getAllTransactionPremiums = async () => {
  return transactionPremiums.query().fetch();
};

export const findAllTransactionByPremium = async (id) => {
  return transactionPremiums.query(Q.where('premium_id', id));
};

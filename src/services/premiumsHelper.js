import { Q } from '@nozbe/watermelondb';
import { database } from '../../App';

const premiums = database.collections.get('premiums');

export const getAllPremiums = async () => {
  const allPremiums = await premiums.query().fetch();
  return allPremiums;
};

export const observePremiums = () => {
  return premiums.query().observe();
};

export const savePremium = async (premium) => {
  await database.action(async () => {
    await premiums.create((entry) => {
      entry.server_id = premium.id;
      entry.name = premium.name;
      entry.type = premium.type;
      entry.amount = premium.amount;
      entry.included_in_amt = premium.included;
      entry.is_card_dependent = premium.dependant_on_card;
      entry.applicable_activity = premium.applicable_activity;
      entry._raw.category = premium.category;
    });
  });
};

export const updatePremium = async (id, updates) => {
  const premium = await premiums.find(id);

  await database.action(async () => {
    await premium.update((entry) => {
      entry.server_id = updates.id;
      entry.name = updates.name;
      entry.type = updates.type;
      entry.amount = updates.amount;
      entry.included_in_amt = updates.included;
      entry.is_card_dependent = updates.dependant_on_card;
      entry.applicable_activity = updates.applicable_activity;
      entry._raw.category = updates.category;
    });
  });
};

export const clearAllPremiums = async () => {
  const allPremiums = await database.collections
    .get('premiums')
    .query()
    .fetch();

  await database.action(async () => {
    const deleted = allPremiums.map((premium) => {
      return premium.prepareDestroyPermanently();
    });

    database.batch(...deleted);
  });
};

export const findPremiumById = async (id) => {
  return premiums.find(id);
};

export const findPremiumByServerId = async (id) => {
  return premiums.query(Q.where('server_id', id));
};

export const getPremiumByCategory = async (category) => {
  return premiums.query(Q.where('category', category));
};

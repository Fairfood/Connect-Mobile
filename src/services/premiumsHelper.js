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
  const res = await database.action(async () => {
    const response = await premiums.create((entry) => {
      entry.server_id = premium.id;
      entry.name = premium.name;
      entry.type = premium.type;
      entry.amount = premium.amount;
      entry.included_in_amt = premium.included;
      entry.is_card_dependent = premium.dependant_on_card;
      entry.applicable_activity = premium.applicable_activity;
      entry._raw.category = premium.category;
      entry._raw.is_active = premium.is_active;
      entry._raw.calculation_type = premium.calculation_type;
    });
    return response;
  });
  return res;
};

export const updatePremium = async (id, updates) => {
  if (!id) {
    return;
  }

  const premiumExist = premiums.query(Q.where('id', id));

  if (premiumExist.length === 0) {
    return;
  }

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
      entry._raw.is_active = updates.is_active;
      entry._raw.calculation_type = updates.calculation_type;
    });
  });
};

export const findPremiumById = async (id) => {
  return premiums.find(id);
};

export const searchPremiumById = async (id) => {
  return premiums.query(Q.where('id', id));
};

export const findPremiumByServerId = async (id) => {
  return premiums.query(Q.where('server_id', id));
};

export const getPremiumByCategory = async (category) => {
  return premiums.query(Q.where('category', category));
};

export const getAllActivePremiums = async () => {
  return premiums.query(Q.where('is_active', true));
};

export const updatePremiumActiveStatus = async (id, status) => {
  if (!id) {
    return;
  }

  const premiumExist = premiums.query(Q.where('id', id));

  if (premiumExist.length === 0) {
    return;
  }

  const premium = await premiums.find(id);

  await database.action(async () => {
    await premium.update((entry) => {
      entry._raw.is_active = status;
    });
  });
};

export const fetchPremiumsByCalculationType = async (calculationType) => {
  return premiums.query(Q.where('calculation_type', calculationType));
};

import { Q } from '@nozbe/watermelondb';
import { database } from '../../App';

const cards = database.collections.get('cards');

export const getAllCards = async () => {
  const allCards = await cards.query().fetch();
  return allCards;
};

export const observeCards = () => {
  return cards.query().observe();
};

export const saveCard = async (card) => {
  await database.action(async () => {
    await cards.create((entry) => {
      entry.card_id = card.card_id;
      entry.node_id = card.node_id;
      entry.fair_id = card.fair_id;
      entry.server_id = card.server_id;
      entry.created_at = card.created_at;
      entry.updated_at = card.updated_at;
    });
  });
};

export const updateCardServerID = async (id, serverId) => {
  await database.action(async () => {
    const card = await cards.find(id);
    await card.update((tx) => {
      tx.server_id = serverId;
    });
  });
};

export const clearAllCards = async () => {
  const allCards = await database.collections.get('cards').query().fetch();
  await database.action(async () => {
    const deleted = allCards.map((card) => {
      return card.prepareDestroyPermanently();
    });

    database.batch(...deleted);
  });
};

export const getAllUnSyncCards = async () => {
  return cards.query(Q.where('server_id', ''), Q.where('node_id', Q.notEq('')));
};

export const getAllCardsByNodeId = async (nodeId) => {
  return cards.query(Q.where('node_id', nodeId));
};

export const findCardByCardId = async (cardId) => {
  return cards.query(Q.where('card_id', cardId));
};

export const updateCardId = async (id, cardId) => {
  await database.action(async () => {
    const card = await cards.find(id);
    await card.update((tx) => {
      tx.card_id = cardId;
      tx.server_id = '';
    });
  });
};

export const updateCardNodeIDById = async (id, update) => {
  await database.action(async () => {
    const card = await cards.find(id);
    await card.update((tx) => {
      tx.node_id = update.node_id;
      tx.fair_id = update.fair_id;
      tx.server_id = update.server_id;
      tx.updated_at = Math.floor(Date.now() / 1000);
    });
  });
};

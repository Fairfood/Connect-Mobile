import Realm from 'realm';

export default class Card extends Realm.Object {
  static schema = {
    name: 'Card',
    primaryKey: 'id',
    properties: {
      id: {
        type: 'string',
        default: () => new Realm.BSON.ObjectId().toHexString(),
      },
      server_id: {
        type: 'string',
        default: '',
      },
      card_id: {
        type: 'string',
        default: '',
      },
      node_id: {
        type: 'string',
        default: '',
      },
      fair_id: {
        type: 'string',
        default: '',
      },
      created_at: {
        type: 'int',
        default: () => Math.round(new Date().getTime() / 1000),
      },
      updated_at: {
        type: 'int',
        default: () => Math.round(new Date().getTime() / 1000),
      },
    },
  };
}

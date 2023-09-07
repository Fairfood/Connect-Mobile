import Realm from 'realm';

export default class TransactionPremium extends Realm.Object {
  static schema = {
    name: 'TransactionPremium',
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
      premium_id: {
        type: 'string',
        default: '',
      },
      transaction_id: {
        type: 'string',
        default: '',
      },
      amount: {
        type: 'float',
        default: 0,
      },
      category: {
        type: 'string',
        default: '',
      },
      type: {
        type: 'string',
        default: '',
      },
      verification_method: {
        type: 'int',
        default: 0,
      },
      receipt: {
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
      date: {
        type: 'int',
        default: 0,
      },
      currency: {
        type: 'string',
        default: '',
      },
      source: {
        type: 'string',
        default: '',
      },
      destination: {
        type: 'string',
        default: '',
      },
      verification_latitude: {
        type: 'float',
        default: 0,
      },
      verification_longitude: {
        type: 'float',
        default: 0,
      },
      is_reported: {
        type: 'bool',
        default: false,
      },
      reported: {
        type: 'string',
        default: '',
      },
      extra_fields: {
        type: 'string',
        default: '',
      },
      options: {
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

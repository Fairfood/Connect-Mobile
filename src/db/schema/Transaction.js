import Realm from 'realm';

export default class Transaction extends Realm.Object {
  static schema = {
    name: 'Transaction',
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
      node_id: {
        type: 'string',
        default: '',
      },
      product_id: {
        type: 'string',
        default: '',
      },
      product_price: {
        type: 'float',
        default: 0,
      },
      type: {
        type: 'int',
        default: 0,
      },
      currency: {
        type: 'string',
        default: '',
      },
      quantity: {
        type: 'float',
        default: 0,
      },
      ref_number: {
        type: 'int',
        default: 0,
      },
      price: {
        type: 'float',
        default: 0,
      },
      invoice_file: {
        type: 'string',
        default: '',
      },
      date: {
        type: 'string',
        default: '',
      },
      total: {
        type: 'float',
        default: 0,
      },
      quality_correction: {
        type: 'int',
        default: 0,
      },
      verification_method: {
        type: 'int',
        default: 0,
      },
      verification_longitude: {
        type: 'float',
        default: 0,
      },
      verification_latitude: {
        type: 'float',
        default: 0,
      },
      is_verified: {
        type: 'bool',
        default: false,
      },
      is_loss: {
        type: 'bool',
        default: false,
      },
      is_deleted: {
        type: 'bool',
        default: false,
      },
      card_id: {
        type: 'string',
        default: '',
      },
      transaction_type: {
        type: 'int',
        default: 0,
      },
      extra_fields: {
        type: 'string',
        default: '',
      },
      error: {
        type: 'string',
        default: '',
      },
      reported: {
        type: 'string',
        default: '',
      },
      is_reported: {
        type: 'bool',
        default: false,
      },
      created_on: {
        type: 'int',
        default: () => Math.round(new Date().getTime() / 1000),
      },
      updated_on: {
        type: 'int',
        default: () => Math.round(new Date().getTime() / 1000),
      },
    },
  };
}

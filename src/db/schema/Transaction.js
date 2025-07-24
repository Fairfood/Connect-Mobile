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
      product_price_corrected: {
        type: 'double',
        default: 0,
      },
      type: {
        type: 'string',
        default: '',
      },
      currency: {
        type: 'string',
        default: '',
      },
      quantity_corrected: {
        type: 'double',
        default: 0,
      },
      price_corrected: {
        type: 'double',
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
      total_corrected: {
        type: 'double',
        default: 0,
      },
      quality_correction: {
        type: 'int',
        default: 0,
      },
      verification_method: {
        type: 'string',
        default: '',
      },
      verification_longitude_corrected: {
        type: 'double',
        default: 0,
      },
      verification_latitude_corrected: {
        type: 'double',
        default: 0,
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
      reference_id: {
        type: 'string',
        default: '',
      },
      parents: {
        type: 'set',
        objectType: 'string',
        default: [],
      },
      source: {
        type: 'string',
        default: '',
      },
      destination: {
        type: 'string',
        default: '',
      },
      current_quantity_corrected: {
        type: 'double',
        default: 0,
      },
      is_deleted: {
        type: 'bool',
        default: false,
      },
      is_edited: {
        type: 'bool',
        default: false,
      },
    },
  };
}

import Realm from 'realm';

export default class Batch extends Realm.Object {
  static schema = {
    name: 'Batch',
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
      transaction_id: {
        type: 'string',
        default: '',
      },
      product_id: {
        type: 'string',
        default: '',
      },
      initial_quantity: {
        type: 'float',
        default: 0,
      },
      current_quantity: {
        type: 'float',
        default: 0,
      },
      ref_number: {
        type: 'int',
        default: 0,
      },
      unit: {
        type: 'int',
        default: 0,
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

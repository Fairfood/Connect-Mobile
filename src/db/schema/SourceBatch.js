import Realm from 'realm';

export default class SourceBatch extends Realm.Object {
  static schema = {
    name: 'SourceBatch',
    primaryKey: 'id',
    properties: {
      id: {
        type: 'string',
        default: () => new Realm.BSON.ObjectId().toHexString(),
      },
      transaction_id: {
        type: 'string',
        default: '',
      },
      batch_id: {
        type: 'string',
        default: '',
      },
      quantity: {
        type: 'float',
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

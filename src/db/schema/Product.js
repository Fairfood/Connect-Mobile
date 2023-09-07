import Realm from 'realm';

export default class Product extends Realm.Object {
  static schema = {
    name: 'Product',
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
      name: {
        type: 'string',
        default: '',
      },
      description: {
        type: 'string',
        default: '',
      },
      image: {
        type: 'string',
        default: '',
      },
      price: {
        type: 'float',
        default: 0,
      },
      is_active: {
        type: 'bool',
        default: true,
      },
    },
  };
}

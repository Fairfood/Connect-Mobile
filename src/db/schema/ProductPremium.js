import Realm from 'realm';

export default class ProductPremium extends Realm.Object {
  static schema = {
    name: 'ProductPremium',
    primaryKey: 'id',
    properties: {
      id: {
        type: 'string',
        default: () => new Realm.BSON.ObjectId().toHexString(),
      },
      product_id: {
        type: 'string',
        default: '',
      },
      premium_id: {
        type: 'string',
        default: '',
      },
    },
  };
}

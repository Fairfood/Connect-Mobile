import Realm from 'realm';

export default class Premium extends Realm.Object {
  static schema = {
    name: 'Premium',
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
      type: {
        type: 'string',
        default: '',
      },
      amount_corrected: {
        type: 'double',
        default: 0,
      },
      included: {
        type: 'bool',
        default: false,
      },
      dependant_on_card: {
        type: 'bool',
        default: false,
      },
      applicable_activity: {
        type: 'string',
        default: '',
      },
      category: {
        type: 'string',
        default: '',
      },
      calculation_type: {
        type: 'string',
        default: '',
      },
      is_active: {
        type: 'bool',
        default: true,
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
      label: {
        type: 'string',
        default: '',
      },
    },
  };
}

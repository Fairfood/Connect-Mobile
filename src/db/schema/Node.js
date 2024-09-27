import Realm from 'realm';

export default class Node extends Realm.Object {
  static schema = {
    name: 'Node',
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
        type: 'int',
        default: 2,
      },
      phone: {
        type: 'string',
        default: '',
      },
      ktp: {
        type: 'string',
        default: '',
      },
      street: {
        type: 'string',
        default: '',
      },
      city: {
        type: 'string',
        default: '',
      },
      country: {
        type: 'string',
        default: '',
      },
      province: {
        type: 'string',
        default: '',
      },
      zipcode: {
        type: 'string',
        default: '',
      },
      image: {
        type: 'string',
        default: '',
      },
      latitude: {
        type: 'float',
        default: 0,
      },
      longitude: {
        type: 'float',
        default: 0,
      },
      card_id: {
        type: 'string',
        default: '',
      },
      is_modified: {
        type: 'bool',
        default: false,
      },
      is_card_modified: {
        type: 'bool',
        default: false,
      },
      extra_fields: {
        type: 'string',
        default: '',
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

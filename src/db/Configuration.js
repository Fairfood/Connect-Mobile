import Realm from 'realm';
import Card from './schema/Card';
import Node from './schema/Node';
import Premium from './schema/Premium';
import Product from './schema/Product';
import ProductPremium from './schema/ProductPremium';
import Transaction from './schema/Transaction';
import TransactionPremium from './schema/TransactionPremium';
import migrations from './Migrations';

// Create a configuration object
export const realmConfig = {
  schemaVersion: 15,
  schema: [
    Card,
    Node,
    Premium,
    Product,
    ProductPremium,
    Transaction,
    TransactionPremium,
  ],
  onMigration: migrations,
};

let realm = new Realm(realmConfig);

export const reInitRealm = () => {
  realm = new Realm(realmConfig);
};

export { realm };

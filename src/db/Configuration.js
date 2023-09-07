import Realm from 'realm';
import { createRealmContext } from '@realm/react';

import Batch from './schema/Batch';
import Card from './schema/Card';
import Node from './schema/Node';
import Premium from './schema/Premium';
import Product from './schema/Product';
import ProductPremium from './schema/ProductPremium';
import SourceBatch from './schema/SourceBatch';
import Transaction from './schema/Transaction';
import TransactionPremium from './schema/TransactionPremium';

// Create a configuration object
const realmConfig = {
  schemaVersion: 2,
  schema: [
    Batch,
    Card,
    Node,
    Premium,
    Product,
    ProductPremium,
    SourceBatch,
    Transaction,
    TransactionPremium,
  ],
};

const realm = new Realm(realmConfig);
const realmContext = createRealmContext(realmConfig);

export { realm, realmContext };

import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 7,
  tables: [
    tableSchema({
      name: 'nodes',
      columns: [
        { name: 'server_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'type', type: 'number' }, // company 1 and farmer 2
        { name: 'phone', type: 'string' },
        { name: 'ktp', type: 'string' },
        { name: 'street', type: 'string' },
        { name: 'city', type: 'string' },
        { name: 'country', type: 'string' },
        { name: 'province', type: 'string' },
        { name: 'zipcode', type: 'string' },
        { name: 'image', type: 'string' },
        { name: 'latitude', type: 'number' },
        { name: 'longitude', type: 'number' },
        { name: 'card_id', type: 'string' }, // check if it is unique
        { name: 'is_modified', type: 'boolean' }, // specify default
        { name: 'is_card_modified', type: 'boolean' }, // specify default
        { name: 'last_synced', type: 'number' }, //
        { name: 'created_on', type: 'number' }, //
        { name: 'updated_on', type: 'number' }, //
        { name: 'extra_fields', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'transactions',
      columns: [
        { name: 'server_id', type: 'string' },
        { name: 'node_id', type: 'string' },
        { name: 'product_id', type: 'string' },
        { name: 'product_price', type: 'number' },
        { name: 'type', type: 'number' }, // Incoming/outgoing
        { name: 'currency', type: 'string' },
        { name: 'quantity', type: 'number' },
        { name: 'ref_number', type: 'number' },
        { name: 'price', type: 'number' },
        { name: 'invoice_file', type: 'string' },
        { name: 'created_on', type: 'number' },
        { name: 'date', type: 'string' },
        { name: 'total', type: 'number' },
        { name: 'quality_correction', type: 'number' },
        { name: 'verification_method', type: 'number' },
        { name: 'verification_longitude', type: 'number' },
        { name: 'verification_latitude', type: 'number' },
        // { name: "timestamp", type: "string" },
        // { name: "latitude", type: "number", isOptional: true },
        // { name: "longitude", type: "number", isOptional: true },
        { name: 'is_verified', type: 'boolean' }, // specify default
        { name: 'is_loss', type: 'boolean' }, // specify default
        { name: 'is_deleted', type: 'boolean' }, // specify default
        { name: 'card_id', type: 'string', isOptional: true }, // check if it is unique
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'transaction_type', type: 'number' },
        { name: 'extra_fields', type: 'string' },
        { name: 'error', type: 'string' },
        { name: 'reported', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'batches',
      columns: [
        { name: 'server_id', type: 'string' },
        { name: 'transaction_id', type: 'string' },
        { name: 'product_id', type: 'string' },
        { name: 'initial_quantity', type: 'number' },
        { name: 'current_quantity', type: 'number' },
        { name: 'ref_number', type: 'number' },
        { name: 'unit', type: 'number' }, // Check if the  unit it string or number
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'source_batches',
      columns: [
        { name: 'transaction_id', type: 'string', isIndexed: true },
        { name: 'batch_id', type: 'string', isIndexed: true },
        { name: 'quantity', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'products',
      columns: [
        { name: 'server_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'image', type: 'string' },
        { name: 'price', type: 'number' },
        { name: 'is_active', type: 'boolean' },
      ],
    }),
    tableSchema({
      name: 'premiums',
      columns: [
        { name: 'server_id', type: 'string' },
        { name: 'name', type: 'string' },
        { name: 'type', type: 'number' }, // per txn, per kg, per unit , per farmer
        { name: 'amount', type: 'number' },
        { name: 'included_in_amt', type: 'boolean' },
        { name: 'is_card_dependent', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'applicable_activity', type: 'number' },
        { name: 'category', type: 'string' },
      ],
    }),
    tableSchema({
      name: 'transaction_premiums',
      columns: [
        { name: 'premium_id', type: 'string' },
        { name: 'transaction_id', type: 'string', isIndexed: true }, // per txn, per kg, per unit , per farmer
        { name: 'amount', type: 'number' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'server_id', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'type', type: 'string' },
        { name: 'verification_method', type: 'number' },
        { name: 'receipt', type: 'string' },
        { name: 'card_id', type: 'string' },
        { name: 'node_id', type: 'string' },
        { name: 'date', type: 'number' },
        { name: 'currency', type: 'string' },
        { name: 'source', type: 'string' },
        { name: 'destination', type: 'string' },
        { name: 'verification_latitude', type: 'number' },
        { name: 'verification_longitude', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'cards',
      columns: [
        { name: 'server_id', type: 'string' },
        { name: 'card_id', type: 'string' },
        { name: 'node_id', type: 'string' },
        { name: 'fair_id', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'product_premiums',
      columns: [
        { name: 'product_id', type: 'string' },
        { name: 'premium_id', type: 'string' },
      ],
    }),
  ],
});

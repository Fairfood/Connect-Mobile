import {
  schemaMigrations,
  createTable,
  addColumns,
} from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    {
      toVersion: 7,
      steps: [
        addColumns({
          table: 'transaction_premiums',
          columns: [
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
        addColumns({
          table: 'premiums',
          columns: [
            { name: 'category', type: 'string' },
          ],
        }),
      ],
    },
    {
      toVersion: 6,
      steps: [
        addColumns({
          table: 'cards',
          columns: [{ name: 'fair_id', type: 'string' }],
        }),
      ],
    },
    {
      toVersion: 5,
      steps: [
        addColumns({
          table: 'transactions',
          columns: [
            { name: 'error', type: 'string' },
            { name: 'reported', type: 'string' },
          ],
        }),
      ],
    },
    {
      toVersion: 4,
      steps: [
        addColumns({
          table: 'transactions',
          columns: [{ name: 'extra_fields', type: 'string' }],
        }),
        addColumns({
          table: 'nodes',
          columns: [{ name: 'extra_fields', type: 'string' }],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        createTable({
          name: 'product_premiums',
          columns: [
            { name: 'product_id', type: 'string' },
            { name: 'premium_id', type: 'string' },
          ],
        }),
      ],
    },
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'premiums',
          columns: [{ name: 'applicable_activity', type: 'number' }],
        }),
      ],
    },
  ],
});

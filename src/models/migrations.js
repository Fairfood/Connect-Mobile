import {
  schemaMigrations,
  createTable,
  addColumns,
} from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
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

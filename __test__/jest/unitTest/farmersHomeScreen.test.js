import { sortFarmers } from '../../../src/screens/farmers/farmersHomeScreen/controller';

describe('sortFarmers function', () => {
  const farmers = [
    { name: 'Alice', created_on: 1708041599 },
    { name: 'Bob', created_on: 1708041600 },
    { name: 'Charlie', created_on: 1708041598 },
  ];

  it('sorts by created_descending', async () => {
    const sortedFarmers = await sortFarmers(farmers, 'created_descending');
    expect(sortedFarmers).toEqual([
      { name: 'Bob', created_on: 1708041600 },
      { name: 'Alice', created_on: 1708041599 },
      { name: 'Charlie', created_on: 1708041598 },
    ]);
  });

  it('sorts by created_ascending', async () => {
    const sortedFarmers = await sortFarmers(farmers, 'created_ascending');
    expect(sortedFarmers).toEqual([
      { name: 'Charlie', created_on: 1708041598 },
      { name: 'Alice', created_on: 1708041599 },
      { name: 'Bob', created_on: 1708041600 },
    ]);
  });

  it('sorts by name_ascending', async () => {
    const sortedFarmers = await sortFarmers(farmers, 'name_ascending');
    expect(sortedFarmers).toEqual([
      { name: 'Alice', created_on: 1708041599 },
      { name: 'Bob', created_on: 1708041600 },
      { name: 'Charlie', created_on: 1708041598 },
    ]);
  });

  it('sorts by name_descending', async () => {
    const sortedFarmers = await sortFarmers(farmers, 'name_descending');
    expect(sortedFarmers).toEqual([
      { name: 'Charlie', created_on: 1708041598 },
      { name: 'Bob', created_on: 1708041600 },
      { name: 'Alice', created_on: 1708041599 },
    ]);
  });

  it('uses created_descending as default', async () => {
    const sortedFarmers = await sortFarmers(farmers, 'created_descending');
    expect(sortedFarmers).toEqual([
      { name: 'Bob', created_on: 1708041600 },
      { name: 'Alice', created_on: 1708041599 },
      { name: 'Charlie', created_on: 1708041598 },
    ]);
  });
});

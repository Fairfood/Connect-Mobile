import { getSectionListData } from '../../../src/screens/transactions/transactionHomeScreen/controller';

describe('getSectionListData function', () => {
  it('should correctly sort and group data by reference_id when filterItem.groupByType is reference_id', () => {
    const data = [
      { reference_id: 'TRC123', created_on: 1710828056 },
      { reference_id: 'TRC123', created_on: 1710828056 },
      { reference_id: 'TRC121', created_on: 1710828039 },
    ];
    const filterItem = { groupByType: 'reference_id' };

    const result = getSectionListData('transaction', data, filterItem);

    expect(result).toEqual([
      {
        title: 'TRC123',
        data: [
          {
            reference_id: 'TRC123',
            created_on: 1710828056,
            key: 'TRC123',
          },
          {
            reference_id: 'TRC123',
            created_on: 1710828056,
            key: 'TRC123',
          },
        ],
      },
      {
        title: 'TRC121',
        data: [
          {
            reference_id: 'TRC121',
            created_on: 1710828039,
            key: 'TRC121',
          },
        ],
      },
    ]);
  });

  it('should correctly sort and filter out when reference_id is empty', () => {
    const data = [
      { reference_id: 'TRC123', created_on: 1710828056 },
      { reference_id: 'TRC123', created_on: 1710828056 },
      { reference_id: '', created_on: 1710828039 },
    ];
    const filterItem = { groupByType: 'reference_id' };

    const result = getSectionListData('transaction', data, filterItem);

    expect(result).toEqual([
      {
        title: 'TRC123',
        data: [
          {
            reference_id: 'TRC123',
            created_on: 1710828056,
            key: 'TRC123',
          },
          {
            reference_id: 'TRC123',
            created_on: 1710828056,
            key: 'TRC123',
          },
        ],
      },
    ]);
  });

  it('should correctly sort and group data by date when filterItem.groupByType is not reference_id', () => {
    const data = [
      { created_on: 1710828056 },
      { created_on: 1710741628 },
      { created_on: 1710655228 },
    ];

    const result = getSectionListData('transaction', data);

    expect(result).toEqual([
      {
        title: '2024-03-19',
        data: [{ created_on: 1710828056, key: '2024-03-19' }],
      },
      {
        title: '2024-03-18',
        data: [{ created_on: 1710741628, key: '2024-03-18' }],
      },
      {
        title: '2024-03-17',
        data: [{ created_on: 1710655228, key: '2024-03-17' }],
      },
    ]);
  });

  it('should correctly sort and group data by date when type is not transaction', () => {
    const data = [
      { date: 1710828056 },
      { date: 1710741628 },
      { date: 1710655228 },
    ];

    const result = getSectionListData('payment', data);

    expect(result).toEqual([
      {
        title: '2024-03-19',
        data: [{ date: 1710828056, key: '2024-03-19' }],
      },
      {
        title: '2024-03-18',
        data: [{ date: 1710741628, key: '2024-03-18' }],
      },
      {
        title: '2024-03-17',
        data: [{ date: 1710655228, key: '2024-03-17' }],
      },
    ]);
  });

  it('should handle empty data array', () => {
    const result = getSectionListData('transaction', []);
    expect(result).toEqual([]);
  });

  it('should handle null data array', () => {
    const result = getSectionListData('transaction', null);
    expect(result).toEqual([]);
  });

  it('should handle undefined data array', () => {
    const result = getSectionListData('transaction', undefined);
    expect(result).toEqual([]);
  });
});

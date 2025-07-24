import { groupBy } from '../../../src/screens/home/send/sendScreen/controller';

describe('groupBy', () => {
  test('should group an array of objects by a given property', () => {
    const data = [
      { id: 1, premium_name: 'Quality', premium_id: 20 },
      { id: 2, premium_name: 'Collector', premium_id: 25 },
      { id: 3, premium_name: 'Data', premium_id: 20 },
    ];

    const groupedData = groupBy(data, 'premium_id');

    expect(groupedData).toEqual({
      20: [
        { id: 1, premium_name: 'Quality', premium_id: 20 },
        { id: 3, premium_name: 'Data', premium_id: 20 },
      ],
      25: [{ id: 2, premium_name: 'Collector', premium_id: 25 }],
    });
  });

  test('should handle an empty array', () => {
    const data = [];

    const groupedData = groupBy(data, 'premium_id');

    expect(groupedData).toEqual({});
  });
});

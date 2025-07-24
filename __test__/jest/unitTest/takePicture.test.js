import { getTotal } from '../../../src/screens/home/buy/takePicture/controller';

describe('getTotal validations', () => {
  it('should return the productTotal if premiums array is empty', async () => {
    const productTotal = 100;
    const premiums = [];
    const result = await getTotal(productTotal, premiums);
    expect(result).toEqual(productTotal);
  });

  it('should subtract the total of premiums with dependant_on_card from productTotal', async () => {
    const productTotal = 100;
    const premiums = [
      { dependant_on_card: true, total: 20 },
      { dependant_on_card: false, total: 10 },
      { dependant_on_card: true, total: 30 },
    ];
    const result = await getTotal(productTotal, premiums);
    expect(result).toEqual(productTotal - 20 - 30); // 50
  });

  it('should subtract the total of premiums with dependant_on_card from productTotal and round the productTotal first', async () => {
    const productTotal = 100.1;
    const premiums = [
      { dependant_on_card: true, total: 20.5 },
      { dependant_on_card: false, total: 10.6 },
      { dependant_on_card: true, total: 30.4 },
    ];
    const result = await getTotal(productTotal, premiums);
    expect(result).toEqual(productTotal - 20.5 - 30.4);
  });

  it('should not subtract the total of premiums without dependant_on_card from productTotal', async () => {
    const productTotal = 100;
    const premiums = [
      { dependant_on_card: false, total: 20 },
      { dependant_on_card: false, total: 10 },
      { dependant_on_card: false, total: 30 },
    ];
    const result = await getTotal(productTotal, premiums);
    expect(result).toEqual(productTotal);
  });
});

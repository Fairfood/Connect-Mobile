import {
  MAXIMUM_PAY_FARMER_AMOUNT,
  MINIMUM_PAY_FARMER_AMOUNT,
} from '../../../src/utils/constants';
import { calculateTotalPrice, validatePayFarmerForm } from '../../../src/screens/home/payFarmer/payFarmerScreen/controller'; // Update 'yourModuleName' to the correct module path

describe('validatePayFarmerForm', () => {
  it('returns [false, message] when premiums is empty', async () => {
    const premiums = [];
    const currencyCode = 'USD';
    const result = await validatePayFarmerForm(premiums, currencyCode, []);
    expect(result).toEqual([false, 'minimum_one_premium_required']);
  });

  it('returns [false, message] when premiums is null', async () => {
    const premiums = null;
    const currencyCode = 'USD';
    const result = await validatePayFarmerForm(premiums, currencyCode, []);
    expect(result).toEqual([false, 'minimum_one_premium_required']);
  });

  it('returns [false, message] when premiums is undefined', async () => {
    const premiums = undefined;
    const currencyCode = 'USD';
    const result = await validatePayFarmerForm(premiums, currencyCode, []);
    expect(result).toEqual([false, 'minimum_one_premium_required']);
  });

  it('returns [false, message] when paid_amount is missing', async () => {
    const premiums = [{ name: 'Premium 1' }];
    const currencyCode = 'USD';
    const result = await validatePayFarmerForm(premiums, currencyCode, []);
    expect(result).toEqual([false, 'Premium 1 - amount required.']);
  });

  it('returns [false, message] when paid_amount is less than MINIMUM_PAY_FARMER_AMOUNT', async () => {
    const premiums = [
      { name: 'Premium 1', paid_amount: MINIMUM_PAY_FARMER_AMOUNT - 1 },
    ];
    const currencyCode = 'USD';
    const result = await validatePayFarmerForm(premiums, currencyCode, []);
    expect(result).toEqual([
      false,
      `Premium 1 - amount must_be_greater_than ${MINIMUM_PAY_FARMER_AMOUNT}USD`,
    ]);
  });

  it('returns [false, message] when paid_amount is greater than or equal to MAXIMUM_PAY_FARMER_AMOUNT', async () => {
    const premiums = [
      { name: 'Premium 1', paid_amount: MAXIMUM_PAY_FARMER_AMOUNT },
    ];
    const currencyCode = 'USD';
    const result = await validatePayFarmerForm(premiums, currencyCode, []);
    expect(result).toEqual([
      false,
      `Premium 1 - amount must_be_lower_than ${MAXIMUM_PAY_FARMER_AMOUNT}USD`,
    ]);
  });

  it('returns [true, null] when all conditions pass', async () => {
    const premiums = [
      { name: 'Premium 1', paid_amount: MINIMUM_PAY_FARMER_AMOUNT + 1 },
    ];
    const currencyCode = 'USD';
    const result = await validatePayFarmerForm(premiums, currencyCode, []);
    expect(result).toEqual([true, null]);
  });
});

describe('calculateTotalPrice', () => {
  it('should return 0 if premiums is undefined', async () => {
    const premiums = undefined;
    const result = await calculateTotalPrice(premiums);
    expect(result).toBe(0);
  });

  it('should return 0 if premiums is null', async () => {
    const premiums = null;
    const result = await calculateTotalPrice(premiums);
    expect(result).toBe(0);
  });

  it('should return 0 if premiums is an empty array', async () => {
    const premiums = [];
    const result = await calculateTotalPrice(premiums);
    expect(result).toBe(0);
  });

  it('should return 0 when no products have a paid amount', async () => {
    const premiums = [
      { paid_amount: '' },
      { paid_amount: '' },
      { paid_amount: '' },
    ];
    const total = await calculateTotalPrice(premiums);
    expect(total).toEqual(0);
  });

  it('should ignore products with empty paid_amount fields', async () => {
    const premiums = [
      { paid_amount: '10.50' },
      { paid_amount: '' },
      { paid_amount: '20.75' },
    ];
    const total = await calculateTotalPrice(premiums);
    expect(total).toEqual(31.25); // Sum of the paid_amounts: 10.50 + 20.75 = 31.25
  });

  it('should return the total paid amount when all products have a paid amount', async () => {
    const premiums = [
      { paid_amount: '10.50' },
      { paid_amount: '15.25' },
      { paid_amount: '20.75' },
    ];
    const total = await calculateTotalPrice(premiums);
    expect(total).toEqual(46.5); // Sum of the paid_amounts: 10.50 + 15.25 + 20.75 = 46.50
  });
});

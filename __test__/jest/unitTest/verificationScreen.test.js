import { getTotalPrice } from '../../../src/screens/home/buy/verificationScreen/controller';

describe('getTotalPrice', () => {
  it('should return 0 when no products are provided', () => {
    const products = [];
    const result = getTotalPrice(products);
    expect(result).toEqual(0);
  });

  it('should return 0 when any product has missing fields', () => {
    const products = [
      { quantity: 1, base_price: 10 },
      { base_price: 10, total_amount: 100 },
      { quantity: 1, total_amount: 100 },
    ];
    const result = getTotalPrice(products);
    expect(result).toEqual(0);
  });

  it('should return the correct total price when some products have valid fields and others do not', () => {
    const products = [
      { quantity: 1, base_price: 10, total_amount: 100, premium_total: 5 },
      { quantity: 2, base_price: 20 },
      { quantity: 3, total_amount: 300, premium_total: 15 },
    ];
    const result = getTotalPrice(products);
    expect(result).toEqual(Math.round((100 + 5))); // 105
  });

  it('should return the correct total price when all products have valid fields', () => {
    const products = [
      { quantity: 1, base_price: 10, total_amount: 100, premium_total: 5 },
      { quantity: 2, base_price: 20, total_amount: 200, premium_total: 10 },
      { quantity: 3, base_price: 30, total_amount: 300, premium_total: 15 },
    ];
    const result = getTotalPrice(products);
    expect(result).toEqual(Math.round((100 + 5) + (200 + 10) + (300 + 15))); // 655
  });
});

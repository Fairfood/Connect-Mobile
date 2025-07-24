import { getTotalAmount } from '../../../src/screens/home/send/sendTakePicture/controller';
import {
  PREMIUM_APPLICABLE_ACTIVITY_BUY,
  PREMIUM_APPLICABLE_ACTIVITY_SELL,
  PREMIUM_MANUAL,
  PREMIUM_OPTIONS,
} from '../../../src/utils/constants';

describe('getTotalAmount', () => {
  it('calculates the total amount correctly', async () => {
    const product = {
      edited_quantity: 95,
      ratio: 1,
      total_amount: 100,
      total_premiums: [
        {
          applicable_activity: PREMIUM_APPLICABLE_ACTIVITY_BUY,
          total_premium_quantity: 2,
          calculation_type: PREMIUM_MANUAL,
          total: 50,
          amount: 10,
        },
        {
          applicable_activity: PREMIUM_APPLICABLE_ACTIVITY_BUY,
          total_premium_quantity: 4,
          calculation_type: PREMIUM_OPTIONS,
          total: 30,
          amount: 5,
        },
        {
          applicable_activity: PREMIUM_APPLICABLE_ACTIVITY_SELL,
          total_premium_quantity: 10,
          calculation_type: PREMIUM_MANUAL,
          total: 50,
          amount: 5,
        },
      ],
    };

    const result = await getTotalAmount(product);
    expect(result).toEqual(655);
  });

  // need fix
});

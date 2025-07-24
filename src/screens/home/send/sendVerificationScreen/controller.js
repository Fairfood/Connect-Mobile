import {
  PREMIUM_APPLICABLE_ACTIVITY_BUY,
  PREMIUM_MANUAL,
  PREMIUM_OPTIONS,
} from '../../../../utils/constants';

/**
 * Get total amount including premiums of all product
 * @param   {Array} products  product array
 * @returns {number}          total amount
 */
export const getAllTotalAmount = (products) => {
  let totalAmount = 0;

  products.forEach(
    ({ edited_quantity, ratio, total_amount, total_premiums }) => {
      const editedQuantity =
        edited_quantity !== '' ? parseFloat(edited_quantity) : 0;
      const productRatio = ratio !== '' ? parseFloat(ratio) : 1;

      totalAmount += parseFloat(total_amount) * productRatio;

      total_premiums.forEach((premium) => {
        const {
          amount,
          applicable_activity,
          calculation_type,
          total_premium_quantity,
          total,
        } = premium;

        if (applicable_activity === PREMIUM_APPLICABLE_ACTIVITY_BUY) {
          if (editedQuantity < total_premium_quantity) {
            if (
              calculation_type === PREMIUM_MANUAL ||
              calculation_type === PREMIUM_OPTIONS
            ) {
              totalAmount += productRatio * total;
            } else {
              totalAmount += amount * editedQuantity;
            }
          } else if (
            calculation_type === PREMIUM_MANUAL ||
            calculation_type === PREMIUM_OPTIONS
          ) {
            totalAmount += total;
          } else {
            totalAmount += amount * total_premium_quantity;
          }
        } else {
          totalAmount += amount * editedQuantity;
        }
      });
    },
  );

  return totalAmount;
};

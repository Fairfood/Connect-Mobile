import {
  PREMIUM_APPLICABLE_ACTIVITY_BUY,
  PREMIUM_MANUAL,
  PREMIUM_OPTIONS,
} from '../../../../utils/constants';

/**
 * Get total amount including premiums by product
 * @param   {object} product  product object
 * @returns {number}          total amount including premiums
 */
export const getTotalAmount = async (product) => {
  const { edited_quantity, ratio, total_amount, total_premiums } = product;
  const editedQuantity =
    edited_quantity !== '' ? parseFloat(edited_quantity) : 0;
  const productRatio = ratio !== '' ? parseFloat(ratio) : 1;
  let totalAmount = total_amount * productRatio;

  total_premiums.forEach(
    ({
      applicable_activity,
      total_premium_quantity,
      calculation_type,
      total,
      amount,
    }) => {
      if (applicable_activity === PREMIUM_APPLICABLE_ACTIVITY_BUY) {
        if (editedQuantity < total_premium_quantity) {
          totalAmount +=
            calculation_type === PREMIUM_MANUAL ||
            calculation_type === PREMIUM_OPTIONS
              ? total * productRatio
              : amount * editedQuantity;
        } else {
          totalAmount +=
            calculation_type === PREMIUM_MANUAL ||
            calculation_type === PREMIUM_OPTIONS
              ? total
              : amount * parseFloat(total_premium_quantity);
        }
      } else {
        totalAmount += amount * editedQuantity;
      }
    },
  );

  return totalAmount;
};

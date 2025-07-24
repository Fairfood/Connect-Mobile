import {
  FORM_TYPE_PAYMENT,
  MAXIMUM_PAY_FARMER_AMOUNT,
  MINIMUM_PAY_FARMER_AMOUNT,
} from '../../../../utils/constants';
import I18n from '../../../../translations/text/i18n';

export const validatePayFarmerForm = async (premiums, currencyCode, forms) => {
  if (!premiums || premiums.length === 0) {
    return [false, 'minimum_one_premium_required'];
  }

  for (const premium of premiums) {
    if (!premium.paid_amount) {
      return [
        false,
        `${premium.name} - ${fieldLabel(forms, 'amount')} ${I18n.t(
          'required',
        )}.`,
      ];
    }

    const paidAmount = parseFloat(premium.paid_amount);

    if (paidAmount <= MINIMUM_PAY_FARMER_AMOUNT) {
      return [
        false,
        `${premium.name} - ${fieldLabel(forms, 'amount')} ${I18n.t(
          'must_be_greater_than',
        )} ${MINIMUM_PAY_FARMER_AMOUNT}${currencyCode}`,
      ];
    }

    if (paidAmount >= MAXIMUM_PAY_FARMER_AMOUNT) {
      return [
        false,
        `${premium.name} - ${fieldLabel(forms, 'amount')} ${I18n.t(
          'must_be_lower_than',
        )} ${MAXIMUM_PAY_FARMER_AMOUNT}${currencyCode}`,
      ];
    }
  }

  return [true, null];
};

/**
 * calculate and set total price based on updated product array
 * @param   {Array} premiums updated product array
 * @returns {number}         total amount
 */
export const calculateTotalPrice = async (premiums) => {
  if (!premiums) {
    return 0;
  }

  const total = premiums.reduce((acc, product) => {
    if (product.paid_amount === '') {
      return acc;
    }
    return acc + parseFloat(product.paid_amount);
  }, 0);

  return total;
};

export const fieldVisibility = (form, key) => {
  const farmerForm = form.filter((x) => x.form_type === FORM_TYPE_PAYMENT);
  const fieldConfig = farmerForm?.[0]?.field_config ?? [];
  return !fieldConfig.some((x) => x.key === key && x.visibility === false);
};

export const fieldLabel = (form, key) => {
  const farmerForm = form.filter((x) => x.form_type === FORM_TYPE_PAYMENT);
  const fieldConfig = farmerForm?.[0]?.field_config ?? [];
  const field = fieldConfig.find((x) => x.key === key);
  return field?.label || I18n.t(key);
};

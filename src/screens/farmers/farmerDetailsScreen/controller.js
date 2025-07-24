import Countries from '../../../utils/countries';
import { FORM_TYPE_FARMER } from '../../../utils/constants';
import { stringToJson } from '../../../utils/helperFunctions';

export const fieldVisibility = (form, key) => {
  const farmerForm = form.filter((x) => x.form_type === FORM_TYPE_FARMER);
  const fieldConfig = farmerForm?.[0]?.field_config ?? [];
  return !fieldConfig.some((x) => x.key === key && x.visibility === false);
};

/**
 * checking phone text includes both dial code and phone number.
 * if this condition true, returns phone text otherwise null
 * @param   {string} phone phone text
 * @returns {any}          phone text or null
 */
export const getPhoneText = (phone) => {
  if (!phone) {
    return null;
  }
  const phoneText = phone.trim();
  return phoneText.includes(' ') ? phoneText : null;
};

export const getSubmissionFields = (nodeExtraFields = []) => {
  let extraFields = nodeExtraFields;

  if (typeof extraFields === 'string') {
    extraFields = stringToJson(extraFields);
  }

  const submissionFields = [];
  for (const fields of extraFields) {
    for (const values of fields.values) {
      submissionFields.push({
        label: values.field_details.label,
        value: values.value,
        key: values.field_details.key,
        type: values.field_details.type,
      });
    }
  }

  return submissionFields;
};

export const getFarmerDetails = async (farmer, companyCountry) => {
  // Splitting phone into dial code and phone number
  const phone = farmer?.phone ? farmer.phone.trim() : '';
  let [dialCode, mobile] = phone.includes(' ') ? phone.split(' ') : ['', ''];
  mobile = mobile.trim();

  // If phone is empty, set dial code based on country
  if (!dialCode) {
    const countryDialCodes = Object.entries(Countries.data).map(
      ([country, details]) => ({
        value: details.dial_code,
        country_name: country,
      }),
    );

    const country = farmer.country || companyCountry;
    const countryDetails = countryDialCodes.find(
      (x) => x.country_name === country,
    );

    dialCode = countryDetails?.value || '';
  }

  const extraFields =
    farmer?.extra_fields && typeof farmer.extra_fields === 'string'
      ? stringToJson(farmer.extra_fields)
      : '';

  // Constructing farmer details object
  const farmerDetails = {
    name: farmer.name,
    mobile,
    street: farmer.street,
    city: farmer.city,
    country: farmer.country,
    province: farmer.province,
    zipcode: farmer.zipcode,
    profilePic: farmer.image,
    dialCode: dialCode.replace('+', ''),
    reference_number: farmer.reference_number,
    card_id: farmer.card_id,
    display_id: farmer.display_id,
    extra_fields: extraFields,
  };

  return farmerDetails;
};

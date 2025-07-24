import {
  checkEmojis,
  checkMandatory,
  phoneNumberValidation,
} from '../../../utils/helperFunctions';
import I18n from '../../../translations/text/i18n';
import { FORM_TYPE_FARMER } from '../../../utils/constants';

export const validateEditFarmerForm = async (
  { name, mobile, street, city, country, province, zipcode, phone },
  forms,
  countryCode,
) => {
  // checking emoji in fields
  const emojiFields = [
    { name: fieldLabel(forms, 'full_name'), value: name },
    { name: fieldLabel(forms, 'mobile_number'), value: mobile },
    { name: fieldLabel(forms, 'street'), value: street },
    { name: fieldLabel(forms, 'city'), value: city },
    { name: fieldLabel(forms, 'postal_code'), value: zipcode },
  ];

  const [emojiValid, emojiError] = await checkEmojis(emojiFields);
  if (!emojiValid) {
    return [emojiValid, emojiError];
  }

  // checking mandatory fields
  const mandatoryFields = [
    { name: fieldLabel(forms, 'full_name'), value: name },
    { name: fieldLabel(forms, 'city'), value: city },
    { name: fieldLabel(forms, 'country'), value: country },
    { name: fieldLabel(forms, 'province'), value: province },
  ];

  const [mandatoryValid, mandatoryError] = await checkMandatory(
    mandatoryFields,
  );

  if (!mandatoryValid) {
    return [mandatoryValid, mandatoryError];
  }

  // checking mobile number is valid
  const isPhoneValid = await phoneNumberValidation(phone, countryCode);
  if (!isPhoneValid) {
    return [false, I18n.t('mobile_number_is_invalid')];
  }

  return [true, null];
};

export const checkDuplicateFarmer = (nodes, updatedObj) => {
  const isDuplicate = nodes.some((item) => {
    return Object.entries(updatedObj).every(
      ([key, value]) => item[key] === value,
    );
  });

  return isDuplicate;
};

export const fieldVisibility = (forms, key) => {
  const farmerForm = forms.filter((x) => x.form_type === FORM_TYPE_FARMER);
  const fieldConfig = farmerForm?.[0]?.field_config ?? [];
  return !fieldConfig.some((x) => x.key === key && x.visibility === false);
};

export const fieldLabel = (forms, key) => {
  const farmerForm = forms.filter((x) => x.form_type === FORM_TYPE_FARMER);
  const fieldConfig = farmerForm?.[0]?.field_config ?? [];
  const field = fieldConfig.find((x) => x.key === key);
  return field?.label || I18n.t(key);
};

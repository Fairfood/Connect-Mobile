/* eslint-disable camelcase */
import I18n from '../../../translations/text/i18n';
import { FORM_TYPE_FARMER } from '../../../utils/constants';
import {
  checkEmojis,
  checkMandatory,
  phoneNumberValidation,
} from '../../../utils/helperFunctions';

export const validateStepOneForm = async ({
  name,
  mobile,
  phone,
  reference_number,
  extraFields,
  countryCode,
  forms,
}) => {
  // checking emoji in fields
  const emojiFields = [
    // need_fix add custom fields too
    { name: fieldLabel(forms, 'full_name'), value: name },
    { name: fieldLabel(forms, 'mobile_number'), value: mobile },
    { name: fieldLabel(forms, 'reference_number'), value: reference_number },
  ];

  const [emojiValid, emojiError] = await checkEmojis(emojiFields);
  if (!emojiValid) {
    return [emojiValid, emojiError];
  }

  // checking mandatory fields
  const mandatoryFields = [
    { name: fieldLabel(forms, 'full_name'), value: name },
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

  // checking custom fields
  if (extraFields.length > 0) {
    const customFieldStatus = await customFieldValidation(extraFields);
    if (customFieldStatus !== true) {
      return [false, customFieldStatus];
    }
  }

  return [true, null];
};

export const customFieldValidation = async (customFields) => {
  const farmerFields = customFields?.[0]?.fields ?? [];

  const invalidField = farmerFields.find(
    (field) =>
      field.required &&
      (field.value === null || field.value === undefined || field.value === ''),
  );

  if (invalidField) {
    return `${invalidField.label || invalidField.key} ${I18n.t('required')}`;
  }

  return true;
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

import I18n from '../../../../translations/text/i18n';
import {
  checkEmojis,
  checkMandatory,
  phoneNumberValidation,
} from '../../../../utils/helperFunctions';

export const validateEditProfileForm = async ({
  farmerName,
  farmerLastName,
  farmerMobile,
  fullMobileNumber,
  countryCode,
}) => {
  // checking emoji in fields
  const emojiFields = [
    { name: I18n.t('first_name'), value: farmerName },
    { name: I18n.t('last_name'), value: farmerLastName },
    { name: I18n.t('mobile_number'), value: farmerMobile },
  ];

  const [emojiValid, emojiError] = await checkEmojis(emojiFields);
  if (!emojiValid) {
    return [emojiValid, emojiError];
  }

  // checking mandatory fields
  const mandatoryFields = [{ name: I18n.t('first_name'), value: farmerName }];

  const [mandatoryValid, mandatoryError] = await checkMandatory(
    mandatoryFields,
  );

  if (!mandatoryValid) {
    return [mandatoryValid, mandatoryError];
  }

  // checking mobile number is valid
  const isPhoneValid = await phoneNumberValidation(
    fullMobileNumber,
    countryCode,
  );

  if (!isPhoneValid) {
    return [false, I18n.t('mobile_number_is_invalid')];
  }

  return [true, null];
};

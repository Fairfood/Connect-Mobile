/* eslint-disable no-control-regex */
import I18n from '../../../translations/text/i18n';
import { checkEmojis } from '../../../utils/helperFunctions';

export const validateLoginForm = async (userEmail, userPassword) => {
  if (!userEmail || !userPassword) {
    return [false, I18n.t('email_and_password_are_mandatory')];
  }

  const emailRegex =
    /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;

  if (!emailRegex.test(userEmail)) {
    return [false, I18n.t('enter_a_valid_email')];
  }

  // checking emoji in fields
  const emojiFields = [
    { name: I18n.t('email_id'), value: userEmail },
    { name: I18n.t('password'), value: userPassword },
  ];

  const [emojiValid, emojiError] = await checkEmojis(emojiFields);
  if (!emojiValid) {
    return [false, emojiError];
  }

  return [true, null];
};

import PhoneNumber from 'libphonenumber-js';
import I18n from '../translations/text/i18n';
import { PHONE_NUMBER_MAX_LENGTH, PHONE_NUMBER_MIN_LENGTH } from './constants';

/**
 * converting dates to different format
 * @param   {string} date   current date string
 * @param   {string} format needed format for date
 * @returns {string}        formatted date
 */
export const ISOdateConvert = (date = null, format = 'date') => {
  let covertDate = new Date();

  if (date) {
    covertDate = new Date(date);
  }

  switch (format) {
    case 'Mon Jan 10 2021':
      return covertDate.toDateString();
    case 'date':
      return covertDate.toLocaleDateString();
    case 'time':
      return covertDate.toTimeString();
    case 'GMT format':
      return covertDate.toGMTString();
    case '2021-01-10T10:12:50.500Z':
      return covertDate.toISOString();
    case 'Local date Format':
      return covertDate.toLocaleString();
    case 'Locale time format':
      return covertDate.toLocaleTimeString();
    case 'Mon Jan 10 2021 15:42:50':
      return covertDate.toString('YYYY-MM-dd');
    case 'UTC format':
      return covertDate.toUTCString();
    default:
      return covertDate;
  }
};

/**
 * Converting value for custom fields
 * @param   {object} field  field object
 * @returns {any}           updated value
 */
export const getCustomFieldValue = (field) => {
  if (!field || !field.value) {
    return null;
  }

  if (field.type === 'BOOLEAN') {
    return field.value === 'True' ? I18n.t('yes') : I18n.t('no');
  }

  if (field.type === 'DATE') {
    const newDate = new Date(field.value);
    return ISOdateConvert(newDate);
  }

  return field.value;
};

/**
 * Converting json stringified variable to json
 * @param   {string} stringValue  json stringified variable
 * @returns {object}              json variable
 */
export const stringToJson = (stringValue) => {
  try {
    if (stringValue || typeof stringValue === 'string') {
      const value = JSON.parse(stringValue);
      if (typeof value === 'object') {
        return value;
      }

      if (typeof value === 'string') {
        return stringToJson(value);
      }
    }

    return stringValue;
  } catch {
    return stringValue;
  }
};

/**
 * Converting json to json stringified variable
 * @param   {object} jsonValue  json variable
 * @returns {string}            json stringified value
 */
export const jsonToString = (jsonValue) => {
  try {
    if (jsonValue && typeof jsonValue === 'object') {
      const value = JSON.stringify(jsonValue);
      if (typeof value === 'string') {
        return value;
      }

      if (typeof value === 'object') {
        return jsonToString(value);
      }
    }

    return jsonValue;
  } catch {
    return jsonValue;
  }
};

/**
 * Checking mandatory fields has value
 * @param   {Array} fields mandatory field array
 * @returns {Array}        validated results
 */
export const checkMandatory = async (fields = []) => {
  const invalidField = fields.find((field) => !field.value);

  if (invalidField) {
    const errMsg = `${invalidField.name} ${I18n.t('is_mandatory')}`;
    return [false, errMsg];
  }

  return [true, ''];
};

/**
 * Removing null value key pair from object
 * @param   {object} obj object with null value
 * @returns {object}     updated object
 */
export const removeNullValues = async (obj = {}) => {
  Object.entries(obj).forEach(([key, value]) => {
    if (value === null) {
      delete obj[key];
    }
  });
  return obj;
};

/**
 * Splitting currency code to individual letters
 * @param   {string} currencyCode currency code
 * @returns {string}              updated text
 */
export const getCurrencySplit = async (currencyCode) => {
  if (!currencyCode) {
    return '';
  }
  return currencyCode.toString().split('').join(' ');
};

/**
 * Checking fields has emoji value
 * @param   {Array} fields emoji field array
 * @returns {Array}        validated results
 */
export const checkEmojis = async (fields) => {
  if (!fields) {
    return [true, ''];
  }

  for (const field of fields) {
    const value = await removeEmojis(field.value);

    if (value.length !== field.value.length) {
      const errMsg = `${field.name} ${I18n.t('cannot_contain_emoji')}`;
      return [false, errMsg];
    }
  }

  return [true, ''];
};

/**
 * Replacing emoji from text
 * @param   {string} text text with emoji
 * @returns {string}      text without emoji
 */
export const removeEmojis = async (text) => {
  return text
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
      '',
    )
    .trim();
};

/**
 * Capitalizing first letter of input text
 * @param   {string} text input text
 * @returns {string}      capitalized text
 */
export const capitalizeText = async (text) => {
  if (text !== '') {
    const firstLetter = text.trim().substr(0, 1);
    const sumText = (await firstLetter.toUpperCase()) + text.trim().substr(1);
    return sumText;
  }

  return text;
};

export const phoneNumberValidation = async (phone, countryCode) => {
  if (phone === '') {
    return true;
  }

  const number = await PhoneNumber(phone, countryCode);
  if (
    !number ||
    !number.isValid() ||
    phone.length > PHONE_NUMBER_MAX_LENGTH ||
    phone.length < PHONE_NUMBER_MIN_LENGTH
  ) {
    return false;
  }

  return true;
};

export const extractPhoneNumber = async (phone, type = 'number') => {
  if (!phone) {
    return '';
  }

  let userPhoneNumber = phone;
  if (!userPhoneNumber || !userPhoneNumber.includes(' ')) {
    return userPhoneNumber;
  }

  const userCountryCode = userPhoneNumber.split(' ')[0];
  if (type === 'code') {
    return userCountryCode.replace('+', '');
  }

  if (type === 'number') {
    userPhoneNumber = userPhoneNumber.replace(userCountryCode, '');
    userPhoneNumber = userPhoneNumber.replace(/ /g, '');
    return userPhoneNumber;
  }
};

/**
 * Making avatar text by taking first letters of user's full name
 * @param   {string} name user's name
 * @returns {string}      avatar text
 */
export const avatarText = (name) => {
  const fullName = (name || '').toString().trim();
  const [firstLetter, secondLetter] = fullName
    .split(' ')
    .map((n) => n.charAt(0).toUpperCase());
  return `${firstLetter || 'A'}${
    secondLetter || fullName.charAt(1).toUpperCase() || 'A'
  }`;
};

export const getTimestampWithStartTime = (date) => {
  const selectedDate = new Date(date);
  selectedDate.setHours(0);
  selectedDate.setMinutes(0);
  selectedDate.setSeconds(0);
  selectedDate.setMilliseconds(0);
  return new Date(selectedDate).getTime();
};

export const getTimestampWithEndTime = (date) => {
  const selectedDate = new Date(date);
  selectedDate.setHours(23);
  selectedDate.setMinutes(59);
  selectedDate.setSeconds(59);
  selectedDate.setMilliseconds(999);
  return new Date(selectedDate).getTime();
};

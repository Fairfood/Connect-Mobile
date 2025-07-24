import { I18n } from 'i18n-js';
import en from './en';
import id from './id';

const translations = {
  'en-US': en,
  'id-ID': id,
};

const Speech = new I18n(translations);

Speech.defaultLocale = 'en-US';
Speech.locale = 'en-US';
Speech.enableFallback = true;

export default Speech;

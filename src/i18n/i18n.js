import { I18n } from 'i18n-js';
import en from './locales/en';
import id from './locales/id';

const translations = {
  'en-US': en,
  'en-GB': en,
  'en-IN': en,
  'id-ID': id,
};

const i18n = new I18n(translations);

i18n.defaultLocale = 'en-US';
i18n.locale = 'en-US';
i18n.enableFallback = true;

export default i18n;

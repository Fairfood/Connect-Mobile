// App transaction types
export const APP_TRANS_TYPE_OUTGOING = 'OUTGOING';
export const APP_TRANS_TYPE_INCOMING = 'INCOMING';

// Premium applicable activity
export const PREMIUM_APPLICABLE_ACTIVITY_BUY = 'BUY';
export const PREMIUM_APPLICABLE_ACTIVITY_SELL = 'SELL';

// Premium types
export const PREMIUM_PER_TRANSACTION = 'PER_TRANSACTION';
export const PREMIUM_PER_KG = 'PER_KG';
export const PREMIUM_PER_UNIT_CURRENCY = 'PER_UNIT_CURRENCY';
export const PREMIUM_PER_FARMER = 'PER_FARMER';

// Premium calculation type
export const PREMIUM_NORMAL = 'NORMAL';
export const PREMIUM_MANUAL = 'MANUAL';
export const PREMIUM_OPTIONS = 'OPTIONS';
export const PREMIUM_RANGE = 'RANGE';

// Verification method
export const VERIFICATION_METHOD_MANUAL = 'INVOICE';
export const VERIFICATION_METHOD_CARD = 'CARD';
export const VERIFICATION_METHOD_QR = 'QR';

// Verification method text
export const VERIFIED_BY_MANUAL = 'Invoice image';
export const VERIFIED_BY_CARD = 'Farmer card';
export const VERIFIED_BY_QR = 'QR code';

// payment category
export const TYPE_TRANSACTION_PREMIUM = 'TRANSACTION_PREMIUM';
export const TYPE_GENERIC_PREMIUM = 'PREMIUM';
export const TYPE_BASE_PRICE = 'TRANSACTION';

// premium category
export const PREMIUM_CATEGORY_PAYOUT = 'PAYOUT';
export const PREMIUM_CATEGORY_TRANSACTION = 'TRANSACTION';

// payment type
export const PAYMENT_INCOMING = 'INCOMING';
export const PAYMENT_OUTGOING = 'OUTGOING';

// Transaction quantity in Kg
export const MINIMUM_TRANSACTION_QUANTITY = 0.01;
export const MAXIMUM_TRANSACTION_QUANTITY = 99999999;

// pay farmer amount unit
export const MINIMUM_PAY_FARMER_AMOUNT = 0.01;
export const MAXIMUM_PAY_FARMER_AMOUNT = 99999999;

// pay farmer amount unit
export const PHONE_NUMBER_MIN_LENGTH = 3;
export const PHONE_NUMBER_MAX_LENGTH = 15;

// Price
export const MAX_BASE_PRICE = 99999999;
export const MAX_LOCAL_MARKET_PRICE = 99999999;

// transaction limit days
export const TRANSACTION_LIMIT_DAYS = 60;

// just change this variable to enable/disable force update in app
export const APP_FORCE_UPDATE = false;

// custom form types
export const FORM_TYPE_PRODUCT = 'PRODUCT';
export const FORM_TYPE_TRANSACTION = 'TRANSACTION';
export const FORM_TYPE_FARMER = 'FARMER';
export const FORM_TYPE_PAYMENT = 'PAYMENT';

// api default limit
export const API_DEFAULT_LIMIT = 100;

// authentication methods
export const AUTH_EXTERNAL = 'external_auth';
export const AUTH_PASSWORD_GRANT = 'password_grant';

export const DEFAULT_CURRENCY = {
  code: 'INR',
  id: 'E97Z5ZG64W',
  name: 'Indian Rupee',
};

// Hit slop
export const HIT_SLOP_TEN = {
  top: 10,
  right: 10,
  bottom: 10,
  left: 10,
};
export const HIT_SLOP_FIFTEEN = {
  top: 15,
  right: 15,
  bottom: 15,
  left: 15,
};
export const HIT_SLOP_TWENTY = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20,
};

// default Text-to-Speech status
export const DEFAULT_TEXT_TO_SPEECH_STATUS = false;

// avatar background colors
export const AVATAR_BG_COLORS = [
  '#ea2353',
  '#673ab7',
  '#2196f3',
  '#00bcd4',
  '#009688',
  '#8bc34a',
  '#ffc107',
  '#ff9800',
  '#795548',
];

// Months
export const LONG_MONTH_ARRAY = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const PROFILE_MENUS = [
  {
    key: 'update',
    title: 'update',
    rightArrow: true,
  },
  {
    key: 'settings',
    title: 'settings',
    rightArrow: true,
  },
  {
    key: 'privacy_statement',
    title: 'privacy_statement',
    rightArrow: true,
  },
  {
    key: 'terms_&_conditions',
    title: 'terms_&_conditions',
    rightArrow: true,
  },
  {
    key: 'help',
    title: 'help',
    rightArrow: true,
  },
  {
    key: 'how_to_use',
    title: 'how_to_use',
    rightArrow: true,
  },
  {
    key: 'report_issue',
    title: 'report_an_issue',
    rightArrow: true,
  },
  {
    key: 'contact_us',
    title: 'contact_us',
    rightArrow: true,
  },
];

export const DEFAULT_SYNC_DATA = {
  farmer: {
    pending: 0,
    finished: 0,
    failed: 0,
    status: 'completed',
  },
  transaction: {
    pending: 0,
    finished: 0,
    failed: 0,
    status: 'completed',
  },
};

export const SORT_MENUS = [
  { key: 'created_descending', title: 'created_descending' },
  { key: 'created_ascending', title: 'created_ascending' },
  { key: 'name_ascending', title: 'name_ascending' },
  { key: 'name_descending', title: 'name_descending' },
];

export const SETTINGS_MENUS = [
  {
    key: 'language',
    title: 'language',
    rightArrow: true,
  },
  {
    key: 'number_format',
    title: 'number_format',
    rightArrow: true,
  },
  {
    key: 'audio_speech',
    title: 'audio_speech',
    rightArrow: false,
  },
  {
    key: 'hot_sync',
    title: 'hot_sync',
    rightArrow: true,
  },
  {
    key: 'developer_options',
    title: 'developer_options',
    rightArrow: true,
  },
];

export const REPORT_MENUS = [
  {
    key: 'wrong_quantity',
    title: 'wrong_quantity',
  },
  {
    key: 'wrong_price',
    title: 'wrong_price',
  },
  {
    key: 'something_else',
    title: 'something_else',
  },
];

export const DEFAULT_TRANSACTION_FILTER = {
  groupByType: 'date',
  date: { startDate: '', endDate: '' },
  transactionType: { buy: false, sent: false },
  product: [],
  verificationMethod: { card: false, manual: false },
  quantity: { minQuantity: '', maxQuantity: '' },
};

export const DEFAULT_PAYMENT_FILTER = {
  groupByType: 'date',
  date: { startDate: '', endDate: '' },
  paymentType: { credit: false, debit: false },
  premium: [],
  verificationMethod: { card: false, manual: false },
  amount: { minAmount: '', maxAmount: '' },
};

export const CURRENCY_FORMAT = {
  COMA_DOT: { thousandSeparator: ',', decimalSeparator: '.' },
  DOT_COMA: { thousandSeparator: '.', decimalSeparator: ',' },
  EMPTY_DOT: { thousandSeparator: '', decimalSeparator: '.' },
  EMPTY_COMA: { thousandSeparator: '', decimalSeparator: ',' },
};

export const NUMBER_REGEX = /^\d*(\.\d*)?$/;

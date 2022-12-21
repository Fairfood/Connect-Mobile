// App transaction types
export const APP_TRANS_TYPE_OUTGOING = 1;
export const APP_TRANS_TYPE_INCOMING = 2;
export const APP_TRANS_TYPE_LOSS = 3;

// Premium applicable activity
export const PREMIUM_APPLICABLE_ACTIVITY_BUY = 101;
export const PREMIUM_APPLICABLE_ACTIVITY_SELL = 201;

// Verification method
export const VERIFICATION_METHOD_MANUAL = 1;
export const VERIFICATION_METHOD_CARD = 2;

// Transaction quantity in Kg
export const MINIMUM_TRANSACTION_QUANTITY = 0.01;
export const MAXIMUM_TRANSACTION_QUANTITY = 99999999;

// Price
export const MAX_BASE_PRICE = 99999999;
export const MAX_LOCAL_MARKET_PRICE = 99999999;

// delete transaction feature
export const DELETE_TRANSACTION_ENABLED = true;
export const SAVE_DELETE_TRANSACTION_INVOICE = false;

// Colors new
export const COLOR_PRIMARY = '#EA2353';
export const COLOR_SECONDARY = '#D9D9D9';
export const APP_BG_COLOR = '#FFFFFF';
export const TEXT_PRIMARY_COLOR = '#003A60';
export const TEXT_SECONDARY_COLOR = '#858585';
export const TEXT_PRIMARY_LIGHT_COLOR = '#5691AE';
export const INPUT_PLACEHOLDER = '#5691AE';
export const BTN_PRIMARY_TEXT_COLOR = '#FFFFFF';
export const BTN_SECONDARY_COLOR = '#333333';
export const CARD_BACKGROUND_COLOR = '#DDF3FF';
export const BUTTON_COLOR_PRIMARY = '#EA2353';
export const HEADER_BACKGROUND_COLOR = '#92DDF6';
export const SUCCESS_ICON_COLOR = '#219653';
export const WARNING_ICON_COLOR = '#F2994A';
export const ERROR_ICON_COLOR = '#EA2553';
export const ICON_COLOR = '#003A60';
export const BORDER_COLOR = '#E5EBEF';

// Fonts
export const FONT_REGULAR = 'Moderat-Regular';
export const FONT_MEDIUM = 'Moderat-Medium';
export const FONT_BOLD = 'Moderat-Bold';
export const FONT_LIGHT = 'Moderat-Mono-Light';

// Hitslop
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

// commmon borderRadius
export const BORDER_RADIUS = 6;

// profile pic avatar
export const AVATAR_AS_LETTERS = true;

// avatar background colors
export const AvatarBgColors = [
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
export const longMonthArray = [
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

export const ProfileMenus = [
  {
    key: 'language',
    title: 'language',
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
    key: 'contact_us',
    title: 'contact_us',
    rightArrow: true,
  },
  {
    key: 'help',
    title: 'help',
    rightArrow: true,
  },
  {
    key: 'settings',
    title: 'settings',
    rightArrow: true,
  },
];

export const defaultSyncData = {
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

export const SortMenus = [
  { key: 'created_descending', title: 'created_descending' },
  { key: 'created_ascending', title: 'created_ascending' },
  { key: 'name_ascending', title: 'name_ascending' },
  { key: 'name_descending', title: 'name_descending' },
];

export const SettingsMenus = [
  {
    key: 'developer_options',
    title: 'developer_options',
    rightArrow: true,
  },
];

export const defaultTransactionFilter = {
  date: { startDate: '', endDate: '' },
  transactionType: { buy: false, sent: false, loss: false },
  product: [],
  verificationMethod: { card: false, manual: false },
  quantity: { minQuantity: '', maxQuantity: '' },
};

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

// payment category
export const TYPE_TRANSACTION_PREMIUM = 'TRANSACTION_PREMIUM';
export const TYPE_GENERIC_PREMIUM = 'PREMIUM';
export const TYPE_BASE_PRICE = 'TRANSACTION';

// payment type
export const PAYMENT_INCOMING = 'INCOMING';
export const PAYMENT_OUTGOING = 'OUTGOING';

// Transaction quantity in Kg
export const MINIMUM_TRANSACTION_QUANTITY = 0.01;
export const MAXIMUM_TRANSACTION_QUANTITY = 99999999;

// pay farmer amount unit
export const MINIMUM_PAY_FARMER_AMOUNT = 0.01;
export const MAXIMUM_PAY_FARMER_AMOUNT = 99999999;

// Price
export const MAX_BASE_PRICE = 99999999;
export const MAX_LOCAL_MARKET_PRICE = 99999999;

// delete transaction feature
export const DELETE_TRANSACTION_ENABLED = true;
export const SAVE_DELETE_TRANSACTION_INVOICE = false;

// transaction limit days
export const TRANSACTION_LIMIT_DAYS = 60;

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

// common borderRadius
export const BORDER_RADIUS = 6;

// profile pic avatar
export const AVATAR_AS_LETTERS = true;

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
  // {
  //   key: 'language',
  //   title: 'language',
  //   rightArrow: true,
  // },
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
  {
    key: 'settings',
    title: 'settings',
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
    key: 'developer_options',
    title: 'developer_options',
    rightArrow: true,
  },
];

export const DEFAULT_TRANSACTION_FILTER = {
  date: { startDate: '', endDate: '' },
  transactionType: { buy: false, sent: false, loss: false },
  product: [],
  verificationMethod: { card: false, manual: false },
  quantity: { minQuantity: '', maxQuantity: '' },
};

export const DEFAULT_PAYMENT_FILTER = {
  date: { startDate: '', endDate: '' },
  paymentType: { credit: false, debit: false },
  premium: [],
  verificationMethod: { card: false, manual: false },
  amount: { minAmount: '', maxAmount: '' },
};

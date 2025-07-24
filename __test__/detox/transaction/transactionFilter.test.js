import {
  TEST_EMAIL,
  TEST_PASSWORD,
  PAYOUT_PREMIUM,
} from '../data';
import {
  MAXIMUM_TRANSACTION_QUANTITY,
  MINIMUM_TRANSACTION_QUANTITY,
} from '../../../src/utils/constants';

const data = {
  amount: '100.5',
  lessThanMinimumQuantity: String(MINIMUM_TRANSACTION_QUANTITY - 0.003),
  moreThanMaximumQuantity: String(MAXIMUM_TRANSACTION_QUANTITY),
};

describe('pay initial test', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  test('login for pay farmer', async () => {
    await element(by.id('email-input')).typeText(TEST_EMAIL);
    await element(by.id('action-text')).tap();
    await element(by.id('password-input')).typeText(TEST_PASSWORD);
    await element(by.id('action-text')).tap();
    await element(by.id('login-button')).tap();
    await expect(element(by.id('error-text'))).not.toBeVisible();
    await waitFor(element(by.id('onboard-next-button')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('onboard-next-button')).tap();
  });

  test('basic component check - home screen pay button', async () => {
    await expect(element(by.id('skip-1'))).toExist();
    await element(by.id('skip-1')).tap();
    await expect(element(by.id('home-header'))).toExist();
    await expect(element(by.id('pay-button'))).toExist();
  });

  test('basic component check - choose multi premium', async () => {
    await expect(element(by.id('pay-button'))).toExist();
    await element(by.id('pay-button')).tap();
    await expect(element(by.id('multi-premium-title-text'))).toExist();
    await expect(
      element(by.id(`premium-item-${PAYOUT_PREMIUM[0]}`)),
    ).toBeVisible();
    await element(by.id(`premium-item-${PAYOUT_PREMIUM[0]}`)).tap();
  });
});

describe('pay screen', () => {
  test('basic component check - pay page', async () => {
    await expect(element(by.id('pay-screen-header-text'))).toExist();
    await expect(
      element(by.id(`product-header-${PAYOUT_PREMIUM[0]}`)),
    ).toBeVisible();
    await expect(
      element(by.id(`remove-button-${PAYOUT_PREMIUM[0]}`)),
    ).toBeVisible();
    await waitFor(element(by.id(`field-amount-${PAYOUT_PREMIUM[0]}`)))
      .toBeVisible()
      .withTimeout(1000);
    await expect(element(by.id('add-premium-button'))).toExist();
    await expect(element(by.id('pay-submit-button'))).toExist();
  });

  test('checking empty submit', async () => {
    await element(by.id('pay-submit-button')).tap();
    await waitFor(element(by.id('common-error')))
      .toBeVisible()
      .withTimeout(1000);
    await expect(element(by.id('common-error'))).toHaveText(
      `${PAYOUT_PREMIUM[0]} - Amount required.`,
    );
  });

  test('empty quantity check', async () => {
    await element(by.id(`field-base-price-${PAYOUT_PREMIUM[0]}`)).typeText(
      data.basePrice,
    );
    await element(by.id(`field-base-price-${PAYOUT_PREMIUM[0]}`)).tapReturnKey();
    await element(by.id('pay-submit-button')).tap();
    await waitFor(element(by.id('common-error')))
      .toBeVisible()
      .withTimeout(1000);
    await expect(element(by.id('common-error'))).toHaveText(
      `${PAYOUT_PREMIUM[0]} - Quantity required.`,
    );
  });

  test('empty base price check', async () => {
    await element(by.id(`field-base-price-${PAYOUT_PREMIUM[0]}`)).clearText();
    await element(by.id(`field-amount-${PAYOUT_PREMIUM[0]}`)).typeText(data.quantity);
    await element(by.id('pay-submit-button')).tap();
    await waitFor(element(by.id('common-error')))
      .toBeVisible()
      .withTimeout(1000);
    await expect(element(by.id('common-error'))).toHaveText(
      `${PAYOUT_PREMIUM[0]} - Base price required.`,
    );
  });

  test('minimum amount check', async () => {
    await element(by.id(`field-amount-${PAYOUT_PREMIUM[0]}`)).clearText();
    await element(by.id(`field-amount-${PAYOUT_PREMIUM[0]}`)).typeText(
      data.lessThanMinimumQuantity,
    );
    await element(by.id(`field-base-price-${PAYOUT_PREMIUM[0]}`)).clearText();
    await element(by.id(`field-base-price-${PAYOUT_PREMIUM[0]}`)).typeText(
      data.basePrice,
    );
    await element(by.id('pay-submit-button')).tap();
    await waitFor(element(by.id('common-error')))
      .toBeVisible()
      .withTimeout(1000);
    await expect(element(by.id('common-error'))).toHaveText(
      `${PAYOUT_PREMIUM[0]} - Quantity must be greater than ${MINIMUM_TRANSACTION_QUANTITY}Kg.`,
    );
  });

  test('maximum amount check', async () => {
    await element(by.id(`field-amount-${PAYOUT_PREMIUM[0]}`)).clearText();
    await element(by.id(`field-amount-${PAYOUT_PREMIUM[0]}`)).typeText(
      data.moreThanMaximumQuantity,
    );
    await element(by.id('pay-submit-button')).tap();
    await waitFor(element(by.id('common-error')))
      .toBeVisible()
      .withTimeout(1000);
    await expect(element(by.id('common-error'))).toHaveText(
      `${PAYOUT_PREMIUM[0]} - Quantity must be lower than ${MAXIMUM_TRANSACTION_QUANTITY}Kg.`,
    );
  });

  test('card component check and submit', async () => {
    await element(by.id('pay-submit-button')).tap();
  });
});

describe('verification screen', () => {
  test('basic component visibility check', async () => {
    await waitFor(element(by.id('pay-verification-screen')))
      .toBeVisible()
      .withTimeout(2000);
    await expect(element(by.id('policy-info'))).toBeVisible();
    await expect(element(by.id('scanning-gif'))).toBeVisible();
    await expect(element(by.id('no-card-button'))).toBeVisible();
  });

  test('no-card method submit', async () => {
    await element(by.id('no-card-button')).tap();
  });
});

describe('no-card method screen', () => {
  test('basic component visibility check', async () => {
    await waitFor(element(by.id('pay-card-container')))
      .toBeVisible()
      .withTimeout(1000);
    await expect(element(by.id('select-farmer-field-header'))).toBeVisible();
    await expect(element(by.id('select-farmer-field'))).toBeVisible();
    await expect(element(by.id('no-card-submit'))).toBeVisible();
  });

  test('restrict without farmer submit', async () => {
    await element(by.id('no-card-submit')).tap();
    await waitFor(element(by.id('no-card-error')))
      .toBeVisible()
      .withTimeout(1000);
    await expect(element(by.id('no-card-error'))).toHaveText('Select a farmer');
  });

  test('select a farmer', async () => {
    await element(by.id('select-farmer-field')).tap();
    await waitFor(element(by.id('farmer-list-modal')))
      .toBeVisible()
      .withTimeout(1000);
    await expect(element(by.id('search-input'))).toBeVisible();
    await expect(element(by.id('farmer-item-container-0'))).toBeVisible();
    await expect(element(by.id('avatar-container'))).toBeVisible();
    await expect(element(by.id('farmer-item-name'))).toBeVisible();
    await expect(element(by.id('farmer-item-address'))).toBeVisible();
    await element(by.id('farmer-item-container-0')).tap();
    await waitFor(element(by.id('farmer-selected-wrap')))
      .toBeVisible()
      .withTimeout(2000);
    await expect(element(by.id('farmer-item-close-icon'))).toBeVisible();
  });

  test('remove a farmer', async () => {
    await element(by.id('farmer-item-close-icon')).tap();
    await expect(element(by.id('select-farmer-field'))).toBeVisible();
  });

  test('submit no-card method', async () => {
    await element(by.id('select-farmer-field')).tap();
    await waitFor(element(by.id('farmer-list-modal')))
      .toBeVisible()
      .withTimeout(1000);
    await element(by.id('farmer-item-container-0')).tap();
    await waitFor(element(by.id('farmer-selected-wrap')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.id('no-card-submit')).tap();
  });
});

describe('take photo screen', () => {
  test('basic component visibility check', async () => {
    await waitFor(element(by.id('pay-take-photo-screen')))
      .toBeVisible()
      .withTimeout(2000);
    await expect(element(by.id('camera'))).toBeVisible();
    await expect(element(by.id('take-photo-round-icon'))).toBeVisible();
  });

  test('taking photo and invoice visibility check', async () => {
    await element(by.id('take-photo-round-icon')).tap();
    await waitFor(element(by.id('invoice-image')))
      .toBeVisible()
      .withTimeout(2000);
    await expect(element(by.id('retake-photo-text'))).toBeVisible();
    await expect(element(by.id('take-photo-submit-button'))).toBeVisible();
  });

  test('retake photo', async () => {
    await element(by.id('retake-photo-text')).tap();
    await waitFor(element(by.id('camera')))
      .toBeVisible()
      .withTimeout(1000);
    await expect(element(by.id('take-photo-round-icon'))).toBeVisible();
  });

  test('submit', async () => {
    await element(by.id('take-photo-round-icon')).tap();
    await waitFor(element(by.id('invoice-image')))
      .toBeVisible()
      .withTimeout(2000);
    await element(by.id('take-photo-submit-button')).tap();
  });
});

describe('pay complete screen', () => {
  test('basic component visibility check', async () => {
    await waitFor(element(by.id('tnx-header-text')))
      .toBeVisible()
      .withTimeout(10000);
    await expect(element(by.id('node-details'))).toBeVisible();
    await expect(element(by.id('tnx-details-text'))).toBeVisible();
    await expect(element(by.id('tnx-PAYOUT_PREMIUM-count'))).toBeVisible();
    await expect(element(by.id('tnx-product-wrap-0'))).toBeVisible();
    await expect(element(by.id('tnx-product-name-0'))).toBeVisible();
    await waitFor(element(by.id('tnx-product-sync-status-0')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.id('view-invoice-button'))).toBeVisible();
    await expect(element(by.id('back-to-home-button'))).toBeVisible();
  });

  test('home screen navigation', async () => {
    await element(by.id('back-to-home-button')).tap();
    await waitFor(element(by.id('home-header')))
      .toBeVisible()
      .withTimeout(2000);
  });
});

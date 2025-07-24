import { TEST_EMAIL, TEST_PASSWORD } from '../data';

// /**
//  * getting random string values
//  * @returns {string}  random strings
//  */
// function getRandomString() {
//   const alphabets = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
//   const alphanumerics =
//     'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

//   // Determine a random length between 4 and 8
//   const length = Math.floor(Math.random() * 5) + 4;

//   // First character should be an alphabet
//   let result = alphabets.charAt(Math.floor(Math.random() * alphabets.length));

//   // Add the remaining characters (can be alphanumeric)
//   for (let i = 1; i < length; i++) {
//     result += alphanumerics.charAt(
//       Math.floor(Math.random() * alphanumerics.length),
//     );
//   }

//   return result;
// }

// const data = {
//   fullName: getRandomString(),
//   countryCode: '+91',
//   phoneNumber: '9898989898',
//   street: getRandomString(),
//   city: getRandomString(),
//   state: 'Kerala',
//   postalCode: '676767',
//   country: 'India',
// };

describe('add farmer initial test', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  test('login for add farmer', async () => {
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

  test('basic component check - home screen', async () => {
    await expect(element(by.id('skip-1'))).toExist();
    await element(by.id('skip-1')).tap();
    await expect(element(by.id('home-header'))).toExist();
    await expect(element(by.id('footer-farmer-icon'))).toExist();
  });

  test('basic component check - farmer home screen', async () => {
    await element(by.id('footer-farmer-icon')).tap();
    await waitFor(element(by.id('farmer-home-header')))
      .toBeVisible()
      .withTimeout(1000);
    await expect(element(by.id('search-input'))).toExist();
    await expect(element(by.id('menu-icon'))).toExist();
    await waitFor(element(by.id('farmer-item-container-0')))
      .toBeVisible()
      .withTimeout(5000);
    await expect(element(by.id('add-farmer-button'))).toExist();
  });
});

describe('add farmer screen', () => {
  test('add step one - basic component check', async () => {
    await expect(element(by.id('add-farmer-header'))).toExist();
    await expect(element(by.id('field-full-name'))).toExist();
    await expect(element(by.id('field-country-code'))).toExist();
    await expect(element(by.id('field-phone-number'))).toExist();
    await expect(element(by.id('field-reference-number'))).toExist();
    await expect(element(by.id('submit-button'))).toExist();
  });

  //   test('submit step one', async () => {
  //     await element(by.id('submit-button')).tap();
  //   });

  //   test('add step two - basic component check', async () => {
  //     await expect(element(by.id('add-farmer-header'))).toExist();
  //     await expect(element(by.id('field-street'))).toExist();
  //     await expect(element(by.id('field-city'))).toExist();
  //     await expect(element(by.id('field-state'))).toExist();
  //     await expect(element(by.id('field-postal-code'))).toExist();
  //     await expect(element(by.id('field-country'))).toExist();
  //     await expect(element(by.id('submit-button'))).toExist();
  //   });

  //   test('submit step two', async () => {
  //     await element(by.id('submit-button')).tap();
  //   });

  //   test('card component check and submit', async () => {
  //     await element(by.id('pay-submit-button')).tap();
  //   });
  // });

  // describe('verification screen', () => {
  //   test('basic component visibility check', async () => {
  //     await waitFor(element(by.id('pay-verification-screen')))
  //       .toBeVisible()
  //       .withTimeout(2000);
  //     await expect(element(by.id('policy-info'))).toBeVisible();
  //     await expect(element(by.id('scanning-gif'))).toBeVisible();
  //     await expect(element(by.id('no-card-button'))).toBeVisible();
  //   });

  //   test('no-card method submit', async () => {
  //     await element(by.id('no-card-button')).tap();
  //   });
  // });

  // describe('no-card method screen', () => {
  //   test('basic component visibility check', async () => {
  //     await waitFor(element(by.id('pay-card-container')))
  //       .toBeVisible()
  //       .withTimeout(1000);
  //     await expect(element(by.id('select-farmer-field-header'))).toBeVisible();
  //     await expect(element(by.id('select-farmer-field'))).toBeVisible();
  //     await expect(element(by.id('no-card-submit'))).toBeVisible();
  //   });

  //   test('restrict without farmer submit', async () => {
  //     await element(by.id('no-card-submit')).tap();
  //     await waitFor(element(by.id('no-card-error')))
  //       .toBeVisible()
  //       .withTimeout(1000);
  //     await expect(element(by.id('no-card-error'))).toHaveText('Select a farmer');
  //   });

  //   test('select a farmer', async () => {
  //     await element(by.id('select-farmer-field')).tap();
  //     await waitFor(element(by.id('farmer-list-modal')))
  //       .toBeVisible()
  //       .withTimeout(1000);
  //     await expect(element(by.id('search-input'))).toBeVisible();
  //     await expect(element(by.id('farmer-item-container-0'))).toBeVisible();
  //     await expect(element(by.id('avatar-container'))).toBeVisible();
  //     await expect(element(by.id('farmer-item-name'))).toBeVisible();
  //     await expect(element(by.id('farmer-item-address'))).toBeVisible();
  //     await element(by.id('farmer-item-container-0')).tap();
  //     await waitFor(element(by.id('farmer-selected-wrap')))
  //       .toBeVisible()
  //       .withTimeout(2000);
  //     await expect(element(by.id('farmer-item-close-icon'))).toBeVisible();
  //   });

  //   test('remove a farmer', async () => {
  //     await element(by.id('farmer-item-close-icon')).tap();
  //     await expect(element(by.id('select-farmer-field'))).toBeVisible();
  //   });

  //   test('submit no-card method', async () => {
  //     await element(by.id('select-farmer-field')).tap();
  //     await waitFor(element(by.id('farmer-list-modal')))
  //       .toBeVisible()
  //       .withTimeout(1000);
  //     await element(by.id('farmer-item-container-0')).tap();
  //     await waitFor(element(by.id('farmer-selected-wrap')))
  //       .toBeVisible()
  //       .withTimeout(2000);
  //     await element(by.id('no-card-submit')).tap();
  //   });
  // });

  // describe('take photo screen', () => {
  //   test('basic component visibility check', async () => {
  //     await waitFor(element(by.id('pay-take-photo-screen')))
  //       .toBeVisible()
  //       .withTimeout(2000);
  //     await expect(element(by.id('camera'))).toBeVisible();
  //     await expect(element(by.id('take-photo-round-icon'))).toBeVisible();
  //   });

  //   test('taking photo and invoice visibility check', async () => {
  //     await element(by.id('take-photo-round-icon')).tap();
  //     await waitFor(element(by.id('invoice-image')))
  //       .toBeVisible()
  //       .withTimeout(2000);
  //     await expect(element(by.id('retake-photo-text'))).toBeVisible();
  //     await expect(element(by.id('take-photo-submit-button'))).toBeVisible();
  //   });

  //   test('retake photo', async () => {
  //     await element(by.id('retake-photo-text')).tap();
  //     await waitFor(element(by.id('camera')))
  //       .toBeVisible()
  //       .withTimeout(1000);
  //     await expect(element(by.id('take-photo-round-icon'))).toBeVisible();
  //   });

  //   test('submit', async () => {
  //     await element(by.id('take-photo-round-icon')).tap();
  //     await waitFor(element(by.id('invoice-image')))
  //       .toBeVisible()
  //       .withTimeout(2000);
  //     await element(by.id('take-photo-submit-button')).tap();
  //   });
  // });

  // describe('add complete screen', () => {
  //   test('basic component visibility check', async () => {
  //     await waitFor(element(by.id('tnx-header-text')))
  //       .toBeVisible()
  //       .withTimeout(10000);
  //     await expect(element(by.id('node-details'))).toBeVisible();
  //     await expect(element(by.id('tnx-details-text'))).toBeVisible();
  //     await expect(element(by.id('tnx-PAYOUT_PREMIUM-count'))).toBeVisible();
  //     await expect(element(by.id('tnx-product-wrap-0'))).toBeVisible();
  //     await expect(element(by.id('tnx-product-name-0'))).toBeVisible();
  //     await waitFor(element(by.id('tnx-product-sync-status-0')))
  //       .toBeVisible()
  //       .withTimeout(5000);
  //     await expect(element(by.id('view-invoice-button'))).toBeVisible();
  //     await expect(element(by.id('back-to-home-button'))).toBeVisible();
  //   });

  //   test('home screen navigation', async () => {
  //     await element(by.id('back-to-home-button')).tap();
  //     await waitFor(element(by.id('home-header')))
  //       .toBeVisible()
  //       .withTimeout(2000);
  //   });
});

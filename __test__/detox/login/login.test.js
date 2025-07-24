import { TEST_EMAIL, TEST_PASSWORD } from '../data';

/**
  -----------------------------
    ----- Normal Method ----
  -----------------------------
 */

// describe('Login automation test', () => {
//   beforeAll(async () => {
//     await device.launchApp({ newInstance: true });
//   });

//   test('basic component visibility check for login page', async () => {
//     await expect(element(by.id('logo'))).toExist();
//     await expect(element(by.id('version-text'))).toBeVisible();
//     await expect(element(by.id('action-text'))).toBeVisible();
//     await expect(element(by.id('action-text'))).toHaveText(
//       'Login using your trace email and password',
//     );
//     await expect(element(by.id('email-input'))).toExist();
//     await expect(element(by.id('password-input'))).toExist();
//     await expect(element(by.id('error-text'))).not.toBeVisible();
//     await expect(element(by.id('login-button'))).toExist();
//   });

//   test('checking empty value login', async () => {
//     await element(by.id('login-button')).tap();
//     await expect(element(by.id('error-text'))).toBeVisible();
//     await expect(element(by.id('error-text'))).toHaveText(
//       'Email id and password are mandatory',
//     );
//   });

//   test('checking empty email login', async () => {
//     await element(by.id('password-input')).typeText('valid-password');
//     await element(by.id('action-text')).tap();
//     await element(by.id('login-button')).tap();
//     await expect(element(by.id('error-text'))).toBeVisible();
//     await expect(element(by.id('error-text'))).toHaveText(
//       'Email id and password are mandatory',
//     );
//   });

//   test('checking empty password login', async () => {
//     await element(by.id('email-input')).typeText('valid@password.com');
//     await element(by.id('action-text')).tap();
//     await element(by.id('password-input')).clearText();
//     await element(by.id('action-text')).tap();
//     await element(by.id('login-button')).tap();
//     await waitFor(element(by.id('error-text')))
//       .toBeVisible()
//       .withTimeout(1000);
//     await expect(element(by.id('error-text'))).toHaveText(
//       'Email id and password are mandatory',
//     );
//   });

//   test('checking invalid email format', async () => {
//     await element(by.id('email-input')).clearText();
//     await element(by.id('email-input')).typeText('invalid-email');
//     await element(by.id('action-text')).tap();
//     await element(by.id('password-input')).clearText();
//     await element(by.id('password-input')).typeText('valid-password');
//     await element(by.id('action-text')).tap();
//     await element(by.id('login-button')).tap();
//     await waitFor(element(by.id('error-text')))
//       .toBeVisible()
//       .withTimeout(1000);
//     await expect(element(by.id('error-text'))).toHaveText(
//       'Enter a valid email',
//     );
//   });

//   test('checking invalid credentials', async () => {
//     await element(by.id('email-input')).clearText();
//     await element(by.id('email-input')).typeText('invalid@email.com');
//     await element(by.id('action-text')).tap();
//     await element(by.id('password-input')).clearText();
//     await element(by.id('password-input')).typeText('invalid-password');
//     await element(by.id('action-text')).tap();
//     await element(by.id('login-button')).tap();
//     await waitFor(element(by.id('error-text')))
//       .toBeVisible()
//       .withTimeout(2000);
//     await expect(element(by.id('error-text'))).toHaveText(
//       'No active account found with the given credentials',
//     );
//   });

//   test('checking valid credentials', async () => {
//     await element(by.id('email-input')).clearText();
//     await element(by.id('email-input')).typeText(TEST_EMAIL);
//     await element(by.id('action-text')).tap();
//     await element(by.id('password-input')).clearText();
//     await element(by.id('password-input')).typeText(TEST_PASSWORD);
//     await element(by.id('action-text')).tap();
//     await element(by.id('login-button')).tap();
//     await expect(element(by.id('error-text'))).not.toBeVisible();
//     await waitFor(element(by.id('onboard-next-button')))
//       .toBeVisible()
//       .withTimeout(5000);
//     await element(by.id('onboard-next-button')).tap();
//   });
// });

/**
  -----------------------------
    ------- SSO Method -----
  -----------------------------
 */

describe('Login automation test', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  test('basic component visibility check for login page', async () => {
    await expect(element(by.id('logo'))).toExist();
    await expect(element(by.id('version-text'))).toBeVisible();
    await expect(element(by.id('action-text'))).toBeVisible();
    await expect(element(by.id('action-text'))).toHaveText(
      'Login using your trace email and password',
    );
    await expect(element(by.id('email-input'))).toExist();
    await expect(element(by.id('password-input'))).toExist();
    await expect(element(by.id('error-text'))).not.toBeVisible();
    await expect(element(by.id('login-button'))).toExist();
  });

  test('checking empty value login', async () => {
    await element(by.id('login-button')).tap();
    await expect(element(by.id('error-text'))).toBeVisible();
    await expect(element(by.id('error-text'))).toHaveText(
      'Email id and password are mandatory',
    );
  });

  test('checking empty email login', async () => {
    await element(by.id('password-input')).typeText('valid-password');
    await element(by.id('action-text')).tap();
    await element(by.id('login-button')).tap();
    await expect(element(by.id('error-text'))).toBeVisible();
    await expect(element(by.id('error-text'))).toHaveText(
      'Email id and password are mandatory',
    );
  });

  test('checking empty password login', async () => {
    await element(by.id('email-input')).typeText('valid@password.com');
    await element(by.id('action-text')).tap();
    await element(by.id('password-input')).clearText();
    await element(by.id('action-text')).tap();
    await element(by.id('login-button')).tap();
    await waitFor(element(by.id('error-text')))
      .toBeVisible()
      .withTimeout(1000);
    await expect(element(by.id('error-text'))).toHaveText(
      'Email id and password are mandatory',
    );
  });

  test('checking invalid email format', async () => {
    await element(by.id('email-input')).clearText();
    await element(by.id('email-input')).typeText('invalid-email');
    await element(by.id('action-text')).tap();
    await element(by.id('password-input')).clearText();
    await element(by.id('password-input')).typeText('valid-password');
    await element(by.id('action-text')).tap();
    await element(by.id('login-button')).tap();
    await waitFor(element(by.id('error-text')))
      .toBeVisible()
      .withTimeout(1000);
    await expect(element(by.id('error-text'))).toHaveText(
      'Enter a valid email',
    );
  });

  test('checking invalid credentials', async () => {
    await element(by.id('email-input')).clearText();
    await element(by.id('email-input')).typeText('invalid@email.com');
    await element(by.id('action-text')).tap();
    await element(by.id('password-input')).clearText();
    await element(by.id('password-input')).typeText('invalid-password');
    await element(by.id('action-text')).tap();
    await element(by.id('login-button')).tap();
    await waitFor(element(by.id('error-text')))
      .toBeVisible()
      .withTimeout(2000);
    await expect(element(by.id('error-text'))).toHaveText(
      'No active account found with the given credentials',
    );
  });

  test('checking valid credentials', async () => {
    await element(by.id('email-input')).clearText();
    await element(by.id('email-input')).typeText(TEST_EMAIL);
    await element(by.id('action-text')).tap();
    await element(by.id('password-input')).clearText();
    await element(by.id('password-input')).typeText(TEST_PASSWORD);
    await element(by.id('action-text')).tap();
    await element(by.id('login-button')).tap();
    await expect(element(by.id('error-text'))).not.toBeVisible();
    await waitFor(element(by.id('onboard-next-button')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.id('onboard-next-button')).tap();
  });
});

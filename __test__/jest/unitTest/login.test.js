import { validateLoginForm } from '../../../src/screens/auth/login/controller';

describe('Login form validation', () => {
  test('handles empty fields correctly', async () => {
    const result = await validateLoginForm('', '');
    expect(result).toEqual([false, 'email_and_password_are_mandatory']);
  });

  test('handles missing password correctly', async () => {
    const result = await validateLoginForm('user@example.com', '');
    expect(result).toEqual([false, 'email_and_password_are_mandatory']);
  });

  test('handles missing email correctly', async () => {
    const result = await validateLoginForm('', 'password123');
    expect(result).toEqual([false, 'email_and_password_are_mandatory']);
  });

  test('handles invalid email format correctly', async () => {
    const result = await validateLoginForm(
      'invalid-email-format',
      'password123',
    );
    expect(result).toEqual([false, 'enter_a_valid_email']);
  });

  test('handles emojis in fields correctly', async () => {
    const result = await validateLoginForm('user@example.com', 'password123😎');
    expect(result).toEqual([false, 'password cannot_contain_emoji']);
  });

  test('handles valid email and password correctly', async () => {
    const result = await validateLoginForm('user@example.com', 'password123');
    expect(result).toEqual([true, null]);
  });
});

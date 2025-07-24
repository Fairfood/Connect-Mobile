import { validateEditProfileForm } from '../../../src/screens/home/profile/editProfile/controller';

describe('emoji validations', () => {
  test('handles emoji in first_name correctly', async () => {
    const formValues = {
      farmerName: '😎',
      farmerLastName: '',
      farmerMobile: '',
    };
    const result = await validateEditProfileForm(formValues);
    expect(result).toEqual([false, 'first_name cannot_contain_emoji']);
  });

  test('handles emoji in last_name correctly', async () => {
    const formValues = {
      farmerName: '',
      farmerLastName: '😎',
      farmerMobile: '',
    };
    const result = await validateEditProfileForm(formValues);
    expect(result).toEqual([false, 'last_name cannot_contain_emoji']);
  });

  test('handles emoji in mobile_number correctly', async () => {
    const formValues = {
      farmerName: '',
      farmerLastName: '',
      farmerMobile: '😎',
    };
    const result = await validateEditProfileForm(formValues);
    expect(result).toEqual([false, 'mobile_number cannot_contain_emoji']);
  });
});

test('handles empty first_name correctly', async () => {
  const formValues = {
    farmerName: '',
    farmerLastName: 'test lastName',
    farmerMobile: 'test mobile',
  };
  const result = await validateEditProfileForm(formValues);
  expect(result).toEqual([false, 'first_name is_mandatory']);
});

describe('phone number validations', () => {
  test('handles invalid phone number correctly', async () => {
    const formValues = {
      farmerName: 'test firstName',
      farmerLastName: 'test lastName',
      farmerMobile: '989898989',
      fullMobileNumber: '+91 989898989',
      countryCode: 'IN',
    };
    const result = await validateEditProfileForm({ ...formValues });
    expect(result).toEqual([false, 'mobile_number_is_invalid']);
  });

  test('handles invalid country code correctly', async () => {
    const formValues = {
      farmerName: 'test firstName',
      farmerLastName: 'test lastName',
      farmerMobile: '9898989898',
      fullMobileNumber: '+254 9898989898',
      countryCode: 'IN',
    };
    const result = await validateEditProfileForm(formValues);
    expect(result).toEqual([false, 'mobile_number_is_invalid']);
  });

  test('handles valid data correctly', async () => {
    const formValues = {
      farmerName: 'test firstName',
      farmerLastName: 'test lastName',
      farmerMobile: '9898989898',
      fullMobileNumber: '+91 9898989898',
      countryCode: 'IN',
    };
    const result = await validateEditProfileForm(formValues, 'IN');
    expect(result).toEqual([true, null]);
  });
});

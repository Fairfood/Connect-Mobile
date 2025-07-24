import {
  validateEditFarmerForm,
  checkDuplicateFarmer,
} from '../../../src/screens/farmers/editFarmer/controller';

describe('Edit farmer validations', () => {
  test('handles emoji in name correctly', async () => {
    const formValues = {
      name: '😎',
      mobile: '',
      street: '',
      city: '',
      zipcode: '',
    };
    const result = await validateEditFarmerForm(formValues, [], 'IN');
    expect(result).toEqual([false, 'full_name cannot_contain_emoji']);
  });

  test('handles emoji in phone correctly', async () => {
    const formValues = {
      name: '',
      mobile: '😎',
      street: '',
      city: '',
      zipcode: '',
    };
    const result = await validateEditFarmerForm(formValues, [], 'IN');
    expect(result).toEqual([false, 'mobile_number cannot_contain_emoji']);
  });

  test('handles emoji in v correctly', async () => {
    const formValues = {
      name: '',
      mobile: '',
      street: '😎',
      city: '',
      zipcode: '',
    };
    const result = await validateEditFarmerForm(formValues, [], 'IN');
    expect(result).toEqual([false, 'street cannot_contain_emoji']);
  });

  test('handles emoji in city correctly', async () => {
    const formValues = {
      name: '',
      mobile: '',
      street: '',
      city: '😎',
      zipcode: '',
    };
    const result = await validateEditFarmerForm(formValues, [], 'IN');
    expect(result).toEqual([false, 'city cannot_contain_emoji']);
  });

  test('handles emoji postal code correctly', async () => {
    const formValues = {
      name: '',
      mobile: '',
      street: '',
      city: '',
      zipcode: '😎',
    };
    const result = await validateEditFarmerForm(formValues, [], 'IN');
    expect(result).toEqual([false, 'postal_code cannot_contain_emoji']);
  });

  test('handles empty name correctly', async () => {
    const formValues = {
      name: '',
      mobile: '+91 9898989898',
      street: 'test street',
      city: 'test mobile',
      country: 'test city',
      province: 'test street',
      zipcode: 'test zip code',
    };
    const result = await validateEditFarmerForm(formValues, [], 'IN');
    expect(result).toEqual([false, 'full_name is_mandatory']);
  });

  test('handles empty city correctly', async () => {
    const formValues = {
      name: 'test name',
      mobile: '+91 9898989898',
      street: 'test street',
      city: '',
      country: 'test city',
      province: 'test street',
      zipcode: 'test zip code',
    };
    const result = await validateEditFarmerForm(formValues, [], 'IN');
    expect(result).toEqual([false, 'city is_mandatory']);
  });

  test('handles empty country correctly', async () => {
    const formValues = {
      name: 'test name',
      mobile: '+91 9898989898',
      street: 'test street',
      city: 'test mobile',
      country: '',
      province: 'test street',
      zipcode: 'test zip code',
    };
    const result = await validateEditFarmerForm(formValues, [], 'IN');
    expect(result).toEqual([false, 'country is_mandatory']);
  });

  test('handles empty province correctly', async () => {
    const formValues = {
      name: 'test name',
      mobile: '+91 9898989898',
      street: 'test street',
      city: 'test mobile',
      country: 'test city',
      province: '',
      zipcode: 'test zip code',
    };
    const result = await validateEditFarmerForm(formValues, [], 'IN');
    expect(result).toEqual([false, 'province is_mandatory']);
  });

  test('handles invalid phone number correctly', async () => {
    const formValues = {
      name: 'test name',
      mobile: '+91 9898989898',
      street: 'test street',
      city: 'test mobile',
      country: 'test city',
      province: 'test street',
      zipcode: 'test zip code',
      phone: '+91 989898989',
    };
    const result = await validateEditFarmerForm(formValues, [], 'IN');
    expect(result).toEqual([false, 'mobile_number_is_invalid']);
  });

  test('handles invalid country code correctly', async () => {
    const formValues = {
      name: 'test name',
      mobile: '+91 9898989898',
      street: 'test street',
      city: 'test mobile',
      country: 'test city',
      province: 'test street',
      zipcode: 'test zip code',
      phone: '+256 989898989',
    };
    const result = await validateEditFarmerForm(formValues, [], 'IN');
    expect(result).toEqual([false, 'mobile_number_is_invalid']);
  });

  test('handles valid data correctly', async () => {
    const formValues = {
      name: 'test name',
      mobile: '+91 9898989898',
      street: 'test street',
      city: 'test mobile',
      country: 'test city',
      province: 'test street',
      zipcode: 'test zip code',
      phone: '+91 9898989898',
    };
    const result = await validateEditFarmerForm(formValues, [], 'IN');
    expect(result).toEqual([true, null]);
  });

  test('handles duplicate farmer correctly', async () => {
    const nodes = [
      {
        name: 'Test',
        phone: '+91 9898989898',
        reference_number: 'Test reference number',
        street: 'Test Street',
        city: 'Test city',
        country: 'Test country',
        province: 'Test province',
        zipcode: '676767',
      },
    ];
    const formValues = {
      name: 'Test',
      phone: '+91 9898989898',
      reference_number: 'Test reference number',
      street: 'Test Street',
      city: 'Test city',
      country: 'Test country',
      province: 'Test province',
      zipcode: '676767',
    };
    const result = await checkDuplicateFarmer(nodes, formValues);
    expect(result).toBeTruthy();
  });

  test('handles no duplicate farmer correctly', async () => {
    const nodes = [
      {
        name: 'Test1',
        phone: '+91 9898989898',
        reference_number: 'Test reference number',
        street: 'Test Street',
        city: 'Test city',
        country: 'Test country',
        province: 'Test province',
        zipcode: '676767',
      },
    ];
    const formValues = {
      name: 'Test',
      phone: '+91 9898989898',
      reference_number: 'Test reference number',
      street: 'Test street',
      city: 'Test city',
      country: 'Test country',
      province: 'Test province',
      zipcode: '676767',
    };
    const result = await checkDuplicateFarmer(nodes, formValues);
    expect(result).toBeFalsy();
  });
});

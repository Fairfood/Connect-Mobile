import {
  validateStepTwoForm,
  checkDuplicateFarmer,
} from '../../../src/components/addFarmer/stepTwo/controller';

describe('Add farmer step two validations', () => {
  test('handles emoji in street correctly', async () => {
    const formValues = {
      street: '😎',
      city: '',
      country: '',
      province: '',
      zipcode: '',
    };
    const result = await validateStepTwoForm(formValues, [], 'IN');
    expect(result).toEqual([false, 'street cannot_contain_emoji']);
  });

  test('handles emoji in city correctly', async () => {
    const formValues = {
      street: '',
      city: '😎',
      country: '',
      province: '',
      zipcode: '',
    };
    const result = await validateStepTwoForm(formValues, [], 'IN');
    expect(result).toEqual([false, 'city cannot_contain_emoji']);
  });

  test('handles emoji in country correctly', async () => {
    const formValues = {
      street: '',
      city: '',
      country: '😎',
      province: '',
      zipcode: '',
    };
    const result = await validateStepTwoForm(formValues, [], 'IN');
    expect(result).toEqual([false, 'country cannot_contain_emoji']);
  });

  test('handles emoji in province correctly', async () => {
    const formValues = {
      street: '',
      city: '',
      country: '',
      province: '😎',
      zipcode: '',
    };
    const result = await validateStepTwoForm(formValues, [], 'IN');
    expect(result).toEqual([false, 'province cannot_contain_emoji']);
  });

  test('handles emoji postal code correctly', async () => {
    const formValues = {
      street: '',
      city: '',
      country: '',
      province: '',
      zipcode: '😎',
    };
    const result = await validateStepTwoForm(formValues, [], 'IN');
    expect(result).toEqual([false, 'postal_code cannot_contain_emoji']);
  });

  test('handles empty city correctly', async () => {
    const formValues = {
      street: '',
      city: '',
      country: 'Test country',
      province: 'Test province',
      zipcode: '',
    };
    const result = await validateStepTwoForm(formValues, [], 'IN');
    expect(result).toEqual([false, 'city is_mandatory']);
  });

  test('handles empty country correctly', async () => {
    const formValues = {
      street: '',
      city: 'Test city',
      country: '',
      province: 'Test province',
      zipcode: '',
    };
    const result = await validateStepTwoForm(formValues, [], 'IN');
    expect(result).toEqual([false, 'country is_mandatory']);
  });

  test('handles empty province correctly', async () => {
    const formValues = {
      street: '',
      city: 'Test city',
      country: 'Test country',
      province: '',
      zipcode: '',
    };
    const result = await validateStepTwoForm(formValues, [], 'IN');
    expect(result).toEqual([false, 'province is_mandatory']);
  });

  test('handles valid data correctly', async () => {
    const formValues = {
      phone: '+91 9898989898',
      street: 'Test Street',
      city: 'Test city',
      country: 'Test country',
      province: 'Test province',
      zipcode: '676767',
    };
    const result = await validateStepTwoForm(formValues, [], 'IN');
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

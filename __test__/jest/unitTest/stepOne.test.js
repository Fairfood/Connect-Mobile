import {
  validateStepOneForm,
  customFieldValidation,
} from '../../../src/components/addFarmer/stepOne/controller';

describe('Add farmer step one validations', () => {
  test('handles empty value correctly', async () => {
    const customData = [
      { fields: [{ label: 'Age', required: true, value: null }] },
    ];
    const result = await customFieldValidation(customData);
    expect(result).toEqual('Age required');
  });

  test('handles null value correctly', async () => {
    const customData = [
      { fields: [{ label: 'Age', required: true, value: null }] },
    ];
    const result = await customFieldValidation(customData);
    expect(result).toEqual('Age required');
  });

  test('handles empty value correctly', async () => {
    const customData = [
      { fields: [{ label: 'Age', required: true, value: '' }] },
    ];
    const result = await customFieldValidation(customData);
    expect(result).toEqual('Age required');
  });

  test('handles undefined value correctly', async () => {
    const customData = [{ fields: [{ label: 'Age', required: true }] }];
    const result = await customFieldValidation(customData);
    expect(result).toEqual('Age required');
  });

  test('handles optional fields correctly', async () => {
    const customData = [
      { fields: [{ label: 'Age', required: false, value: null }] },
    ];
    const result = await customFieldValidation(customData);
    expect(result).toBeTruthy();
  });

  test('handles valid fields correctly', async () => {
    const customData = [
      { fields: [{ label: 'Age', required: true, value: 12 }] },
    ];
    const result = await customFieldValidation(customData);
    expect(result).toBeTruthy();
  });

  test('handles emoji fields correctly', async () => {
    const formValues = {
      name: '😎Farmer',
      mobile: '😎',
      reference_number: '😎',
      dialCode: '😎',
      extraFields: '😎',
      countryCode: '😎',
      phone: '😎',
      forms: [],
    };
    const result = await validateStepOneForm(formValues);
    expect(result).toEqual([false, 'full_name cannot_contain_emoji']);
  });

  test('handles empty fields correctly', async () => {
    const formValues = {
      name: '',
      mobile: '',
      phone: '',
      reference_number: '',
      dialCode: '',
      extraFields: '',
      countryCode: '',
      forms: [],
    };
    const result = await validateStepOneForm(formValues);
    expect(result).toEqual([false, 'full_name is_mandatory']);
  });

  test('handles all fields correctly', async () => {
    const formValues = {
      name: 'farmer',
      mobile: '9898989898',
      phone: '+91 9898989898',
      reference_number: '',
      dialCode: '91',
      extraFields: [{ fields: [{ label: 'Age', required: true, value: 12 }] }],
      countryCode: 'IN',
      forms: [],
    };
    const result = await validateStepOneForm(formValues);
    expect(result).toEqual([true, null]);
  });
});

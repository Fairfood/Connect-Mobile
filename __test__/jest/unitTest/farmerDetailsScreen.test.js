import {
  fieldVisibility,
  getPhoneText,
  getSubmissionFields,
} from '../../../src/screens/farmers/farmerDetailsScreen/controller';

describe('Farmer details validations', () => {
  it('should return true if the form is empty', () => {
    const form = [];
    const key = 'example_key';
    expect(fieldVisibility(form, key)).toBeTruthy();
  });

  it('should return true if the form does not contain a farmer form', () => {
    const form = [{ form_type: 'other_form' }];
    const key = 'example_key';
    expect(fieldVisibility(form, key)).toBeTruthy();
  });

  it('should return true if the field config is empty', () => {
    const form = [{ form_type: 'FARMER', field_config: [] }];
    const key = 'example_key';
    expect(fieldVisibility(form, key)).toBeTruthy();
  });

  it('should return true if the field with the specified key is not found in the config', () => {
    const form = [
      {
        form_type: 'FARMER',
        field_config: [{ key: 'another_key', visibility: false }],
      },
    ];
    const key = 'example_key';
    expect(fieldVisibility(form, key)).toBeTruthy();
  });

  it('should return true if the field with the specified key is found and has visibility set to true', () => {
    const form = [
      {
        form_type: 'FARMER',
        field_config: [{ key: 'example_key', visibility: true }],
      },
    ];
    const key = 'example_key';
    expect(fieldVisibility(form, key)).toBeTruthy();
  });

  it('should return false if the field with the specified key is found and has visibility set to false', () => {
    const form = [
      {
        form_type: 'FARMER',
        field_config: [{ key: 'example_key', visibility: false }],
      },
    ];
    const key = 'example_key';
    expect(fieldVisibility(form, key)).toBeFalsy();
  });
});

describe('getPhoneText tests', () => {
  test('should return null if the phone is an empty string', async () => {
    const result = await getPhoneText('');
    expect(result).toEqual(null);
  });

  test('should return null if the phone is null', async () => {
    const result = await getPhoneText(null);
    expect(result).toEqual(null);
  });

  test('should return null if the phone is undefined', async () => {
    const result = await getPhoneText(undefined);
    expect(result).toEqual(null);
  });

  test('should return null if the phone does not contain a space', async () => {
    const result = await getPhoneText('+91');
    expect(result).toEqual(null);
  });

  test('should return phone if the phone contain a space', async () => {
    const result = await getPhoneText('+91 9898989898');
    expect(result).toEqual('+91 9898989898');
  });
});

describe('getSubmissionFields tests', () => {
  it('should return an empty array if nodeExtraFields is not provided', () => {
    expect(getSubmissionFields()).toEqual([]);
  });

  it('should return an empty array if nodeExtraFields is an empty string', () => {
    expect(getSubmissionFields('')).toEqual([]);
  });

  it('should return an empty array if nodeExtraFields is a string containing an empty JSON array', () => {
    expect(getSubmissionFields('[]')).toEqual([]);
  });

  it('should return an array of submission fields when nodeExtraFields is a valid JSON string', () => {
    const nodeExtraFields = JSON.stringify([
      {
        values: [
          {
            field_details: { label: 'Label1', key: 'Key1', type: 'Type1' },
            value: 'Value1',
          },
          {
            field_details: { label: 'Label2', key: 'Key2', type: 'Type2' },
            value: 'Value2',
          },
        ],
      },
    ]);

    expect(getSubmissionFields(nodeExtraFields)).toEqual([
      {
        label: 'Label1',
        key: 'Key1',
        type: 'Type1',
        value: 'Value1',
      },
      {
        label: 'Label2',
        key: 'Key2',
        type: 'Type2',
        value: 'Value2',
      },
    ]);
  });
});

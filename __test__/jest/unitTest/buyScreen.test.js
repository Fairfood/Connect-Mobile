import { fieldVisibility } from '../../../src/screens/home/buy/buyScreen/controller';

describe('fieldVisibility', () => {
  const item = {
    product_form: [
      {
        field_config: [
          { key: 'key1', visibility: true },
          { key: 'key2', visibility: false },
          { key: 'key3', visibility: true },
        ],
      },
    ],
  };

  it('should return true if the key is not found in fieldConfig', () => {
    expect(fieldVisibility(item, 'key4')).toBeTruthy();
  });

  it('should return false if the key is found in fieldConfig and its visibility is false', () => {
    expect(fieldVisibility(item, 'key2')).toBeFalsy();
  });

  it('should return true if the key is found in fieldConfig and its visibility is true', () => {
    expect(fieldVisibility(item, 'key1')).toBeTruthy();
  });

  it('should return true if fieldConfig is empty', () => {
    const itemWithEmptyFieldConfig = { product_form: [{ field_config: [] }] };
    expect(fieldVisibility(itemWithEmptyFieldConfig, 'key1')).toBeTruthy();
  });

  it('should return true if item is null', () => {
    expect(fieldVisibility(null, 'key1')).toBeTruthy();
  });

  it('should return true if item is undefined', () => {
    expect(fieldVisibility(undefined, 'key1')).toBeTruthy();
  });

  it('should return true if item.product_form is null', () => {
    expect(fieldVisibility({}, 'key1')).toBeTruthy();
  });

  it('should return true if item.product_form[0] is null', () => {
    expect(fieldVisibility({ product_form: [null] }, 'key1')).toBeTruthy();
  });

  it('should return true if item.product_form[0].field_config is null', () => {
    expect(
      fieldVisibility({ product_form: [{ field_config: null }] }, 'key1'),
    ).toBeTruthy();
  });
});

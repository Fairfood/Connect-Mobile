import { getPhoneText, getAddressText } from '../../../src/screens/farmers/farmerSuccessScreen/controller';

describe('getPhoneText validation', () => {
  it('returns the phone number if it contains a space', () => {
    const phone = '+91 1234567890';
    const result = getPhoneText(phone);
    expect(result).toEqual('+91 1234567890');
  });

  it('returns an empty string if the phone number does not contain a space', () => {
    const phone = '1234567890';
    const result = getPhoneText(phone);
    expect(result).toEqual('');
  });

  it('returns an empty string if the phone number is empty', () => {
    const result = getPhoneText();
    expect(result).toEqual('');
  });

  it('returns an empty string if the phone number is null', () => {
    const result = getPhoneText(null);
    expect(result).toEqual('');
  });

  it('returns an empty string if the phone number is undefined', () => {
    const result = getPhoneText(undefined);
    expect(result).toEqual('');
  });
});

describe('getAddressText validation', () => {
  it('returns an empty string when farmerObj is null', () => {
    const farmerObj = null;
    const result = getAddressText(farmerObj);
    expect(result).toEqual('');
  });

  it('returns the formatted address when all fields are present', () => {
    const farmerObj = {
      street: '123 Main St',
      city: 'Anytown',
      province: 'AnyProvince',
      country: 'AnyCountry',
      zipcode: '12345',
    };
    const result = getAddressText(farmerObj);
    expect(result).toEqual(
      '123 Main St, Anytown, AnyProvince, AnyCountry, 12345.',
    );
  });

  it('returns the formatted address when some fields are missing', () => {
    const farmerObj = {
      street: '123 Main St',
      city: 'Anytown',
      zipcode: '12345',
    };
    const result = getAddressText(farmerObj);
    expect(result).toEqual('123 Main St, Anytown, 12345.');
  });

  it('returns an empty string when all fields are missing', () => {
    const farmerObj = {};
    const result = getAddressText(farmerObj);
    expect(result).toEqual('');
  });

  it('returns an empty string when the input object is undefined', () => {
    const farmerObj = undefined;
    const result = getAddressText(farmerObj);
    expect(result).toEqual('');
  });

  it('returns an empty string when the input object is an empty string', () => {
    const farmerObj = '';
    const result = getAddressText(farmerObj);
    expect(result).toEqual('');
  });
});

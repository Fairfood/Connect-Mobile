import {
  getCustomFieldValue,
  jsonToString,
  stringToJson,
  checkMandatory,
  removeNullValues,
  getCurrencySplit,
  checkEmojis,
  capitalizeText,
  phoneNumberValidation,
  extractPhoneNumber,
  ISOdateConvert,
  avatarText,
} from '../../../src/utils/helperFunctions';

describe('ISOdateConvert function', () => {
  const testDate = '2021-01-10T10:12:50.500Z'; // Example date to test with

  test('returns current date in default "date" format when no arguments are passed', () => {
    const result = ISOdateConvert();
    expect(result).toEqual(new Date().toLocaleDateString());
  });

  test('returns date in "Mon Jan 10 2021" format', () => {
    const result = ISOdateConvert(testDate, 'Mon Jan 10 2021');
    expect(result).toEqual(new Date(testDate).toDateString());
  });

  test('returns date in "date" format', () => {
    const result = ISOdateConvert(testDate, 'date');
    expect(result).toEqual(new Date(testDate).toLocaleDateString());
  });

  test('returns time in "time" format', () => {
    const result = ISOdateConvert(testDate, 'time');
    expect(result).toEqual(new Date(testDate).toTimeString());
  });

  test('returns date in "GMT format"', () => {
    const result = ISOdateConvert(testDate, 'GMT format');
    expect(result).toEqual(new Date(testDate).toGMTString());
  });

  test('returns date in ISO format "2021-01-10T10:12:50.500Z"', () => {
    const result = ISOdateConvert(testDate, '2021-01-10T10:12:50.500Z');
    expect(result).toEqual(new Date(testDate).toISOString());
  });

  test('returns date in "Local date Format"', () => {
    const result = ISOdateConvert(testDate, 'Local date Format');
    expect(result).toEqual(new Date(testDate).toLocaleString());
  });

  test('returns time in "Locale time format"', () => {
    const result = ISOdateConvert(testDate, 'Locale time format');
    expect(result).toEqual(new Date(testDate).toLocaleTimeString());
  });

  test('returns date and time in "Mon Jan 10 2021 15:42:50" format', () => {
    const result = ISOdateConvert(testDate, 'Mon Jan 10 2021 15:42:50');
    expect(result).toEqual(new Date(testDate).toString('YYYY-MM-dd'));
  });

  test('returns date in "UTC format"', () => {
    const result = ISOdateConvert(testDate, 'UTC format');
    expect(result).toEqual(new Date(testDate).toUTCString());
  });

  test('returns Date object when format is unknown', () => {
    const result = ISOdateConvert(testDate, 'unknown format');
    expect(result).toBeInstanceOf(Date);
  });
});

describe('getCustomFieldValue', () => {
  it('should return null when field is null', () => {
    const field = null;
    expect(getCustomFieldValue(field)).toBeNull();
  });

  it('should return null when field value is null', () => {
    const field = { value: null };
    expect(getCustomFieldValue(field)).toBeNull();
  });

  it('should return yes when field type is BOOLEAN and value is True', () => {
    const field = { type: 'BOOLEAN', value: 'True' };
    expect(getCustomFieldValue(field)).toBe('yes');
  });

  it('should return no when field type is BOOLEAN and value is False', () => {
    const field = { type: 'BOOLEAN', value: 'False' };
    expect(getCustomFieldValue(field)).toBe('no');
  });

  it('should return field value when field type is not BOOLEAN or DATE', () => {
    const field = { value: 'test' };
    expect(getCustomFieldValue(field)).toBe('test');
  });
});

describe('stringToJson', () => {
  it('should return null when stringValue is null', () => {
    const stringValue = null;
    expect(stringToJson(stringValue)).toBeNull();
  });

  it('should return undefined when stringValue is undefined', () => {
    const stringValue = undefined;
    expect(stringToJson(stringValue)).toBeUndefined();
  });

  it('should return the value when stringValue is a valid JSON string', () => {
    const stringValue = '{"name": "John", "age": 30}';
    expect(stringToJson(stringValue)).toEqual({ name: 'John', age: 30 });
  });

  it('should return the value when stringValue is an object', () => {
    const stringValue = { name: 'John', age: 30 };
    expect(stringToJson(stringValue)).toEqual({ name: 'John', age: 30 });
  });

  it('should return the value when stringValue is a valid array string', () => {
    const stringValue = '["John", "Doe"]';
    expect(stringToJson(stringValue)).toEqual(['John', 'Doe']);
  });
});

describe('jsonToString function', () => {
  it('should return a stringified JSON object if valid', () => {
    const input = { key: 'value' };
    const output = '{"key":"value"}';
    expect(jsonToString(input)).toBe(output);
  });

  it('should return a stringified JSON object with a nested object', () => {
    const input = { key: { nestedKey: 'nestedValue' } };
    const output = '{"key":{"nestedKey":"nestedValue"}}';
    expect(jsonToString(input)).toBe(output);
  });

  it('should return the same value if input is not an object', () => {
    const input = 'not an object';
    expect(jsonToString(input)).toBe(input);
  });

  it('should return the same value if input is null', () => {
    const input = null;
    expect(jsonToString(input)).toBe(input);
  });

  it('should return the same value if input is undefined', () => {
    const input = undefined;
    expect(jsonToString(input)).toBe(input);
  });

  it('should return the same value if input is a number', () => {
    const input = 123;
    expect(jsonToString(input)).toBe(input);
  });

  it('should return the same value if input is a boolean', () => {
    const input = true;
    expect(jsonToString(input)).toBe(input);
  });

  it('should return the same value if input is a string', () => {
    const input = 'a string';
    expect(jsonToString(input)).toBe(input);
  });

  it('should return an empty string if input is an empty object', () => {
    const input = {};
    expect(jsonToString(input)).toBe('{}');
  });

  it('should return an empty string if input is an array', () => {
    const input = [];
    expect(jsonToString(input)).toBe('[]');
  });

  it('should return a stringified JSON object with an array', () => {
    const input = { key: ['a', 'b', 'c'] };
    const output = '{"key":["a","b","c"]}';
    expect(jsonToString(input)).toBe(output);
  });

  it('should return a stringified JSON object with a mix of data types', () => {
    const input = { key: ['a', 123, true, { nestedKey: 'nestedValue' }] };
    const output = '{"key":["a",123,true,{"nestedKey":"nestedValue"}]}';
    expect(jsonToString(input)).toBe(output);
  });
});

describe('checkMandatory', () => {
  it('should return true and an empty errMsg when all fields have values', async () => {
    const fields = [
      { name: 'Field1', value: 'value1' },
      { name: 'Field2', value: 'value2' },
      { name: 'Field3', value: 'value3' },
    ];

    const [success, errMsg] = await checkMandatory(fields);

    expect(success).toBeTruthy();
    expect(errMsg).toBe('');
  });

  it('should return false and an error message when at least one field is missing a value', async () => {
    const fields = [
      { name: 'Field1', value: 'value1' },
      { name: 'Field2', value: '' },
      { name: 'Field3', value: 'value3' },
    ];

    const [success, errMsg] = await checkMandatory(fields);

    expect(success).toBeFalsy();
    expect(errMsg).toBe('Field2 is_mandatory');
  });

  it('should return false and an error message when at least one field is null value', async () => {
    const fields = [
      { name: 'Field1', value: 'value1' },
      { name: 'Field2', value: null },
      { name: 'Field3', value: 'value3' },
    ];
    const [success, errMsg] = await checkMandatory(fields);

    expect(success).toBeFalsy();
    expect(errMsg).toBe('Field2 is_mandatory');
  });

  it('should return false and an error message when at least one field is undefined value', async () => {
    const fields = [
      { name: 'Field1', value: 'value1' },
      { name: 'Field2', value: undefined },
      { name: 'Field3', value: 'value3' },
    ];
    const [success, errMsg] = await checkMandatory(fields);

    expect(success).toBeFalsy();
    expect(errMsg).toBe('Field2 is_mandatory');
  });

  it('should return true and an empty errMsg when no fields are provided', async () => {
    const [success, errMsg] = await checkMandatory();

    expect(success).toBeTruthy();
    expect(errMsg).toBe('');
  });
});

describe('removeNullValues', () => {
  it('should remove null values from an object', async () => {
    const obj = {
      key1: 'value1',
      key2: null,
      key3: 'value3',
      key4: null,
    };

    const result = await removeNullValues(obj);

    expect(result).toEqual({
      key1: 'value1',
      key3: 'value3',
    });
  });

  it('should return an empty object when all values are null', async () => {
    const obj = {
      key1: null,
      key2: null,
    };

    const result = await removeNullValues(obj);

    expect(result).toEqual({});
  });

  it('should return the original object if no values are null', async () => {
    const obj = {
      key1: 'value1',
      key2: 'value2',
    };

    const result = await removeNullValues(obj);

    expect(result).toEqual(obj);
  });

  it('should return an empty object if an empty object is passed', async () => {
    const obj = {};

    const result = await removeNullValues(obj);

    expect(result).toEqual({});
  });
});

describe('getCurrencySplit', () => {
  it('should handle an empty string', async () => {
    const result = await getCurrencySplit('');
    expect(result).toBe('');
  });

  it('should handle null value', async () => {
    const result = await getCurrencySplit(null);
    expect(result).toBe('');
  });

  it('should handle undefined', async () => {
    const result = await getCurrencySplit(undefined);
    expect(result).toBe('');
  });

  it('should split a string into an array of characters and join it with spaces', async () => {
    const result = await getCurrencySplit('INR');
    expect(result).toBe('I N R');
  });
});

describe('checkEmojis', () => {
  it('should return [true, ""] when all fields contain no emojis', async () => {
    const fields = [
      { name: 'Field1', value: 'This is a test' },
      { name: 'Field2', value: 'No emojis here' },
    ];

    const [success, errMsg] = await checkEmojis(fields);

    expect(success).toBeTruthy();
    expect(errMsg).toBe('');
  });

  it('should return [false, errMsg] when some field contains an emoji', async () => {
    const fields = [
      { name: 'Field1', value: 'This has an emoji 😃' },
      { name: 'Field2', value: 'No emojis here' },
    ];

    const [success, errMsg] = await checkEmojis(fields);

    expect(success).toBeFalsy();
    expect(errMsg).toBe('Field1 cannot_contain_emoji');
  });

  it('should return [true, ""] when no fields are provided', async () => {
    const [success, errMsg] = await checkEmojis();

    expect(success).toBeTruthy();
    expect(errMsg).toBe('');
  });
});

describe('capitalizeText', () => {
  it('should return an empty string if text is an empty string', async () => {
    const result = await capitalizeText('');
    expect(result).toBe('');
  });

  it('should capitalize the first letter of a string', async () => {
    const result = await capitalizeText('hello world');
    expect(result).toBe('Hello world');
  });

  it('should handle white spaces correctly', async () => {
    const result = await capitalizeText('   test');
    expect(result).toBe('Test');
  });

  it('should capitalize the first letter of a string and trim the result', async () => {
    const result = await capitalizeText('  test  ');
    expect(result).toBe('Test');
  });

  it('should handle non-letter characters at the start of the string', async () => {
    const result = await capitalizeText('!test');
    expect(result).toBe('!test');
  });

  it('should return the input text unchanged if the first letter is already capitalized', async () => {
    const result = await capitalizeText('Test');
    expect(result).toBe('Test');
  });

  it('should handle numbers correctly', async () => {
    const result = await capitalizeText('123');
    expect(result).toBe('123');
  });
});

describe('phoneNumberValidation', () => {
  it('should return true when phone is an empty string', async () => {
    const result = await phoneNumberValidation('', 'IN');
    expect(result).toBeTruthy();
  });

  it('should return false when phone is not a valid number', async () => {
    const result = await phoneNumberValidation('abc', 'IN');
    expect(result).toBeFalsy();
  });

  it('should return false when phone length is less than PHONE_NUMBER_MIN_LENGTH', async () => {
    const result = await phoneNumberValidation('123', 'IN');
    expect(result).toBeFalsy();
  });

  it('should return false when phone length is greater than PHONE_NUMBER_MAX_LENGTH', async () => {
    const result = await phoneNumberValidation('1234567890123456', 'IN');
    expect(result).toBeFalsy();
  });

  it('should return false when phone is a invalid number and length is not within range', async () => {
    const result = await phoneNumberValidation('+91 989898989', 'IN');
    expect(result).toBeFalsy();
  });

  it('should return false when phone is a invalid country code', async () => {
    const result = await phoneNumberValidation('+254 9898989898', 'IN');
    expect(result).toBeFalsy();
  });

  it('should return true when phone is a valid', async () => {
    const result = await phoneNumberValidation('+91 9898989898', 'IN');
    expect(result).toBeTruthy();
  });
});

describe('extractPhoneNumber', () => {
  it('should return an empty string when phone is an empty string', async () => {
    const result = await extractPhoneNumber('');
    expect(result).toBe('');
  });

  it('should return phone as it is when phone does not include a space', async () => {
    const result = await extractPhoneNumber('1234567890');
    expect(result).toBe('1234567890');
  });

  it('should return country code without the + sign when type is code', async () => {
    const result = await extractPhoneNumber('+91 1234567890', 'code');
    expect(result).toBe('91');
  });

  it('should return phone number without country code and spaces when type is number', async () => {
    const result = await extractPhoneNumber('+91 1234567890', 'number');
    expect(result).toBe('1234567890');
  });
});

describe('avatarText function', () => {
  it('should return initials for a valid full name', () => {
    const input = 'John Doe';
    const result = avatarText(input);
    expect(result).toBe('JD'); // Should return 'J' from 'John' and 'D' from 'Doe'
  });

  it('should return initials for a single name', () => {
    const input = 'John';
    const result = avatarText(input);
    expect(result).toBe('JO'); // Should return 'J' from 'John' and 'O' as a fallback for second letter
  });

  it('should return initials for a name with leading/trailing spaces', () => {
    const input = '  john doe  ';
    const result = avatarText(input);
    expect(result).toBe('JD'); // Should trim spaces and return 'JD'
  });

  it('should return "AA" for an empty string', () => {
    const input = '';
    const result = avatarText(input);
    expect(result).toBe('AA'); // Default to 'AA' when input is empty
  });

  it('should return "AA" for null or undefined', () => {
    const input = null;
    const result = avatarText(input);
    expect(result).toBe('AA'); // Default to 'AA' when input is null

    const inputUndefined = undefined;
    const resultUndefined = avatarText(inputUndefined);
    expect(resultUndefined).toBe('AA'); // Default to 'AA' when input is undefined
  });

  it('should return initials from the first two words for multi-word names', () => {
    const input = 'Mary Ann Jane';
    const result = avatarText(input);
    expect(result).toBe('MA'); // Should take 'M' from 'Mary' and 'A' from 'Ann'
  });
});

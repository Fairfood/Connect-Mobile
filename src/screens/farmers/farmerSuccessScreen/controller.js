/**
 * checking phone text includes both dial code and phone number.
 * if this condition true, returns phone text otherwise ''
 * @param   {string} phone phone text
 * @returns {any}          phone text or ''
 */
export const getPhoneText = (phone) => {
  if (!phone) {
    return '';
  }
  return phone.toString().trim().includes(' ') ? phone : '';
};

/**
 * creating address text from farmer details
 * @param   {object} farmerObj farmer details
 * @returns {string}           address text
 */
export const getAddressText = (farmerObj) => {
  if (!farmerObj || Object.keys(farmerObj).length === 0) {
    return '';
  }

  const { street, city, province, country, zipcode } = farmerObj;

  const addressComponents = [];

  if (street) {
    addressComponents.push(street);
  }
  if (city) {
    addressComponents.push(city);
  }
  if (province) {
    addressComponents.push(province);
  }
  if (country) {
    addressComponents.push(country);
  }
  if (zipcode) {
    addressComponents.push(zipcode);
  }

  return `${addressComponents.join(', ')}.`;
};

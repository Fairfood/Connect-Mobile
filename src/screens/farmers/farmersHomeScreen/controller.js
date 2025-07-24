/**
 * sorting farmer based on selected sort option
 * @param   {Array}  farmers farmers list
 * @param   {string} sortKey selected sort option key
 * @returns {Array}          sorted farmer list
 */
import moment from 'moment';

export const sortFarmers = async (farmers, sortKey) => {
  const compareDates = (a, b) => {
    return new Date(a.created_on).getTime() - new Date(b.created_on).getTime();
  };

  const compareNames = (a, b) => {
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  };

  switch (sortKey) {
    case 'created_descending':
      return farmers.sort((a, b) => -compareDates(a, b));
    case 'created_ascending':
      return farmers.sort(compareDates);
    case 'name_ascending':
      return farmers.sort(compareNames);
    case 'name_descending':
      return farmers.sort((a, b) => -compareNames(a, b));
    default:
      return farmers.sort((a, b) => -compareDates(a, b));
  }
};

export const getReadableFarmerData = async (farmerArray) => {
  const filteredArray = await Promise.all(
    farmerArray.map(async (farmer) => {
      const phone = farmer.phone.includes(' ') ? farmer.phone : '';

      const createdOn = moment(farmer.created_on * 1000).format(
        'YYYY-MM-DD hh:mm:ss a',
      );

      return {
        ID: farmer.server_id,
        Name: farmer.name,
        'Identification number': farmer.reference_number,
        Phone: phone,
        Street: farmer.street,
        City: farmer.city,
        Province: farmer.province,
        Country: farmer.country,
        'Zip code': farmer.zipcode,
        'Card ID': farmer.card_id,
        'Created on': createdOn,
      };
    }),
  );

  return filteredArray;
};

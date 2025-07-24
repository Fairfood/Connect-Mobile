/**
 * get total amount of individual product excluding card dependent premium
 * @param   {number} productTotal   total premium
 * @param   {Array}  premiums       all premiums array
 * @returns {number}                total premium amount
 */
export const getTotal = async (productTotal, premiums) => {
  const total = premiums.reduce((a, b) => {
    if (b?.dependant_on_card) {
      return a - b.total;
    }
    return a;
  }, productTotal);
  return total;
};

/**
 * Grouping an object array based on a object property
 * Used for grouping transaction premiums
 * @param   {Array}   arr       transaction premium array
 * @param   {string}  property  premium id
 * @returns {object}            grouped premiums
 */
export const groupBy = (arr, property) =>
  arr.reduce(
    (memo, x) => ({
      ...memo,
      [x[property]]: [...(memo[x[property]] || []), x],
    }),
    {},
  );

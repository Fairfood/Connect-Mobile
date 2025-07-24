export const getTotalPrice = (products) => {
  let total = 0;
  products.map((product) => {
    if (!product.quantity || !product.base_price || !product.total_amount) {
      return 0;
    }
    total += product.total_amount;
    total += product.premium_total;
  });
  return parseFloat(total);
};

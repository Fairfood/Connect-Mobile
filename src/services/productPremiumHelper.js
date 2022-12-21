import { Q } from '@nozbe/watermelondb';
import { database } from '../../App';

const productPremiums = database.collections.get('product_premiums');

export const saveProductPremium = async (productId, premiumId) => {
  await database.action(async () => {
    await productPremiums.create((entry) => {
      entry.product_id = productId;
      entry.premium_id = premiumId;
    });
  });
};

export const findAllPremiumsByProductAndPremium = async (
  productId,
  premiumId,
) => {
  return productPremiums.query(
    Q.where('product_id', productId),
    Q.where('premium_id', premiumId),
  );
};

export const findAllPremiumsByProduct = async (id) => {
  return productPremiums.query(Q.where('product_id', id));
};

export const getAllProductPremiums = async () => {
  return productPremiums.query().fetch();
};

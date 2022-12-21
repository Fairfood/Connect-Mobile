import { Q } from '@nozbe/watermelondb';
import { database } from '../../App';

const products = database.collections.get('products');

export const getAllProducts = async () => {
  const allProducts = await products.query().fetch();
  return allProducts;
};

export const observeProducts = () => {
  return products.query().observe();
};

export const saveProduct = async (product) => {
  const res = await database.action(async () => {
    const response = await products.create((entry) => {
      entry.server_id = product.id;
      entry.name = product.name;
      entry.description = product.description;
      entry.image = product.image;
      entry.price = product.price;
      entry.is_active = product.is_active;
    });
    return response;
  });
  return res;
};

export const clearAllProducts = async () => {
  const allProducts = await database.collections
    .get('products')
    .query()
    .fetch();
  await database.action(async () => {
    const deleted = allProducts.map((product) => {
      return product.prepareDestroyPermanently();
    });

    database.batch(...deleted);
  });
};

export const findProductById = async (id) => {
  return products.find(id);
};

export const findProductByServerId = async (id) => {
  return products.query(Q.where('server_id', id));
};

export const TotalProductsCount = async () => {
  return products.query().fetchCount();
};

export const updateProductActiveStatus = async (id, status) => {
  await database.action(async () => {
    const product = await products.find(id);
    await product.update((tx) => {
      tx.is_active = status;
    });
  });
};

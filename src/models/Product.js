import { Model } from "@nozbe/watermelondb";
import { field, date, children, lazy } from "@nozbe/watermelondb/decorators";

class Product extends Model {
  static table = "products";
  static associations = {
    product_premiums: { type: "has_many", foreignKey: "server_id" },
  };

  @field("server_id") server_id;
  @field("name") name;
  @field("description") description;
  @field("image") image;
  @field("price") price;
  @field('is_active') is_active;
}

export default Product;

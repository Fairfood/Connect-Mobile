import { Model } from "@nozbe/watermelondb";
import {
  field,
  date,
  nochange,
  relation,
  readonly,
} from "@nozbe/watermelondb/decorators";

class ProductPremium extends Model {
  static table = "product_premiums";
  static associations = {
    products: { type: "belongs_to", key: "product_id" },
    premiums: { type: "belongs_to", key: "premium_id" },
  };

  @field("product_id") product_id;
  @field("premium_id") premium_id;
  @readonly @date("created_at") createdAt;
  @readonly @date("updated_at") updatedAt;

  @relation("products", "product_id") product;
  @relation("premiums", "premium_id") premium;
}

export default ProductPremium;

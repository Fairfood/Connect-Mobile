import { Model } from "@nozbe/watermelondb";
import {
  field,
  date,
  nochange,
  relation,
  readonly,
} from "@nozbe/watermelondb/decorators";

class Batch extends Model {
  static table = "batches";
  @field("server_id") server_id;
  @field("transaction_id") transaction_id;
  @field("product_id") product_id;
  @field("initial_quantity") initial_quantity;
  @field("current_quantity") current_quantity;
  @field("ref_number") ref_number;
  @field("unit") unit;
  // @nochange @field("server_id") serverID;
  @readonly @date("created_at") createdAt;
  @readonly @date("updated_at") updatedAt;
  // @relation("transactions", "transaction_id") transaction;
  // @relation("products", "product_id") product;
}

export default Batch;

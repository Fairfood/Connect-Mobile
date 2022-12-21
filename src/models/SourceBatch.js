import { Model } from "@nozbe/watermelondb";
import {
  field,
  date,
  nochange,
  relation,
  readonly,
} from "@nozbe/watermelondb/decorators";

class SourceBatch extends Model {
  static table = "source_batches";
  @field("transaction_id") transaction_id;
  @field("batch_id") batch_id;
  @field("quantity") quantity;
  @readonly @date("created_at") createdAt;
  @readonly @date("updated_at") updatedAt;
}

export default SourceBatch;

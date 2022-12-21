import { Model } from "@nozbe/watermelondb";
import {
  field,
  date,
  nochange,
  relation,
  readonly,
} from "@nozbe/watermelondb/decorators";

class TransactionPremium extends Model {
  static table = "transaction_premiums";
  @field("premium_id") premium_id;
  @field("transaction_id") transaction_id;
  @field("amount") amount;
  @readonly @date("created_at") createdAt;
  @readonly @date("updated_at") updatedAt;
}

export default TransactionPremium;

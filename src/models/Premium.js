import { Model } from "@nozbe/watermelondb";
import {
  field,
  date,
  nochange,
  relation,
  readonly,
} from "@nozbe/watermelondb/decorators";

class Premium extends Model {
  static table = "premiums";
  static associations = {
    product_premiums: { type: "has_many", foreignKey: "server_id" },
  };

  @field("server_id") server_id;
  @field("name") name;
  @field("type") type;
  @field("amount") amount;
  @field("included_in_amt") included_in_amt;
  @field("applicable_activity") applicable_activity;
  @field("is_card_dependent") is_card_dependent;
  @nochange @field("server_id") serverID;
  @readonly @date("created_at") createdAt;
  @readonly @date("updated_at") updatedAt;
}

export default Premium;

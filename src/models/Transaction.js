import { Model } from "@nozbe/watermelondb";
import {
  field,
  date,
  readonly,
  relation,
  json
} from "@nozbe/watermelondb/decorators";
import { stringToJson } from "../services/commonFunctions";

const sanitizeExtraFields = json => {
  if(json === ""){
    return json;
  }else{
    if(typeof json === "string"){
      stringToJson(json);
    }else{
      return json;
    }
  }
}

// const sanitizeReported = json => {
//   if(json === ""){
//     return json;
//   }else{
//     if(typeof json === "string"){
//       stringToJson(json);
//     }else{
//       return json;
//     }
//   }
// }

class Transaction extends Model {
  static table = "transactions";
  static associations = {
    nodes: { type: "belongs_to", key: "node_id" },
    products: { type: "belongs_to", key: "product_id" },
  };

  @field("server_id") server_id;
  @field("node_id") node_id;
  @field("product_id") product_id;
  @field("product_price") product_price;
  @field("type") type;
  @field("currency") currency;
  @field("quantity") quantity;
  @field("ref_number") ref_number;
  @field("price") price;
  @field("invoice_file") invoice_file;
  @field("verification_method") verification_method;
  @field("verification_latitude") verification_latitude;
  @field("verification_longitude") verification_longitude;


  @field("date") date;
  @field("created_on") created_on;
  @field("is_verified") is_verified;
  @field("is_deleted") is_deleted;
  @field("card_id") card_id;
  @field("total") total;
  @field("quality_correction") quality_correction;
  @field("transaction_type") transaction_type;
  @field("is_loss") is_loss;
  @json('extra_fields', sanitizeExtraFields) extra_fields;
  @field("error") error;
  // @json('reported', sanitizeReported) reported;
  @readonly @date("created_at") createdAt;
  @readonly @date("updated_at") updatedAt;
  @relation("nodes", "node_id") node;
  @relation("products", "product_id") product;
}

export default Transaction;

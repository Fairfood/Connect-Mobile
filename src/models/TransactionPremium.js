import { Model } from "@nozbe/watermelondb";
import {
  field,
  date,
  readonly,
  // json
} from "@nozbe/watermelondb/decorators";
// import { stringToJson } from "../services/commonFunctions";

// const sanitizeExtraFields = json => {
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

class TransactionPremium extends Model {
  static table = "transaction_premiums";
  @field("premium_id") premium_id;
  @field("transaction_id") transaction_id;
  @field("amount") amount;
  @readonly @date("created_at") createdAt;
  @readonly @date("updated_at") updatedAt;
  // @json('extra_fields', sanitizeExtraFields) extra_fields;
  // @json('reported', sanitizeReported) reported;
}

export default TransactionPremium;

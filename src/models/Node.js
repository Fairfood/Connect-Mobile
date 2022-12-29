import { Model } from "@nozbe/watermelondb";
import {
  field,
  date,
  readonly,
  nochange,
  json
} from "@nozbe/watermelondb/decorators";
import { stringToJson } from "../services/commonFunctions";

const sanitizeExtraFields = json => {
  if(json === ""){
    return json;
  }else{
    if(typeof json == "string"){
      stringToJson(json);
    }else{
      return json;
    }
  }
}

export default class Node extends Model {
  static table = "nodes";
  @field("server_id") server_id;
  @field("name") name;
  @field("type") type;
  @field("phone") phone;
  @field("ktp") ktp;
  @field("street") street;
  @field("city") city;
  @field("country") country;
  @field("province") province;
  @field("zipcode") zipcode;
  @field("image") image;
  @field("latitude") latitude;
  @field("longitude") longitude;
  @field("card_id") card_id;
  @field("is_modified") is_modified;
  @field("is_card_modified") is_card_modified;
  @field("last_synced") last_synced;
  @nochange @field("server_id") serverID;
  @date("created_on") created_on;
  @date("updated_on") updated_on;
  @json('extra_fields', sanitizeExtraFields) extra_fields;
}

import { Model } from "@nozbe/watermelondb";
import {
    field,
    date,
    readonly,
    nochange,
} from "@nozbe/watermelondb/decorators";

export default class Card extends Model {
    static table = "cards";
    @field("server_id") server_id;
    @field("card_id") card_id;
    @field("node_id") node_id;
    @field("fair_id") fair_id;

    // @field("phone") phone;
    // @field("ktp") ktp;
    // @field("street") street;
    // @field("city") city;
    // @field("country") country;
    // @field("province") province;
    // @field("zipcode") zipcode;
    // @field("image") image;
    // @field("latitude") latitude;
    // @field("longitude") longitude;
    // @field("card_id") card_id;
    // @field("is_modified") is_modified;
    // @field("is_card_modified") is_card_modified;
    // @field("last_synced") last_synced;
    @nochange @field("server_id") serverID;
    @date("created_on") created_on;
    @date("updated_on") updated_on;
}

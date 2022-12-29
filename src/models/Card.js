import { Model } from '@nozbe/watermelondb';
import { field, date, nochange } from '@nozbe/watermelondb/decorators';

export default class Card extends Model {
  static table = 'cards';
  @field('server_id') server_id;
  @field('card_id') card_id;
  @field('node_id') node_id;
  @field('fair_id') fair_id;
  @nochange @field('server_id') serverID;
  @date('created_on') created_on;
  @date('updated_on') updated_on;
}

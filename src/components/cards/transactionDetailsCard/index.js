import React from 'react';
import { View, Text } from 'react-native';
import { NumberFormatter } from '../../../utils/commonFunctions';
import { APP_TRANS_TYPE_INCOMING } from '../../../utils/constants';
import I18n from '../../../translations/text/i18n';
import StyleSheetFactory from './styles';

const TransactionDetailsCard = ({
  type,
  productName,
  productQuantity,
  premiums,
  price,
  totalPrice,
}) => {
  const styles = StyleSheetFactory();

  return (
    <View style={styles.cardContainer} testID="card-container">
      <View style={styles.detailsTextWrap}>
        <Text style={styles.detailsText}>{I18n.t('price_details')}</Text>
      </View>

      <View style={[styles.cardItem, { marginTop: 10 }]}>
        {type === APP_TRANS_TYPE_INCOMING ? (
          <Text style={styles.cardLeftItem}>
            {`${I18n.t('base_price_for')} ${NumberFormatter.quantity(
              productQuantity,
            )} Kg ${productName}:`}
          </Text>
        ) : (
          <Text style={styles.cardLeftItem}>
            {`${I18n.t('total_paid_to_farmers')}:`}
          </Text>
        )}
        <Text style={styles.cardRightItem} testID="base-price-value">
          {NumberFormatter.currency(price, true)}
        </Text>
      </View>

      {premiums.length > 0 && (
        <Text style={styles.sectionHeading}>{I18n.t('premiums')}</Text>
      )}

      {premiums.map((premium, index) => (
        <View key={index.toString()} style={styles.cardItem}>
          <Text style={styles.cardLeftItem}>{`${premium.name}:`}</Text>
          <Text style={styles.cardRightItem} testID={premium.name}>
            {NumberFormatter.currency(premium.total, true)}
          </Text>
        </View>
      ))}

      <View style={styles.dottedLine} />
      <View style={[styles.cardItem, { marginVertical: 10 }]}>
        <Text style={styles.totalTitle}>{`${I18n.t('total')}:`}</Text>
        <Text style={styles.titleValue} testID="total-value">
          {NumberFormatter.currency(totalPrice, true)}
        </Text>
      </View>
    </View>
  );
};

export default TransactionDetailsCard;

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useSelector } from 'react-redux';
import I18n from '../../../translations/text/i18n';
import { NumberFormatter } from '../../../utils/commonFunctions';
import StyleSheetFactory from './styles';

const SendCard = ({
  products = [],
  premiums = [],
  loading = false,
  totalPaidToFarmer,
  totalPrice,
}) => {
  const { theme } = useSelector((state) => state.common);
  const styles = useMemo(() => StyleSheetFactory(theme), [theme]);

  return (
    <View>
      {products.length > 0 && !loading && (
        <View style={styles.cardContainer}>
          <Text style={styles.priceDetails}>{I18n.t('price_details')}</Text>

          <View style={styles.cardItem}>
            <Text style={styles.cardLeftItem}>
              {`${I18n.t('total_paid_to_farmers')}:`}
            </Text>
            <Text style={styles.cardRightItem}>
              {NumberFormatter.currency(totalPaidToFarmer, true)}
            </Text>
          </View>

          {premiums.length > 0 && (
            <Text style={styles.sectionHeading}>{I18n.t('premiums')}</Text>
          )}

          {premiums.map((premium, index) => (
            <View key={index.toString()} style={styles.cardItem}>
              <Text style={styles.cardLeftItem}>{`${premium.name}:`}</Text>
              <Text style={styles.cardRightItem}>
                {NumberFormatter.currency(premium.total, true)}
              </Text>
            </View>
          ))}

          <View style={styles.dottedLine} />
          <View style={[styles.cardItem, { marginVertical: 10 }]}>
            <Text style={styles.totalTitle}>{`${I18n.t('total')}:`}</Text>
            <Text style={styles.totalValue}>
              {NumberFormatter.currency(totalPrice, true)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default SendCard;

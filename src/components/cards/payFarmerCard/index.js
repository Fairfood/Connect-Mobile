import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import {
  NumberFormatter,
  createSpeech,
  getCurrency,
} from '../../../utils/commonFunctions';
import I18n from '../../../translations/text/i18n';
import StyleSheetFactory from './styles';
import { AudioIcon } from '../../../assets/svg';
import Speech from '../../../translations/textToSpeech/speech';

const PayFarmerCard = ({ premiums, totalPrice }) => {
  const styles = StyleSheetFactory();
  const { theme, speechEnabled } = useSelector((state) => state.common);

  const announceTotal = async () => {
    const currencyName = getCurrency('name');
    await createSpeech(Speech.t('verify_transaction'), [
      `${parseFloat(totalPrice).toFixed(2)}`,
      currencyName,
    ]);
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.titleWrap}>
        <Text style={styles.transactionSummaryText}>
          {I18n.t('transaction_summary')}
        </Text>
        {speechEnabled && (
          <TouchableOpacity onPress={announceTotal} style={styles.announceWrap}>
            <AudioIcon width={18} height={18} fill={theme.background_1} />
            <Text style={styles.announceText}>{I18n.t('announce')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {premiums.map((premium, index) => (
        <View key={index.toString()} style={styles.cardItem}>
          <Text style={styles.cardLeftItem}>{`${premium.name}:`}</Text>
          <Text style={styles.cardRightItem}>
            {NumberFormatter.currency(premium.paid_amount, true)}
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
  );
};

export default PayFarmerCard;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { convertCurrency, convertQuantity, getCustomFieldValue } from '../services/commonFunctions';
import I18n from '../i18n/i18n';

const CardNew = ({
  products,
  cardColor,
  textColor,
  premiums,
  totalPrice,
  currency,
}) => {
  const { theme } = useSelector((state) => state.common);
  const styles = StyleSheetFactory(theme);

  return (
    <View
      style={[
        styles.cardContainer,
        { backgroundColor: cardColor ?? theme.background_2 },
      ]}
    >
      <View style={{ marginVertical: 5, paddingVertical: 0 }}>
        <Text
          style={[
            styles.transactionSummaryText,
            { color: textColor ?? theme.text_1 },
          ]}
        >
          {I18n.t('transaction_summary')}
        </Text>
      </View>

      <View
        style={[styles.cardItem, { flexDirection: 'column', marginBottom: 10 }]}
      >
        {products.map((item, index) => {
          return (
            <View key={index.toString()}>
              <View style={[styles.cardItem, { marginHorizontal: 0 }]}>
                <Text
                  style={[
                    styles.cardLeftItem,
                    {
                      color: textColor ?? theme.text_1,
                      width: '70%',
                    },
                  ]}
                >
                  {`${I18n.t('base_price_for')} ${convertQuantity(item.quantity)} Kg ${item.name}:`}
                </Text>
                <Text
                  style={[
                    styles.cardRightItem,
                    {
                      fontWeight: '600',
                      color: textColor ?? theme.text_1,
                    },
                  ]}
                >
                  {`${convertCurrency(item.total_amount)} ${currency}`}
                </Text>
              </View>

              {item?.extra_fields?.custom_fields?.buy_txn_fields && (
                <>
                  {item.extra_fields.custom_fields.buy_txn_fields.map(
                    (i, n) => {
                      return (
                        <View key={n.toString()} style={styles.cardItem}>
                          <Text
                            style={[
                              styles.cardLeftItem,
                              {
                                color: textColor ?? theme.text_1,
                                width: '70%',
                              },
                            ]}
                          >
                            {i?.label?.en ?? i.key}
                          </Text>
                          <Text
                            style={[
                              styles.cardRightItem,
                              {
                                fontWeight: '600',
                                color: textColor ?? theme.text_1,
                              },
                            ]}
                          >
                            {getCustomFieldValue(i)}
                          </Text>
                        </View>
                      );
                    },
                  )}
                </>
              )}
            </View>
          );
        })}
      </View>

      {premiums.map((premium, index) => (
        <View key={index.toString()} style={styles.cardItem}>
          <Text
            style={[styles.cardLeftItem, { color: textColor ?? theme.text_1 }]}
          >
            {`${premium.name}:`}
          </Text>
          <Text
            style={[
              styles.cardRightItem,
              {
                fontWeight: '600',
                color: textColor ?? theme.text_1,
              },
            ]}
          >
            {`${convertCurrency(premium.total)} ${currency}`}
          </Text>
        </View>
      ))}

      <View style={styles.dottedLine} />

      <View style={[styles.cardItem, { marginVertical: 10 }]}>
        <Text
          style={[
            styles.cardLeftItem,
            {
              opacity: 1,
              textTransform: 'uppercase',
              color: textColor ?? theme.text_1,
              paddingTop: 5,
            },
          ]}
        >
          {`${I18n.t('total')}:`}
        </Text>
        <Text
          style={[
            styles.cardRightItem,
            {
              fontWeight: '700',
              fontSize: 20,
              color: textColor ?? theme.text_1,
            },
          ]}
        >
          {`${convertCurrency(totalPrice)} ${currency}`}
        </Text>
      </View>
    </View>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    cardContainer: {
      width: '100%',
      alignSelf: 'center',
      marginHorizontal: 15,
      marginTop: 10,
      paddingHorizontal: 20,
      borderRadius: theme.border_radius,
    },
    cardItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignContent: 'space-between',
      marginVertical: 3,
    },
    cardLeftItem: {
      fontFamily: theme.font_regular,
      fontWeight: '400',
      fontStyle: 'normal',
      fontSize: 12,
      color: theme.text_1,
      opacity: 0.7,
      letterSpacing: 0.2,
    },
    cardRightItem: {
      fontFamily: theme.font_regular,
      fontWeight: '400',
      fontStyle: 'normal',
      fontSize: 12,
      color: theme.text_1,
    },
    quantityText: {
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      letterSpacing: 0.2,
      opacity: 1,
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'none',
      marginBottom: 3,
    },
    transactionSummaryText: {
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      letterSpacing: 0.2,
      opacity: 1,
      fontWeight: '500',
      fontSize: 16,
      textTransform: 'none',
      marginVertical: 10,
      marginBottom: 0,
    },
    dottedLine: {
      borderStyle: 'dotted',
      borderWidth: 1,
      borderRadius: theme.border_radius,
      borderColor: theme.background_1,
    },
  });
};

export default CardNew;

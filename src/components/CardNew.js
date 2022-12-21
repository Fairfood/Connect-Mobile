import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import I18n from '../i18n/i18n';
import { getCustomFieldValue } from '../services/commonFunctions';
import * as consts from '../services/constants';

const CardNew = ({
  products,
  cardColor,
  textColor,
  premiums,
  totalPrice,
  currency,
}) => {
  return (
    <View
      style={[
        styles.cardContainer,
        { backgroundColor: cardColor ?? consts.CARD_BACKGROUND_COLOR },
      ]}
    >
      <View style={{ marginVertical: 5, paddingVertical: 0 }}>
        <Text
          style={[
            styles.transactionSummaryText,
            { color: textColor ?? consts.TEXT_PRIMARY_COLOR },
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
                      color: textColor ?? consts.TEXT_PRIMARY_COLOR,
                      width: '70%',
                    },
                  ]}
                >
                  {`${I18n.t('base_price_for')} ${parseFloat(
                    item.quantity,
                  ).toLocaleString('id')} Kg ${item.name}:`}
                </Text>
                <Text
                  style={[
                    styles.cardRightItem,
                    {
                      fontWeight: '600',
                      color: textColor ?? consts.TEXT_PRIMARY_COLOR,
                    },
                  ]}
                >
                  {`${Math.round(parseFloat(item.total_amount)).toLocaleString(
                    'id',
                  )} ${currency}`}
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
                                color: textColor ?? consts.TEXT_PRIMARY_COLOR,
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
                                color: textColor ?? consts.TEXT_PRIMARY_COLOR,
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
            style={[
              styles.cardLeftItem,
              { color: textColor ?? consts.TEXT_PRIMARY_COLOR },
            ]}
          >
            {`${premium.name}:`}
          </Text>
          <Text
            style={[
              styles.cardRightItem,
              {
                fontWeight: '600',
                color: textColor ?? consts.TEXT_PRIMARY_COLOR,
              },
            ]}
          >
            {`${Math.round(premium.total).toLocaleString('id')} ${currency}`}
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
              color: textColor ?? consts.TEXT_PRIMARY_COLOR,
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
              color: textColor ?? consts.TEXT_PRIMARY_COLOR,
            },
          ]}
        >
          {`${Math.round(parseFloat(totalPrice)).toLocaleString(
            'id',
          )} ${currency}`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    alignSelf: 'center',
    marginHorizontal: 15,
    marginTop: 10,
    paddingHorizontal: 20,
  },
  cardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    marginVertical: 3,
  },
  cardLeftItem: {
    fontFamily: consts.FONT_REGULAR,
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 12,
    color: consts.TEXT_PRIMARY_COLOR,
    opacity: 0.7,
    letterSpacing: 0.2,
  },
  cardRightItem: {
    fontFamily: consts.FONT_REGULAR,
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 12,
    color: consts.TEXT_PRIMARY_COLOR,
  },
  quantityText: {
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    letterSpacing: 0.2,
    opacity: 1,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'none',
    marginBottom: 3,
  },
  transactionSummaryText: {
    fontFamily: consts.FONT_REGULAR,
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
    borderRadius: consts.BORDER_RADIUS,
    borderColor: consts.APP_BG_COLOR,
  },
});

export default CardNew;

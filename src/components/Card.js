import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import Icon from '../icons';
import I18n from '../i18n/i18n';
import * as consts from '../services/constants';

const Card = ({
  cardColor,
  textColor,
  displayTransaction,
  productName,
  productQuantity,
  premiums,
  totalPrice,
  displayPriceDetails,
  productPrice,
  currency,
  qualityCorrectionEnabled,
  localPrice,
}) => {
  return (
    <View
      style={[
        styles.cardContainer,
        { backgroundColor: cardColor ?? consts.CARD_BACKGROUND_COLOR },
      ]}
    >
      <>
        <View style={styles.detailsTextWrap}>
          {(displayTransaction || displayPriceDetails) && (
            <Text
              style={[
                styles.detailsText,
                {
                  color: textColor ?? consts.TEXT_PRIMARY_COLOR,
                  fontSize: displayTransaction ? 16 : 14,
                },
              ]}
            >
              {displayTransaction && I18n.t('transaction_summary')}
              {displayPriceDetails && I18n.t('price_details')}
            </Text>
          )}
        </View>
        <View style={[styles.cardItem, { marginBottom: 10 }]}>
          <Text
            style={[
              styles.productQuantity,
              {
                color: textColor ?? consts.TEXT_PRIMARY_COLOR,
              },
            ]}
          >
            {`${productName} `}
            {qualityCorrectionEnabled &&
              `- ${productQuantity.toLocaleString('id').replace(/\./g, '')}Kg`}
            {!qualityCorrectionEnabled &&
              localPrice !== '' &&
              `- Local market price: ${parseInt(localPrice).toLocaleString(
                'id',
              )} ${currency}`}
          </Text>
        </View>

        {!displayTransaction && (
          <View style={[styles.cardItem, { marginBottom: 0 }]}>
            <View style={{ flexDirection: 'row' }}>
              {!displayTransaction && (
                <View style={{ marginTop: 0, marginRight: 5 }}>
                  <Icon
                    name='info'
                    color={consts.TEXT_PRIMARY_COLOR}
                    size={16}
                  />
                </View>
              )}
              <Text
                style={[
                  styles.basePriceText,
                  {
                    color: textColor ?? consts.TEXT_PRIMARY_COLOR,
                  },
                ]}
              >
                {`${I18n.t('base_price_per_kg')} ${productName} ${I18n.t(
                  'is',
                )} ${parseInt(productPrice).toLocaleString('id')} ${currency}`}
              </Text>
            </View>
          </View>
        )}
      </>

      {displayTransaction && (
        <View style={{ flexDirection: 'row' }}>
          <View style={{ marginTop: 0, marginHorizontal: 5 }}>
            <Icon
              name='info'
              color={textColor ? '#FFFFFF' : consts.TEXT_PRIMARY_COLOR}
              size={16}
            />
          </View>

          <Text
            style={[
              styles.basePriceText,
              {
                color: textColor ?? consts.TEXT_PRIMARY_COLOR,
                marginBottom: 10,
              },
            ]}
          >
            {`${I18n.t('base_price_per_kg')} ${productName} ${I18n.t(
              'is',
            )} ${parseFloat(productPrice).toLocaleString('id')} ${currency}`}
          </Text>
        </View>
      )}

      <View
        style={[styles.cardItem, { marginTop: displayTransaction ? 0 : 15 }]}
      >
        <Text
          style={[
            styles.cardLeftItem,
            { color: textColor ?? consts.TEXT_PRIMARY_COLOR, width: '70%' },
          ]}
        >
          {`${I18n.t('base_price_for')} ${parseFloat(
            productQuantity,
          ).toLocaleString('id')} Kg ${productName}:`}
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
          {`${(
            parseFloat(productQuantity) * parseFloat(productPrice)
          ).toLocaleString('id')} ${currency}`}
        </Text>
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
      <View
        style={[
          styles.cardItem,
          { marginVertical: displayTransaction ? 10 : 15 },
        ]}
      >
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
    paddingHorizontal: 10,
  },
  cardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    marginVertical: 5,
    marginHorizontal: 10,
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
  detailsTextWrap: {
    marginVertical: 5,
    paddingVertical: 0,
  },
  detailsText: {
    fontFamily: consts.FONT_REGULAR,
    fontWeight: '500',
    fontStyle: 'normal',
    opacity: 1,
    letterSpacing: 0.2,
    textTransform: 'none',
    marginVertical: 10,
    marginBottom: 0,
    marginLeft: 10,
  },
  productQuantity: {
    fontFamily: consts.FONT_REGULAR,
    fontWeight: '500',
    fontStyle: 'normal',
    fontSize: 12,
    color: consts.TEXT_PRIMARY_COLOR,
    opacity: 1,
    letterSpacing: 0.2,
    textTransform: 'none',
  },
  basePriceText: {
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 12,
    fontWeight: '500',
    opacity: 1,
    letterSpacing: 0.2,
    textTransform: 'none',
  },
  dottedLine: {
    borderStyle: 'dotted',
    borderWidth: 1,
    borderRadius: consts.BORDER_RADIUS,
    borderColor: consts.APP_BG_COLOR,
  },
});

export default Card;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import Icon from '../icons';
import I18n from '../i18n/i18n';
import { convertCurrency, convertQuantity } from '../services/commonFunctions';

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
  const { theme } = useSelector((state) => state.common);
  const styles = StyleSheetFactory(theme);

  return (
    <View
      style={[
        styles.cardContainer,
        { backgroundColor: cardColor ?? theme.background_2 },
      ]}
    >
      <>
        <View style={styles.detailsTextWrap}>
          {(displayTransaction || displayPriceDetails) && (
            <Text
              style={[
                styles.detailsText,
                {
                  color: textColor ?? theme.text_1,
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
                color: textColor ?? theme.text_1,
              },
            ]}
          >
            {`${productName} `}
            {qualityCorrectionEnabled &&
              `- ${convertQuantity(productQuantity)}Kg`}
            {!qualityCorrectionEnabled &&
              localPrice !== '' &&
              `- Local market price: ${convertCurrency(
                localPrice,
              )} ${currency}`}
          </Text>
        </View>

        {!displayTransaction && (
          <View style={[styles.cardItem, { marginBottom: 0 }]}>
            <View style={{ flexDirection: 'row' }}>
              {!displayTransaction && (
                <View style={{ marginTop: 0, marginRight: 5 }}>
                  <Icon name="info" color={theme.text_1} size={16} />
                </View>
              )}
              <Text
                style={[
                  styles.basePriceText,
                  {
                    color: textColor ?? theme.text_1,
                  },
                ]}
              >
                {`${I18n.t('base_price_per_kg')} ${productName} ${I18n.t(
                  'is',
                )} ${convertCurrency(productPrice)} ${currency}`}
              </Text>
            </View>
          </View>
        )}
      </>

      {displayTransaction && (
        <View style={{ flexDirection: 'row' }}>
          <View style={{ marginTop: 0, marginHorizontal: 5 }}>
            <Icon
              name="info"
              color={textColor ? '#FFFFFF' : theme.text_1}
              size={16}
            />
          </View>

          <Text
            style={[
              styles.basePriceText,
              {
                color: textColor ?? theme.text_1,
                marginBottom: 10,
              },
            ]}
          >
            {`${I18n.t('base_price_per_kg')} ${productName} ${I18n.t(
              'is',
            )} ${convertCurrency(productPrice)} ${currency}`}
          </Text>
        </View>
      )}

      <View
        style={[styles.cardItem, { marginTop: displayTransaction ? 0 : 15 }]}
      >
        <Text
          style={[
            styles.cardLeftItem,
            { color: textColor ?? theme.text_1, width: '70%' },
          ]}
        >
          {`${I18n.t('base_price_for')} ${convertQuantity(
            productQuantity,
          )} Kg ${productName}:`}
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
          {`${convertCurrency(
            parseFloat(productQuantity) * parseFloat(productPrice),
          )} ${currency}`}
        </Text>
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
      paddingHorizontal: 10,
      borderRadius: theme.border_radius,
    },
    cardItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignContent: 'space-between',
      marginVertical: 5,
      marginHorizontal: 10,
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
    detailsTextWrap: {
      marginVertical: 5,
      paddingVertical: 0,
    },
    detailsText: {
      fontFamily: theme.font_regular,
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
      fontFamily: theme.font_regular,
      fontWeight: '500',
      fontStyle: 'normal',
      fontSize: 12,
      color: theme.text_1,
      opacity: 1,
      letterSpacing: 0.2,
      textTransform: 'none',
    },
    basePriceText: {
      fontFamily: theme.font_regular,
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
      borderRadius: theme.border_radius,
      borderColor: theme.background_1,
    },
  });
};

export default Card;

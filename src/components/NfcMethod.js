/* eslint-disable function-paren-newline */
/* eslint-disable react/jsx-wrap-multilines */
/* eslint-disable no-return-assign */
/* eslint-disable camelcase */
/* eslint-disable global-require */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import { getSkipCardText } from '../services/commonFunctions';
import TransparentButton from './TransparentButton';
import I18n from '../i18n/i18n';
import Icon from '../icons';

const { height, width } = Dimensions.get('window');

const NfcMethod = ({ ...props }) => {
  const {
    actionType,
    verifyLoading,
    onNoCardSubmit,
    cardSection = null,
    error,
    noCardButton = true,
  } = props;
  const { theme } = useSelector((state) => state.common);
  const styles = StyleSheetFactory(theme);

  return (
    <View style={styles.container}>
      <View style={styles.infoWrap}>
        <View style={{ alignItems: 'center', marginRight: 10 }}>
          <Icon name="info" color="#FFFFFF" size={14} />
        </View>
        <View style={{ width: '95%' }}>
          <Text style={styles.policyText}>{I18n.t('privacy_policy')}</Text>
        </View>
      </View>

      <View style={styles.cardReaderImageContainer}>
        <FastImage
          source={require('../assets/images/scanning.gif')}
          style={{ width, height: width }}
        />
      </View>

      <View style={styles.withCardBottomWrap}>
        <View style={styles.withCardBottomSubWrap}>
          {verifyLoading ? (
            <View style={styles.cardReadingWrap}>
              <ActivityIndicator color={theme.text_1} />
              <Text style={[styles.scanning, { marginLeft: 10 }]}>
                {I18n.t('verifying')}
              </Text>
            </View>
          ) : (
            <Text style={styles.scanning}>
              {I18n.t('scanning_farmer_card')}
            </Text>
          )}
        </View>

        {actionType === 'buy' && actionType === 'send' && (
          <View style={styles.formTitleContainer}>
            <Text style={styles.formTitle}>
              {I18n.t('tap_farmer_card_to_verify_premium')}
            </Text>
          </View>
        )}

        {noCardButton && (
          <View style={styles.noCardButton}>
            <TransparentButton
              buttonText={getSkipCardText(actionType)}
              onPress={() => onNoCardSubmit()}
              padding={7}
              color="#4DCAF4"
            />
          </View>
        )}

        {error !== '' && <Text style={styles.errorMessage}>{error}</Text>}

        {cardSection}
      </View>
    </View>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#D5ECFB',
      paddingHorizontal: width * 0.025,
    },
    formTitleContainer: {
      marginTop: 35,
      marginBottom: 20,
    },
    formTitle: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 16,
      textAlign: 'center',
    },
    cardReaderImageContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    noCardButton: {
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
    },
    scanning: {
      color: theme.text_1,
      fontWeight: 'normal',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 14,
      textAlign: 'center',
      marginVertical: 10,
    },
    errorMessage: {
      fontSize: 14,
      fontFamily: theme.font_regular,
      lineHeight: 28,
      paddingBottom: 10,
      textAlign: 'center',
      color: theme.icon_error,
    },
    infoWrap: {
      backgroundColor: theme.text_2,
      flexDirection: 'row',
      width: '95%',
      paddingHorizontal: width * 0.05,
      paddingVertical: width * 0.02,
      alignSelf: 'center',
      borderRadius: theme.border_radius,
      zIndex: 99,
    },
    policyText: {
      fontFamily: 'Moderat-Medium',
      fontSize: 12,
      color: '#FFFFFF',
    },
    withCardBottomWrap: {
      marginTop: height * -0.12,
      paddingBottom: 15,
    },
    withCardBottomSubWrap: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardReadingWrap: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });
};

export default NfcMethod;

/* eslint-disable function-paren-newline */
import React from 'react';
import { View, Text, ActivityIndicator, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import TransparentButton from '../../buttons/transparentButton';
import I18n from '../../../translations/text/i18n';
import StyleSheetFactory from './styles';
import { getSkipCardText } from '../../../utils/commonFunctions';
import { InfoIcon } from '../../../assets/svg';

const { width } = Dimensions.get('window');

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
  const styles = StyleSheetFactory();

  return (
    <View style={styles.container}>
      <View style={styles.infoWrap} testID="policy-info">
        <InfoIcon
          fill="#ffffff"
          width={18}
          height={18}
          style={{ marginTop: 2, marginRight: 10 }}
        />
        <View style={{ width: '95%' }}>
          <Text style={styles.policyText}>{I18n.t('privacy_policy')}</Text>
        </View>
      </View>

      <View style={styles.cardReaderImageContainer}>
        <FastImage
          source={{ uri: 'file:///android_asset/scanning.gif' }}
          style={{ width, height: width }}
          resizeMode={FastImage.resizeMode.contain}
          testID="scanning-gif"
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
            <Text style={styles.formTitle} testID="tap-card-info">
              {I18n.t('tap_farmer_card_to_verify_premium')}
            </Text>
          </View>
        )}

        {noCardButton && (
          <View style={styles.noCardButton} testID="no-card-button">
            <TransparentButton
              buttonText={getSkipCardText(actionType)}
              onPress={onNoCardSubmit}
              color="#4DCAF4"
            />
          </View>
        )}

        {error && <Text style={styles.errorMessage}>{error}</Text>}

        {cardSection}
      </View>
    </View>
  );
};

export default NfcMethod;

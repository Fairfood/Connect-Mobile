/* eslint-disable react/jsx-wrap-multilines */
/* eslint-disable no-return-assign */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Dimensions,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { HIT_SLOP_TWENTY } from '../services/constants';
import { getSkipCardText } from '../services/commonFunctions';
import TransparentButton from './TransparentButton';
import I18n from '../i18n/i18n';
import Icon from '../icons';
import CommonAlert from './CommonAlert';

const { height, width } = Dimensions.get('window');

const QrCodeMethod = ({ ...props }) => {
  const {
    actionType,
    onNoCardSubmit,
    qrTutorial,
    cardSection = null,
    noCardButton = true,
    onGetScanId,
    verifyLoading = false,
  } = props;
  const { theme } = useSelector((state) => state.common);
  const [alertModal, setAlertModal] = useState(false);
  const [help, setHelp] = useState(qrTutorial);
  const [alertMessage, setAlertMessage] = useState(
    I18n.t('something_went_wrong'),
  );
  const [alertTitle, setAlertTitle] = useState('Alert');
  let qrRef = useRef(null);

  const onSuccess = (element) => {
    const { data } = element;
    if (data) {
      checkUrl(data);
    } else {
      setAlertModal(true);
    }
  };

  const retryScan = async () => {
    setAlertModal(false);
    qrRef.reactivate();
  };

  const checkUrl = (data) => {
    const dataUrl = data.toString();

    if (!dataUrl.includes('https://id.fairfood.org')) {
      createAlert('invalid_card');
      return;
    }

    if (dataUrl === 'https://id.fairfood.org') {
      createAlert('old_card');
      return;
    }

    const parts = dataUrl.split('/');
    const cardID = parts[parts.length - 1];
    onGetScanId(cardID);
  };

  const closeHelpTutorial = async () => {
    await AsyncStorage.setItem('qr_help_tutorial', 'true');
    setHelp(false);
  };

  const createAlert = (key) => {
    let messageText = '';
    if (key === 'invalid_card') {
      setAlertTitle(I18n.t('invalid_card'));
      messageText = `${I18n.t('invalid_card_message')} ${I18n.t('try_again')}`;
    } else if (key === 'old_card') {
      setAlertTitle(I18n.t('old_card'));
      messageText = `${I18n.t('old_card_message')} ${I18n.t('try_new_card')}`;
    }

    if (actionType === 'buy' || actionType === 'send') {
      setAlertMessage(`${messageText} ${I18n.t('continue_manual_verif')}`);
    } else if (actionType === 'issue_card') {
      setAlertMessage(`${messageText} ${I18n.t('attach_card_later')}`);
    } else if (actionType === 'reissue_card') {
      setAlertMessage(`${messageText}`);
    }
    setAlertModal(true);
  };

  const styles = StyleSheetFactory(theme);

  return (
    <View style={styles.container}>
      <View style={styles.topContainerWrap}>
        <View style={styles.qrInfoWrap}>
          <View style={{ alignItems: 'center', marginRight: 10 }}>
            <Icon name="info" color="#FFFFFF" size={14} />
          </View>
          <View style={{ width: '95%' }}>
            <Text style={styles.policyText}>{I18n.t('privacy_policy')}</Text>
          </View>
        </View>
        <Text style={styles.qrScanning}>{I18n.t('scan_qr_code')}</Text>
        <View style={styles.qrCodeBox} />
      </View>
      {verifyLoading ? (
        <View style={{ height: height * 0.6 }} />
      ) : (
        <QRCodeScanner
          ref={(camera) => (qrRef = camera)}
          onRead={onSuccess}
          cameraContainerStyle={{ height: height * 0.6 }}
        />
      )}

      <View>
        {noCardButton && (
          <View style={styles.qrNoCardButton}>
            <TransparentButton
              buttonText={getSkipCardText(actionType)}
              onPress={() => onNoCardSubmit()}
              padding={7}
              color="#4DCAF4"
            />
          </View>
        )}
      </View>

      <View style={styles.cardWrapper}>
        {verifyLoading && (
          <View style={styles.cardReadingWrap}>
            <ActivityIndicator color={theme.text_1} />
            <Text style={styles.scanning}>{I18n.t('verifying')}</Text>
          </View>
        )}

        {!help && cardSection}

        {help && (
          <View style={styles.helpWrap}>
            <FastImage
              source={require('../assets/images/qr_code.gif')}
              style={{
                width: width * 0.48,
                height: height * 0.13,
                resizeMode: 'contain',
              }}
            />
            <Text style={styles.qrHelpMessage}>
              {I18n.t('qr_code_help_message1')}
            </Text>
            <Text style={styles.qrHelpMessage}>
              {I18n.t('qr_code_help_message2')}
            </Text>
            <TouchableOpacity
              onPress={() => closeHelpTutorial()}
              hitSlop={HIT_SLOP_TWENTY}
            >
              <Text style={styles.qrHelpCloseText}>
                {I18n.t('qr_code_help_skip')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <CommonAlert
        visible={alertModal}
        title={alertTitle}
        message={alertMessage}
        submitText={I18n.t('ok')}
        // cancelText={I18n.t('retry')}
        icon={
          <Image
            source={require('../assets/images/card-not-found.png')}
            resizeMode="contain"
            style={{ width: width * 0.3, height: width * 0.3 }}
          />
        }
        // onCancel={() => retryScan()}
        onSubmit={() => retryScan()}
      />
    </View>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#D5ECFB',
    },
    headerWrap: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: width * 0.05,
    },
    noCardButton: {
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
    },
    qrCodeBox: {
      width: width * 0.6,
      height: width * 0.6,
      borderRadius: theme.border_radius,
      borderColor: '#4DCAF4',
      borderWidth: 3,
      top: height * 0.15,
      alignSelf: 'center',
      zIndex: 99,
      position: 'absolute',
    },
    qrNoCardButton: {
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      bottom: height * 0.045,
      zIndex: 99,
      position: 'absolute',
    },
    scanning: {
      color: theme.text_1,
      fontWeight: 'normal',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 14,
      textAlign: 'center',
      marginVertical: 10,
      marginLeft: 10,
    },
    qrScanning: {
      color: '#ffffff',
      fontWeight: 'normal',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 14,
      textAlign: 'center',
      marginVertical: 10,
    },
    qrInfoWrap: {
      backgroundColor: theme.text_2,
      flexDirection: 'row',
      width: '95%',
      paddingHorizontal: width * 0.05,
      paddingVertical: width * 0.02,
      alignSelf: 'center',
      borderRadius: theme.border_radius,
    },
    topContainerWrap: {
      top: 10,
      zIndex: 99,
      position: 'absolute',
    },
    policyText: {
      fontFamily: 'Moderat-Medium',
      fontSize: 12,
      color: '#FFFFFF',
    },
    cardReadingWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
    },
    cardWrapper: {
      flex: 1,
      marginTop: 'auto',
      backgroundColor: '#D5ECFB',
    },
    qrHelpMessage: {
      fontFamily: 'Moderat-Medium',
      fontSize: 14,
      color: theme.text_1,
      textAlign: 'center',
    },
    qrHelpCloseText: {
      fontFamily: 'Moderat-Medium',
      fontSize: 12,
      color: theme.text_1,
      marginTop: height * 0.05,
      textAlign: 'center',
      textDecorationLine: 'underline',
    },
    helpWrap: {
      paddingHorizontal: width * 0.1,
      alignSelf: 'center',
      alignItems: 'center',
    },
  });
};

export default QrCodeMethod;

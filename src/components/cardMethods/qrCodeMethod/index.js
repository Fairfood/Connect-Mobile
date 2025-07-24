/* eslint-disable no-return-assign */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Dimensions,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCodeScanner from 'react-native-qrcode-scanner';
import { useSelector } from 'react-redux';
import { RNCamera } from 'react-native-camera';
import { HIT_SLOP_TWENTY } from '../../../utils/constants';
import { getSkipCardText } from '../../../utils/commonFunctions';
import { FlashOffIcon, FlashOnIcon, InfoIcon } from '../../../assets/svg';
import TransparentButton from '../../buttons/transparentButton';
import I18n from '../../../translations/text/i18n';
import CommonAlert from '../../modals/commonAlert';
import StyleSheetFactory from './styles';

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
    stepper,
    disableQr = false,
    helpSkip = true,
  } = props;
  let qrRef = useRef(null);
  const styles = StyleSheetFactory();
  const { theme } = useSelector((state) => state.common);
  const [flash, setFlash] = useState(RNCamera.Constants.FlashMode.off);
  const [alertModal, setAlertModal] = useState(false);
  const [help, setHelp] = useState(qrTutorial);
  const [alertMessage, setAlertMessage] = useState(
    I18n.t('something_went_wrong'),
  );
  const [alertTitle, setAlertTitle] = useState('Alert');

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
      setAlertMessage(
        `${messageText} ${I18n.t('continue_manual_verification')}`,
      );
    } else if (actionType === 'issue_card') {
      setAlertMessage(`${messageText} ${I18n.t('attach_card_later')}`);
    } else if (actionType === 'reissue_card') {
      setAlertMessage(`${messageText}`);
    }
    setAlertModal(true);
  };

  const handleFlash = () => {
    if (flash === RNCamera.Constants.FlashMode.off) {
      setFlash(RNCamera.Constants.FlashMode.torch);
    } else if (RNCamera.Constants.FlashMode.torch) {
      setFlash(RNCamera.Constants.FlashMode.off);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topContainerWrap}>
        <View style={styles.qrInfoWrap}>
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
        <Text style={styles.qrScanning}>{I18n.t('scan_qr_code')}</Text>
        <View style={styles.qrCodeBox} />
        <View
          style={[
            styles.bottomButtonsWrap,
            { top: stepper ? height * 0.48 : height * 0.49 },
          ]}
        >
          {noCardButton && (
            <View style={styles.qrNoCardButton}>
              <TransparentButton
                buttonText={getSkipCardText(actionType)}
                onPress={onNoCardSubmit}
                color="#4DCAF4"
              />
            </View>
          )}
          <TouchableOpacity onPress={handleFlash} style={styles.flashIconWrap}>
            {flash === RNCamera.Constants.FlashMode.off ? (
              <FlashOffIcon
                width={width * 0.1}
                height={width * 0.1}
                fill="#fff"
              />
            ) : (
              <FlashOnIcon
                width={width * 0.1}
                height={width * 0.1}
                fill="#fff"
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
      {disableQr ? (
        <View style={{ height: height * 0.6 }} />
      ) : (
        <QRCodeScanner
          ref={(camera) => (qrRef = camera)}
          onRead={onSuccess}
          flashMode={flash}
          reactivateTimeout={2000}
          cameraStyle={{
            marginTop: stepper ? height * 0.04 : 0,
            height: stepper ? height * 0.51 : height * 0.6,
          }}
        />
      )}

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
              source={{ uri: 'file:///android_asset/qr_code.gif' }}
              style={{
                width: width * 0.48,
                height: height * 0.13,
              }}
              resizeMode={FastImage.resizeMode.contain}
            />
            <Text style={styles.qrHelpMessage}>
              {I18n.t('qr_code_help_message1')}
            </Text>
            <Text style={styles.qrHelpMessage}>
              {I18n.t('qr_code_help_message2')}
            </Text>
            {helpSkip && (
              <TouchableOpacity
                onPress={closeHelpTutorial}
                hitSlop={HIT_SLOP_TWENTY}
              >
                <Text style={styles.qrHelpCloseText}>
                  {I18n.t('qr_code_help_skip')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      {alertModal && (
        <CommonAlert
          visible={alertModal}
          title={alertTitle}
          message={alertMessage}
          submitText={I18n.t('ok')}
          icon={
            <Image
              source={require('../../../assets/images/card_not_found.png')}
              resizeMode="contain"
              style={{ width: width * 0.3, height: width * 0.3 }}
            />
          }
          onSubmit={retryScan}
        />
      )}
    </View>
  );
};

export default QrCodeMethod;

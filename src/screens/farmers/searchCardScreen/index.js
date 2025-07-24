import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  BackHandler,
  ActivityIndicator,
  Text,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import NfcManager, { NfcEvents } from 'react-native-nfc-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { getAlertConfig, handleErrors } from '../../../utils/commonFunctions';
import { updateNfcSupported } from '../../../redux/CommonStore';
import { findFarmer } from '../../../db/services/FarmerHelper';
import {
  fetchCardWithFarmerAndCardId,
  fetchCardWithFarmerAndDisplayId,
} from '../../../db/services/CardHelper';
import CustomLeftHeader from '../../../components/headers/customLeftHeader';
import I18n from '../../../translations/text/i18n';
import CommonAlert from '../../../components/modals/commonAlert';
import NfcMethod from '../../../components/cardMethods/nfcMethod';
import QrCodeMethod from '../../../components/cardMethods/qrCodeMethod';
import VerificationSwitch from '../../../components/verificationSwitch';
import StyleSheetFactory from './styles';

const SearchCardScreen = ({ navigation }) => {
  const styles = StyleSheetFactory();
  const { theme } = useSelector((state) => state.common);
  const { nfcSupported } = useSelector((state) => state.common);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [qrTutorial, setQrTutorial] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [verificationMode, setVerificationMode] = useState('nfc');
  const [alert, setAlert] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const dispatch = useDispatch();

  useFocusEffect(
    useCallback(() => {
      setInitialLoading(true);
      setupInitialValues();
      return () => {};
    }, []),
  );

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleBackButtonClick();
        return true;
      },
    );

    return () => backHandler.remove();
  }, [verifyLoading]);

  /**
   * handling back action
   */
  const handleBackButtonClick = () => {
    if (verifyLoading) {
      Toast.show({
        type: 'warning',
        text1: I18n.t('cannot_go_back'),
        text2: I18n.t('procedure_in_progress'),
      });
    } else {
      if (nfcSupported) {
        NfcManager.unregisterTagEvent().catch(() => 0);
        cleanUp(false);
      }

      setVerifyLoading(false);
      navigation.goBack(null);
    }
  };

  /**
   * initial setting farmer list values
   */
  const setupInitialValues = async () => {
    const qrHelpTutorial = await AsyncStorage.getItem('qr_help_tutorial');
    if (!qrHelpTutorial || qrHelpTutorial !== 'true') {
      setQrTutorial(true);
    }

    if (nfcSupported === null) {
      initNfc();
    } else if (nfcSupported) {
      setVerificationMode('nfc');
      checkNfcEnabled();
    }

    setInitialLoading(false);
  };

  /**
   * initializing NFC
   */
  const initNfc = async () => {
    NfcManager.isSupported()
      .then(async (supported) => {
        if (supported) {
          setVerificationMode('nfc');
          dispatch(updateNfcSupported(true));
          checkNfcEnabled();
        } else {
          createAlert('nfc_unsupported');
          dispatch(updateNfcSupported(false));
        }
      })
      .catch((err) => {
        handleErrors(err, {
          ref: 'VerificationScreen_initNfc',
        });
      });
  };

  const checkNfcEnabled = async () => {
    const isEnabled = await NfcManager.isEnabled();
    if (isEnabled) {
      await NfcManager.start();
      readNfc();
    } else {
      createAlert('nfc_no_turned_on');
    }
  };

  /**
   * NFC reading function
   */
  const readNfc = () => {
    return new Promise((resolve) => {
      let tagFound = null;

      NfcManager.setEventListener(NfcEvents.DiscoverTag, async (tag) => {
        tagFound = tag;
        // resolve(tagFound);

        checkCardId(tagFound.id);

        NfcManager.unregisterTagEvent().catch((err) => {
          handleErrors(err, {
            ref: 'VerificationScreen_readNfc',
          });
        });
      });

      NfcManager.setEventListener(NfcEvents.SessionClosed, () => {
        cleanUp(true);
        if (!tagFound) {
          resolve();
        }
      });

      NfcManager.registerTagEvent();
    });
  };

  const toFarmerDetails = (farmerFound) => {
    setVerifyLoading(false);
    if (verificationMode === 'nfc' && nfcSupported) {
      NfcManager.unregisterTagEvent().catch(() => 0);
      cleanUp(false);
    }
    navigation.popToTop();
    navigation.navigate('FarmerDetails', {
      node: farmerFound,
      avatarBgColor: '#00bcd4',
    });
  };

  const checkCardId = async (id) => {
    setVerifyLoading(true);
    const isCardExist = await fetchCardWithFarmerAndCardId(id);

    if (isCardExist.length === 0) {
      createAlert('card_not_found_for_farmer');
      return;
    }

    const farmerFound = await findFarmer(isCardExist[0].node_id);

    if (farmerFound) {
      toFarmerDetails(farmerFound);
    } else {
      createAlert('card_not_found_for_farmer');
    }
  };

  const checkDisplayId = async (id) => {
    setVerifyLoading(true);
    const isCardExist = await fetchCardWithFarmerAndDisplayId(id);

    if (isCardExist.length === 0) {
      createAlert('card_not_found_for_farmer');
      return;
    }

    const farmerFound = await findFarmer(isCardExist[0].node_id);

    if (farmerFound) {
      toFarmerDetails(farmerFound);
    } else {
      createAlert('card_not_found_for_farmer');
    }
  };

  /**
   * redirecting to device NFC settings.
   */
  const turnOnNFC = async () => {
    NfcManager.goToNfcSetting();
  };

  /**
   * clearing NFC event
   * @param {boolean} tryAgain if true again starting NFC event.
   */
  const cleanUp = (tryAgain) => {
    NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
    NfcManager.setEventListener(NfcEvents.SessionClosed, null);
    if (tryAgain) {
      initNfc();
    }
  };

  /**
   * creating alert modal based on put key
   * @param {string} key alert modal type
   */
  const createAlert = (key) => {
    const alertObj = getAlertConfig(key);

    if (alertObj) {
      setAlert(alertObj);
      setAlertModal(true);
    }
  };

  /**
   * submit function of alert modal
   * @param {*} key alert type
   */
  const onPressAlert = (key) => {
    setVerifyLoading(false);
    setAlertModal(false);
    setAlert(null);

    switch (key) {
      case 'nfc_no_turned_on':
        turnOnNFC();
        break;
      case 'card_not_found_for_farmer':
        if (verificationMode === 'nfc' && nfcSupported) {
          readNfc();
        }
        break;
      case 'nfc_unsupported':
        setVerificationMode('qr_code');
        break;
      default:
        break;
    }
  };

  /**
   * cancel function of alert modal
   */
  const onCancelAlert = () => {
    setVerifyLoading(false);
    setAlertModal(false);
    setAlert(null);
  };

  const changeMethod = () => {
    if (verificationMode === 'nfc') {
      if (nfcSupported) {
        NfcManager.unregisterTagEvent().catch(() => 0);
        cleanUp(false);
      }
      setVerificationMode('qr_code');
    } else if (verificationMode === 'qr_code') {
      checkNfcEnabled();
      setVerificationMode('nfc');
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            verificationMode === 'no_card'
              ? theme.background_1
              : theme.background_2,
        },
      ]}
    >
      <View style={styles.headerWrap}>
        <CustomLeftHeader
          title={I18n.t('search_farmer_by_card')}
          onPress={handleBackButtonClick}
          extraStyle={{ width: '90%' }}
        />

        <VerificationSwitch
          verificationMode={verificationMode}
          onPress={changeMethod}
          nfcSupported={nfcSupported}
        />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {initialLoading && (
          <ActivityIndicator size="small" color={theme.icon_1} />
        )}

        {verificationMode === 'nfc' && !initialLoading && (
          <NfcMethod
            actionType="buy"
            verifyLoading={verifyLoading}
            backNavigation={handleBackButtonClick}
            noCardButton={false}
            cardSection={
              <View
                style={{
                  backgroundColor: '#5691AE',
                  width: '95%',
                  padding: '5%',
                  justifyContent: 'center',
                  alignItems: 'center',
                  alignSelf: 'center',
                }}
              >
                <Text
                  style={{
                    color: theme.text_4,
                    fontSize: 15,
                    fontFamily: theme.font_regular,
                  }}
                >
                  {I18n.t('tap_card_to_search_farmer')}
                </Text>
              </View>
            }
          />
        )}

        {verificationMode === 'qr_code' && !initialLoading && (
          <QrCodeMethod
            actionType="search"
            verifyLoading={verifyLoading}
            disableQr={verifyLoading}
            backNavigation={handleBackButtonClick}
            createAlert={createAlert}
            onGetScanId={checkDisplayId}
            qrTutorial={qrTutorial}
            helpSkip={false}
            noCardButton={false}
          />
        )}

        {alertModal && (
          <CommonAlert
            visible={alertModal}
            title={alert.title}
            message={alert.message}
            submitText={alert.submitText}
            icon={alert.icon}
            onSubmit={() => onPressAlert(alert.key)}
            cancelText={alert?.cancelText ?? null}
            onCancel={alert?.cancelText ? () => onCancelAlert() : null}
            onRequestClose={onCancelAlert}
          />
        )}
      </ScrollView>
    </View>
  );
};

export default SearchCardScreen;

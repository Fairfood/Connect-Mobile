/* eslint-disable function-paren-newline */
/* eslint-disable react/jsx-wrap-multilines */
/* eslint-disable no-return-assign */
/* eslint-disable camelcase */
/* eslint-disable global-require */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
  Image,
  BackHandler,
  ActivityIndicator,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import NfcManager, { NfcEvents } from 'react-native-nfc-manager';
import Geolocation from 'react-native-geolocation-service';
import Toast from 'react-native-toast-message';
import * as Sentry from '@sentry/react-native';

import {
  convertCurrency,
  jsonToString,
  requestPermission,
} from '../../../services/commonFunctions';
import { NfcNotSupportIcon, TurnOnNfcIcon } from '../../../assets/svg';
import { initSyncProcess } from '../../../redux/LoginStore';
import { updateNfcSupported } from '../../../redux/CommonStore';
import CustomLeftHeader from '../../../components/CustomLeftHeader';
import {
  MINIMUM_PAY_FARMER_AMOUNT,
  MAXIMUM_PAY_FARMER_AMOUNT,
  TYPE_GENERIC_PREMIUM,
  PAYMENT_OUTGOING,
  VERIFICATION_METHOD_CARD,
} from '../../../services/constants';
import { logAnalytics } from '../../../services/googleAnalyticsHelper';
import { fetchAllFarmers, findFarmer } from '../../../db/services/FarmerHelper';
import { createTransactionPremium } from '../../../db/services/TransactionPremiumHelper';
import { syncPayments } from '../../../sync/SyncTransactions';
import I18n from '../../../i18n/i18n';
import CommonAlert from '../../../components/CommonAlert';
import NfcMethod from '../../../components/NfcMethod';
import QrCodeMethod from '../../../components/QrCodeMethod';
import NoCardMethod from '../../../components/NoCardMethod';
import VerificationSwitch from '../../../components/VerificationSwitch';
import { fetchCardByCardId } from '../../../db/services/CardHelper';

const { width } = Dimensions.get('window');
const defaultPosition = { coords: { longitude: 0, latitude: 0 } };

const PayFarmerVerification = ({ navigation, route }) => {
  const { premiums, totalPrice, newFarmer, preLocation } = route.params;
  const { theme } = useSelector((state) => state.common);
  const { isConnected } = useSelector((state) => state.connection);
  const { userProjectDetails, syncInProgress, loggedInUser } = useSelector(
    (state) => state.login,
  );
  const { nfcSupported } = useSelector((state) => state.common);

  const { currency } = userProjectDetails;
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [qrTutorial, setQrTutorial] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [verificationMode, setVerificationMode] = useState('nfc');
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [farmersList, setFarmersList] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const [alertKey, setAlertKey] = useState('');
  const [alertMessage, setAlertMessage] = useState(
    I18n.t('something_went_wrong'),
  );
  const [alertTitle, setAlertTitle] = useState('Alert');
  const [alertSubmitText, setAlertSubmitText] = useState('Ok');
  const [alertIcon, setAlertIcon] = useState(null);
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  useEffect(() => {
    setInitialLoading(true);
    setupInitialValues();
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackButtonClick,
    );
    return () => {
      subscription.remove();
    };
  }, []);

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

    const farmers = await fetchAllFarmers();
    const convertedFarmers = Array.from(farmers);

    convertedFarmers.forEach((f) => {
      f.label = f.name;
      f.value = f.id;
    });

    convertedFarmers.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );

    if (newFarmer) {
      setSelectedFarmer(newFarmer);
    }

    setFarmersList(convertedFarmers);
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
        Sentry.captureException(`error initiating${err}`);
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
          Sentry.captureMessage(`tag error>>>${err}`);
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

  const checkCardId = async (id) => {
    setVerifyLoading(true);

    const isCardExist = await fetchCardByCardId(id);
    if (isCardExist.length === 0) {
      incompleteTransaction();
      return;
    }

    if (!isCardExist[0].node_id) {
      incompleteTransaction();
      return;
    }

    const farmer = await findFarmer(isCardExist[0].node_id);
    if (farmer) {
      requestAccessLocationPermission(farmer, isCardExist);
    } else {
      incompleteTransaction();
    }
  };

  /**
   * clearing NFC event
   */
  function handleBackButtonClick() {
    if (nfcSupported) {
      NfcManager.unregisterTagEvent().catch(() => 0);
      cleanUp(false);
    }
    navigation.goBack(null);
  }

  const backNavigation = () => {
    if (nfcSupported) {
      NfcManager.unregisterTagEvent().catch(() => 0);
      cleanUp(false);
    }

    setVerifyLoading(false);
    navigation.goBack(null);
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
   * fetching device's geo location
   * @param {object}  farmer  selected farmer
   * @param {Array}   card    selected card
   */
  const requestAccessLocationPermission = async (farmer, card) => {
    if (preLocation) {
      transactionValidate(farmer, card, preLocation);
    } else {
      const locationGranted = await requestPermission('location');

      if (locationGranted) {
        Geolocation.getCurrentPosition(
          (position) => {
            transactionValidate(farmer, card, position);
            return position.coords;
          },
          () => {
            transactionValidate(farmer, card, defaultPosition);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 },
        );
      } else {
        transactionValidate(farmer, card, defaultPosition);
      }
    }
  };

  /**
   * function when any transaction error occurs
   *
   */
  const incompleteTransaction = () => {
    createAlert('card_not_found_for_farmer');
    if (verificationMode === 'nfc' && nfcSupported) {
      readNfc();
    }
  };

  /**
   * validation function before submit
   * @param {object}  node      selected farmer
   * @param {Array}   card      selected card
   * @param {object}  position  device's geo location
   */
  const transactionValidate = async (node, card, position) => {
    let valid = true;

    await Promise.all(
      premiums.map(async (premium) => {
        const paidAmount = parseFloat(premium.paid_amount);
        if (
          paidAmount === '' ||
          paidAmount <= MINIMUM_PAY_FARMER_AMOUNT ||
          paidAmount >= MAXIMUM_PAY_FARMER_AMOUNT ||
          paidAmount === 0
        ) {
          valid = false;
          setError(`${I18n.t('check_the_values_entered')} ${premium.name}`);
        }
      }),
    );

    if (valid) {
      setError('');
      completeTransaction(node, card, position);
    } else {
      setVerifyLoading(false);
    }
  };

  /**
   * submit function. saving transaction, premium and batches in local db.
   * @param {object}  node      selected farmer
   * @param {Array}   card      selected card
   * @param {object}  position  device's geo location.
   */
  const completeTransaction = async (node, card, position) => {
    await Promise.all(
      premiums.map(async (premium) => {
        const date = parseInt(new Date().getTime() / 1000);
        const cardId =
          card[0].server_id !== '' ? card[0].server_id : card[0].id;
        const extraFields = premium.extra_fields
          ? jsonToString(premium.extra_fields)
          : '';

        const transactionPremium = {
          premium_id: premium.id,
          transaction_id: '',
          amount: parseFloat(premium.paid_amount),
          server_id: '',
          category: TYPE_GENERIC_PREMIUM,
          type: PAYMENT_OUTGOING,
          verification_method: VERIFICATION_METHOD_CARD,
          receipt: '',
          card_id: cardId,
          node_id: node.id,
          date,
          verification_longitude: position.coords.longitude,
          verification_latitude: position.coords.latitude,
          currency,
          source: loggedInUser.default_node,
          destination: node.server_id !== '' ? node.server_id : node.id,
          extra_fields: extraFields,
        };

        await createTransactionPremium(transactionPremium);
      }),
    ).then(async () => {
      logAnalytics('transactions', {
        verification_type:
          verificationMode === 'nfc'
            ? 'nfc_verification'
            : 'qr_code_verification',
        transaction_type: 'pay_farmer',
        network_status: isConnected && !syncInProgress ? 'online' : 'offline',
      });

      if (isConnected && !syncInProgress) {
        dispatch(initSyncProcess());
        await syncPayments();
      }

      if (nfcSupported) {
        NfcManager.unregisterTagEvent().catch(() => 0);
        cleanUp(false);
      }

      navigation.navigate('PayFarmerComplete', {
        farmer: node,
        total: totalPrice,
        premiumArray: premiums,
      });
    });
  };

  /**
   * requesting camera access permission
   * @param {object} selectedFarm  selected farmer object
   */
  const requestCameraPermission = async (selectedFarm) => {
    if (selectedFarm != null) {
      const cameraGranted = await requestPermission('camera');
      const microphoneGranted = await requestPermission('microphone');

      if (!cameraGranted || !microphoneGranted) {
        Toast.show({
          type: 'error',
          text1: I18n.t('grant_permission'),
          text2: I18n.t('allow_camera_permission'),
        });
        Linking.openSettings();
      } else {
        goToTakePicture(selectedFarm);
      }
    } else {
      setError(I18n.t('select_a_farmer'));
    }
  };

  /**
   * redirecting to take picture page
   * @param {object} selectedFarm  selected farmer object
   */
  const goToTakePicture = (selectedFarm) => {
    setError('');

    if (nfcSupported) {
      NfcManager.unregisterTagEvent().catch(() => 0);
      cleanUp(false);
    }

    const params = {
      premiums,
      totalPrice,
      farmer: selectedFarm,
    };

    navigation.navigate('PayFarmerTakePicture', params);
  };

  /**
   * creating alert modal based on put key
   * @param {string} key alert modal type
   */
  const createAlert = (key) => {
    setAlertKey(key);

    if (key === 'nfc_no_turned_on') {
      setAlertTitle(I18n.t('nfc_no_turned_on'));
      setAlertMessage(I18n.t('turn_on_nfc_continue'));
      setAlertSubmitText(I18n.t('turn_on'));
      setAlertIcon(
        <TurnOnNfcIcon width={width * 0.27} height={width * 0.27} />,
      );
    } else if (key === 'nfc_unsupported') {
      setAlertTitle(I18n.t('nfc_unsupported'));
      setAlertMessage(I18n.t('nfc_not_support_device'));
      setAlertSubmitText(I18n.t('ok'));
      setAlertIcon(
        <NfcNotSupportIcon width={width * 0.27} height={width * 0.27} />,
      );
    } else if (key === 'card_not_found_for_farmer') {
      setAlertTitle(I18n.t('card_not_found_for_farmer'));
      setAlertMessage(I18n.t('card_not_issued_for_farmer'));
      setAlertSubmitText(I18n.t('ok'));
      setAlertIcon(
        <Image
          source={require('../../../assets/images/card-not-found.png')}
          resizeMode="contain"
          style={{ width: width * 0.3, height: width * 0.3 }}
        />,
      );
    }
    setAlertModal(true);
  };

  /**
   * submit function of alert modal
   * @param {*} key alert type
   */
  const onPressAlert = (key) => {
    if (key === 'nfc_no_turned_on') {
      turnOnNFC();
    } else if (key === 'card_not_found_for_farmer') {
      if (verificationMode === 'nfc' && nfcSupported) {
        readNfc();
      }
    } else if (key === 'nfc_unsupported') {
      setVerificationMode('qr_code');
    }

    setAlertModal(false);
    setVerifyLoading(false);
  };

  /**
   * clearing NFC if choose no card option
   */
  const onNoCardSubmit = () => {
    setVerificationMode('no_card');

    if (nfcSupported) {
      NfcManager.unregisterTagEvent().catch(() => 0);
      cleanUp(false);
    }
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

  const styles = StyleSheetFactory(theme);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            verificationMode === 'no_card' ? '#ffffff' : '#D5ECFB',
        },
      ]}
    >
      <View style={styles.headerWrap}>
        <CustomLeftHeader
          title={I18n.t('premium_verification')}
          leftIcon="arrow-left"
          onPress={() => backNavigation()}
          extraStyle={{ width: '90%' }}
        />

        <VerificationSwitch
          verificationMode={verificationMode}
          onPress={() => changeMethod()}
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
            error={error}
            onNoCardSubmit={onNoCardSubmit}
            backNavigation={backNavigation}
            cardSection={
              <View style={{ width: '95%', alignSelf: 'center' }}>
                <CardNew
                  premiums={premiums}
                  cardColor="#5691AE"
                  textColor={theme.background_1}
                  totalPrice={totalPrice}
                  currency={currency}
                  styles={styles}
                  theme={theme}
                />
              </View>
            }
          />
        )}

        {verificationMode === 'qr_code' && !initialLoading && (
          <QrCodeMethod
            actionType="buy"
            verifyLoading={verifyLoading}
            error={error}
            onNoCardSubmit={onNoCardSubmit}
            backNavigation={backNavigation}
            createAlert={createAlert}
            onGetScanId={checkCardId}
            qrTutorial={qrTutorial}
            cardSection={
              <View style={{ width: '95%', alignSelf: 'center' }}>
                <CardNew
                  premiums={premiums}
                  cardColor="#5691AE"
                  textColor={theme.background_1}
                  totalPrice={totalPrice}
                  currency={currency}
                  styles={styles}
                  theme={theme}
                />
              </View>
            }
          />
        )}

        {verificationMode === 'no_card' && !initialLoading && (
          <NoCardMethod
            incomingFarmer={selectedFarmer}
            allFarmersList={farmersList}
            error={error}
            onSubmit={requestCameraPermission}
            backNavigation={backNavigation}
            cardSection={
              <View style={{ width: '95%', alignSelf: 'center' }}>
                <CardNew
                  premiums={premiums}
                  cardColor="#5691AE"
                  textColor={theme.background_1}
                  totalPrice={totalPrice}
                  theme={theme}
                  styles={styles}
                  currency={currency}
                />
              </View>
            }
          />
        )}

        {alertModal && (
          <CommonAlert
            visible={alertModal}
            title={alertTitle}
            message={alertMessage}
            submitText={alertSubmitText}
            icon={alertIcon}
            onSubmit={() => onPressAlert(alertKey)}
          />
        )}
      </ScrollView>
    </View>
  );
};

const CardNew = ({
  premiums,
  cardColor,
  totalPrice,
  currency,
  theme,
  styles,
}) => {
  return (
    <View
      style={[
        styles.cardContainer,
        { backgroundColor: cardColor ?? theme.background_2 },
      ]}
    >
      <View style={{ marginVertical: 5, paddingVertical: 0 }}>
        <Text style={styles.transactionSummaryText}>
          {I18n.t('transaction_summary')}
        </Text>
      </View>

      {premiums.map((premium, index) => (
        <View key={index.toString()} style={styles.cardItem}>
          <Text style={styles.cardLeftItem}>{`${premium.name}:`}</Text>
          <Text style={styles.cardRightItem}>
            {`${convertCurrency(premium.paid_amount)} ${currency}`}
          </Text>
        </View>
      ))}

      <View style={styles.dottedLine} />

      <View style={[styles.cardItem, { marginVertical: 10 }]}>
        <Text style={styles.totalTitle}>{`${I18n.t('total')}:`}</Text>
        <Text style={styles.totalValue}>
          {`${convertCurrency(totalPrice)} ${currency}`}
        </Text>
      </View>
    </View>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    headerWrap: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: width * 0.05,
    },
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
      opacity: 0.7,
      letterSpacing: 0.2,
      color: '#ffffff',
    },
    cardRightItem: {
      fontFamily: theme.font_regular,
      fontWeight: '600',
      fontStyle: 'normal',
      fontSize: 12,
      color: '#ffffff',
    },
    quantityText: {
      fontFamily: theme.font_regular,
      letterSpacing: 0.2,
      opacity: 1,
      fontSize: 12,
      fontWeight: '500',
      textTransform: 'none',
      marginBottom: 3,
    },
    transactionSummaryText: {
      fontFamily: theme.font_regular,
      letterSpacing: 0.2,
      opacity: 1,
      fontWeight: '500',
      fontSize: 16,
      textTransform: 'none',
      marginVertical: 10,
      marginBottom: 0,
      color: '#ffffff',
    },
    dottedLine: {
      borderStyle: 'dotted',
      borderWidth: 1,
      borderRadius: theme.border_radius,
      borderColor: theme.background_1,
    },
    totalTitle: {
      fontFamily: theme.font_regular,
      fontWeight: '400',
      fontSize: 12,
      letterSpacing: 0.2,
      opacity: 1,
      textTransform: 'uppercase',
      paddingTop: 5,
      color: '#ffffff',
    },
    totalValue: {
      fontFamily: theme.font_regular,
      letterSpacing: 0.2,
      opacity: 1,
      fontWeight: '700',
      fontSize: 20,
      color: '#ffffff',
    },
  });
};

export default PayFarmerVerification;

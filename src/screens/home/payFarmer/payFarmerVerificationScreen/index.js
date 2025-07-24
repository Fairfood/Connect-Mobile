import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  BackHandler,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import NfcManager, { NfcEvents } from 'react-native-nfc-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import Toast from 'react-native-toast-message';
import Tts from 'react-native-tts';
import {
  createReferenceId,
  getCurrency,
  handleErrors,
  requestPermission,
  createSpeech,
  getAlertConfig,
} from '../../../../utils/commonFunctions';
import { jsonToString } from '../../../../utils/helperFunctions';
import { updateNfcSupported } from '../../../../redux/CommonStore';
import CustomLeftHeader from '../../../../components/headers/customLeftHeader';
import {
  MINIMUM_PAY_FARMER_AMOUNT,
  MAXIMUM_PAY_FARMER_AMOUNT,
  TYPE_GENERIC_PREMIUM,
  PAYMENT_OUTGOING,
  VERIFICATION_METHOD_CARD,
} from '../../../../utils/constants';
import { logAnalytics } from '../../../../utils/serviceHelper';
import {
  fetchAllFarmers,
  findFarmer,
} from '../../../../db/services/FarmerHelper';
import { createTransactionPremium } from '../../../../db/services/TransactionPremiumHelper';
import {
  fetchCardWithFarmerAndCardId,
  fetchCardWithFarmerAndDisplayId,
} from '../../../../db/services/CardHelper';
import { initiateSync } from '../../../../sync/SyncInitials';
import I18n from '../../../../translations/text/i18n';
import CommonAlert from '../../../../components/modals/commonAlert';
import NfcMethod from '../../../../components/cardMethods/nfcMethod';
import QrCodeMethod from '../../../../components/cardMethods/qrCodeMethod';
import NoCardMethod from '../../../../components/cardMethods/noCardMethod';
import VerificationSwitch from '../../../../components/verificationSwitch';
import StyleSheetFactory from './styles';
import PayFarmerCard from '../../../../components/cards/payFarmerCard';
import Speech from '../../../../translations/textToSpeech/speech';
import ProfileCard from '../../../../components/cards/profileCard';

const defaultLocation = { coords: { longitude: 0, latitude: 0 } };

const PayFarmerVerification = ({ navigation, route }) => {
  const { premiums, totalPrice, newFarmer, preLocation } = route.params;
  const styles = StyleSheetFactory();

  const { theme, speechEnabled } = useSelector((state) => state.common);
  const { isConnected } = useSelector((state) => state.connection);
  const { syncInProgress, loggedInUser } = useSelector((state) => state.login);
  const { nfcSupported } = useSelector((state) => state.common);
  const [farmer, setFarmer] = useState(null);
  const [card, setCard] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [qrTutorial, setQrTutorial] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [verificationMode, setVerificationMode] = useState('nfc');
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [farmersList, setFarmersList] = useState(null);
  const [alert, setAlert] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  useFocusEffect(
    useCallback(() => {
      setInitialLoading(true);
      setupInitialValues();
      return () => {
        if (speechEnabled) {
          Tts.stop();
        }
      };
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

    if (newFarmer) {
      setSelectedFarmer(newFarmer);
    }

    // fetching all farmers, adding label and id and sort by ascending order
    const farmers = (await fetchAllFarmers())
      .map((f) => ({ ...f, label: f.name, value: f.id }))
      .sort((a, b) =>
        a.label.toLowerCase().localeCompare(b.label.toLowerCase()),
      );
    setFarmersList(farmers);

    if (speechEnabled) {
      const currencyName = getCurrency('name');
      await createSpeech(Speech.t('verify_transaction'), [
        `${parseFloat(totalPrice).toFixed(2)}`,
        currencyName,
      ]);
    }

    setInitialLoading(false);
  };

  /**
   * initializing NFC
   */
  const initNfc = async () => {
    try {
      const supported = await NfcManager.isSupported();

      if (supported) {
        setVerificationMode('nfc');
        dispatch(updateNfcSupported(true));
        checkNfcEnabled();
      } else {
        createAlert('nfc_unsupported');
        dispatch(updateNfcSupported(false));
      }
    } catch (err) {
      handleErrors(err);
    }
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
          handleErrors(err);
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

    const isCardExist = await fetchCardWithFarmerAndCardId(id);
    if (isCardExist.length === 0) {
      createAlert('card_not_found_for_farmer');
      return;
    }

    const farmerFound = await findFarmer(isCardExist[0].node_id);
    if (farmerFound) {
      setFarmer(farmerFound);
      setCard(isCardExist[0]);
      createAlert('verify_card_transaction');
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
      setFarmer(farmerFound);
      setCard(isCardExist[0]);
      createAlert('verify_card_transaction');
    } else {
      createAlert('card_not_found_for_farmer');
    }
  };

  /**
   * clearing NFC event
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
   */
  const requestAccessLocationPermission = async () => {
    try {
      const locationGranted = await requestPermission('location');

      if (locationGranted) {
        Geolocation.getCurrentPosition(
          (position) => {
            transactionValidate(position);
            return position.coords;
          },
          () => {
            transactionValidate(defaultLocation);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 },
        );
      } else {
        transactionValidate(defaultLocation);
      }
    } catch (err) {
      handleErrors(err, {
        ref: 'payFarmerVerificationScreen_requestAccessLocationPermission',
      });
      transactionValidate(defaultLocation);
    }
  };

  /**
   * validation function before submit
   * @param {object} position current coordinates
   */
  const transactionValidate = async (position) => {
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
      completeTransaction(position);
    } else {
      setVerifyLoading(false);
      if (verificationMode === 'nfc' && nfcSupported) {
        readNfc();
      }
    }
  };

  /**
   * creating form submission
   * @param   {object} premium  premium object
   * @returns {Array}           submission array
   */
  const createSubmissions = async (premium) => {
    const paymentForm = premium?.pay_common_form ?? [];
    if (paymentForm.length > 0) {
      const submissions = [];
      for (const form of paymentForm) {
        const values = [];
        for (const x of form.fields) {
          if (x.value && x.value !== '') {
            values.push({
              field: x.id,
              field_details: x,
              value: x.value,
            });
          }
        }

        if (values.length > 0) {
          submissions.push({
            form: form.id,
            values,
          });
        }
      }
      return submissions;
    }

    return [];
  };

  /**
   * submit function. saving transaction, premium and batches in local db.
   * @param {object} position geo location coordinates
   */
  const completeTransaction = async (position) => {
    const paymentArray = [];
    const referenceId = createReferenceId();
    const currency = getCurrency('code');

    await Promise.all(
      premiums.map(async (premium) => {
        let tnxDate = null;
        const commonTnxFields = premium?.pay_common_form?.[0].fields ?? [];
        if (commonTnxFields.length > 0) {
          const tnxDateField = commonTnxFields.find(
            (field) => field.key === 'transaction_date',
          );
          if (tnxDateField) {
            tnxDate = tnxDateField.value;
          }
        }

        const date = tnxDate || new Date().getTime();
        const cardId = card.server_id !== '' ? card.server_id : card.id;

        let submissions = await createSubmissions(premium);
        if (typeof submissions === 'object') {
          submissions = jsonToString(submissions);
        }

        const transactionPremium = {
          premium_id: premium.id,
          transaction_id: '',
          amount_corrected: parseFloat(premium.paid_amount),
          server_id: '',
          category: TYPE_GENERIC_PREMIUM,
          type: PAYMENT_OUTGOING,
          verification_method: VERIFICATION_METHOD_CARD,
          receipt: '',
          card_id: cardId,
          node_id: farmer.id,
          date: parseInt(Math.round(date / 1000)),
          verification_longitude_corrected: position.coords.longitude,
          verification_latitude_corrected: position.coords.latitude,
          currency,
          source: loggedInUser.entity_id,
          destination: farmer.server_id !== '' ? farmer.server_id : farmer.id,
          reference_id: referenceId,
          extra_fields: submissions,
          options: String(premium.paid_amount),
          comment: premium.comment,
        };

        const obj = { ...transactionPremium, premium_name: premium.name };
        paymentArray.push(obj);

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
        await initiateSync();
      }

      if (nfcSupported) {
        NfcManager.unregisterTagEvent().catch(() => 0);
        cleanUp(false);
      }

      navigation.navigate('PayFarmerComplete', {
        farmer,
        total: totalPrice,
        paymentArray,
        referenceId,
      });
    });
  };

  /**
   * requesting camera access permission
   * @param {object} selectedFarm  selected farmer object
   */
  const requestCameraPermission = async (selectedFarm) => {
    if (!selectedFarm) {
      setError(I18n.t('select_a_farmer'));
      return;
    }

    const cameraGranted = await requestPermission('camera');
    if (!cameraGranted) {
      Toast.show({
        type: 'error',
        text1: I18n.t('grant_permission'),
        text2: I18n.t('allow_camera_permission'),
      });
      Linking.openSettings();
      return;
    }

    goToTakePicture(selectedFarm);
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

    navigation.navigate('PayFarmerTakePicture', {
      premiums,
      totalPrice,
      farmer: selectedFarm,
    });
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
      case 'verify_card_transaction':
        if (preLocation) {
          transactionValidate(preLocation);
        } else {
          requestAccessLocationPermission();
        }
        break;
      default:
        break;
    }
  };

  const onCancelAlert = (key) => {
    setFarmer(null);
    setCard(null);
    setVerifyLoading(false);
    setAlertModal(false);
    setAlert(null);

    if (
      key === 'verify_card_transaction' &&
      verificationMode === 'nfc' &&
      nfcSupported
    ) {
      readNfc();
    }
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

    if (speechEnabled) {
      const currencyName = getCurrency('name');
      createSpeech(Speech.t('verify_transaction'), [
        `${parseFloat(totalPrice).toFixed(2)}`,
        currencyName,
      ]);
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
          title={I18n.t('premium_verification')}
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
            error={error}
            onNoCardSubmit={onNoCardSubmit}
            backNavigation={handleBackButtonClick}
            cardSection={
              <PayFarmerCard
                premiums={premiums}
                totalPrice={totalPrice}
                currency={getCurrency('code')}
              />
            }
          />
        )}

        {verificationMode === 'qr_code' && !initialLoading && (
          <QrCodeMethod
            actionType="buy"
            verifyLoading={verifyLoading}
            disableQr={card || verifyLoading}
            error={error}
            onNoCardSubmit={onNoCardSubmit}
            backNavigation={handleBackButtonClick}
            createAlert={createAlert}
            onGetScanId={checkDisplayId}
            qrTutorial={qrTutorial}
            cardSection={
              <PayFarmerCard
                premiums={premiums}
                totalPrice={totalPrice}
                currency={getCurrency('code')}
              />
            }
          />
        )}

        {verificationMode === 'no_card' && !initialLoading && (
          <NoCardMethod
            incomingFarmer={selectedFarmer}
            allFarmersList={farmersList}
            error={error}
            onSubmit={requestCameraPermission}
            backNavigation={handleBackButtonClick}
            cardSection={
              <PayFarmerCard
                premiums={premiums}
                totalPrice={totalPrice}
                currency={getCurrency('code')}
              />
            }
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
            onCancel={alert?.cancelText ? () => onCancelAlert(alert.key) : null}
            onRequestClose={() => onCancelAlert(alert.key)}
            customSection={
              alert.key === 'verify_card_transaction' ? (
                <ProfileCard user={farmer} type="farmer" />
              ) : null
            }
          />
        )}
      </ScrollView>
    </View>
  );
};

export default PayFarmerVerification;

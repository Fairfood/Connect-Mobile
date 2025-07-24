import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  BackHandler,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import NfcManager, { NfcEvents } from 'react-native-nfc-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import Geolocation from 'react-native-geolocation-service';
import Toast from 'react-native-toast-message';
import Tts from 'react-native-tts';
import {
  createReferenceId,
  createSpeech,
  getAlertConfig,
  getCurrency,
  handleErrors,
  requestPermission,
} from '../../../../utils/commonFunctions';
import { jsonToString } from '../../../../utils/helperFunctions';
import { updateNfcSupported } from '../../../../redux/CommonStore';
import {
  MINIMUM_TRANSACTION_QUANTITY,
  MAXIMUM_TRANSACTION_QUANTITY,
  APP_TRANS_TYPE_INCOMING,
  VERIFICATION_METHOD_CARD,
  TYPE_TRANSACTION_PREMIUM,
  PAYMENT_OUTGOING,
  TYPE_BASE_PRICE,
  PREMIUM_OPTIONS,
  PREMIUM_RANGE,
} from '../../../../utils/constants';
import { logAnalytics } from '../../../../utils/serviceHelper';
import {
  fetchAllFarmers,
  findFarmer,
} from '../../../../db/services/FarmerHelper';
import { createTransaction } from '../../../../db/services/TransactionsHelper';
import { createTransactionPremium } from '../../../../db/services/TransactionPremiumHelper';
import {
  fetchCardWithFarmerAndCardId,
  fetchCardWithFarmerAndDisplayId,
} from '../../../../db/services/CardHelper';
import { initiateSync } from '../../../../sync/SyncInitials';
import CustomLeftHeader from '../../../../components/headers/customLeftHeader';
import BuyCard from '../../../../components/cards/buyCard';
import I18n from '../../../../translations/text/i18n';
import CommonAlert from '../../../../components/modals/commonAlert';
import NfcMethod from '../../../../components/cardMethods/nfcMethod';
import QrCodeMethod from '../../../../components/cardMethods/qrCodeMethod';
import NoCardMethod from '../../../../components/cardMethods/noCardMethod';
import VerificationSwitch from '../../../../components/verificationSwitch';
import Speech from '../../../../translations/textToSpeech/speech';
import StyleSheetFactory from './styles';
import ProfileCard from '../../../../components/cards/profileCard';

const defaultLocation = { coords: { longitude: 0, latitude: 0 } };

const VerificationScreen = ({ navigation, route }) => {
  const { products, totalPrice, newFarmer, preLocation } = route.params;
  const styles = StyleSheetFactory();
  const { isConnected } = useSelector((state) => state.connection);
  const { theme, speechEnabled } = useSelector((state) => state.common);
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

    const farmers = await fetchAllFarmers();

    farmers.forEach((f) => {
      f.label = f.name;
      f.value = f.id;
    });

    farmers.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );

    if (newFarmer) {
      setSelectedFarmer(newFarmer);
    }

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
        ref: 'verificationScreen_requestAccessLocationPermission',
      });
      transactionValidate(defaultLocation);
    }
  };

  /**
   * total amount of individual product excluding card dependent premium
   * @param   {number}  ProductTotal  product total
   * @param   {Array}   Premiums      total premiums
   * @returns {number}                total amount
   */
  const getTotal = async (ProductTotal, Premiums) => {
    if (verificationMode === 'no_card') {
      const total = Premiums.reduce((a, b) => {
        if (b?.dependant_on_card) {
          return a - b.total;
        }
        return a;
      }, ProductTotal);
      return total;
    }

    return ProductTotal;
  };

  /**
   * get total amount of all products including premium amount
   * @returns {number} total amount
   */
  const getTotalPrice = () => {
    let total = 0;
    products.map((product) => {
      if (!product.quantity || !product.base_price || !product.total_amount) {
        return 0;
      }
      total += product.total_amount;
      total += product.premium_total;
    });
    return parseFloat(total);
  };

  /**
   * get card dependent premium total and premium array
   * @param   {string} key  'total' or 'premium'
   * @returns {any}         returns total or premium array based on key
   */
  const getPremiumRemovedValues = (key) => {
    let allTotal = totalPrice;

    const mainObj = {};
    products.map((product) => {
      product.applied_premiums.map((premium) => {
        const serverId = premium.server_id;
        if (mainObj[serverId]) {
          if (!premium.dependant_on_card) {
            const obj = mainObj[serverId];
            let { total } = obj;
            total += premium.total;
            obj.total = total;
            mainObj[serverId] = obj;
          } else {
            allTotal -= premium.total;
          }
        } else if (!premium.dependant_on_card) {
          const obj = {
            name: premium.name,
            total: premium.total,
          };
          mainObj[serverId] = obj;
        } else {
          allTotal -= premium.total;
        }
      });
    });

    if (key === 'total') {
      return allTotal;
    }
    return Object.values(mainObj);
  };

  /**
   * validation function before submit
   * @param {object} position current coordinates
   */
  const transactionValidate = async (position) => {
    let valid = true;

    await Promise.all(
      products.map(async (product) => {
        const quantity = parseFloat(product.quantity);
        const price = product.total_amount;
        const total = await getTotal(
          product.total_amount + product.premium_total,
          product.applied_premiums,
        );

        const productPrice = product.base_price;

        if (
          quantity === '' ||
          quantity <= MINIMUM_TRANSACTION_QUANTITY ||
          quantity >= MAXIMUM_TRANSACTION_QUANTITY ||
          price === '' ||
          price <= 0 ||
          total === '' ||
          total <= 0 ||
          productPrice === '' ||
          productPrice <= 0
        ) {
          valid = false;
          setError(`${I18n.t('check_the_values_entered')} ${product.name}`);
        } else {
          await Promise.all(
            product.applied_premiums.map(async (premium) => {
              const amount =
                parseFloat(premium.amount) * parseFloat(product.quantity);
              if (amount <= 0) {
                valid = false;
                setError(
                  `${I18n.t('check_the_values_entered')} ${product.name}`,
                );
              }
            }),
          );
        }
      }),
    );

    if (!farmer) {
      setError('Farmer not found, try again later');
      valid = false;
    }

    if (!card) {
      setError('Card not found, try again later');
      valid = false;
    }

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
   * @param   {object} product  product object
   * @returns {Array}           submission array
   */
  const createSubmissions = async (product) => {
    const productForm = product?.product_form ?? [];
    const transactionForm = product?.transaction_form ?? [];
    const mergedForm = [...productForm, ...transactionForm];
    if (mergedForm.length > 0) {
      const submissions = [];
      for (const form of mergedForm) {
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
    const transactionArray = [];
    const referenceId = createReferenceId();
    const currency = getCurrency('code');

    await Promise.all(
      products.map(async (product) => {
        let tnxDate = null;
        const commonTnxFields = product?.transaction_form?.[0].fields ?? [];
        if (commonTnxFields.length > 0) {
          const tnxDateField = commonTnxFields.find(
            (field) => field.key === 'transaction_date',
          );
          if (tnxDateField) {
            tnxDate = tnxDateField.value;
          }
        }

        const date = tnxDate || new Date().getTime();
        const quantity = parseFloat(product.quantity);
        const total = await getTotal(
          product.total_amount + product.premium_total,
          product.applied_premiums,
        );

        let submissions = await createSubmissions(product);
        if (typeof submissions === 'object') {
          submissions = jsonToString(submissions);
        }

        const transactionObj = {
          server_id: null,
          node_id: farmer.id,
          node_name: farmer.name,
          currency,
          product_id: product.id,
          type: APP_TRANS_TYPE_INCOMING,
          quantity_corrected: quantity,
          price_corrected: parseFloat(product.total_amount),
          total_corrected: total,
          invoice_file: '',
          card_id: card.id,
          date: moment(new Date(date)).format('DD MMM YYYY'),
          created_on: parseInt(Math.round(date / 1000)),
          quality_correction: 100,
          product_price_corrected: parseFloat(product.base_price),
          product_name: product.name,
          verification_method: VERIFICATION_METHOD_CARD,
          verification_longitude_corrected: position.coords.longitude,
          verification_latitude_corrected: position.coords.latitude,
          reference_id: referenceId,
          source: farmer.id,
          destination: loggedInUser.entity_id,
          current_quantity_corrected: quantity,
          extra_fields: submissions,
        };

        const transactionId = await createTransaction(transactionObj);

        transactionObj.id = transactionId;
        transactionObj.total_amount = product.total_amount;
        transactionObj.premium_total = product.premium_total;
        transactionArray.push(transactionObj);

        await saveAllTransactionPremium(
          product.applied_premiums,
          product.quantity,
          transactionId,
          transactionObj,
        );
        await saveBasePricePayment(transactionId, transactionObj);
      }),
    ).then(async () => {
      logAnalytics('transactions', {
        verification_type:
          verificationMode === 'nfc'
            ? 'nfc_verification'
            : 'qr_code_verification',
        transaction_type: 'buy_transaction',
        network_status: isConnected && !syncInProgress ? 'online' : 'offline',
      });

      let checkTransactionStatus = false;

      if (isConnected && !syncInProgress) {
        checkTransactionStatus = true;
        await initiateSync();
      }

      if (nfcSupported) {
        NfcManager.unregisterTagEvent().catch(() => 0);
        cleanUp(false);
      }

      navigation.navigate('TransactionComplete', {
        farmerName: farmer.name,
        total: totalPrice,
        transactionArray,
        checkTransactionStatus,
      });
    });
  };

  /**
   * saving all transaction premiums
   * @param {Array}   appliedPremiums all premiums applied for the transaction
   * @param {number}  productQuality  product quantity
   * @param {string}  transactionId   corresponding transaction id
   * @param {object}  transactionObj  transaction object
   */
  const saveAllTransactionPremium = async (
    appliedPremiums,
    productQuality,
    transactionId,
    transactionObj,
  ) => {
    await Promise.all(
      appliedPremiums.map(async (premium) => {
        const amount = parseFloat(premium.amount) * parseFloat(productQuality);

        let options = premium.amount;
        if (premium.calculation_type === PREMIUM_OPTIONS) {
          options = premium?.selected_option?.id ?? '';
        } else if (premium.calculation_type === PREMIUM_RANGE) {
          options = premium.selected_option;
        }

        const transactionPremium = {
          premium_id: premium.id,
          transaction_id: transactionId,
          amount_corrected: amount,
          server_id: '',
          category: TYPE_TRANSACTION_PREMIUM,
          type: PAYMENT_OUTGOING,
          verification_method: transactionObj.verification_method,
          receipt: transactionObj.invoice_file,
          card_id: transactionObj.card_id,
          node_id: transactionObj.node_id,
          date: transactionObj.created_on,
          currency: transactionObj.currency,
          source: loggedInUser.entity_id,
          destination: farmer.server_id !== '' ? farmer.server_id : farmer.id,
          verification_longitude_corrected:
            transactionObj.verification_longitude_corrected,
          verification_latitude_corrected:
            transactionObj.verification_latitude_corrected,
          options: String(options),
          reference_id: transactionObj.reference_id,
        };

        await createTransactionPremium(transactionPremium);
      }),
    );
  };

  /**
   * saving all base price payment
   * @param {string}  transactionId   corresponding transaction id
   * @param {object}  transactionObj  transaction object
   */
  const saveBasePricePayment = async (transactionId, transactionObj) => {
    const basePricePayment = {
      premium_id: '',
      transaction_id: transactionId,
      amount_corrected: transactionObj.price_corrected,
      server_id: '',
      category: TYPE_BASE_PRICE,
      type: PAYMENT_OUTGOING,
      verification_method: transactionObj.verification_method,
      receipt: transactionObj.invoice_file,
      card_id: transactionObj.card_id,
      node_id: transactionObj.node_id,
      date: transactionObj.created_on,
      currency: transactionObj.currency,
      source: loggedInUser.entity_id,
      destination: farmer.server_id !== '' ? farmer.server_id : farmer.id,
      verification_longitude_corrected:
        transactionObj.verification_longitude_corrected,
      verification_latitude_corrected:
        transactionObj.verification_latitude_corrected,
      options: String(transactionObj.product_price_corrected),
      reference_id: transactionObj.reference_id,
    };

    await createTransactionPremium(basePricePayment);
  };

  /**
   * requesting camera access permission
   * @param {object} selectedFarm  selected farmer object
   */
  const requestCameraPermission = async (selectedFarm) => {
    if (selectedFarm != null) {
      const cameraGranted = await requestPermission('camera');

      if (!cameraGranted) {
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

    const updatedTotal = getPremiumRemovedValues('total');

    const params = {
      products,
      totalPrice: updatedTotal,
      farmer: selectedFarm,
    };

    navigation.navigate('TakePicture', params);
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

  /**
   * cancel function of alert modal
   * @param {*} key alert type
   */
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
   * get premium array with name and total (group by premium)
   * @returns {Array} premium array
   */
  const getPremiumTotals = () => {
    if (products.length > 0) {
      const mainObj = {};
      products.map((product) => {
        product.applied_premiums.map((premium) => {
          const serverId = premium.server_id;
          if (mainObj[serverId]) {
            const obj = mainObj[serverId];
            let { total } = obj;
            total += premium.total;
            obj.total = total;
            mainObj[serverId] = obj;
          } else {
            const obj = {
              name: premium.name,
              total: premium.total,
            };
            mainObj[serverId] = obj;
          }
        });
      });
      return Object.values(mainObj);
    }

    return [];
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
      const updatedTotal = getPremiumRemovedValues('total');
      const currencyName = getCurrency('name');

      createSpeech(Speech.t('verify_transaction'), [
        `${parseFloat(updatedTotal).toFixed(2)}`,
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
          testID="buy-verification-screen"
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
              <View>
                {products && (
                  <BuyCard
                    products={products}
                    premiums={getPremiumTotals()}
                    totalPrice={getTotalPrice()}
                  />
                )}
              </View>
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
              <View>
                {products && (
                  <BuyCard
                    products={products}
                    premiums={getPremiumTotals()}
                    totalPrice={getTotalPrice()}
                  />
                )}
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
            backNavigation={handleBackButtonClick}
            cardSection={
              <View>
                {products && (
                  <BuyCard
                    products={products}
                    premiums={getPremiumRemovedValues('premium')}
                    totalPrice={getPremiumRemovedValues('total')}
                  />
                )}
              </View>
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

export default VerificationScreen;

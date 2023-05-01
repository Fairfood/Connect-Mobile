/* eslint-disable function-paren-newline */
/* eslint-disable react/jsx-wrap-multilines */
/* eslint-disable no-return-assign */
/* eslint-disable camelcase */
/* eslint-disable global-require */
import React, { useState, useEffect } from 'react';
import {
  View,
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
import moment from 'moment';
import Geolocation from 'react-native-geolocation-service';
import Toast from 'react-native-toast-message';
import * as Sentry from '@sentry/react-native';

import { findFarmerById, getAllFarmers } from '../../../services/farmersHelper';
import { saveTransaction } from '../../../services/transactionsHelper';
import { saveBatch } from '../../../services/batchesHelper';
import { saveTransactionPremium } from '../../../services/transactionPremiumHelper';
import { findCardByCardId } from '../../../services/cardsHelper';
import { requestPermission } from '../../../services/commonFunctions';
import { NfcNotSupportIcon, TurnOnNfcIcon } from '../../../assets/svg';
import { syncTransactions } from '../../../services/syncTransactions';
import { initSyncProcess } from '../../../redux/LoginStore';
import { updateNfcSupported } from '../../../redux/CommonStore';
import {
  MINIMUM_TRANSACTION_QUANTITY,
  MAXIMUM_TRANSACTION_QUANTITY,
  APP_TRANS_TYPE_INCOMING,
  VERIFICATION_METHOD_CARD,
  TYPE_TRANSACTION_PREMIUM,
  PAYMENT_OUTGOING,
  TYPE_BASE_PRICE,
} from '../../../services/constants';
import CustomLeftHeader from '../../../components/CustomLeftHeader';
import CardNew from '../../../components/CardNew';
import I18n from '../../../i18n/i18n';
import CommonAlert from '../../../components/CommonAlert';
import NfcMethod from '../../../components/NfcMethod';
import QrCodeMethod from '../../../components/QrCodeMethod';
import NoCardMethod from '../../../components/NoCardMethod';
import VerificationSwitch from '../../../components/VerificationSwitch';

const { width } = Dimensions.get('window');
const defaultPosition = { coords: { longitude: 0, latitude: 0 } };

const VerificationScreen = ({ navigation, route }) => {
  const { isConnected } = useSelector((state) => state.connection);
  const { products, totalPrice, newFarmer, preLocation } = route.params;
  const { theme } = useSelector((state) => state.common);
  const { userProjectDetails, syncInProgress, loggedInUser } = useSelector(
    (state) => state.login,
  );
  const { nfcSupported } = useSelector((state) => state.common);

  const { currency, quality_correction } = userProjectDetails;
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

    const farmers = await getAllFarmers();
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

    const isCardExist = await findCardByCardId(id);
    if (isCardExist.length === 0) {
      incompleteTransaction();
      return;
    }

    if (!isCardExist[0].node_id) {
      incompleteTransaction();
      return;
    }
    const farmer = await findFarmerById(isCardExist[0].node_id);

    if (farmer) {
      requestAccessLocationPermission(farmer);
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
   *
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
   *
   * @param {object} farmer selected farmer
   */
  const requestAccessLocationPermission = async (farmer) => {
    if (preLocation) {
      transactionValidate(farmer, preLocation);
    } else {
      const locationGranted = await requestPermission('location');

      if (locationGranted) {
        Geolocation.getCurrentPosition(
          (position) => {
            transactionValidate(farmer, position);
            return position.coords;
          },
          () => {
            transactionValidate(farmer, defaultPosition);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 },
        );
      } else {
        transactionValidate(farmer, defaultPosition);
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
   * total amount of individual product excluding card dependent premium
   *
   * @param   {number}  ProductTotal  product total
   * @param   {Array}   Premiums      total premiums
   * @returns {number}                total amount
   */
  const getTotal = async (ProductTotal, Premiums) => {
    if (verificationMode === 'no_card') {
      const total = Premiums.reduce((a, b) => {
        if (b?._raw?.is_card_dependent) {
          return a - b.total;
        }
        return a;
      }, Math.round(ProductTotal));
      return total;
    }

    return Math.round(ProductTotal);
  };

  /**
   * get total amount of all products including premium amount
   *
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
    return Math.round(parseFloat(total));
  };

  /**
   * get card dependent premium total and premium array
   *
   * @param   {string} key  'total' or 'premium'
   * @returns {any}         returns total or premium array based on key
   */
  const getPremiumRemovedValues = (key) => {
    let allTotal = totalPrice;

    const mainObj = {};
    products.map((product) => {
      product.applied_premiums.map((premium) => {
        const serverId = premium._raw.server_id;
        if (mainObj[serverId]) {
          if (!premium._raw.is_card_dependent) {
            const obj = mainObj[serverId];
            let { total } = obj;
            total += premium.total;
            obj.total = total;
            mainObj[serverId] = obj;
          } else {
            allTotal -= premium.total;
          }
        } else if (!premium._raw.is_card_dependent) {
          const obj = {
            name: premium._raw.name,
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
   *
   * @param {object} node     selected farmer
   * @param {object} position device's geo location
   */
  const transactionValidate = async (node, position) => {
    let valid = true;

    await Promise.all(
      products.map(async (product) => {
        const quantity = parseFloat(product.quantity);
        const price = product.total_amount;
        const total = await getTotal(
          product.total_amount + product.premium_total,
          product.applied_premiums,
        );

        const product_price = product.base_price;

        if (
          quantity === '' ||
          quantity <= MINIMUM_TRANSACTION_QUANTITY ||
          quantity >= MAXIMUM_TRANSACTION_QUANTITY ||
          price === '' ||
          price <= 0 ||
          total === '' ||
          total <= 0 ||
          product_price === '' ||
          product_price <= 0
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

    if (valid) {
      setError('');
      completeTransaction(node, position);
    } else {
      setVerifyLoading(false);
    }
  };

  /**
   * submit function. saving transaction, premium and batches in local db.
   *
   * @param {object} node selected farmer
   * @param {object} position device's geo location.
   */
  const completeTransaction = async (node, position) => {
    const transactionArray = [];

    await Promise.all(
      products.map(async (product) => {
        const date = new Date();
        const quantity = parseFloat(product.quantity);
        const price = product.total_amount;
        const total = await getTotal(
          product.total_amount + product.premium_total,
          product.applied_premiums,
        );
        const product_price = product.base_price;
        const extra_fields = product.extra_fields ?? null;

        const transactionObj = {
          server_id: null,
          node_id: node.id,
          node_name: node.name,
          currency,
          product_id: product.id,
          type: APP_TRANS_TYPE_INCOMING,
          quantity,
          ref_number: null,
          price,
          invoice_file: '',
          card_id: node.card_id,
          date: moment(Math.round(date)).format('DD MMM YYYY'),
          total,
          created_on: parseInt(Math.round(date) / 1000),
          quality_correction: 100,
          product_price,
          product_name: product.name,
          verification_method: VERIFICATION_METHOD_CARD,
          verification_longitude: position.coords.longitude,
          verification_latitude: position.coords.latitude,
          extra_fields: extra_fields ?? '',
        };

        const transactionId = await saveTransaction(transactionObj);
        transactionObj.id = transactionId;
        transactionObj.total_amount = product.total_amount;
        transactionObj.premium_total =
          parseFloat(total) - parseFloat(product.total_amount);
        transactionArray.push(transactionObj);

        const batch = {
          server_id: null,
          product_id: product.id,
          transaction_id: transactionId,
          name: product.name,
          initial_quantity: parseFloat(product.quantity),
          current_quantity: parseFloat(product.quantity),
          ref_number: null,
          unit: 1,
        };

        await saveBatch(batch);
        await saveAllTransactionPremium(
          product.applied_premiums,
          product.quantity,
          transactionId,
          transactionObj,
          node,
        );
        await saveBasePricePayment(transactionId, transactionObj, node);
      }),
    ).then(async () => {
      let checkTransactionStatus = false;

      if (isConnected && !syncInProgress) {
        checkTransactionStatus = true;
        dispatch(initSyncProcess());
        await syncTransactions();
      }

      if (nfcSupported) {
        NfcManager.unregisterTagEvent().catch(() => 0);
        cleanUp(false);
      }

      navigation.navigate('TransactionComplete', {
        farmerName: node.name,
        total: totalPrice,
        transactionArray,
        checkTransactionStatus,
      });
    });
  };

  /**
   * saving all transaction premiums
   *
   * @param {Array}   appliedPremiums all premiums applied for the transaction
   * @param {number}  productQuality  product quantity
   * @param {string}  transactionId   corresponding transaction id
   * @param {object}  transactionObj  transaction object
   * @param {object}  node            selected farmer
   */
  const saveAllTransactionPremium = async (
    appliedPremiums,
    productQuality,
    transactionId,
    transactionObj,
    node,
  ) => {
    await Promise.all(
      appliedPremiums.map(async (premium) => {
        const amount =
          parseFloat(premium._raw.amount) * parseFloat(productQuality);
        const transactionPremium = {
          premium_id: premium._raw.id,
          transaction_id: transactionId,
          amount: parseFloat(amount),
          server_id: '',
          category: TYPE_TRANSACTION_PREMIUM,
          type: PAYMENT_OUTGOING,
          verification_method: transactionObj.verification_method,
          receipt: transactionObj.invoice_file,
          card_id: transactionObj.card_id,
          node_id: transactionObj.node_id,
          date: transactionObj.created_on,
          currency: transactionObj.currency,
          source: loggedInUser.default_node,
          destination: node.server_id !== '' ? node.server_id : node.id,
          verification_longitude: transactionObj.verification_longitude,
          verification_latitude: transactionObj.verification_latitude,
        };
        await saveTransactionPremium(transactionPremium);
      }),
    );
  };

  /**
   * saving all base price payment
   *
   * @param {string}  transactionId   corresponding transaction id
   * @param {object}  transactionObj  transaction object
   * @param {object}  node            selected farmer
   */
  const saveBasePricePayment = async (transactionId, transactionObj, node) => {
    const basePricePayment = {
      premium_id: '',
      transaction_id: transactionId,
      amount: transactionObj.price,
      server_id: '',
      category: TYPE_BASE_PRICE,
      type: PAYMENT_OUTGOING,
      verification_method: transactionObj.verification_method,
      receipt: transactionObj.invoice_file,
      card_id: transactionObj.card_id,
      node_id: transactionObj.node_id,
      date: transactionObj.created_on,
      currency: transactionObj.currency,
      source: loggedInUser.default_node,
      destination: node.server_id !== '' ? node.server_id : node.id,
      verification_longitude: transactionObj.verification_longitude,
      verification_latitude: transactionObj.verification_latitude,
    };
    await saveTransactionPremium(basePricePayment);
  };

  /**
   * requesting camera access permission
   *
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
   *
   * @param {object} selectedFarm  selected farmer object
   */
  const goToTakePicture = (selectedFarm) => {
    setError('');

    if (nfcSupported) {
      NfcManager.unregisterTagEvent().catch(() => 0);
      cleanUp(false);
    }

    const params = {
      products,
      totalPrice: getPremiumRemovedValues('total'),
      farmer: selectedFarm,
    };

    navigation.navigate('TakePicture', params);
  };

  /**
   * creating alert modal based on put key
   *
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
          resizeMode='contain'
          style={{ width: width * 0.3, height: width * 0.3 }}
        />,
      );
    }
    setAlertModal(true);
  };

  /**
   * submit function of alert modal
   *
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
   * get premium array with name and total (group by premium)
   *
   * @returns {Array} premium array
   */
  const getPremiumTotals = () => {
    if (products.length > 0) {
      const mainObj = {};
      products.map((product) => {
        product.applied_premiums.map((premium) => {
          const serverId = premium._raw.server_id;
          if (mainObj[serverId]) {
            const obj = mainObj[serverId];
            let { total } = obj;
            total += premium.total;
            obj.total = total;
            mainObj[serverId] = obj;
          } else {
            const obj = {
              name: premium._raw.name,
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
            verificationMode === 'no_card' ? '#ffffff' : '#D5ECFB',
        },
      ]}
    >
      <View style={styles.headerWrap}>
        <CustomLeftHeader
          title={I18n.t('premium_verification')}
          leftIcon='arrow-left'
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
          <ActivityIndicator size='small' color={theme.icon_1} />
        )}

        {verificationMode === 'nfc' && !initialLoading && (
          <NfcMethod
            actionType='buy'
            verifyLoading={verifyLoading}
            error={error}
            onNoCardSubmit={onNoCardSubmit}
            backNavigation={backNavigation}
            cardSection={
              <View>
                {products && (
                  <View style={{ width: '95%', alignSelf: 'center' }}>
                    <CardNew
                      products={products}
                      cardColor='#5691AE'
                      textColor={theme.background_1}
                      premiums={getPremiumTotals()}
                      totalPrice={getTotalPrice()}
                      currency={currency}
                      qualityCorrectionEnabled={quality_correction}
                    />
                  </View>
                )}
              </View>
            }
          />
        )}

        {verificationMode === 'qr_code' && !initialLoading && (
          <QrCodeMethod
            actionType='buy'
            verifyLoading={verifyLoading}
            error={error}
            onNoCardSubmit={onNoCardSubmit}
            backNavigation={backNavigation}
            createAlert={createAlert}
            onGetScanId={checkCardId}
            qrTutorial={qrTutorial}
            cardSection={
              <View>
                {products && (
                  <View style={{ width: '95%', alignSelf: 'center' }}>
                    <CardNew
                      products={products}
                      cardColor='#5691AE'
                      textColor={theme.background_1}
                      premiums={getPremiumTotals()}
                      totalPrice={getTotalPrice()}
                      currency={currency}
                      qualityCorrectionEnabled={quality_correction}
                    />
                  </View>
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
            backNavigation={backNavigation}
            cardSection={
              <View>
                {products && (
                  <CardNew
                    products={products}
                    cardColor='#5691AE'
                    textColor={theme.background_1}
                    premiums={getPremiumRemovedValues('premium')}
                    totalPrice={getPremiumRemovedValues('total')}
                    currency={currency}
                    qualityCorrectionEnabled={quality_correction}
                  />
                )}
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

const styles = StyleSheet.create({
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
});

export default VerificationScreen;

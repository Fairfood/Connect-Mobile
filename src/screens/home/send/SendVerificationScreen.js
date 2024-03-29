/* eslint-disable react/jsx-wrap-multilines */
/* eslint-disable camelcase */
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
import { useSelector, useDispatch } from 'react-redux';
import NfcManager, { NfcEvents } from 'react-native-nfc-manager';
import moment from 'moment';
import Geolocation from 'react-native-geolocation-service';
import Toast from 'react-native-toast-message';

import { saveTransaction } from '../../../services/transactionsHelper';
import { findAndUpdateBatchQuantity } from '../../../services/batchesHelper';
import { saveTransactionPremium } from '../../../services/transactionPremiumHelper';
import { saveSourceBatch } from '../../../services/sourceBatchesHelper';
import { requestPermission } from '../../../services/commonFunctions';
import { NfcNotSupportIcon, TurnOnNfcIcon } from '../../../assets/svg';
import { initSyncProcess } from '../../../redux/LoginStore';
import { updateNfcSupported } from '../../../redux/CommonStore';
import { syncTransactions } from '../../../services/syncTransactions';
import CustomLeftHeader from '../../../components/CustomLeftHeader';
import I18n from '../../../i18n/i18n';
import CommonAlert from '../../../components/CommonAlert';
import NfcMethod from '../../../components/NfcMethod';
import QrCodeMethod from '../../../components/QrCodeMethod';
import VerificationSwitch from '../../../components/VerificationSwitch';
import * as consts from '../../../services/constants';

const { width } = Dimensions.get('window');
const defaultPosition = { coords: { longitude: 0, latitude: 0 } };

const SendVerificationScreen = ({ navigation, route }) => {
  const { isConnected } = useSelector((state) => state.connection);
  const { products, buyer, transactionType, totalEditedQuantity, preLocation } =
    route.params;
  const { theme } = useSelector((state) => state.common);
  const { userProjectDetails, syncInProgress, loggedInUser } = useSelector(
    (state) => state.login,
  );
  const { nfcSupported } = useSelector((state) => state.common);
  const { currency } = userProjectDetails;
  const [initialLoading, setInitialLoading] = useState(true);
  const [verificationMode, setVerificationMode] = useState('nfc');
  const [qrTutorial, setQrTutorial] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
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

        NfcManager.unregisterTagEvent().catch(() => 0);
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

    const { cards } = buyer;
    const filteredCards = cards.filter((card) => {
      return card.card_id === id;
    });
    if (filteredCards.length === 0) {
      createAlert('card_not_found_for_buyer');
      incompleteTransaction();
    } else {
      requestAccessLocationPermission(filteredCards);
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

  /**
   * clearing NFC event and redirecting to previous page
   */
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
   * @param {object} card selected card
   */
  const requestAccessLocationPermission = async (card) => {
    if (preLocation) {
      transactionValidate(preLocation, card);
    } else {
      const locationGranted = await requestPermission('location');

      if (locationGranted) {
        Geolocation.getCurrentPosition(
          (position) => {
            transactionValidate(position, card);
            return position.coords;
          },
          () => {
            transactionValidate(defaultPosition, card);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 },
        );
      } else {
        transactionValidate(defaultPosition, card);
      }
    }
  };

  /**
   * initializing NFC again
   */
  const incompleteTransaction = () => {
    if (verificationMode === 'nfc' && nfcSupported) {
      readNfc();
    }
  };

  /**
   * get total amount including premiums of all product
   *
   * @returns {number} total amount
   */
  const getAllTotalAmount = () => {
    let total = 0;

    products.map((product) => {
      total += parseFloat(product.total_amount) * parseFloat(product.ratio);

      product.total_premiums.map((premium) => {
        if (
          premium.applicable_activity === consts.PREMIUM_APPLICABLE_ACTIVITY_BUY
        ) {
          if (product.edited_quantity < premium.total_premiumed_quantity) {
            total +=
              parseFloat(premium.amount) * parseFloat(product.edited_quantity);
          } else {
            total +=
              parseFloat(premium.amount) *
              parseFloat(premium.total_premiumed_quantity);
          }
        } else {
          total +=
            parseFloat(premium.amount) * parseFloat(product.edited_quantity);
        }
      });
    });

    return Math.round(parseFloat(total));
  };

  /**
   * get total amount including premiums by product
   *
   * @param {Array} product product array
   */
  const getTotalAmount = async (product) => {
    let total = 0;
    total += parseFloat(product.total_amount) * parseFloat(product.ratio);

    product.total_premiums.map((premium) => {
      if (
        premium.applicable_activity === consts.PREMIUM_APPLICABLE_ACTIVITY_BUY
      ) {
        if (product.edited_quantity < premium.total_premiumed_quantity) {
          total +=
            parseFloat(premium.amount) * parseFloat(product.edited_quantity);
        } else {
          total +=
            parseFloat(premium.amount) *
            parseFloat(premium.total_premiumed_quantity);
        }
      } else {
        total +=
          parseFloat(premium.amount) * parseFloat(product.edited_quantity);
      }
    });

    return Math.round(parseFloat(total));
  };

  /**
   * calculate total amount paid to farmer by all products
   *
   * @returns {number} total amount
   */
  const totalPaidToFarmers = () => {
    let total = 0;
    products.map((product) => {
      total += parseFloat(product.total_amount) * parseFloat(product.ratio);
    });

    return Math.round(parseFloat(total));
  };

  /**
   * requesting camera access permission
   */
  const requestCameraPermission = async () => {
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
      goToTakePicture();
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

  /**
   * calculating total premiums data
   *
   * @returns {Array} premium data array
   */
  const getTotalPremiums = () => {
    if (products.length > 0) {
      const mainObj = {};
      products.map((product) => {
        product.total_premiums.map((premium) => {
          const { id } = premium;
          let { name } = premium;
          let total = 0;

          if (mainObj[id]) {
            const existedObj = mainObj[id];
            name = existedObj.name;
            total = existedObj.total;
          }

          if (
            premium.applicable_activity ===
            consts.PREMIUM_APPLICABLE_ACTIVITY_BUY
          ) {
            if (product.edited_quantity < premium.total_premiumed_quantity) {
              total +=
                parseFloat(premium.amount) *
                parseFloat(product.edited_quantity);
            } else {
              total +=
                parseFloat(premium.amount) *
                parseFloat(premium.total_premiumed_quantity);
            }
          } else {
            total +=
              parseFloat(premium.amount) * parseFloat(product.edited_quantity);
          }

          const obj = {
            name,
            total,
          };
          mainObj[id] = obj;
        });
      });
      return Object.values(mainObj);
    }
    return [];
  };

  /**
   * saving source batches in local db
   *
   * @param {Array} batches all batch array
   * @param {string} transactionId corresponding transaction id
   * @param {number} ratio product quantity ratio
   */
  const saveSourceBatches = async (batches, transactionId, ratio) => {
    await Promise.all(
      batches.map(async (batch) => {
        const sourceBatch = {
          batch_id: batch.id,
          transaction_id: transactionId,
          quantity: parseFloat(batch.current_quantity) * parseFloat(ratio),
        };
        await saveSourceBatch(sourceBatch);
        await findAndUpdateBatchQuantity(batch.id, { current_quantity: 0 });
      }),
    );
  };

  /**
   * transaction validate function
   *
   * @param {object} position device's geo location coordinates
   * @param {object} card     deleted card
   */
  const transactionValidate = async (position, card) => {
    let valid = true;

    await Promise.all(
      products.map(async (product) => {
        const quantity = product.edited_quantity;
        const price =
          parseFloat(product.total_amount) * parseFloat(product.ratio);
        const total = await getTotalAmount(product);
        const productPrice =
          parseFloat(product.total_amount) * parseFloat(product.ratio);

        if (
          quantity === '' ||
          quantity <= consts.MINIMUM_TRANSACTION_QUANTITY ||
          quantity >= consts.MAXIMUM_TRANSACTION_QUANTITY ||
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
            product.total_premiums.map(async (premium) => {
              let amount = 0;
              if (
                premium.applicable_activity ===
                consts.PREMIUM_APPLICABLE_ACTIVITY_BUY
              ) {
                if (
                  product.edited_quantity < premium.total_premiumed_quantity
                ) {
                  amount +=
                    parseFloat(premium.amount) *
                    parseFloat(product.edited_quantity);
                } else {
                  amount +=
                    parseFloat(premium.amount) *
                    parseFloat(premium.total_premiumed_quantity);
                }
              } else {
                amount +=
                  parseFloat(premium.amount) *
                  parseFloat(product.edited_quantity);
              }

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
      completeTransaction(position, card);
    } else {
      setVerifyLoading(false);
    }
  };

  /**
   * submit function. saving transaction, premiums and batch in local db
   *
   * @param {object} position device's geo location coordinates
   * @param {object} card     selected card
   */
  const completeTransaction = async (position, card) => {
    const transactionArray = [];

    await Promise.all(
      products.map(async (product) => {
        const date = new Date();
        const quantity = product.edited_quantity;
        const price =
          parseFloat(product.total_amount) * parseFloat(product.ratio);
        const total = await getTotalAmount(product);
        const productPrice =
          parseFloat(product.total_amount) * parseFloat(product.ratio);

        const transactionObj = {
          server_id: null,
          node_id: buyer.id,
          node_name: buyer.name,
          currency,
          product_id: product.id,
          type: consts.APP_TRANS_TYPE_OUTGOING,
          quantity,
          ref_number: null,
          price,
          invoice_file: '',
          card_id: card[0].card_id,
          date: moment(Math.round(date)).format('DD MMM YYYY'),
          total,
          created_on: parseInt(Math.round(date) / 1000),
          product_price: productPrice,
          quality_correction: 100,
          product_name: product.name,
          verification_method: consts.VERIFICATION_METHOD_CARD,
          transaction_type:
            parseFloat(product.total_quantity) ===
            parseFloat(product.edited_quantity)
              ? 3
              : transactionType,
          verification_latitude: position.coords.latitude,
          verification_longitude: position.coords.longitude,
        };

        const transactionId = await saveTransaction(transactionObj);
        transactionObj.total_quantity = product.total_quantity;
        transactionObj.edited_quantity = product.edited_quantity;
        transactionArray.push(transactionObj);

        await saveAllPremiums(product, transactionId, transactionObj);
        await saveBasePricePayment(transactionId, transactionObj);
        await saveSourceBatches(product.batches, transactionId, product.ratio);
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

      navigation.navigate('SendTransactionCompleteScreen', {
        buyerName: buyer.name,
        quantity: totalEditedQuantity,
        transactionArray,
        checkTransactionStatus,
      });
    });
  };

  /**
   * saving corresponding transaction premium in local db
   *
   * @param {object} product        product object
   * @param {string} transactionId  transaction id
   * @param {object} transactionObj transaction object
   */
  const saveAllPremiums = async (product, transactionId, transactionObj) => {
    await Promise.all(
      product.total_premiums.map(async (premium) => {
        let total = 0;
        if (
          premium.applicable_activity === consts.PREMIUM_APPLICABLE_ACTIVITY_BUY
        ) {
          if (product.edited_quantity < premium.total_premiumed_quantity) {
            total +=
              parseFloat(premium.amount) * parseFloat(product.edited_quantity);
          } else {
            total +=
              parseFloat(premium.amount) *
              parseFloat(premium.total_premiumed_quantity);
          }
        } else {
          total +=
            parseFloat(premium.amount) * parseFloat(product.edited_quantity);
        }

        const transactionPremium = {
          premium_id: premium.id,
          transaction_id: transactionId,
          amount: parseFloat(total),
          server_id: '',
          category: consts.TYPE_TRANSACTION_PREMIUM,
          type: consts.PAYMENT_INCOMING,
          verification_method: transactionObj.verification_method,
          receipt: transactionObj.invoice_file,
          card_id: transactionObj.card_id,
          node_id: transactionObj.node_id,
          date: transactionObj.created_on,
          currency: transactionObj.currency,
          source: buyer.server_id,
          destination: loggedInUser.default_node,
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
   */
  const saveBasePricePayment = async (transactionId, transactionObj) => {
    const basePricePayment = {
      premium_id: '',
      transaction_id: transactionId,
      amount: transactionObj.price,
      server_id: '',
      category: consts.TYPE_BASE_PRICE,
      type: consts.PAYMENT_INCOMING,
      verification_method: transactionObj.verification_method,
      receipt: transactionObj.invoice_file,
      card_id: transactionObj.card_id,
      node_id: transactionObj.node_id,
      date: transactionObj.created_on,
      currency: transactionObj.currency,
      source: buyer.server_id,
      destination: loggedInUser.default_node,
      verification_longitude: transactionObj.verification_longitude,
      verification_latitude: transactionObj.verification_latitude,
    };
    await saveTransactionPremium(basePricePayment);
  };

  /**
   * redirecting to send take picture page
   */
  const goToTakePicture = async () => {
    if (nfcSupported) {
      NfcManager.unregisterTagEvent().catch(() => 0);
      cleanUp(false);
    }

    navigation.navigate('SendTakePicture', {
      products,
      transactionType,
      buyer,
      totalEditedQuantity,
    });
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
    } else if (key === 'card_not_found_for_buyer') {
      setAlertTitle(I18n.t('card_not_found_for_buyer'));
      setAlertMessage(I18n.t('card_not_issued_for_buyer'));
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
    } else if (key === 'card_not_found_for_buyer') {
      if (verificationMode === 'nfc' && nfcSupported) {
        readNfc();
      }
    } else if (key === 'nfc_unsupported') {
      setVerificationMode('qr_code');
    }

    setAlertModal(false);
    setVerifyLoading(false);
  };

  const styles = StyleSheetFactory(theme);

  return (
    <View style={styles.container}>
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
            actionType='send'
            verifyLoading={verifyLoading}
            error={error}
            onNoCardSubmit={requestCameraPermission}
            backNavigation={backNavigation}
            cardSection={
              <CardContainer
                products={products}
                currency={currency}
                totalPaidToFarmers={totalPaidToFarmers}
                getTotalPremiums={getTotalPremiums}
                getAllTotalAmount={getAllTotalAmount}
                theme={theme}
              />
            }
          />
        )}

        {verificationMode === 'qr_code' && !initialLoading && (
          <QrCodeMethod
            actionType='send'
            verifyLoading={verifyLoading}
            error={error}
            onNoCardSubmit={requestCameraPermission}
            backNavigation={backNavigation}
            createAlert={createAlert}
            onGetScanId={checkCardId}
            qrTutorial={qrTutorial}
            cardSection={
              <CardContainer
                products={products}
                currency={currency}
                totalPaidToFarmers={totalPaidToFarmers}
                getTotalPremiums={getTotalPremiums}
                getAllTotalAmount={getAllTotalAmount}
                theme={theme}
              />
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

const CardContainer = ({ ...props }) => {
  const {
    products,
    currency,
    totalPaidToFarmers,
    getTotalPremiums,
    getAllTotalAmount,
    theme,
  } = props;

  const styles = StyleSheetFactory(theme);

  return (
    <View style={styles.cardContainer}>
      <View style={{ marginVertical: 5, paddingVertical: 0 }}>
        <Text style={styles.transactionSummaryText}>
          {I18n.t('transaction_summary')}
        </Text>
      </View>

      {products.map((item, index) => (
        <View
          key={index.toString()}
          style={[styles.cardItem, { marginTop: 0 }]}
        >
          <Text
            style={[
              styles.cardLeftItem,
              { color: theme.background_1, width: '70%' },
            ]}
          >
            {`${item.name}:`}
          </Text>
          <View style={{ flexDirection: 'row' }}>
            <Text
              style={[styles.cardRightItem, { color: theme.background_1 }]}
            >
              {`${parseFloat(item.edited_quantity).toLocaleString('pt-BR')} Kg`}
            </Text>
          </View>
        </View>
      ))}

      <View style={{ marginVertical: 0, paddingVertical: 0 }}>
        <Text style={styles.transactionSummaryText}>
          {I18n.t('price_details')}
        </Text>
      </View>

      <View style={[styles.cardItem, { marginTop: 5 }]}>
        <Text
          style={[
            styles.cardLeftItem,
            { color: theme.background_1, width: '70%' },
          ]}
        >
          {`${I18n.t('total_paid_to_farmers')}:`}
        </Text>
        <View style={{ flexDirection: 'row' }}>
          <Text style={[styles.cardRightItem, { color: theme.background_1 }]}>
            {`${totalPaidToFarmers().toLocaleString('pt-BR')} ${currency}`}
          </Text>
        </View>
      </View>

      {getTotalPremiums().map((premium, index) => (
        <View
          key={index.toString()}
          style={[styles.cardItem, { marginTop: 0 }]}
        >
          <Text style={[styles.cardLeftItem, { color: theme.background_1 }]}>
            {`${premium.name} ${I18n.t('paid')}:`}
          </Text>
          <Text
            style={[
              styles.cardRightItem,
              {
                fontWeight: '600',
                color: theme.background_1,
              },
            ]}
          >
            {`${Math.round(parseFloat(premium.total)).toLocaleString(
              'pt-BR',
            )} ${currency}`}
          </Text>
        </View>
      ))}

      <View style={styles.dottedLine} />

      <View style={[styles.cardItem, { marginVertical: 5 }]}>
        <Text
          style={[
            styles.cardLeftItem,
            {
              opacity: 1,
              textTransform: 'capitalize',
              color: theme.background_1,
              paddingTop: 5,
            },
          ]}
        >
          {`${I18n.t('total_price')}:`}
        </Text>
        <Text
          style={[
            styles.cardRightItem,
            {
              fontWeight: '700',
              fontSize: 20,
              color: theme.background_1,
            },
          ]}
        >
          {`${getAllTotalAmount().toLocaleString('pt-BR')} ${currency}`}
        </Text>
      </View>
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
    formTitleContainer: {
      margin: 30,
      marginBottom: 15,
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
    cardContainer: {
      width: '95%',
      alignSelf: 'center',
      marginVertical: 30,
      paddingHorizontal: 10,
      backgroundColor: theme.placeholder,
      borderRadius: theme.border_radius,
    },
    cardItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignContent: 'space-between',
      marginVertical: 8,
      marginHorizontal: 10,
    },
    cardLeftItem: {
      fontFamily: theme.font_regular,
      fontWeight: '400',
      fontStyle: 'normal',
      fontSize: 12,
      color: theme.background_1,
      opacity: 0.7,
      letterSpacing: 0.1,
    },
    cardRightItem: {
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 12,
      color: theme.background_1,
    },
    dottedLine: {
      borderStyle: 'dotted',
      borderWidth: 1,
      borderRadius: theme.border_radius,
      borderColor: theme.background_1,
      marginHorizontal: 0,
      marginTop: 5,
    },
    errorMessage: {
      fontSize: 14,
      fontFamily: theme.font_regular,
      lineHeight: 28,
      paddingBottom: 10,
      textAlign: 'center',
      color: theme.button_bg_1,
    },
    privacyInfoView: {
      backgroundColor: '#5691AE',
      flexDirection: 'row',
      width: '95%',
      padding: 10,
      alignSelf: 'center',
    },
    infoIconWrap: {
      alignItems: 'center',
      marginRight: 10,
    },
    privacyText: {
      fontFamily: 'Moderat-Medium',
      fontSize: 12,
      color: '#FFFFFF',
    },
    transactionSummaryText: {
      fontFamily: theme.font_regular,
      color: theme.background_1,
      fontStyle: 'normal',
      opacity: 1,
      fontWeight: '500',
      letterSpacing: 0.1,
      fontSize: 16,
      textTransform: 'none',
      marginVertical: 5,
      marginBottom: 0,
      marginLeft: 10,
    },
  });
};

export default SendVerificationScreen;

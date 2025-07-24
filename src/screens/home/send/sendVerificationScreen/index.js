import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  BackHandler,
  ActivityIndicator,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector, useDispatch } from 'react-redux';
import NfcManager, { NfcEvents } from 'react-native-nfc-manager';
import moment from 'moment';
import Geolocation from 'react-native-geolocation-service';
import Toast from 'react-native-toast-message';
import Tts from 'react-native-tts';
import {
  createTransaction,
  updateTransactionCurrentQuantity,
} from '../../../../db/services/TransactionsHelper';
import { createTransactionPremium } from '../../../../db/services/TransactionPremiumHelper';
import {
  NumberFormatter,
  createReferenceId,
  createSpeech,
  getAlertConfig,
  getBuyerCard,
  getCurrency,
  handleErrors,
  requestPermission,
} from '../../../../utils/commonFunctions';
import { jsonToString } from '../../../../utils/helperFunctions';
import { AudioIcon } from '../../../../assets/svg';
import { updateNfcSupported } from '../../../../redux/CommonStore';
import { logAnalytics } from '../../../../utils/serviceHelper';
import {
  PREMIUM_APPLICABLE_ACTIVITY_BUY,
  MINIMUM_TRANSACTION_QUANTITY,
  MAXIMUM_TRANSACTION_QUANTITY,
  APP_TRANS_TYPE_OUTGOING,
  VERIFICATION_METHOD_CARD,
  TYPE_TRANSACTION_PREMIUM,
  PAYMENT_INCOMING,
  TYPE_BASE_PRICE,
  PREMIUM_MANUAL,
  PREMIUM_OPTIONS,
} from '../../../../utils/constants';
import { initiateSync } from '../../../../sync/SyncInitials';
import CustomLeftHeader from '../../../../components/headers/customLeftHeader';
import I18n from '../../../../translations/text/i18n';
import CommonAlert from '../../../../components/modals/commonAlert';
import NfcMethod from '../../../../components/cardMethods/nfcMethod';
import QrCodeMethod from '../../../../components/cardMethods/qrCodeMethod';
import VerificationSwitch from '../../../../components/verificationSwitch';
import StyleSheetFactory from './styles';
import { getAllTotalAmount } from './controller';
import Speech from '../../../../translations/textToSpeech/speech';
import ProfileCard from '../../../../components/cards/profileCard';

const defaultLocation = { coords: { longitude: 0, latitude: 0 } };

const SendVerificationScreen = ({ navigation, route }) => {
  const styles = StyleSheetFactory();
  const { isConnected } = useSelector((state) => state.connection);
  const { products, buyer, transactionType, totalEditedQuantity, preLocation } =
    route.params;
  const { theme, speechEnabled } = useSelector((state) => state.common);
  const { syncInProgress, loggedInUser } = useSelector((state) => state.login);
  const { nfcSupported } = useSelector((state) => state.common);
  const [cardId, setCardId] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [verificationMode, setVerificationMode] = useState('nfc');
  const [qrTutorial, setQrTutorial] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
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

    if (speechEnabled) {
      const currencyName = getCurrency('name');
      const totalPrice = await getAllTotalAmount2();
      await createSpeech(Speech.t('verify_transaction'), [
        `${parseFloat(totalPrice).toFixed(2)}`,
        currencyName,
      ]);
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
    try {
      const isSupported = await NfcManager.isSupported();
      if (isSupported) {
        setVerificationMode('nfc');
        dispatch(updateNfcSupported(true));
        checkNfcEnabled();
      } else {
        createAlert('nfc_unsupported');
        dispatch(updateNfcSupported(false));
      }
    } catch (err) {
      handleErrors(err, {
        ref: 'sendVerification_initNfc',
      });
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
    const foundBuyerCard = await getBuyerCard(id, 'card_id');

    if (foundBuyerCard) {
      setCardId(foundBuyerCard.id);
      createAlert('verify_card_transaction');
    } else {
      createAlert('card_not_found_for_buyer');
    }
  };

  const checkDisplayId = async (id) => {
    setVerifyLoading(true);
    const foundBuyerCard = await getBuyerCard(id, 'display_id');

    if (foundBuyerCard) {
      setCardId(foundBuyerCard.id);
      createAlert('verify_card_transaction');
    } else {
      createAlert('card_not_found_for_buyer');
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
        ref: 'sendVerificationScreen_requestAccessLocationPermission',
      });
      transactionValidate(defaultLocation);
    }
  };

  /**
   * get total amount including premiums of all product
   * @returns {number} total amount
   */
  const getAllTotalAmount2 = async () => {
    let totalAmount = 0;

    products.forEach(
      ({ edited_quantity, ratio, total_amount, total_premiums }) => {
        const editedQuantity =
          edited_quantity !== '' ? parseFloat(edited_quantity) : 0;
        const productRatio = ratio !== '' ? parseFloat(ratio) : 1;

        totalAmount += parseFloat(total_amount) * productRatio;

        total_premiums.forEach((premium) => {
          const {
            amount,
            applicable_activity,
            calculation_type,
            total_premium_quantity,
            total,
          } = premium;

          if (applicable_activity === PREMIUM_APPLICABLE_ACTIVITY_BUY) {
            if (editedQuantity < total_premium_quantity) {
              if (
                calculation_type === PREMIUM_MANUAL ||
                calculation_type === PREMIUM_OPTIONS
              ) {
                totalAmount += productRatio * total;
              } else {
                totalAmount += amount * editedQuantity;
              }
            } else if (
              calculation_type === PREMIUM_MANUAL ||
              calculation_type === PREMIUM_OPTIONS
            ) {
              totalAmount += total;
            } else {
              totalAmount += amount * total_premium_quantity;
            }
          } else {
            totalAmount += amount * editedQuantity;
          }
        });
      },
    );

    return totalAmount;
  };

  /**
   * get total amount including premiums by product
   * @param   {Array} product product array
   * @returns {number}        total
   */
  const getTotalAmount = async (product) => {
    const { total_premiums, total_amount, ratio, edited_quantity } = product;
    const editedQuantity =
      edited_quantity !== '' ? parseFloat(edited_quantity) : 0;
    const productRatio = ratio !== '' ? parseFloat(ratio) : 1;

    let totalAmount = parseFloat(total_amount) * productRatio;

    total_premiums.forEach(
      ({
        applicable_activity,
        total_premium_quantity,
        calculation_type,
        total,
        amount,
      }) => {
        if (applicable_activity === PREMIUM_APPLICABLE_ACTIVITY_BUY) {
          if (editedQuantity < total_premium_quantity) {
            totalAmount +=
              calculation_type === PREMIUM_MANUAL ||
              calculation_type === PREMIUM_OPTIONS
                ? total * productRatio
                : amount * editedQuantity;
          } else {
            totalAmount +=
              calculation_type === PREMIUM_MANUAL ||
              calculation_type === PREMIUM_OPTIONS
                ? total
                : amount * total_premium_quantity;
          }
        } else {
          totalAmount += amount * editedQuantity;
        }
      },
    );

    return totalAmount;
  };

  /**
   * calculate total amount paid to farmer by all products
   * @returns {number} total amount
   */
  const totalPaidToFarmers = () => {
    let total = 0;
    products.map((product) => {
      total += parseFloat(product.total_amount) * parseFloat(product.ratio);
    });

    return total;
  };

  /**
   * requesting camera access permission
   */
  const requestCameraPermission = async () => {
    const cameraGranted = await requestPermission('camera');

    if (!cameraGranted) {
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
   * @returns {Array} premium data array
   */
  const getTotalPremiums = () => {
    if (products.length > 0) {
      const mainObj = {};
      products.map(({ total_premiums, edited_quantity, ratio }) => {
        const editedQuantity =
          edited_quantity !== '' ? parseFloat(edited_quantity) : 0;
        const productRatio = ratio !== '' ? parseFloat(ratio) : 1;

        total_premiums.map(
          ({
            id,
            name,
            amount,
            applicable_activity,
            total_premium_quantity,
            calculation_type,
            total,
          }) => {
            let totalAmount = 0;

            if (mainObj[id]) {
              const existedObj = mainObj[id];
              totalAmount = existedObj.total;
            }

            if (applicable_activity === PREMIUM_APPLICABLE_ACTIVITY_BUY) {
              if (editedQuantity < total_premium_quantity) {
                if (
                  calculation_type === PREMIUM_MANUAL ||
                  calculation_type === PREMIUM_OPTIONS
                ) {
                  totalAmount += total * productRatio;
                } else {
                  totalAmount += amount * editedQuantity;
                }
              } else if (
                calculation_type === PREMIUM_MANUAL ||
                calculation_type === PREMIUM_OPTIONS
              ) {
                totalAmount += total;
              } else {
                totalAmount += amount * total_premium_quantity;
              }
            } else {
              totalAmount += amount * editedQuantity;
            }

            const obj = {
              name,
              total: totalAmount,
            };
            mainObj[id] = obj;
          },
        );
      });
      return Object.values(mainObj);
    }
    return [];
  };

  /**
   * saving source batches in local db
   * @param {Array} parents all parent transactions
   */
  const updateParentTransactions = async (parents) => {
    await Promise.all(
      parents.map(async (parent) => {
        await updateTransactionCurrentQuantity(parent, {
          current_quantity_corrected: 0,
        });
      }),
    );
  };

  /**
   * transaction validate function
   * @param {object} position geo location coordinates
   */
  const transactionValidate = async (position) => {
    let valid = true;

    await Promise.all(
      products.map(async (product) => {
        const {
          edited_quantity,
          ratio,
          total_amount,
          name,
          total_premiums,
          parents,
        } = product;
        const editedQuantity =
          edited_quantity !== '' ? parseFloat(edited_quantity) : 0;
        const productRatio = ratio !== '' ? parseFloat(ratio) : 1;
        const price = parseFloat(total_amount) * productRatio;
        const totalAmount = await getTotalAmount(product);

        if (
          edited_quantity === '' ||
          edited_quantity <= MINIMUM_TRANSACTION_QUANTITY ||
          edited_quantity >= MAXIMUM_TRANSACTION_QUANTITY ||
          price === '' ||
          price <= 0 ||
          totalAmount === '' ||
          totalAmount <= 0 ||
          parents.length === 0
        ) {
          valid = false;
          setError(`${I18n.t('check_the_values_entered')} ${name}`);
        } else {
          await Promise.all(
            total_premiums.map(
              async ({
                applicable_activity,
                total_premium_quantity,
                calculation_type,
                total,
                amount,
              }) => {
                let premiumAmount = 0;
                if (applicable_activity === PREMIUM_APPLICABLE_ACTIVITY_BUY) {
                  if (editedQuantity < total_premium_quantity) {
                    premiumAmount +=
                      calculation_type === PREMIUM_MANUAL ||
                      calculation_type === PREMIUM_OPTIONS
                        ? total * productRatio
                        : amount * editedQuantity;
                  } else {
                    premiumAmount +=
                      calculation_type === PREMIUM_MANUAL ||
                      calculation_type === PREMIUM_OPTIONS
                        ? total
                        : amount * total_premium_quantity;
                  }
                } else {
                  premiumAmount += amount * editedQuantity;
                }

                if (premiumAmount <= 0) {
                  valid = false;
                  setError(`${I18n.t('check_the_values_entered')} ${name}`);
                }
              },
            ),
          );
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
   * submit function. saving transaction, premiums and batch in local db
   * @param {object} position geo location coordinates
   */
  const completeTransaction = async (position) => {
    const transactionArray = [];
    const referenceId = createReferenceId();
    const currency = getCurrency('code');

    await Promise.all(
      products.map(async (product) => {
        const date = new Date();
        const quantity = product.edited_quantity;
        const price =
          parseFloat(product.total_amount) * parseFloat(product.ratio);
        const total = await getTotalAmount(product);
        const productPrice =
          parseFloat(product.total_amount) * parseFloat(product.ratio);

        let extraFields = product.extra_fields || '';
        if (extraFields && typeof extraFields === 'object') {
          extraFields = jsonToString(extraFields);
        }

        const transactionObj = {
          server_id: null,
          node_id: buyer.id,
          node_name: buyer.name,
          currency,
          product_id: product.id,
          type: APP_TRANS_TYPE_OUTGOING,
          quantity_corrected: quantity,
          price_corrected: price,
          invoice_file: '',
          card_id: cardId,
          date: moment(Math.round(date)).format('DD MMM YYYY'),
          total_corrected: total,
          created_on: parseInt(Math.round(date) / 1000),
          product_price_corrected: productPrice,
          quality_correction: 100,
          product_name: product.name,
          verification_method: VERIFICATION_METHOD_CARD,
          transaction_type:
            parseFloat(product.total_quantity) ===
            parseFloat(product.edited_quantity)
              ? 3
              : transactionType,
          verification_latitude_corrected: position.coords.latitude,
          verification_longitude_corrected: position.coords.longitude,
          extra_fields: extraFields,
          reference_id: referenceId,
          source: loggedInUser.entity_id,
          destination: buyer.id,
          current_quantity_corrected: quantity,
          parents: product.parents,
        };

        const transactionId = await createTransaction(transactionObj);
        transactionObj.total_quantity = product.total_quantity;
        transactionObj.edited_quantity = product.edited_quantity;
        transactionObj.premium_total = parseFloat(total) - parseFloat(price);
        transactionArray.push(transactionObj);

        await saveAllPremiums(product, transactionId, transactionObj);
        await saveBasePricePayment(transactionId, transactionObj);
        await updateParentTransactions(product.parents);
      }),
    ).then(async () => {
      logAnalytics('transactions', {
        verification_type:
          verificationMode === 'nfc'
            ? 'nfc_verification'
            : 'qr_code_verification',
        transaction_type: 'send_transaction',
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
   * @param {object} product        product object
   * @param {string} transactionId  transaction id
   * @param {object} transactionObj transaction object
   */
  const saveAllPremiums = async (product, transactionId, transactionObj) => {
    const { total_premiums, edited_quantity, ratio } = product;
    const editedQuantity =
      edited_quantity !== '' ? parseFloat(edited_quantity) : 0;
    const productRatio = ratio !== '' ? parseFloat(ratio) : 1;

    await Promise.all(
      total_premiums.map(
        async ({
          id,
          applicable_activity,
          total_premium_quantity,
          calculation_type,
          total,
          amount,
        }) => {
          let premiumTotal = 0;
          if (applicable_activity === PREMIUM_APPLICABLE_ACTIVITY_BUY) {
            if (editedQuantity < total_premium_quantity) {
              premiumTotal +=
                calculation_type === PREMIUM_MANUAL ||
                calculation_type === PREMIUM_OPTIONS
                  ? total * productRatio
                  : amount * editedQuantity;
            } else {
              premiumTotal +=
                calculation_type === PREMIUM_MANUAL ||
                calculation_type === PREMIUM_OPTIONS
                  ? total
                  : amount * parseFloat(total_premium_quantity);
            }
          } else {
            premiumTotal += amount * editedQuantity;
          }

          const transactionPremium = {
            premium_id: id,
            transaction_id: transactionId,
            amount_corrected: premiumTotal,
            server_id: '',
            category: TYPE_TRANSACTION_PREMIUM,
            type: PAYMENT_INCOMING,
            verification_method: transactionObj.verification_method,
            receipt: transactionObj.invoice_file,
            card_id: transactionObj.card_id,
            node_id: transactionObj.node_id,
            date: transactionObj.created_on,
            currency: transactionObj.currency,
            source: buyer.id,
            destination: loggedInUser.entity_id,
            verification_longitude_corrected:
              transactionObj.verification_longitude_corrected,
            verification_latitude_corrected:
              transactionObj.verification_latitude_corrected,
            reference_id: transactionObj.reference_id,
          };

          await createTransactionPremium(transactionPremium);
        },
      ),
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
      type: PAYMENT_INCOMING,
      verification_method: transactionObj.verification_method,
      receipt: transactionObj.invoice_file,
      card_id: transactionObj.card_id,
      node_id: transactionObj.node_id,
      date: transactionObj.created_on,
      currency: transactionObj.currency,
      source: buyer.id,
      destination: loggedInUser.entity_id,
      verification_longitude_corrected:
        transactionObj.verification_longitude_corrected,
      verification_latitude_corrected:
        transactionObj.verification_latitude_corrected,
      reference_id: transactionObj.reference_id,
    };

    await createTransactionPremium(basePricePayment);
  };

  /**
   * redirecting to send take picture page
   */
  const goToTakePicture = async () => {
    if (nfcSupported) {
      NfcManager.unregisterTagEvent().catch(() => 0);
      cleanUp(false);
    }

    const totalPrice = await getAllTotalAmount2();

    navigation.navigate('SendTakePicture', {
      products,
      transactionType,
      buyer,
      totalEditedQuantity,
      totalPrice,
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
    setAlertModal(false);
    setVerifyLoading(false);
    setAlert(null);

    switch (key) {
      case 'nfc_no_turned_on':
        NfcManager.goToNfcSetting();
        break;
      case 'card_not_found_for_buyer':
        setCardId(null);
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
    setVerifyLoading(false);
    setAlertModal(false);
    setAlert(null);
    setCardId(null);

    if (
      key === 'verify_card_transaction' &&
      verificationMode === 'nfc' &&
      nfcSupported
    ) {
      readNfc();
    }
  };

  return (
    <View style={styles.container}>
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
            actionType="send"
            verifyLoading={verifyLoading}
            error={error}
            onNoCardSubmit={requestCameraPermission}
            backNavigation={handleBackButtonClick}
            cardSection={
              <CardContainer
                products={products}
                totalPaidToFarmers={totalPaidToFarmers}
                getTotalPremiums={getTotalPremiums}
                theme={theme}
                styles={styles}
                speechEnabled={speechEnabled}
              />
            }
          />
        )}

        {verificationMode === 'qr_code' && !initialLoading && (
          <QrCodeMethod
            actionType="send"
            verifyLoading={verifyLoading}
            error={error}
            disableQr={cardId || verifyLoading}
            onNoCardSubmit={requestCameraPermission}
            backNavigation={handleBackButtonClick}
            createAlert={createAlert}
            onGetScanId={checkDisplayId}
            qrTutorial={qrTutorial}
            cardSection={
              <CardContainer
                products={products}
                totalPaidToFarmers={totalPaidToFarmers}
                getTotalPremiums={getTotalPremiums}
                theme={theme}
                styles={styles}
                speechEnabled={speechEnabled}
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
                <ProfileCard user={buyer} type="buyer" />
              ) : null
            }
          />
        )}
      </ScrollView>
    </View>
  );
};

const CardContainer = ({ ...props }) => {
  const {
    products,
    totalPaidToFarmers,
    getTotalPremiums,
    theme,
    styles,
    speechEnabled,
  } = props;

  const announceTotal = async () => {
    const currencyName = getCurrency('name');
    const total = getAllTotalAmount(products);
    await createSpeech(Speech.t('verify_transaction'), [
      `${parseFloat(total).toFixed(2)}`,
      currencyName,
    ]);
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.titleWrap}>
        <Text style={styles.transactionSummaryText}>
          {I18n.t('transaction_summary')}
        </Text>
        {speechEnabled && (
          <TouchableOpacity onPress={announceTotal} style={styles.announceWrap}>
            <AudioIcon width={18} height={18} fill={theme.background_1} />
            <Text style={styles.announceText}>{I18n.t('announce')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {products.map((item, index) => (
        <View key={index.toString()} style={styles.cardItem}>
          <Text style={styles.cardLeftItem}>{`${item.name}:`}</Text>
          <Text style={styles.cardRightItem}>
            {NumberFormatter.quantity(item.edited_quantity, true)}
          </Text>
        </View>
      ))}

      <View>
        <Text style={styles.transactionSummaryText}>
          {I18n.t('price_details')}
        </Text>
      </View>

      <View style={styles.cardItem}>
        <Text style={styles.cardLeftItem}>
          {`${I18n.t('total_paid_to_farmers')}:`}
        </Text>
        <Text style={styles.cardRightItem}>
          {NumberFormatter.currency(totalPaidToFarmers(), true)}
        </Text>
      </View>

      {getTotalPremiums().length > 0 && (
        <Text style={styles.sectionHeading}>{I18n.t('premiums')}</Text>
      )}

      {getTotalPremiums().map((premium, index) => (
        <View key={index.toString()} style={styles.cardItem}>
          <Text style={styles.cardLeftItem}>{`${premium.name}:`}</Text>
          <Text style={styles.cardRightItem}>
            {NumberFormatter.currency(premium.total, true)}
          </Text>
        </View>
      ))}

      <View style={styles.dottedLine} />

      <View style={[styles.cardItem, { marginVertical: 10 }]}>
        <Text style={styles.totalTitle}>{`${I18n.t('total')}:`}</Text>
        <Text style={styles.totalValue}>
          {NumberFormatter.currency(getAllTotalAmount(products), true)}
        </Text>
      </View>
    </View>
  );
};

export default SendVerificationScreen;

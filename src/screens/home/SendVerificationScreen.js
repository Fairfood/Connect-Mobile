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
  ToastAndroid,
  Linking,
} from 'react-native';
import { useSelector } from 'react-redux';
import NfcManager, { NfcEvents } from 'react-native-nfc-manager';
import moment from 'moment';
import Geolocation from 'react-native-geolocation-service';
import { saveTransaction } from '../../services/transactionsHelper';
import { findAndupdateBatchQuantity } from '../../services/batchesHelper';
import { saveTransactionPremium } from '../../services/transactionPremiumHelper';
import { syncTransactions } from '../../services/syncTransactions';
import { saveSourceBatch } from '../../services/sourceBatchesHelper';
import { requestPermission } from '../../services/commonFunctions';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import TransparentButton from '../../components/TransparentButton';
import I18n from '../../i18n/i18n';
import Icon from '../../icons';
import CommonAlert from '../../components/CommonAlert';
import * as consts from '../../services/constants';
import { NfcNotSupportIcon, TurnOnNfcIcon } from '../../assets/svg';

const { height, width } = Dimensions.get('window');
const defaultPosition = { coords: { longitude: 0, latitude: 0 } };

const SendVerificationScreen = ({ navigation, route }) => {
  const { isConnected } = useSelector((state) => state.connection);
  const { products, buyer, transactionType, totalEditedQuantity, preLocation } =
    route.params;
  const { userProjectDetails, syncInProgress } = useSelector(
    (state) => state.login,
  );
  const { currency } = userProjectDetails;
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertKey, setAlertKey] = useState('');
  const [alertMessage, setAllertMessage] = useState(
    I18n.t('something_went_wrong'),
  );
  const [alertTitle, setAlertTitle] = useState('Alert');
  const [alertSubmitText, setAlertSubmitText] = useState('Ok');
  const [alertIcon, setAlertIcon] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    initNfc();
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackButtonClick);
    return () => {
      subscription.remove();
    };
  }, []);

  /**
   * clearing NFC event
   */
  function handleBackButtonClick() {
    NfcManager.unregisterTagEvent().catch(() => 0);
    cleanUp();
    navigation.goBack(null);
  }

  const backNavigation = () => {
    NfcManager.unregisterTagEvent().catch(() => 0);
    cleanUp(false);
    setVerifyLoading(false);
    navigation.goBack(null);
  };

  const initNfc = async () => {
    NfcManager.isSupported().then(async (supported) => {
      if (supported) {
        const isEnabled = await NfcManager.isEnabled();
        if (isEnabled) {
          await NfcManager.start();
          readNdef();
        } else {
          createAlert('nfc_no_turned_on');
        }
      } else {
        createAlert('nfc_unsupported');
      }
    });
  };

  const turnOnNFC = async () => {
    NfcManager.goToNfcSetting();
  };

  const cleanUp = (tryagain) => {
    NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
    NfcManager.setEventListener(NfcEvents.SessionClosed, null);
    if (tryagain) {
      initNfc();
    }
  };

  const requestAccessLocationPermission = async () => {
    if (preLocation) {
      transactionValidate(preLocation);
    } else {
      const locationGranted = await requestPermission('location');

      if (locationGranted) {
        Geolocation.getCurrentPosition(
          (position) => {
            transactionValidate(position);
            return position.coords;
          },
          () => {
            transactionValidate(defaultPosition);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 },
        );
      } else {
        transactionValidate(defaultPosition);
      }
    }
  };

  const readNdef = () => {
    return new Promise((resolve) => {
      let tagFound = null;

      NfcManager.setEventListener(NfcEvents.DiscoverTag, async (tag) => {
        setVerifyLoading(true);
        tagFound = tag;
        // resolve(tagFound);

        const { cards } = buyer;
        const filteredCards = cards.filter((card) => {
          return card.card_id === tagFound.id;
        });
        if (filteredCards.length === 0) {
          createAlert('card_not_found_for_buyer');
          incompleteTransaction();
        } else {
          requestAccessLocationPermission();
        }
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

  const incompleteTransaction = () => {
    initNfc();
  };

  // get total amount including premiums of all product
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

  // get total amount including premiums by product
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

  const totalPaidTofarmers = () => {
    let total = 0;
    products.map((product) => {
      total += parseFloat(product.total_amount) * parseFloat(product.ratio);
    });

    return Math.round(parseFloat(total));
  };

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

  const saveAllPremiums = async (product, transactionId) => {
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
        await saveTransactionPremium(premium.id, transactionId, total);
      }),
    );
  };

  const saveSourceBatches = async (batches, transactionId, ratio) => {
    await Promise.all(
      batches.map(async (batch) => {
        const sourceBatch = {
          batch_id: batch.id,
          transaction_id: transactionId,
          quantity: parseFloat(batch.current_quantity) * parseFloat(ratio),
        };
        await saveSourceBatch(sourceBatch);
        await findAndupdateBatchQuantity(batch.id, { current_quantity: 0 });
      }),
    );
  };

  const transactionValidate = async (position) => {
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
      completeTransaction(position);
    } else {
      setVerifyLoading(false);
    }
  };

  const completeTransaction = async (position) => {
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
          invoice: null,
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

        await saveAllPremiums(product, transactionId);
        await saveSourceBatches(product.batches, transactionId, product.ratio);
      }),
    ).then(async () => {
      let checkTransactionStatus = false;

      if (isConnected && !syncInProgress) {
        checkTransactionStatus = true;
        await syncTransactions();
      }

      setVerifyLoading(false);

      NfcManager.unregisterTagEvent().catch(() => 0);
      cleanUp(false);

      navigation.navigate('SendTransactionCompleteScreen', {
        buyerName: buyer.name,
        quantity: totalEditedQuantity,
        transactionArray,
        checkTransactionStatus,
      });
    });
  };

  const requestCameraPermission = async () => {
    const cameraGranted = await requestPermission('camera');
    const microphoneGranted = await requestPermission('microphone');

    if (!cameraGranted || !microphoneGranted) {
      ToastAndroid.show(I18n.t('allow_camera_permission'), ToastAndroid.SHORT);
      Linking.openSettings();
    } else {
      goToTakePicture();
    }
  };

  const goToTakePicture = async () => {
    NfcManager.unregisterTagEvent().catch(() => 0);
    cleanUp(false);

    setVerifyLoading(false);

    navigation.navigate('SendTakePicture', {
      products,
      transactionType,
      buyer,
      totalEditedQuantity,
    });
  };

  const createAlert = (key) => {
    setAlertKey(key);
    setVerifyLoading(false);

    if (key === 'nfc_no_turned_on') {
      setAlertTitle(I18n.t('nfc_no_turned_on'));
      setAllertMessage(I18n.t('turn_on_nfc_continue'));
      setAlertSubmitText(I18n.t('turn_on'));
      setAlertIcon(
        <TurnOnNfcIcon width={width * 0.27} height={width * 0.27} />,
      );
    } else if (key === 'nfc_unsupported') {
      setAlertTitle(I18n.t('nfc_unsupported'));
      setAllertMessage(I18n.t('nfc_not_support_device'));
      setAlertSubmitText(I18n.t('ok'));
      setAlertIcon(
        <NfcNotSupportIcon width={width * 0.27} height={width * 0.27} />,
      );
    } else if (key === 'card_not_found_for_buyer') {
      setAlertTitle(I18n.t('card_not_found_for_buyer'));
      setAllertMessage(I18n.t('card_not_issued_for_buyer'));
      setAlertSubmitText(I18n.t('ok'));
      setAlertIcon(
        <Image
          source={require('../../assets/images/card-not-found.png')}
          resizeMode='contain'
          style={{ width: width * 0.3, height: width * 0.3 }}
        />,
      );
    }
    setAlertModal(true);
  };

  const onPressAlert = (key) => {
    if (key === 'nfc_no_turned_on') {
      turnOnNFC();
    } else if (key === 'card_not_found_for_buyer') {
      readNdef();
    }

    setAlertModal(false);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.containerSub}>
        <CustomLeftHeader
          title={I18n.t('premium_verification')}
          leftIcon='Close'
          onPress={() => backNavigation()}
        />
        <View style={styles.privacyInfoView}>
          <View style={styles.infoIconWrap}>
            <Icon name='info' color='#FFFFFF' size={14} />
          </View>
          <View style={{ width: '95%' }}>
            <Text style={styles.privacyText}>{I18n.t('privacy_policy')}</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardReaderImageContainer}>
        <Image
          source={require('../../assets/images/scanning.gif')}
          resizeMode='contain'
          style={{ width, height: width }}
        />
      </View>

      <View style={{ marginTop: height * -0.12 }}>
        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
          {verifyLoading ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator color={consts.TEXT_PRIMARY_COLOR} />
              <Text style={[styles.scanning, { marginLeft: 10 }]}>
                {I18n.t('reading_farmer_card')}
              </Text>
            </View>
          ) : (
            <Text style={styles.scanning}>
              {I18n.t('scanning_farmer_card')}
            </Text>
          )}
        </View>
        <View style={styles.formTitleContainer}>
          <Text style={styles.formTitle}>
            {I18n.t('tap_nfc_card_to_verify_transaction')}
          </Text>
        </View>
        <View style={styles.noCardButton}>
          <TransparentButton
            buttonText={`${I18n.t('no_card')}?`}
            onPress={() => requestCameraPermission()}
            padding={7}
            color='#4DCAF4'
          />
        </View>

        {error !== '' && <Text style={styles.errorMessage}>{error}</Text>}

        <View style={[styles.cardContainer]}>
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
                  { color: consts.APP_BG_COLOR, width: '70%' },
                ]}
              >
                {`${item.name}:`}
              </Text>
              <View style={{ flexDirection: 'row' }}>
                <Text
                  style={[styles.cardRightItem, { color: consts.APP_BG_COLOR }]}
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
                { color: consts.APP_BG_COLOR, width: '70%' },
              ]}
            >
              {`${I18n.t('total_paid_to_farmers')}:`}
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <Text
                style={[styles.cardRightItem, { color: consts.APP_BG_COLOR }]}
              >
                {`${totalPaidTofarmers().toLocaleString('pt-BR')} ${currency}`}
              </Text>
            </View>
          </View>

          {getTotalPremiums().map((premium, index) => (
            <View
              key={index.toString()}
              style={[styles.cardItem, { marginTop: 0 }]}
            >
              <Text
                style={[styles.cardLeftItem, { color: consts.APP_BG_COLOR }]}
              >
                {`${premium.name} ${I18n.t('paid')}:`}
              </Text>
              <Text
                style={[
                  styles.cardRightItem,
                  {
                    fontWeight: '600',
                    color: consts.APP_BG_COLOR,
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
                  color: consts.APP_BG_COLOR,
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
                  color: consts.APP_BG_COLOR,
                },
              ]}
            >
              {`${getAllTotalAmount().toLocaleString('pt-BR')} ${currency}`}
            </Text>
          </View>
        </View>
      </View>

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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D5ECFB',
    paddingHorizontal: width * 0.04,
  },
  containerSub: {
    backgroundColor: 'transparent',
    width: '100%',
  },
  formTitleContainer: {
    margin: 30,
    marginBottom: 15,
  },
  formTitle: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 16,
    textAlign: 'center',
  },
  cardReaderImageContainer: {
    // height: "30%",
    justifyContent: 'center',
    alignItems: 'center',
  },
  noCardButton: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  scanning: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: 'normal',
    fontFamily: consts.FONT_REGULAR,
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
    backgroundColor: consts.INPUT_PLACEHOLDER,
  },
  cardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    marginVertical: 8,
    marginHorizontal: 10,
  },
  cardLeftItem: {
    fontFamily: consts.FONT_REGULAR,
    fontWeight: '400',
    fontStyle: 'normal',
    fontSize: 12,
    color: consts.APP_BG_COLOR,
    opacity: 0.7,
    letterSpacing: 0.1,
  },
  cardRightItem: {
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 12,
    color: consts.APP_BG_COLOR,
  },
  dottedLine: {
    borderStyle: 'dotted',
    borderWidth: 1,
    borderRadius: consts.BORDER_RADIUS,
    borderColor: consts.APP_BG_COLOR,
    marginHorizontal: 0,
    marginTop: 5,
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: consts.FONT_REGULAR,
    lineHeight: 28,
    paddingBottom: 10,
    textAlign: 'center',
    color: consts.BUTTON_COLOR_PRIMARY,
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
    fontFamily: consts.FONT_REGULAR,
    color: consts.APP_BG_COLOR,
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

export default SendVerificationScreen;

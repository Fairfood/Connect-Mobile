import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Text,
  BackHandler,
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import Geolocation from 'react-native-geolocation-service';
import moment from 'moment';
import { InfoIcon, CloseIcon } from '../../../../assets/svg';
import {
  createReferenceId,
  getCurrency,
  handleErrors,
  requestPermission,
} from '../../../../utils/commonFunctions';
import { jsonToString } from '../../../../utils/helperFunctions';
import { logAnalytics } from '../../../../utils/serviceHelper';
import {
  createTransaction,
  updateTransactionCurrentQuantity,
} from '../../../../db/services/TransactionsHelper';
import { createTransactionPremium } from '../../../../db/services/TransactionPremiumHelper';
import {
  PREMIUM_APPLICABLE_ACTIVITY_BUY,
  MINIMUM_TRANSACTION_QUANTITY,
  MAXIMUM_TRANSACTION_QUANTITY,
  APP_TRANS_TYPE_OUTGOING,
  TYPE_TRANSACTION_PREMIUM,
  PAYMENT_INCOMING,
  TYPE_BASE_PRICE,
  PREMIUM_MANUAL,
  VERIFICATION_METHOD_MANUAL,
  HIT_SLOP_FIFTEEN,
  PREMIUM_OPTIONS,
} from '../../../../utils/constants';
import { initiateSync } from '../../../../sync/SyncInitials';
import CustomLeftHeader from '../../../../components/headers/customLeftHeader';
import CustomButton from '../../../../components/buttons/customButton';
import I18n from '../../../../translations/text/i18n';
import StyleSheetFactory from './styles';
import { getTotalAmount } from './controller';

const { height, width } = Dimensions.get('window');
const defaultPosition = { coords: { longitude: 0, latitude: 0 } };

const SendTakePicture = ({ navigation, route }) => {
  const cameraRef = useRef(null);
  const styles = StyleSheetFactory();

  const { products, transactionType, buyer, totalEditedQuantity } =
    route.params;
  const { theme } = useSelector((state) => state.common);
  const { isConnected } = useSelector((state) => state.connection);
  const { syncInProgress, loggedInUser } = useSelector((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [infoView, setInfoView] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleBackButtonClick();
        return true;
      },
    );

    return () => backHandler.remove();
  }, [isVerifying]);

  /**
   * handling back action
   */
  const handleBackButtonClick = () => {
    if (isVerifying) {
      Toast.show({
        type: 'warning',
        text1: I18n.t('cannot_go_back'),
        text2: I18n.t('procedure_in_progress'),
      });
    } else {
      setIsVerifying(false);
      navigation.goBack(null);
    }
  };

  /**
   * taking picture from device camera for receipt verification
   */
  const onTakePicture = async () => {
    try {
      setIsLoading(true);
      if (!cameraRef) {
        throw new Error('camera not found');
      }

      const options = { quality: 0.5, base64: false };
      const data = await cameraRef.current.takePictureAsync(options);
      setReceipt(data);
      setIsLoading(false);
    } catch (err) {
      setIsVerifying(false);
      setIsLoading(false);
      handleErrors(err);
      Toast.show({
        type: 'error',
        text1: I18n.t('something_went_wrong'),
        text2: String(error),
      });
      navigation.goBack(null);
    }
  };

  /**
   * fetching device geo location
   */
  const requestAccessLocationPermission = async () => {
    setIsVerifying(true);
    try {
      const locationGranted = await requestPermission('location');

      if (locationGranted) {
        Geolocation.getCurrentPosition(
          (position) => {
            transactionValidate(position);
          },
          () => {
            transactionValidate(defaultPosition);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 },
        );
      } else {
        transactionValidate(defaultPosition);
      }
    } catch (err) {
      handleErrors(err, {
        ref: 'sendTakePicture_requestAccessLocationPermission',
      });
      transactionValidate(defaultPosition);
      handleErrors(err);
      setIsVerifying(false);
      setInfoView(false);
    }
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
          total_premiums,
          name,
          parents,
        } = product;
        const editedQuantity =
          edited_quantity !== '' ? parseFloat(edited_quantity) : 0;
        const productRatio = ratio !== '' ? parseFloat(ratio) : 1;

        const price = parseFloat(total_amount) * productRatio;
        const allTotal = await getTotalAmount(product);

        if (
          editedQuantity === '' ||
          editedQuantity <= MINIMUM_TRANSACTION_QUANTITY ||
          editedQuantity >= MAXIMUM_TRANSACTION_QUANTITY ||
          price === '' ||
          price <= 0 ||
          allTotal === '' ||
          allTotal <= 0 ||
          parents.length === 0
        ) {
          valid = false;
          setError(`${I18n.t('check_the_values_entered')} ${name}`);
          setIsVerifying(false);
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
                let totalAmount = 0;
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
                        : amount * parseFloat(total_premium_quantity);
                  }
                } else {
                  totalAmount += amount * editedQuantity;
                }

                if (totalAmount <= 0) {
                  valid = false;
                  setError(`${I18n.t('check_the_values_entered')} ${name}`);
                  setIsVerifying(false);
                }
              },
            ),
          );
        }
      }),
    );

    if (valid) {
      setError('');
      onVerification(position);
    }
  };

  /**
   * submit function. save transaction, premium and batches in local db.
   * @param {object} position geo location coordinates
   */
  const onVerification = async (position) => {
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
          invoice: null,
          date: moment(Math.round(date)).format('DD MMM YYYY'),
          total_corrected: total,
          invoice_file: receipt.uri,
          card_id: '',
          created_on: parseInt(Math.round(date) / 1000),
          product_price_corrected: productPrice,
          quality_correction: 100,
          product_name: product.name,
          verification_method: VERIFICATION_METHOD_MANUAL,
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
        verification_type: 'manual_verification',
        transaction_type: 'send_transaction',
        network_status: isConnected && !syncInProgress ? 'online' : 'offline',
      });

      let checkTransactionStatus = false;

      if (isConnected && !syncInProgress) {
        checkTransactionStatus = true;
        await initiateSync();
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
   * saving all transaction premiums in local d
   * @param {object} product        product object
   * @param {string} transactionId  transaction id
   * @param {object} transactionObj transaction object
   */
  const saveAllPremiums = async (product, transactionId, transactionObj) => {
    const { edited_quantity, ratio } = product;
    const editedQuantity =
      edited_quantity !== '' ? parseFloat(edited_quantity) : 0;
    const productRatio = ratio !== '' ? parseFloat(ratio) : 1;

    await Promise.all(
      product.total_premiums.map(
        async ({
          applicable_activity,
          total_premium_quantity,
          calculation_type,
          total,
          amount,
          id,
        }) => {
          let totalAmount = 0;
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

          const transactionPremium = {
            premium_id: id,
            transaction_id: transactionId,
            amount_corrected: totalAmount,
            server_id: '',
            category: TYPE_TRANSACTION_PREMIUM,
            type: PAYMENT_INCOMING,
            verification_method: transactionObj.verification_method,
            receipt: transactionObj.invoice_file,
            card_id: transactionObj.card_id,
            node_id: transactionObj.node_id,
            date: transactionObj.created_on,
            currency: transactionObj.currency,
            source: buyer.server_id,
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
      source: buyer.server_id,
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
   * saving source batches in local db
   * @param {Array} parents all parent transaction
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

  return (
    <ScrollView
      contentContainerStyle={{
        flex: 1,
        backgroundColor: '#4F4F4F',
        paddingHorizontal: width * 0.03,
        justifyContent: 'space-between',
      }}
    >
      <View style={{ height: height * 0.1 }}>
        <CustomLeftHeader
          title={I18n.t('verify_with_photo')}
          onPress={handleBackButtonClick}
          backgroundColor="#4F4F4F"
          titleColor={theme.background_1}
          extraStyle={{ backgroundColor: '4F4F4F' }}
        />
      </View>

      <View style={styles.container}>
        {receipt == null && (
          <RNCamera
            ref={cameraRef}
            style={styles.preview}
            type={RNCamera.Constants.Type.back}
            flashMode={RNCamera.Constants.FlashMode.off}
          />
        )}

        {receipt != null && (
          <Image source={{ uri: receipt.uri }} style={styles.preview} />
        )}

        {receipt == null && (
          <View style={{ marginBottom: 20 }}>
            <View style={styles.detail}>
              <Text style={styles.textDetails}>
                {I18n.t('take_photo_of_receipt')}
              </Text>
            </View>
            <View style={styles.detail}>
              <TouchableOpacity
                onPress={onTakePicture}
                style={[
                  styles.addIcon,
                  { justifyContent: 'center', alignItems: 'center' },
                ]}
              >
                <View
                  style={[
                    styles.addIcon,
                    { backgroundColor: '#ffffff', width: 60, height: 60 },
                  ]}
                >
                  {isLoading && (
                    <ActivityIndicator size="large" color="#4F4F4F" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {receipt != null && (
          <>
            {!isVerifying ? (
              <>
                {error === '' && (
                  <View style={styles.detail}>
                    <Text style={styles.textDetails}>
                      {I18n.t('make_sure_the_image')}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setReceipt(null)}
                      disabled={isVerifying}
                    >
                      <Text
                        style={[
                          styles.textDetails,
                          {
                            textDecorationLine: 'underline',
                            color: '#4DCAF4',
                            marginVertical: 10,
                          },
                        ]}
                      >
                        {I18n.t('retake_photo')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {error && <Text style={styles.errorMessage}>{error}</Text>}
              </>
            ) : (
              <View style={[styles.detail, { marginTop: 3 }]}>
                {infoView ? (
                  <View style={styles.infoMsgContainer}>
                    <View style={{ width: '90%' }}>
                      <Text style={styles.infoHeader}>
                        {I18n.t('why_this_taking_long')}
                      </Text>
                      <Text style={styles.infoMessage}>
                        {I18n.t('transaction_may_take_some')}
                      </Text>
                    </View>
                    <View style={{ width: '10%', alignItems: 'center' }}>
                      <TouchableOpacity
                        onPress={() => setInfoView(!infoView)}
                        style={styles.infoCloseWrap}
                      >
                        <CloseIcon
                          width={width * 0.035}
                          height={width * 0.035}
                          fill="#ffffff"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setInfoView(!infoView)}
                    style={styles.infoIconWrap}
                    hitSlop={HIT_SLOP_FIFTEEN}
                  >
                    <InfoIcon
                      width={width * 0.05}
                      height={width * 0.05}
                      fill="#ffb74d"
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {isVerifying ? (
              <ActivityIndicator size="large" color={theme.button_bg_1} />
            ) : (
              <CustomButton
                buttonText={I18n.t('verify')}
                onPress={requestAccessLocationPermission}
                disabled={isVerifying}
              />
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
};

export default SendTakePicture;

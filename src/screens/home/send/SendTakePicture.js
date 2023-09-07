/* eslint-disable camelcase */
import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Text,
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import { useDispatch, useSelector } from 'react-redux';
import Geolocation from 'react-native-geolocation-service';
import moment from 'moment';
import { InfoIcon, CloseIcon } from '../../../assets/svg';
import {
  jsonToString,
  requestPermission,
} from '../../../services/commonFunctions';
import { initSyncProcess } from '../../../redux/LoginStore';
import { logAnalytics } from '../../../services/googleAnalyticsHelper';
import { createTransaction } from '../../../db/services/TransactionsHelper';
import { createTransactionPremium } from '../../../db/services/TransactionPremiumHelper';
import { findAndUpdateBatchQuantity } from '../../../db/services/BatchHelper';
import { syncTransactions } from '../../../sync/SyncTransactions';
import { createSourceBatch } from '../../../db/services/SourceBatchHelper';
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
} from '../../../services/constants';
import CustomLeftHeader from '../../../components/CustomLeftHeader';
import CustomButton from '../../../components/CustomButton';
import I18n from '../../../i18n/i18n';

const { height, width } = Dimensions.get('window');
const defaultPosition = { coords: { longitude: 0, latitude: 0 } };

const SendTakePicture = ({ navigation, route }) => {
  const cameraRef = useRef(null);
  const { products, transactionType, buyer, totalEditedQuantity } =
    route.params;
  const { theme } = useSelector((state) => state.common);
  const { isConnected } = useSelector((state) => state.connection);
  const { userProjectDetails, syncInProgress, loggedInUser } = useSelector(
    (state) => state.login,
  );
  const { currency } = userProjectDetails;
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [infoView, setInfoView] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();

  /**
   * taking picture using device camera for bill receipt
   */
  const onTakePicture = async () => {
    setIsLoading(true);
    if (cameraRef) {
      const options = { quality: 0.1, base64: false };
      const data = await cameraRef.current.takePictureAsync(options);
      setReceipt(data);
      setIsLoading(false);
    } else {
      setIsLoading(false);
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
      setIsVerifying(false);
      setInfoView(false);
      // console.log(err);
    }
  };

  /**
   * get total amount including premiums by product
   * @param   {object} product  product object
   * @returns {number}          total amount including premiums
   */
  const getTotalAmount = async (product) => {
    const { edited_quantity, ratio, total_amount, total_premiums } = product;
    const editedQuantity =
      edited_quantity !== '' ? parseFloat(edited_quantity) : 0;
    const productRatio = ratio !== '' ? parseFloat(ratio) : 1;
    let totalAmount = total_amount * productRatio;

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
                : amount * parseFloat(total_premium_quantity);
          }
        } else {
          totalAmount += amount * editedQuantity;
        }
      },
    );

    return Math.round(parseFloat(totalAmount));
  };

  /**
   * transaction validate function
   * @param {object} position geo location coordinates
   */
  const transactionValidate = async (position) => {
    let valid = true;

    await Promise.all(
      products.map(async (product) => {
        const { edited_quantity, ratio, total_amount, total_premiums, name } =
          product;
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
          allTotal <= 0
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
          quantity,
          ref_number: null,
          price,
          invoice: null,
          date: moment(Math.round(date)).format('DD MMM YYYY'),
          total,
          invoice_file: receipt.uri,
          card_id: '',
          created_on: parseInt(Math.round(date) / 1000),
          product_price: productPrice,
          quality_correction: 100,
          product_name: product.name,
          verification_method: VERIFICATION_METHOD_MANUAL,
          transaction_type:
            parseFloat(product.total_quantity) ===
            parseFloat(product.edited_quantity)
              ? 3
              : transactionType,
          verification_latitude: position.coords.latitude,
          verification_longitude: position.coords.longitude,
          extra_fields: extraFields,
        };

        const transactionId = await createTransaction(transactionObj);

        transactionObj.total_quantity = product.total_quantity;
        transactionObj.edited_quantity = product.edited_quantity;
        transactionArray.push(transactionObj);

        await saveAllPremiums(product, transactionId, transactionObj);
        await saveBasePricePayment(transactionId, transactionObj);
        await saveSourceBatches(product.batches, transactionId, product.ratio);
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
        dispatch(initSyncProcess());
        await syncTransactions();
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
            amount: totalAmount,
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
            destination: loggedInUser.default_node,
            verification_longitude: transactionObj.verification_longitude,
            verification_latitude: transactionObj.verification_latitude,
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
      amount: transactionObj.price,
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
      destination: loggedInUser.default_node,
      verification_longitude: transactionObj.verification_longitude,
      verification_latitude: transactionObj.verification_latitude,
    };

    await createTransactionPremium(basePricePayment);
  };

  /**
   * saving source batches in local db
   * @param {Array} batches all batch array
   * @param {*} transactionId transaction id
   * @param {*} ratio product ratio
   */
  const saveSourceBatches = async (batches, transactionId, ratio) => {
    await Promise.all(
      batches.map(async (batch) => {
        const sourceBatch = {
          batch_id: batch.id,
          transaction_id: transactionId,
          quantity: batch.current_quantity * ratio,
        };
        await createSourceBatch(sourceBatch);
        await findAndUpdateBatchQuantity(batch.id, { current_quantity: 0 });
      }),
    );
  };

  const styles = StyleSheetFactory(theme);

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
          onPress={() => navigation.goBack(null)}
          backgroundColor="#4F4F4F"
          leftIcon="arrow-left"
          titleColor={theme.background_1}
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

                {error !== '' && (
                  <Text style={styles.errorMessage}>{error}</Text>
                )}
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
                onPress={() => requestAccessLocationPermission()}
                disabled={isVerifying}
              />
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'column',
      backgroundColor: '#4F4F4F',
      marginBottom: 10,
    },
    preview: {
      height: height * 0.7,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    capture: {
      flex: 1,
      borderRadius: theme.border_radius,
      padding: 15,
      paddingHorizontal: 20,
      alignSelf: 'center',
      margin: 20,
      position: 'absolute',
      bottom: 20,
      left: 110,
    },
    addIcon: {
      height: 65,
      width: 65,
      borderRadius: 62,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 0.5,
      backgroundColor: 'black',
      borderColor: '#ffffff',
      bottom: 0,
    },
    detail: {
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
    },
    textDetails: {
      fontSize: 14,
      color: '#FFFFFF',
    },
    infoHeader: {
      fontSize: 14,
      color: '#ffb74d',
      fontWeight: '600',
    },
    infoMessage: {
      fontSize: 12,
      color: '#FFFFFF',
      marginTop: 3,
    },
    infoMsgContainer: {
      backgroundColor: '#60605F',
      flexDirection: 'row',
      padding: width * 0.03,
      justifyContent: 'space-between',
      borderRadius: theme.border_radius,
    },
    infoCloseWrap: {
      justifyContent: 'center',
      alignSelf: 'flex-end',
      alignItems: 'center',
      width: width * 0.05,
      height: width * 0.05,
      borderRadius: (width * 0.05) / 2,
    },
    infoIconWrap: {
      alignSelf: 'flex-end',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 10,
    },
    errorMessage: {
      fontSize: 14,
      fontFamily: theme.font_regular,
      lineHeight: 28,
      paddingBottom: 10,
      textAlign: 'center',
      color: theme.button_bg_1,
    },
  });
};

export default SendTakePicture;

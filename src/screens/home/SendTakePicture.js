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
import { useSelector } from 'react-redux';
import reactotron from 'reactotron-react-native';
import Geolocation from 'react-native-geolocation-service';
import moment from 'moment';
import { saveTransaction } from '../../services/transactionsHelper';
import { findAndupdateBatchQuantity } from '../../services/batchesHelper';
import { saveTransactionPremium } from '../../services/transactionPremiumHelper';
import { syncTransactions } from '../../services/syncTransactions';
import { saveSourceBatch } from '../../services/sourceBatchesHelper';
import { InfoIcon, CloseIcon } from '../../assets/svg';
import { requestPermission } from '../../services/commonFunctions';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import CustomButton from '../../components/CustomButton';
import I18n from '../../i18n/i18n';
import * as consts from '../../services/constants';

const { height, width } = Dimensions.get('window');
const defaultPosition = { coords: { longitude: 0, latitude: 0 } };

const SendTakePicture = ({ navigation, route }) => {
  const cameraRef = useRef(null);
  const { products, transactionType, buyer, totalEditedQuantity } =
    route.params;
  const { isConnected } = useSelector((state) => state.connection);
  const { userProjectDetails, syncInProgress } = useSelector(
    (state) => state.login,
  );
  const { currency } = userProjectDetails;
  const [isLoading, setisLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [infoView, setInfoView] = useState(false);
  const [error, setError] = useState('');

  /**
   * taking picture using device camera for bill recipet
   */
  const onTakePicture = async () => {
    setisLoading(true);
    if (cameraRef) {
      const options = { quality: 0.1, base64: false };
      const data = await cameraRef.current.takePictureAsync(options);
      setReceipt(data);
      setisLoading(false);
    } else {
      setisLoading(false);
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
            reactotron.log(position);
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
   *
   * @param   {object} product  product object
   * @returns {number}          total amount including premiums
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
   * saving all transaction premiums in local d
   *
   * @param {object} product        product object
   * @param {string} transactionId  transaction id
   */
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

  /**
   * saving source batches in local db
   *
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
        await saveSourceBatch(sourceBatch);
        await findAndupdateBatchQuantity(batch.id, { current_quantity: 0 });
      }),
    );
  };

  /**
   * transaction validate function
   *
   * @param {object} position geo location coordinates
   */
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
          setIsVerifying(false);
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
                setIsVerifying(false);
              }
            }),
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
   *
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
          invoice_file: receipt.uri,
          created_on: parseInt(Math.round(date) / 1000),
          product_price: productPrice,
          quality_correction: 100,
          product_name: product.name,
          verification_method: consts.VERIFICATION_METHOD_MANUAL,
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

      navigation.navigate('SendTransactionCompleteScreen', {
        buyerName: buyer.name,
        quantity: totalEditedQuantity,
        transactionArray,
        checkTransactionStatus,
      });
    });
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
          onPress={() => navigation.goBack(null)}
          backgroundColor='#4F4F4F'
          leftIcon='arrow-left'
          titleColor={consts.APP_BG_COLOR}
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
                    <ActivityIndicator size='large' color='#4F4F4F' />
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
                          fill='#ffffff'
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setInfoView(!infoView)}
                    style={styles.infoIconWrap}
                    hitSlop={consts.HIT_SLOP_FIFTEEN}
                  >
                    <InfoIcon
                      width={width * 0.05}
                      height={width * 0.05}
                      fill='#ffb74d'
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {isVerifying ? (
              <ActivityIndicator
                size='large'
                color={consts.BUTTON_COLOR_PRIMARY}
              />
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

const styles = StyleSheet.create({
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
    borderRadius: consts.BORDER_RADIUS,
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
    borderRadius: consts.BORDER_RADIUS,
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
    fontFamily: consts.FONT_REGULAR,
    lineHeight: 28,
    paddingBottom: 10,
    textAlign: 'center',
    color: consts.BUTTON_COLOR_PRIMARY,
  },
});

export default SendTakePicture;

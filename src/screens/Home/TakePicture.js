import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Image,
  Text,
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import { useSelector } from 'react-redux';
import moment from 'moment';
import Geolocation from 'react-native-geolocation-service';
import { saveTransaction } from '../../services/transactionsHelper';
import { saveBatch } from '../../services/batchesHelper';
import { saveTransactionPremium } from '../../services/transactionPremiumHelper';
import { syncTransactions } from '../../services/syncTransactions';
import { InfoIcon, CloseIcon } from '../../assets/svg';
import { requestPermission } from '../../services/commonFunctions';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import CustomButton from '../../components/CustomButton';
import I18n from '../../i18n/i18n';
import * as consts from '../../services/constants';

const { height, width } = Dimensions.get('window');
const defaultPosition = { coords: { longitude: 0, latitude: 0 } };

const TakePicture = ({ navigation, route }) => {
  const cameraRef = useRef(null);
  const { products, totalPrice, farmer } = route.params;
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
   * taking picture from device camera for reciept verification
   */
  const onTakePicture = async () => {
    setisLoading(true);
    if (cameraRef) {
      const options = { quality: 0.5, base64: false };
      const data = await cameraRef.current.takePictureAsync(options);
      setReceipt(data);
      setisLoading(false);
    } else {
      setisLoading(false);
    }
  };

  /**
   * requesting device's geo location permission
   */
  const requestAccessLocationPermission = async () => {
    setIsVerifying(true);
    try {
      const granted = await requestPermission('location');

      if (granted) {
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
    } catch (err) {
      setIsVerifying(false);
      setInfoView(false);
    }
  };

  /**
   * get total amount of individual product excluding card depentent premium
   *
   * @param   {number} productTotal   total premium
   * @param   {Array}  premiums       all premiums array
   * @returns {number}                total premium amount
   */
  const getTotal = async (productTotal, premiums) => {
    const total = premiums.reduce((a, b) => {
      if (b?._raw?.is_card_dependent) {
        return a - b.total;
      }
      return a;
    }, Math.round(productTotal));
    return total;
  };

  /**
   * get all premiums exclude card dependent
   *
   * @param   {Array} premiums  all premiums
   * @returns {Array}           updated premiums
   */
  const getUpdatedPremiums = async (premiums) => {
    const newPremiums = premiums.filter((premium) => {
      return !premium._raw.is_card_dependent;
    });
    return newPremiums;
  };

  /**
   * validation before transaction submit
   *
   * @param {object} position device's geo location coordinates
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
          const updatedPremiums = await getUpdatedPremiums(
            product.applied_premiums,
          );

          await Promise.all(
            updatedPremiums.map(async (premium) => {
              const amount =
                parseFloat(premium._raw.amount) * parseFloat(product.quantity);
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
   * submit function. saving transaction premium and batces in local db.
   *
   * @param {object} position device's geo location coordinates
   */
  const onVerification = async (position) => {
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
        const productPrice = product.base_price;
        const extraFields = product.extra_fields ?? null;

        const transactionObj = {
          server_id: null,
          node_id: farmer.node_id,
          node_name: farmer.farmer_name,
          currency,
          product_id: product.id,
          type: consts.APP_TRANS_TYPE_INCOMING,
          quantity,
          ref_number: null,
          price,
          total,
          invoice_file: receipt.uri,
          date: moment(Math.round(date)).format('DD MMM YYYY'),
          created_on: parseInt(Math.round(date) / 1000),
          quality_correction: 100,
          product_price: productPrice,
          product_name: product.name,
          verification_method: consts.VERIFICATION_METHOD_MANUAL,
          verification_longitude: position.coords.longitude,
          verification_latitude: position.coords.latitude,
          extra_fields: extraFields ?? '',
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

        const updatedPremiums = await getUpdatedPremiums(
          product.applied_premiums,
        );

        await saveAllTransactionPremium(
          updatedPremiums,
          product.quantity,
          transactionId,
        );
      }),
    )
      .then(async () => {
        let checkTransactionStatus = false;

        if (isConnected && !syncInProgress) {
          checkTransactionStatus = true;
          await syncTransactions();
        }

        navigation.navigate('TransactionComplete', {
          farmerName: farmer.farmer_name,
          total: totalPrice,
          transactionArray,
          checkTransactionStatus,
        });
      })
      .catch(() => {
        // console.log('error', err);
      });
  };

  /**
   * saving all transaction premiums
   *
   * @param {Array}   appliedPremiums  all premiums applied for the transaction
   * @param {number}  productQuality   product quantity
   * @param {string}  transactionId    corresponding transaction id
   */
  const saveAllTransactionPremium = async (
    appliedPremiums,
    productQuality,
    transactionId,
  ) => {
    await Promise.all(
      appliedPremiums.map(async (premium) => {
        const amount =
          parseFloat(premium._raw.amount) * parseFloat(productQuality);
        await saveTransactionPremium(premium._raw.id, transactionId, amount);
      }),
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={{ height: height * 0.1 }}>
        <CustomLeftHeader
          backgroundColor='#4F4F4F'
          title={I18n.t('verify_with_photo')}
          leftIcon='arrow-left'
          titleColor={consts.APP_BG_COLOR}
          onPress={() => navigation.goBack(null)}
        />
      </View>
      <View style={styles.containerSub}>
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

        {receipt != null && (
          <>
            {!isVerifying && (
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
            )}

            {isVerifying && (
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height,
    backgroundColor: '#4F4F4F',
    paddingHorizontal: width * 0.03,
    justifyContent: 'space-between',
  },
  containerSub: {
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
    color: consts.TEXT_PRIMARY_COLOR,
  },
});

export default TakePicture;

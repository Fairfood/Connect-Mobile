import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Image,
  Text,
  BackHandler,
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import moment from 'moment';
import Geolocation from 'react-native-geolocation-service';
import { InfoIcon, CloseIcon } from '../../../../assets/svg';
import {
  createReferenceId,
  getCurrency,
  handleErrors,
  requestPermission,
} from '../../../../utils/commonFunctions';
import { jsonToString } from '../../../../utils/helperFunctions';
import {
  MINIMUM_TRANSACTION_QUANTITY,
  MAXIMUM_TRANSACTION_QUANTITY,
  APP_TRANS_TYPE_INCOMING,
  VERIFICATION_METHOD_MANUAL,
  HIT_SLOP_FIFTEEN,
  TYPE_TRANSACTION_PREMIUM,
  TYPE_BASE_PRICE,
  PAYMENT_OUTGOING,
  PREMIUM_OPTIONS,
  PREMIUM_RANGE,
} from '../../../../utils/constants';
import CustomLeftHeader from '../../../../components/headers/customLeftHeader';
import CustomButton from '../../../../components/buttons/customButton';
import I18n from '../../../../translations/text/i18n';
import { logAnalytics } from '../../../../utils/serviceHelper';
import { createTransaction } from '../../../../db/services/TransactionsHelper';
import { createTransactionPremium } from '../../../../db/services/TransactionPremiumHelper';
import { initiateSync } from '../../../../sync/SyncInitials';
import StyleSheetFactory from './styles';
import { getTotal } from './controller';

const { height, width } = Dimensions.get('window');
const defaultPosition = { coords: { longitude: 0, latitude: 0 } };

const TakePicture = ({ navigation, route }) => {
  const cameraRef = useRef(null);
  const { products, totalPrice, farmer } = route.params;
  const { isConnected } = useSelector((state) => state.connection);
  const { syncInProgress, loggedInUser } = useSelector((state) => state.login);
  const { theme } = useSelector((state) => state.common);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [infoView, setInfoView] = useState(false);
  const [errorText, setErrorText] = useState('');
  const styles = StyleSheetFactory();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        handleBackButtonClick();
        return true;
      },
    );

    return () => backHandler.remove();
  }, []);

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
      if (!cameraRef) {
        throw new Error('camera not found');
      }

      const options = { quality: 0.5, base64: false };
      const data = await cameraRef.current.takePictureAsync(options);
      setReceipt(data);
      setIsLoading(false);
    } catch (error) {
      setIsVerifying(false);
      setIsLoading(false);
      handleErrors(error, {
        ref: 'TakePicture_onTakePicture',
      });
      Toast.show({
        type: 'error',
        text1: I18n.t('something_went_wrong'),
        text2: String(error),
      });
      navigation.goBack(null);
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
    } catch (error) {
      handleErrors(error, {
        ref: 'TakePicture_requestAccessLocationPermission',
      });
      setIsVerifying(false);
      setInfoView(false);
    }
  };

  /**
   * validation before transaction submit
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
          setErrorText(`${I18n.t('check_the_values_entered')} ${product.name}`);
          setIsVerifying(false);
        } else {
          const updatedPremiums = product.applied_premiums.filter(
            (premium) => !premium.dependant_on_card,
          );

          await Promise.all(
            updatedPremiums.map(async (premium) => {
              const amount =
                parseFloat(premium.amount) * parseFloat(product.quantity);
              if (amount <= 0) {
                valid = false;
                setErrorText(
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
      setErrorText('');
      onVerification(position);
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
   * submit function. saving transaction premium and batches in local db.
   * @param {object} position device's geo location coordinates
   */
  const onVerification = async (position) => {
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
        const price = parseFloat(product.total_amount);
        const productPrice = parseFloat(product.base_price);
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
          price_corrected: price,
          total_corrected: total,
          invoice_file: receipt.uri,
          card_id: '',
          date: moment(new Date(date)).format('DD MMM YYYY'),
          created_on: parseInt(Math.round(date / 1000)),
          quality_correction: 100,
          product_price_corrected: productPrice,
          product_name: product.name,
          verification_method: VERIFICATION_METHOD_MANUAL,
          verification_longitude_corrected: position.coords.longitude,
          verification_latitude_corrected: position.coords.latitude,
          reference_id: referenceId,
          source: farmer.id,
          destination: loggedInUser.entity_id,
          current_quantity_corrected: quantity,
          extra_fields: submissions,
        };

        const transactionId = await createTransaction(transactionObj);

        const updatedPremiums = product.applied_premiums.filter(
          (premium) => !premium.dependant_on_card,
        );

        transactionObj.id = transactionId;
        transactionObj.total_amount = product.total_amount;
        transactionObj.premium_total = await getTotal(
          product.premium_total,
          product.applied_premiums,
        );
        transactionArray.push(transactionObj);

        await saveAllTransactionPremium(
          updatedPremiums,
          product.quantity,
          transactionId,
          transactionObj,
        );

        await saveBasePricePayment(transactionId, transactionObj);
      }),
    )
      .then(async () => {
        logAnalytics('transactions', {
          verification_type: 'manual_verification',
          transaction_type: 'buy_transaction',
          network_status: isConnected && !syncInProgress ? 'online' : 'offline',
        });

        let checkTransactionStatus = false;

        if (isConnected && !syncInProgress) {
          checkTransactionStatus = true;
          await initiateSync();
        }

        navigation.navigate('TransactionComplete', {
          farmerName: farmer.name,
          total: totalPrice,
          transactionArray,
          checkTransactionStatus,
        });
      })
      .catch((error) => {
        handleErrors(error, {
          ref: 'TakePicture_onVerification',
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
          destination: farmer.server_id || farmer.id,
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
      destination: farmer.server_id || farmer.id,
      verification_longitude_corrected:
        transactionObj.verification_longitude_corrected,
      verification_latitude_corrected:
        transactionObj.verification_latitude_corrected,
      reference_id: transactionObj.reference_id,
      options: String(transactionObj.product_price_corrected),
    };

    await createTransactionPremium(basePricePayment);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={{ height: height * 0.1 }}>
        <CustomLeftHeader
          title={I18n.t('verify_with_photo')}
          titleColor={theme.background_1}
          onPress={handleBackButtonClick}
          extraStyle={{ backgroundColor: '#4F4F4F' }} // need_fix - add color to theme
          testID="buy-take-photo-screen"
        />
      </View>
      <View style={styles.containerSub}>
        {receipt == null && (
          <RNCamera
            ref={cameraRef}
            style={{
              flex: 1,
              width: '100%',
            }}
            type={RNCamera.Constants.Type.back}
            flashMode={RNCamera.Constants.FlashMode.off}
            testID="camera"
          />
        )}

        {receipt != null && (
          <Image
            source={{ uri: receipt.uri }}
            style={styles.preview}
            testID="invoice-image"
          />
        )}

        {receipt != null && (
          <>
            {!isVerifying && (
              <>
                {errorText === '' && (
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
                        testID="retake-photo-text"
                      >
                        {I18n.t('retake_photo')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {errorText !== '' && (
                  <Text style={styles.errorMessage} testID="take-photo-error">
                    {errorText}
                  </Text>
                )}
              </>
            )}

            {isVerifying && (
              <View style={[styles.detail, { marginTop: 3 }]}>
                {infoView ? (
                  <View style={styles.infoMsgContainer} testID="info-view">
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
                    testID="info-icon"
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
              <ActivityIndicator
                size="large"
                color={theme.button_bg_1}
                testID="loading-icon"
              />
            ) : (
              <CustomButton
                buttonText={I18n.t('verify')}
                onPress={requestAccessLocationPermission}
                disabled={isVerifying}
                testID="take-photo-submit-button"
              />
            )}
          </>
        )}
      </View>

      {receipt == null && (
        <View style={{ marginBottom: 20 }}>
          <View style={styles.detail}>
            <Text style={styles.textDetails} testID="take-photo-info">
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
              testID="take-photo-round-icon"
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
    </ScrollView>
  );
};

export default TakePicture;

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
import { InfoIcon, CloseIcon } from '../../../../assets/svg';
import {
  createReferenceId,
  getCurrency,
  handleErrors,
  requestPermission,
} from '../../../../utils/commonFunctions';
import { jsonToString } from '../../../../utils/helperFunctions';
import {
  MINIMUM_PAY_FARMER_AMOUNT,
  MAXIMUM_PAY_FARMER_AMOUNT,
  TYPE_GENERIC_PREMIUM,
  PAYMENT_OUTGOING,
  VERIFICATION_METHOD_MANUAL,
  HIT_SLOP_FIFTEEN,
} from '../../../../utils/constants';
import { logAnalytics } from '../../../../utils/serviceHelper';
import { createTransactionPremium } from '../../../../db/services/TransactionPremiumHelper';
import { initiateSync } from '../../../../sync/SyncInitials';
import CustomLeftHeader from '../../../../components/headers/customLeftHeader';
import CustomButton from '../../../../components/buttons/customButton';
import I18n from '../../../../translations/text/i18n';
import StyleSheetFactory from './styles';

const { height, width } = Dimensions.get('window');
const defaultPosition = { coords: { longitude: 0, latitude: 0 } };

const PayFarmerTakePicture = ({ navigation, route }) => {
  const cameraRef = useRef(null);
  const styles = StyleSheetFactory();
  const { premiums, farmer, totalPrice } = route.params;
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
      premiums.map(async (premium) => {
        const paidAmount = parseFloat(premium.paid_amount);
        if (
          paidAmount === '' ||
          paidAmount <= MINIMUM_PAY_FARMER_AMOUNT ||
          paidAmount >= MAXIMUM_PAY_FARMER_AMOUNT ||
          paidAmount === 0
        ) {
          valid = false;
          setError(`${I18n.t('check_the_values_entered')} ${premium.name}`);
        }
      }),
    );

    if (valid) {
      setError('');
      onVerification(position);
    }
  };

  /**
   * creating form submission
   * @param   {object} premium  premium object
   * @returns {Array}           submission array
   */
  const createSubmissions = async (premium) => {
    const paymentForm = premium?.pay_common_form ?? [];
    if (paymentForm.length > 0) {
      const submissions = [];
      for (const form of paymentForm) {
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
   * submit function. save transaction, premium and batches in local db.
   * @param {object} position geo location coordinates
   */
  const onVerification = async (position) => {
    const paymentArray = [];
    const referenceId = createReferenceId();
    const currency = getCurrency('code');

    await Promise.all(
      premiums.map(async (premium) => {
        let tnxDate = null;
        const commonTnxFields = premium?.pay_common_form?.[0].fields ?? [];
        if (commonTnxFields.length > 0) {
          const tnxDateField = commonTnxFields.find(
            (field) => field.key === 'transaction_date',
          );
          if (tnxDateField) {
            tnxDate = tnxDateField.value;
          }
        }

        const date = tnxDate || new Date().getTime();

        let submissions = await createSubmissions(premium);
        if (typeof submissions === 'object') {
          submissions = jsonToString(submissions);
        }

        const transactionPremium = {
          premium_id: premium.id,
          transaction_id: '',
          amount_corrected: parseFloat(premium.paid_amount),
          server_id: '',
          category: TYPE_GENERIC_PREMIUM,
          type: PAYMENT_OUTGOING,
          verification_method: VERIFICATION_METHOD_MANUAL,
          receipt: receipt.uri,
          card_id: '',
          node_id: farmer.id,
          date: parseInt(Math.round(date / 1000)),
          verification_longitude_corrected: position.coords.longitude,
          verification_latitude_corrected: position.coords.latitude,
          currency,
          source: loggedInUser.entity_id,
          destination: farmer.server_id !== '' ? farmer.server_id : farmer.id,
          extra_fields: submissions,
          reference_id: referenceId,
          options: String(premium.paid_amount),
          comment: premium.comment,
        };

        const obj = { ...transactionPremium, premium_name: premium.name };
        paymentArray.push(obj);

        await createTransactionPremium(transactionPremium);
      }),
    ).then(async () => {
      logAnalytics('transactions', {
        verification_type: 'manual_verification',
        transaction_type: 'pay_farmer',
        network_status: isConnected && !syncInProgress ? 'online' : 'offline',
      });

      if (isConnected && !syncInProgress) {
        await initiateSync();
      }

      navigation.navigate('PayFarmerComplete', {
        farmer,
        total: totalPrice,
        paymentArray,
        referenceId,
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
          onPress={handleBackButtonClick}
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

                {error && (
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

export default PayFarmerTakePicture;

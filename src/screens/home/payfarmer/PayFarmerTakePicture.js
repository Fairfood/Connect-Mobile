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
import { InfoIcon, CloseIcon } from '../../../assets/svg';
import {
  jsonToString,
  requestPermission,
} from '../../../services/commonFunctions';
import { initSyncProcess } from '../../../redux/LoginStore';
import {
  MINIMUM_PAY_FARMER_AMOUNT,
  MAXIMUM_PAY_FARMER_AMOUNT,
  TYPE_GENERIC_PREMIUM,
  PAYMENT_OUTGOING,
  VERIFICATION_METHOD_MANUAL,
  HIT_SLOP_FIFTEEN,
} from '../../../services/constants';
import CustomLeftHeader from '../../../components/CustomLeftHeader';
import CustomButton from '../../../components/CustomButton';
import I18n from '../../../i18n/i18n';
import { logAnalytics } from '../../../services/googleAnalyticsHelper';
import { createTransactionPremium } from '../../../db/services/TransactionPremiumHelper';
import { syncPayments } from '../../../sync/SyncTransactions';

const { height, width } = Dimensions.get('window');
const defaultPosition = { coords: { longitude: 0, latitude: 0 } };

const PayFarmerTakePicture = ({ navigation, route }) => {
  const cameraRef = useRef(null);
  const { premiums, farmer, totalPrice } = route.params;
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
   * submit function. save transaction, premium and batches in local db.
   * @param {object} position geo location coordinates
   */
  const onVerification = async (position) => {
    await Promise.all(
      premiums.map(async (premium) => {
        const date = parseInt(new Date().getTime() / 1000);
        const extraFields = premium.extra_fields
          ? jsonToString(premium.extra_fields)
          : '';

        const transactionPremium = {
          premium_id: premium.id,
          transaction_id: '',
          amount: parseFloat(premium.paid_amount),
          server_id: '',
          category: TYPE_GENERIC_PREMIUM,
          type: PAYMENT_OUTGOING,
          verification_method: VERIFICATION_METHOD_MANUAL,
          receipt: receipt.uri,
          card_id: '',
          node_id: farmer.id,
          date,
          verification_longitude: position.coords.longitude,
          verification_latitude: position.coords.latitude,
          currency,
          source: loggedInUser.default_node,
          destination: farmer.server_id !== '' ? farmer.server_id : farmer.id,
          extra_fields: extraFields,
        };

        await createTransactionPremium(transactionPremium);
      }),
    ).then(async () => {
      logAnalytics('transactions', {
        verification_type: 'manual_verification',
        transaction_type: 'pay_farmer',
        network_status: isConnected && !syncInProgress ? 'online' : 'offline',
      });

      if (isConnected && !syncInProgress) {
        dispatch(initSyncProcess());
        await syncPayments();
      }

      navigation.navigate('PayFarmerComplete', {
        farmer,
        total: totalPrice,
        premiumArray: premiums,
      });
    });
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

export default PayFarmerTakePicture;

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  BackHandler,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
// import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SuccessScreenTickIcon,
  SyncCloseIcon,
  TnxSuccessStatusIcon,
} from '../../../assets/svg';
import CustomButton from '../../../components/CustomButton';
import I18n from '../../../i18n/i18n';
import { convertQuantity } from '../../../services/commonFunctions';

const { height, width } = Dimensions.get('window');

const SendTransactionCompleteScreen = ({ navigation, route }) => {
  const { buyerName, quantity, transactionArray, checkTransactionStatus } =
    route.params;
  const { theme, sendTnxStatus } = useSelector((state) => state.common);
  const [loading, setLoading] = useState(true);
  const [tnxStatusArray, setTnxStatusArray] = useState([]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        return true;
      },
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    setupInitialValues();
  }, []);

  /**
   * setting initial transaction status from async storage
   */
  const setupInitialValues = async () => {
    if (checkTransactionStatus) {
      setTnxStatusArray(sendTnxStatus);
    }

    setLoading(false);
  };

  /**
   * checking particular product transaction status is success
   * @param   {string} productId  product id
   * @returns {boolean}           true if transaction success, otherwise false
   */
  const getTransactionStatus = (productId) => {
    if (!checkTransactionStatus) {
      return true;
    }

    // checking product id is in tnxStatusArray, if not that transaction is failed
    if (!tnxStatusArray.includes(productId)) {
      return false;
    }

    return true;
  };

  /**
   * resetting transactionStatus and redirecting to home page
   */
  const onConfirm = async () => {
    navigation.navigate('Home');
  };

  const styles = StyleSheetFactory(theme);

  const FieldView = ({ title, value, hidden }) => {
    if (hidden) {
      return null;
    }

    return (
      <View style={styles.fieldWrap}>
        <View style={{ width: '60%' }}>
          <Text style={styles.fieldTitle}>{title}</Text>
        </View>
        <View style={{ width: '40%', alignItems: 'flex-end' }}>
          <Text style={styles.fieldValue}>{value}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <SuccessScreenTickIcon width={width * 0.3} height={height * 0.15} />
        <Text style={styles.successTitle}>
          {I18n.t('transaction_completed')}
        </Text>
        <View style={styles.toWrap}>
          <Text style={styles.toText}>{`${I18n.t('to')}, `}</Text>
          <Text style={styles.buyerName}>{buyerName}</Text>
        </View>
      </View>

      {loading && (
        <View style={{ marginTop: 15 }}>
          <ActivityIndicator size="small" color={theme.text_1} />
        </View>
      )}

      {!loading && (
        <ScrollView contentContainerStyle={styles.bottomSection}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>
              {I18n.t('transaction_details')}
            </Text>
            <Text style={styles.productCountText}>
              {`${transactionArray.length} ${I18n.t('products')}`}
            </Text>
          </View>

          {checkTransactionStatus &&
            transactionArray.length > tnxStatusArray.length && (
              <View style={styles.errorWrap}>
                <Text style={styles.errorTnxWarning}>
                  {`${transactionArray.length - tnxStatusArray.length} ${I18n.t(
                    'transactions_failed',
                  )}`}
                </Text>
              </View>
            )}

          {transactionArray.map((item, index) => {
            const tnxStatus = getTransactionStatus(item.product_id);
            return (
              <View
                style={[
                  styles.fieldContainer,
                  {
                    backgroundColor: tnxStatus
                      ? null
                      : 'rgba(255, 176, 170, 0.3)',
                  },
                ]}
                key={index.toString()}
              >
                <View style={styles.fieldWrap}>
                  <Text
                    style={[
                      styles.fieldValue,
                      { marginBottom: height * 0.005 },
                    ]}
                  >
                    {item.product_name}
                  </Text>
                  <View style={styles.tnxStatusWrap}>
                    {tnxStatus ? (
                      <TnxSuccessStatusIcon
                        width={width * 0.04}
                        height={width * 0.04}
                      />
                    ) : (
                      <SyncCloseIcon
                        width={width * 0.04}
                        height={width * 0.04}
                        fill={theme.icon_error}
                      />
                    )}

                    <Text
                      style={[
                        styles.tnxStatusText,
                        {
                          color: tnxStatus ? theme.text_2 : theme.icon_error,
                        },
                      ]}
                    >
                      {tnxStatus ? I18n.t('success') : I18n.t('failed')}
                    </Text>
                  </View>
                </View>

                <FieldView
                  title={`${I18n.t('sent')}`}
                  value={`${convertQuantity(item.total_quantity)} Kg`}
                />

                <FieldView
                  title={I18n.t('loss')}
                  value={`${
                    convertQuantity(
                      parseFloat(item.total_quantity) -
                        parseFloat(item.edited_quantity),
                    ) || 0
                  } Kg`}
                />
              </View>
            );
          })}

          <View style={styles.fieldWrap}>
            <View style={{ width: '60%' }}>
              <Text style={styles.totalText}>
                {I18n.t('total').toLocaleUpperCase()}
              </Text>
            </View>
            <View style={{ width: '40%', alignItems: 'flex-end' }}>
              <Text style={styles.totalText}>
                {`${convertQuantity(quantity)} Kg`}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      {!loading && (
        <View style={styles.buttonWrap}>
          <CustomButton
            buttonText={I18n.t('ok')}
            onPress={() => onConfirm()}
            extraStyle={{ width: '45%' }}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background_1,
    },
    topSection: {
      width,
      height: height * 0.33,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.header_bg,
    },
    successTitle: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 20,
      textAlign: 'center',
      marginTop: 30,
    },
    toWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
    },
    toText: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontSize: 14,
      textAlign: 'center',
    },
    buyerName: {
      color: theme.text_1,
      fontFamily: theme.font_medium,
      fontSize: 16,
      textAlign: 'center',
    },
    bottomSection: {
      flexGrow: 1,
      padding: width * 0.05,
    },
    titleContainer: {
      marginTop: height * 0.01,
      paddingBottom: height * 0.02,
      paddingHorizontal: width * 0.04,
      borderBottomColor: theme.border_1,
      borderBottomWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    fieldContainer: {
      borderBottomColor: theme.border_1,
      borderBottomWidth: 1,
      paddingVertical: height * 0.015,
    },
    fieldWrap: {
      width: '100%',
      paddingVertical: height * 0.005,
      paddingHorizontal: width * 0.04,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    titleText: {
      color: theme.text_1,
      fontSize: 16,
      fontFamily: theme.font_medium,
    },
    fieldTitle: {
      color: '#427290',
      fontSize: 14,
      fontFamily: theme.font_regular,
    },
    totalText: {
      color: theme.text_1,
      fontSize: 16,
      fontFamily: theme.font_bold,
      marginTop: height * 0.005,
    },
    fieldValue: {
      color: theme.text_1,
      fontSize: 14,
      fontFamily: theme.font_medium,
    },
    productCountText: {
      color: '#427290',
      fontSize: 16,
      fontFamily: theme.font_regular,
    },
    transactionText: {
      color: theme.text_1,
      fontSize: 14,
      fontFamily: theme.font_regular,
      fontWeight: 'normal',
      fontStyle: 'normal',
    },
    cardContainer: {
      backgroundColor: '#DDF3FF',
      marginHorizontal: '7.5%',
      padding: 25,
    },
    formTitleContainer: {
      margin: 30,
      marginBottom: 10,
    },
    formTitle: {
      color: theme.text_1,
      fontWeight: '600',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 18,
      textAlign: 'center',
      marginBottom: 20,
    },
    cardReaderImageContainer: {
      height: '30%',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
    },
    buttonWrap: {
      marginVertical: 20,
    },
    dot: {
      backgroundColor: theme.text_1,
      width: 5,
      height: 5,
      borderRadius: 5 / 2,
      marginRight: 5,
    },
    tnxStatusWrap: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    tnxStatusText: {
      fontFamily: theme.font_regular,
      fontSize: 13,
      paddingLeft: width * 0.015,
    },
    errorWrap: {
      width: '100%',
      backgroundColor: 'rgba(255, 176, 170, 0.3)',
      marginBottom: 10,
      padding: 10,
      borderRadius: theme.border_radius,
    },
    errorTnxWarning: {
      fontFamily: theme.font_regular,
      color: theme.icon_error,
      fontSize: 13,
      marginHorizontal: width * 0.04,
      textAlign: 'center',
    },
  });
};

export default SendTransactionCompleteScreen;

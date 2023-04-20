import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  BackHandler,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SuccessScreenTickIcon,
  SyncCloseIcon,
  TnxSuccessStatusIcon,
} from '../../../assets/svg';
import CustomButton from '../../../components/CustomButton';
import I18n from '../../../i18n/i18n';

const { height, width } = Dimensions.get('window');

const TransactionCompleteScreen = ({ navigation, route }) => {
  const { farmerName, total, transactionArray, checkTransactionStatus } =
    route.params;
  const { theme } = useSelector((state) => state.common);
  const { userProjectDetails } = useSelector((state) => state.login);
  const { currency } = userProjectDetails;
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
   * setting initial value of transactionStatus from local storage
   */
  const setupInitialValues = async () => {
    let transactionStatus =
      (await AsyncStorage.getItem('transactionStatus')) || '{}';
    transactionStatus = JSON.parse(transactionStatus);
    if (transactionStatus.buy) {
      setTnxStatusArray(transactionStatus.buy);
    }

    setLoading(false);
  };

  /**
   * get products transaction status
   *
   * @param   {string} productId  corresponding product id
   * @returns {boolean}           true if transaction success, otherwise false
   */
  const getTransactionStatus = (productId) => {
    if (!checkTransactionStatus) {
      return true;
    }

    if (!tnxStatusArray.includes(productId)) {
      return false;
    }

    return true;
  };

  /**
   * navigating to home screen after clearing current transaction status
   */
  const onConfirm = async () => {
    await AsyncStorage.setItem('transactionStatus', JSON.stringify({}));
    navigation.navigate('Home');
  };

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

  const styles = StyleSheetFactory(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <SuccessScreenTickIcon width={width * 0.3} height={height * 0.15} />
        <Text style={styles.successTitle}>
          {I18n.t('transaction_completed')}
        </Text>
        <View style={styles.fromWrap}>
          <Text style={styles.fromText}>{`${I18n.t('from')}, `}</Text>
          <Text style={styles.farmerName}>{farmerName}</Text>
        </View>
      </View>

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
                  title={`${I18n.t('base_price_for')} ${parseFloat(
                    item.quantity,
                  ).toLocaleString('id')} Kg`}
                  value={`${Math.round(
                    parseFloat(item.total_amount),
                  )} ${currency}`}
                />

                <FieldView
                  title={I18n.t('total_premium_paid')}
                  value={`${Math.round(
                    parseFloat(item.premium_total),
                  )} ${currency}`}
                  hidden={userProjectDetails.premiums.length === 0}
                />

                <FieldView
                  title={I18n.t('total_amount')}
                  value={`${Math.round(parseFloat(item.total))} ${currency}`}
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
                {`${Math.round(parseFloat(total))} ${currency}`}
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
      fontFamily: theme.font_regular,
      fontSize: 20,
      textAlign: 'center',
      marginTop: 30,
    },
    fromWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
    },
    fromText: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontSize: 14,
      textAlign: 'center',
    },
    farmerName: {
      color: theme.text_1,
      fontFamily: theme.font_medium,
      fontSize: 16,
      textAlign: 'center',
    },
    bottomSection: {
      flexGrow: 1,
      paddingVertical: width * 0.04,
      paddingHorizontal: width * 0.04,
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
    buttonWrap: {
      marginVertical: 20,
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

export default TransactionCompleteScreen;

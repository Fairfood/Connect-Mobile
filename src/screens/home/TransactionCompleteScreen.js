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
} from '../../assets/svg';
import CustomButton from '../../components/CustomButton';
import I18n from '../../i18n/i18n';
import * as consts from '../../services/constants';

const { height, width } = Dimensions.get('window');

const TransactionCompleteScreen = ({ navigation, route }) => {
  const { farmerName, total, transactionArray, checkTransactionStatus } =
    route.params;
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

  const setupInitialValues = async () => {
    let transactionStatus =
      (await AsyncStorage.getItem('transactionStatus')) || '{}';
    transactionStatus = JSON.parse(transactionStatus);

    if (transactionStatus.buy) {
      setTnxStatusArray(transactionStatus.buy);
    }

    setLoading(false);
  };

  const getTransactionStatus = (productId) => {
    if (!checkTransactionStatus) {
      return true;
    }

    if (!tnxStatusArray.includes(productId)) {
      return false;
    }

    return true;
  };

  const onConfirm = async () => {
    await AsyncStorage.setItem('transactionStatus', JSON.stringify({}));
    navigation.navigate('Home');
  };

  const FieldView = ({ title, value, hidden }) => {
    if (hidden) { return null; }

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
                <Text style={styles.errorTnxwarning}>
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
                        fill={consts.ERROR_ICON_COLOR}
                      />
                    )}

                    <Text
                      style={[
                        styles.tnxStatusText,
                        {
                          color: tnxStatus
                            ? consts.TEXT_PRIMARY_LIGHT_COLOR
                            : consts.ERROR_ICON_COLOR,
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
                {`${Math.round(
                parseFloat(total),
              )} ${currency}`}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: consts.APP_BG_COLOR,
  },
  topSection: {
    width,
    height: height * 0.33,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: consts.HEADER_BACKGROUND_COLOR,
  },
  successTitle: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontFamily: consts.FONT_REGULAR,
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
    color: consts.TEXT_PRIMARY_COLOR,
    fontFamily: consts.FONT_REGULAR,
    fontSize: 14,
    textAlign: 'center',
  },
  farmerName: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontFamily: consts.FONT_MEDIUM,
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
    borderBottomColor: consts.BORDER_COLOR,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldContainer: {
    borderBottomColor: consts.BORDER_COLOR,
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
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 16,
    fontFamily: consts.FONT_MEDIUM,
  },
  fieldTitle: {
    color: '#427290',
    fontSize: 14,
    fontFamily: consts.FONT_REGULAR,
  },
  totalText: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 16,
    fontFamily: consts.FONT_BOLD,
    marginTop: height * 0.005,
  },
  fieldValue: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 14,
    fontFamily: consts.FONT_MEDIUM,
  },
  productCountText: {
    color: '#427290',
    fontSize: 16,
    fontFamily: consts.FONT_REGULAR,
  },
  transactionText: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 14,
    fontFamily: consts.FONT_REGULAR,
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
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: '600',
    fontFamily: consts.FONT_REGULAR,
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
    backgroundColor: consts.TEXT_PRIMARY_COLOR,
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
    fontFamily: consts.FONT_REGULAR,
    fontSize: 13,
    paddingLeft: width * 0.015,
  },
  errorWrap: {
    width: '100%',
    backgroundColor: 'rgba(255, 176, 170, 0.3)',
    marginBottom: 10,
    padding: 10,
    borderRadius: consts.BORDER_RADIUS,
  },
  errorTnxwarning: {
    fontFamily: consts.FONT_REGULAR,
    color: consts.ERROR_ICON_COLOR,
    fontSize: 13,
    marginHorizontal: width * 0.04,
    textAlign: 'center',
  },
});

export default TransactionCompleteScreen;

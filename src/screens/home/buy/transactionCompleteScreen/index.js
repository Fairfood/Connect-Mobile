import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  BackHandler,
  ScrollView,
  Dimensions,
  Linking,
} from 'react-native';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';
import {
  PrintInvoiceIcon,
  SuccessScreenTickIcon,
  SyncCloseIcon,
  TnxSuccessStatusIcon,
  ViewInvoiceIcon,
} from '../../../../assets/svg';
import CustomButton from '../../../../components/buttons/customButton';
import I18n from '../../../../translations/text/i18n';
import {
  NumberFormatter,
  getAlertConfig,
  getAndroidVersion,
  handleErrors,
  requestPermission,
} from '../../../../utils/commonFunctions';
import { createBuyCompleteInvoice } from '../../../../utils/createInvoice';
import TransparentButton from '../../../../components/buttons/transparentButton';
import CommonAlert from '../../../../components/modals/commonAlert';
import StyleSheetFactory from './styles';

const { height, width } = Dimensions.get('window');

const TransactionCompleteScreen = ({ navigation, route }) => {
  const { farmerName, total, transactionArray, checkTransactionStatus } =
    route.params;
  const styles = StyleSheetFactory();
  const { theme, buyTnxStatus } = useSelector((state) => state.common);
  const { buyTnxSyncingInProgress } = useSelector((state) => state.sync);
  const [tnxStatusArray, setTnxStatusArray] = useState([]);
  const [printLoading, setPrinterLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const androidVersion = getAndroidVersion();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        navigation.navigate('HomeScreen');
        return true;
      },
    );

    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    if (checkTransactionStatus) {
      setTnxStatusArray(buyTnxStatus);
    }
  }, [buyTnxSyncingInProgress]);

  /**
   * get products transaction status
   * @param   {string} productId  corresponding product id
   * @returns {boolean}           true if transaction success, otherwise false
   */
  const getTransactionStatus = (productId) => {
    if (!checkTransactionStatus) {
      return true;
    }

    if (buyTnxSyncingInProgress) {
      return true;
    }

    if (!tnxStatusArray.includes(productId)) {
      return false;
    }

    return true;
  };

  /**
   * creating alert modal based on put key
   * @param {string} key      alert modal type
   */
  const createAlert = (key) => {
    const alertObj = getAlertConfig(key);

    if (alertObj) {
      setAlert(alertObj);
      setAlertModal(true);
    }
  };

  const onPressAlert = (key) => {
    setAlertModal(false);
    setAlert(null);

    switch (key) {
      case 'no_printer_connected':
        openBluetoothSettings();
        break;
      case 'no_bluetooth_permission':
        submitBluetoothPermission();
        break;
      case 'allow_bluetooth_permission':
        submitCustomPermissionModal();
        break;
      default:
        break;
    }
  };

  const onCancelAlert = () => {
    setAlertModal(false);
    setAlert(null);
  };

  const viewInvoice = async () => {
    try {
      createBuyCompleteInvoice({
        action: 'view',
        farmerName,
        transactionArray,
        totalAmount: total,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: I18n.t('error'),
        text2: I18n.t('something_went_wrong'),
      });
      handleErrors(error, {
        ref: 'TransactionCompleteScreen_downloadInvoice',
      });
    }
  };

  const submitCustomPermissionModal = async () => {
    onCancelAlert();
    await AsyncStorage.setItem('bluetooth_allowed', 'true');
    printInvoice();
  };

  const handleValidatePrint = async () => {
    try {
      setPrinterLoading(true);
      if (androidVersion < 12) {
        const bluetoothAllowed = await AsyncStorage.getItem(
          'bluetooth_allowed',
        );

        if (!bluetoothAllowed || bluetoothAllowed !== 'true') {
          setPrinterLoading(false);
          createAlert('allow_bluetooth_permission');
          return;
        }

        printInvoice();
      } else {
        const bluetoothGranted = await requestPermission('bluetooth');
        if (!bluetoothGranted) {
          setPrinterLoading(false);
          createAlert('no_bluetooth_permission');
          return;
        }

        printInvoice();
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: I18n.t('error'),
        text2: I18n.t('something_went_wrong'),
      });
      setPrinterLoading(false);
      handleErrors(error, {
        ref: 'TransactionCompleteScreen_handleValidatePrint',
      });
    }
  };

  const printInvoice = async () => {
    try {
      const bluetoothState = await BluetoothStateManager.getState();
      if (bluetoothState !== 'PoweredOn') {
        createAlert('no_printer_connected');
        setPrinterLoading(false);
        return false;
      }

      const printStatus = await createBuyCompleteInvoice({
        action: 'print',
        farmerName,
        transactionArray,
        totalAmount: total,
      });

      setPrinterLoading(false);
      if (printStatus) {
        onCancelAlert();
      } else {
        createAlert('no_printer_connected');
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: I18n.t('error'),
        text2: I18n.t('something_went_wrong'),
      });

      setPrinterLoading(false);
      onCancelAlert();
      handleErrors(error, {
        ref: 'TransactionCompleteScreen_printInvoice',
      });
    }
  };

  const openBluetoothSettings = () => {
    try {
      onCancelAlert();
      BluetoothStateManager.openSettings();
    } catch (error) {
      handleErrors(error, {
        ref: 'TransactionCompleteScreen_openBluetoothSettings',
      });
    }
  };

  const submitBluetoothPermission = () => {
    try {
      onCancelAlert();
      Linking.openSettings();
    } catch (error) {
      handleErrors(error, {
        ref: 'TransactionCompleteScreen_submitBluetoothPermission',
      });
    }
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <SuccessScreenTickIcon width={width * 0.3} height={height * 0.15} />
        <Text style={styles.successTitle} testID="tnx-header-text">
          {I18n.t('transaction_completed')}
        </Text>
        <View style={styles.fromWrap} testID="node-details">
          <Text style={styles.fromText}>{`${I18n.t('from')}, `}</Text>
          <Text style={styles.farmerName}>{farmerName}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.bottomSection}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText} testID="tnx-details-text">
            {I18n.t('transaction_details')}
          </Text>
          <Text style={styles.productCountText} testID="tnx-products-count">
            {`${transactionArray.length} ${I18n.t('products')}`}
          </Text>
        </View>

        {checkTransactionStatus &&
          !buyTnxSyncingInProgress &&
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
              testID={`tnx-product-wrap-${index}`}
            >
              <View style={styles.fieldWrap}>
                <Text
                  style={[styles.fieldValue, { marginBottom: height * 0.005 }]}
                  testID={`tnx-product-name-${index}`}
                >
                  {item.product_name}
                </Text>
                <View style={styles.tnxStatusWrap}>
                  {buyTnxSyncingInProgress ? (
                    <Text
                      style={[
                        styles.tnxStatusText,
                        {
                          color: theme.icon_warning,
                        },
                      ]}
                    >
                      {I18n.t('syncing_')}
                    </Text>
                  ) : (
                    <>
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
                        testID={`tnx-product-sync-status-${index}`}
                      >
                        {tnxStatus ? I18n.t('success') : I18n.t('failed')}
                      </Text>
                    </>
                  )}
                </View>
              </View>

              <FieldView
                title={NumberFormatter.quantity(item.quantity_corrected, true)}
                value={NumberFormatter.currency(item.total_amount, true)}
              />

              <FieldView
                title={I18n.t('total_premium_paid')}
                value={NumberFormatter.currency(item.premium_total, true)}
              />

              <FieldView
                title={I18n.t('total_amount')}
                value={NumberFormatter.currency(item.total_corrected, true)}
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
              {NumberFormatter.currency(total, true)}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonWrap}>
        <TransparentButton
          buttonText="View invoice"
          onPress={viewInvoice}
          extraStyle={[
            styles.transparentButtonStyle,
            { width: androidVersion >= 12 ? '48%' : '100%' },
          ]}
          icon={<ViewInvoiceIcon width={20} height={20} />}
          color={theme.icon_1}
          testID="view-invoice-button"
        />
        {androidVersion >= 12 && (
          <TransparentButton
            buttonText="Print invoice"
            onPress={handleValidatePrint}
            extraStyle={styles.transparentButtonStyle}
            isLoading={printLoading}
            disabled={printLoading}
            icon={<PrintInvoiceIcon width={20} height={20} />}
            color={theme.icon_1}
            testID="print-invoice-button"
          />
        )}
      </View>

      <CustomButton
        buttonText={I18n.t('back_to_home')}
        onPress={() => navigation.navigate('HomeScreen')}
        extraStyle={styles.buttonStyle}
        testID="back-to-home-button"
      />

      {alertModal && (
        <CommonAlert
          visible={alertModal}
          title={alert.title}
          message={alert.message}
          submitText={alert.submitText}
          icon={alert.icon}
          onSubmit={() => onPressAlert(alert.key)}
          cancelText={alert?.cancelText ?? null}
          onCancel={alert?.cancelText ? onCancelAlert : null}
          onRequestClose={onCancelAlert}
        />
      )}
    </SafeAreaView>
  );
};

export default TransactionCompleteScreen;

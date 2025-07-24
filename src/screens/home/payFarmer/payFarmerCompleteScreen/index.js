import React, { useEffect } from 'react';
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
  ViewInvoiceIcon,
} from '../../../../assets/svg';
import {
  NumberFormatter,
  getAlertConfig,
  getAndroidVersion,
  handleErrors,
  requestPermission,
} from '../../../../utils/commonFunctions';
import { createPaymentCompleteInvoice } from '../../../../utils/createInvoice';
import CustomButton from '../../../../components/buttons/customButton';
import I18n from '../../../../translations/text/i18n';
import Avatar from '../../../../components/avatar';
import TransparentButton from '../../../../components/buttons/transparentButton';
import CommonAlert from '../../../../components/modals/commonAlert';
import StyleSheetFactory from './styles';

const { height, width } = Dimensions.get('window');

const PayFarmerComplete = ({ navigation, route }) => {
  const { farmer, total, paymentArray, referenceId } = route.params;
  const { theme } = useSelector((state) => state.common);
  const [printLoading, setPrinterLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const styles = StyleSheetFactory();
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
      createPaymentCompleteInvoice({
        action: 'view',
        referenceId,
        transactionArray: paymentArray,
        farmer: farmer?.name ?? null,
        total,
      });
    } catch {
      Toast.show({
        type: 'error',
        text1: I18n.t('error'),
        text2: I18n.t('something_went_wrong'),
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
        ref: 'PayFarmerCompleteScreen_handleValidatePrint',
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

      const printStatus = await createPaymentCompleteInvoice({
        action: 'print',
        referenceId,
        transactionArray: paymentArray,
        farmer: farmer?.name ?? null,
        total,
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
        ref: 'PayFarmerCompleteScreen_printInvoice',
      });
    }
  };

  const openBluetoothSettings = () => {
    try {
      onCancelAlert();
      BluetoothStateManager.openSettings();
    } catch (error) {
      handleErrors(error, {
        ref: 'PayFarmerCompleteScreen_openBluetoothSettings',
      });
    }
  };

  const submitBluetoothPermission = () => {
    try {
      onCancelAlert();
      Linking.openSettings();
    } catch (error) {
      handleErrors(error, {
        ref: 'PayFarmerCompleteScreen_submitBluetoothPermission',
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
        <Text style={styles.successTitle}>{I18n.t('transaction_created')}</Text>
        <Text style={styles.fromText}>
          {`${I18n.t('premium_complete_sub_msg')}`}
        </Text>
        <View style={styles.fromWrap}>
          <Avatar
            image={farmer.image}
            containerStyle={styles.person}
            avatarName={farmer.name}
          />
          <View style={styles.fromSubWrap}>
            <Text style={styles.farmerName}>{farmer?.name ?? ''}</Text>
            <Text style={styles.fromText}>
              {`${farmer?.city ?? ''}, ${farmer?.country ?? ''}`}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.bottomSection}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>{I18n.t('transaction_details')}</Text>
          <Text style={styles.productCountText}>
            {`${paymentArray.length} ${I18n.t('premium')}(s)`}
          </Text>
        </View>

        {paymentArray.map((item, index) => {
          return (
            <View style={styles.fieldContainer} key={index.toString()}>
              <FieldView
                title={item.premium_name}
                value={NumberFormatter.currency(item.amount_corrected, true)}
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
          />
        )}
      </View>

      <CustomButton
        buttonText={I18n.t('back_to_home')}
        onPress={() => navigation.navigate('HomeScreen')}
        extraStyle={styles.buttonStyle}
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

export default PayFarmerComplete;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
// import Collapsible from 'react-native-collapsible';
import moment from 'moment';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NumberFormatter,
  getAlertConfig,
  getAndroidVersion,
  getBuyer,
  getBuyerCard,
  getSubmissionFields,
  handleErrors,
  requestPermission,
} from '../../../utils/commonFunctions';
import { getCustomFieldValue } from '../../../utils/helperFunctions';
// import { ReportedIcon, ThinArrowDownIcon } from '../../../assets/svg';
import {
  HIT_SLOP_FIFTEEN,
  PAYMENT_INCOMING,
  PAYMENT_OUTGOING,
  TYPE_BASE_PRICE,
} from '../../../utils/constants';
import { findCard, findCardByServerId } from '../../../db/services/CardHelper';
import CustomLeftHeader from '../../../components/headers/customLeftHeader';
import I18n from '../../../translations/text/i18n';
import InvoiceModal from '../../../components/modals/invoiceModal';
import StyleSheetFactory from './styles';
import OptionMenu from '../../../components/popups/optionMenu';
import {
  MenuVerticalIcon,
  PrintInvoiceIcon,
  SyncPendingSecondaryIcon,
  ViewInvoiceIcon,
} from '../../../assets/svg';
import CommonAlert from '../../../components/modals/commonAlert';
import { getPaymentByReference } from '../../../db/services/TransactionPremiumHelper';
import { createPaymentInvoice } from '../../../utils/createInvoice';
import {
  fetchFarmerByServerId,
  findFarmer,
} from '../../../db/services/FarmerHelper';
import { findPremium } from '../../../db/services/PremiumsHelper';

const PaymentDetails = ({ navigation, route }) => {
  const { paymentItem } = route.params;
  const {
    extra_fields,
    receipt,
    verification_latitude_corrected,
    verification_longitude_corrected,
    card_id,
    server_id,
    amount_corrected,
    date,
    type,
    reference_id = '',
    premium_name = '',
    comment,
  } = paymentItem;
  const styles = StyleSheetFactory();
  const { theme } = useSelector((state) => state.common);
  const [actionLoading, setActionLoading] = useState(false);
  const [openSetUpModal, setOpenSetUpModal] = useState(false);
  const [paymentExtraFields, setPaymentExtraFields] = useState([]);
  const [cardDetails, setCardDetails] = useState(null);
  const [menuModal, setMenuModal] = useState(false);
  // const [activeCollapse, setActiveCollapse] = useState(true);
  // const [reportedDetails, setReportedDetails] = useState(null);
  const [alert, setAlert] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const [validMap, setValidMap] = useState(null);
  const androidVersion = getAndroidVersion();

  const paymentMenus = [
    {
      key: 'view_invoice',
      title: 'view_invoice',
      icon: <ViewInvoiceIcon width={22} height={22} />,
      visible: true,
    },
    {
      key: 'print_invoice',
      title: 'print_invoice',
      icon: <PrintInvoiceIcon width={22} height={22} />,
      visible: androidVersion >= 12,
    },
  ];

  useEffect(() => {
    setupDetails();
  }, []);

  /**
   * setting initial values
   */
  const setupDetails = async () => {
    if (extra_fields) {
      const extraFields = await getSubmissionFields(extra_fields);
      setPaymentExtraFields(extraFields);
    }

    if (verification_latitude_corrected && verification_longitude_corrected) {
      setValidMap(true);
    } else {
      setValidMap(false);
    }

    if (card_id) {
      if (type === PAYMENT_INCOMING) {
        const buyerCard = await getBuyerCard(card_id, 'id');
        setCardDetails(buyerCard);
      } else {
        let card = null;
        card = await findCardByServerId(card_id);

        if (card.length !== 0) {
          setCardDetails(card[0]);
        } else {
          card = await findCard(card_id);
          setCardDetails(card);
        }
      }
    }

    // if (is_reported) {
    //   let reportedData = reported;
    //   if (reportedData && typeof reportedData === 'string') {
    //     reportedData = stringToJson(reportedData);
    //   }
    //   setReportedDetails(reportedData);
    // }
  };

  const openGoogleMap = () => {
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${verification_latitude_corrected}%2C${verification_longitude_corrected}`,
    );
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

  const onPressMenu = (key) => {
    setMenuModal(false);
    if (key === 'view_invoice') {
      handleInvoice('view');
    } else if (key === 'print_invoice') {
      handleInvoice('print');
    }
  };

  const getUpdatedPaymentArray = async (array) => {
    try {
      const buyer = await getBuyer();
      for (const tx of array) {
        if (!tx.node_name || !tx.premium_name) {
          let node = null;

          if (tx.type === PAYMENT_OUTGOING) {
            if (tx.destination === '') {
              node = await findFarmer(tx.node_id, true);
            } else {
              node = await fetchFarmerByServerId(tx.destination);
              if (node.length === 0) {
                node = await findFarmer(tx.node_id, true);
              } else {
                node = node?.[0] ?? null;
              }
            }
          } else {
            node = buyer;
          }

          const premium =
            tx.category === TYPE_BASE_PRICE
              ? { name: 'Base price' }
              : await findPremium(tx.premium_id, true);

          tx.node_name = node?.name ?? 'Not available';
          tx.node_image = node?.image ?? '';
          tx.premium_name = premium?.name ?? 'Not available';
        }
      }

      return array;
    } catch (error) {
      handleErrors(error, {
        ref: 'PaymentDetails_getUpdatedPaymentArray',
      });
    }
  };

  const handleInvoice = async (action) => {
    try {
      if (!reference_id) {
        Toast.show({
          type: 'error',
          text1: I18n.t('invoice_not_found'),
          text2: I18n.t('could_not_find_invoice'),
        });
        return;
      }

      setActionLoading(true);

      if (action === 'print') {
        if (androidVersion < 12) {
          const bluetoothAllowed = await AsyncStorage.getItem(
            'bluetooth_allowed',
          );

          if (!bluetoothAllowed || bluetoothAllowed !== 'true') {
            setActionLoading(false);
            createAlert('allow_bluetooth_permission');
            return;
          }
        } else {
          const bluetoothGranted = await requestPermission('bluetooth');
          if (!bluetoothGranted) {
            setActionLoading(false);
            createAlert('no_bluetooth_permission');
            return;
          }
        }
      }

      const refData = await getPaymentByReference(reference_id);

      if (refData.length === 0) {
        Toast.show({
          type: 'error',
          text1: I18n.t('invoice_not_found'),
          text2: I18n.t('could_not_find_invoice_id'),
        });
        setActionLoading(false);
        return;
      }

      const updatedArray = await getUpdatedPaymentArray(refData);

      const invoiceData = {
        action,
        referenceId: reference_id,
        transactionArray: updatedArray,
      };

      if (action === 'view') {
        viewInvoice(invoiceData);
      } else {
        printInvoice(invoiceData);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: I18n.t('error'),
        text2: I18n.t('something_went_wrong'),
      });
      handleErrors(error, {
        ref: 'PaymentDetails_handleInvoice',
      });
      setActionLoading(false);
    }
  };

  const viewInvoice = async (invoiceData) => {
    await createPaymentInvoice(invoiceData);
    setActionLoading(false);
  };

  const printInvoice = async (invoiceData) => {
    try {
      const bluetoothState = await BluetoothStateManager.getState();
      if (bluetoothState !== 'PoweredOn') {
        createAlert('no_printer_connected');
        setActionLoading(false);
        return false;
      }

      const printStatus = await createPaymentInvoice(invoiceData);

      setActionLoading(false);
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
      handleErrors(error, {
        ref: 'PaymentDetails_printInvoice',
      });
      setActionLoading(false);
    }
  };

  const openBluetoothSettings = () => {
    try {
      onCancelAlert();
      BluetoothStateManager.openSettings();
    } catch (error) {
      handleErrors(error, {
        ref: 'PaymentDetails_openBluetoothSettings',
      });
      setActionLoading(false);
    }
  };

  const submitBluetoothPermission = () => {
    try {
      onCancelAlert();
      Linking.openSettings();
    } catch (error) {
      handleErrors(error, {
        ref: 'PaymentDetails_submitBluetoothPermission',
      });
      setActionLoading(false);
    }
  };

  const submitCustomPermissionModal = async () => {
    onCancelAlert();
    await AsyncStorage.setItem('bluetooth_allowed', 'true');
    printInvoice();
  };

  // const goToReportPage = () => {
  //   navigation.navigate('ReportPayment', {
  //     paymentItem,
  //   });
  // };

  return (
    <SafeAreaView style={styles.container}>
      <CustomLeftHeader
        title={I18n.t('payment_details')}
        rightIcon={<MenuVerticalIcon width={22} height={22} />}
        onPressRightIcon={
          !actionLoading ? () => setMenuModal(!menuModal) : () => {}
        }
        onPress={() => navigation.goBack(null)}
        extraStyle={{ paddingHorizontal: 20 }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {menuModal && (
          <OptionMenu
            visible={menuModal}
            onPress={onPressMenu}
            menus={paymentMenus}
            hideModal={() => setMenuModal(false)}
          />
        )}

        {actionLoading && (
          <ActivityIndicator size="small" color={theme.icon_1} />
        )}

        {(server_id === '' || server_id == null) && (
          <View style={styles.syncWarningWrap}>
            <View style={{ marginHorizontal: 10, marginVertical: 5 }}>
              <SyncPendingSecondaryIcon />
            </View>
            <Text style={styles.syncMsg}>
              {I18n.t('this_transaction_is_not_synced_to_the_server')}
            </Text>
          </View>
        )}

        {/* {is_reported && reportedDetails && (
          <TouchableOpacity
            onPress={() => setActiveCollapse(!activeCollapse)}
            style={styles.errorWrap}
          >
            <View style={styles.errorTitleWrap}>
              <ReportedIcon width={width * 0.06} height={width * 0.06} />
              <Text style={styles.errorTile}>
                {I18n.t('transaction_reported')}
              </Text>
              <View style={styles.arrowWrap}>
                <ThinArrowDownIcon
                  width={width * 0.035}
                  height={width * 0.035}
                  fill={theme.primary}
                />
              </View>
            </View>
            <Collapsible collapsed={activeCollapse} align="center">
              <View style={styles.errorMessageWrap}>
                <View style={styles.leftColumn}>
                  <View style={styles.bulletin} />
                </View>
                <View style={styles.rightColumn}>
                  <Text style={styles.errorMessage}>
                    {I18n.t(reportedDetails.report_category)}
                  </Text>
                </View>
              </View>

              <View style={styles.errorMessageWrap}>
                <View style={styles.leftColumn}>
                  <View style={styles.bulletin} />
                </View>
                <View style={styles.rightColumn}>
                  <Text style={styles.errorMessage}>
                    {reportedDetails.report_message}
                  </Text>
                </View>
              </View>
            </Collapsible>
          </TouchableOpacity>
        )} */}

        {reference_id !== '' && (
          <View style={styles.formTitleContainer}>
            <Text style={styles.formSubTitle}>{I18n.t('reference_id')}</Text>
            <Text style={styles.formTitle}>{reference_id}</Text>
          </View>
        )}

        <View style={styles.formTitleContainer}>
          <Text style={styles.formSubTitle}>{I18n.t('payment_type')}</Text>
          <Text style={styles.formTitle}>
            {premium_name || `[${I18n.t('not_available')}]`}
          </Text>
        </View>

        <View style={styles.formTitleContainer}>
          <Text style={styles.formSubTitle}>{I18n.t('amount')}</Text>
          <Text style={styles.formTitle}>
            {NumberFormatter.currency(amount_corrected, true)}
          </Text>
        </View>

        <View style={styles.formTitleContainer}>
          <Text style={styles.formSubTitle}>{I18n.t('transaction_date')}</Text>
          <Text style={styles.formTitle}>
            {moment(date * 1000).format('DD MMM YYYY hh:mm a')}
          </Text>
        </View>

        {comment && (
          <View style={styles.formTitleContainer}>
            <Text style={styles.formSubTitle}>{I18n.t('comment')}</Text>
            <Text style={styles.formTitle}>{comment}</Text>
          </View>
        )}

        {paymentExtraFields.map((i, n) => {
          return (
            <View key={n.toString()} style={styles.formTitleContainer}>
              <Text style={styles.formSubTitle}>{i?.label || i.key}</Text>
              <Text style={styles.formTitle}>{getCustomFieldValue(i)}</Text>
            </View>
          );
        })}

        {cardDetails && (
          <View style={styles.formTitleContainer}>
            <Text style={styles.formSubTitle}>
              {`${I18n.t('card_id')} / ${I18n.t('display_id')}`}
            </Text>
            <Text style={styles.formTitle}>
              {`${cardDetails.card_id || '-'} / ${
                cardDetails.display_id !== ''
                  ? `FF ${cardDetails.display_id}`
                  : '-'
              }`}
            </Text>
          </View>
        )}

        {receipt && (
          <View style={styles.formTitleContainer}>
            <Text
              style={[styles.formTitle, { fontSize: 15, marginBottom: 10 }]}
            >
              {I18n.t('verification_image')}
            </Text>
            <View style={styles.viewImage}>
              <TouchableOpacity
                onPress={() => setOpenSetUpModal(true)}
                hitSlop={HIT_SLOP_FIFTEEN}
              >
                <Text style={styles.viewImageButtonText}>
                  {`${I18n.t('view_image')} >`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {validMap && (
          <View style={styles.formTitleContainer}>
            <Text style={styles.formSubTitle}>Location</Text>
            <TouchableOpacity
              onPress={openGoogleMap}
              style={styles.mapImageWrap}
            >
              <Image
                source={require('../../../assets/images/map.png')}
                style={styles.mapImage}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* {!is_reported && (
          <View style={styles.reportSectionWrap}>
            <Text style={styles.reportTitleText}>
              {I18n.t('trouble_in_transaction')}
            </Text>
            <TouchableOpacity
              onPress={goToReportPage}
              hitSlop={HIT_SLOP_FIFTEEN}
            >
              <Text style={styles.reportButtonText}>
                {`${I18n.t('report_issue')} >`}
              </Text>
            </TouchableOpacity>
          </View>
        )} */}

        {openSetUpModal && (
          <View style={{ flex: 1, position: 'absolute' }}>
            <InvoiceModal
              openSetUpModal={openSetUpModal}
              closeModal={() => setOpenSetUpModal(false)}
              imageUri={receipt}
            />
          </View>
        )}

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
      </ScrollView>
    </SafeAreaView>
  );
};

export default PaymentDetails;

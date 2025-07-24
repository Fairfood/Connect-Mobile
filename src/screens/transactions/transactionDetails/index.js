import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
// import { useFocusEffect } from '@react-navigation/native';
// import Collapsible from 'react-native-collapsible';
import moment from 'moment';
import Toast from 'react-native-toast-message';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';
import {
  NumberFormatter,
  deleteTransaction,
  getAlertConfig,
  getAndroidVersion,
  getBuyer,
  getBuyerCard,
  getSubmissionFields,
  handleErrors,
  requestPermission,
  getCurrency,
} from '../../../utils/commonFunctions';
import { getCustomFieldValue } from '../../../utils/helperFunctions';
import {
  fetchAllPremiumsByTransaction,
  fetchPremiumsByTransactionAndCategory,
  updateTransactionPremium,
} from '../../../db/services/TransactionPremiumHelper';
import { initiateSync } from '../../../sync/SyncInitials';
import { findPremium } from '../../../db/services/PremiumsHelper';
import {
  countErroredTransactions,
  getTransactionByReference,
  updateTransaction,
} from '../../../db/services/TransactionsHelper';
import {
  DeleteBinIcon,
  MenuVerticalIcon,
  PrintInvoiceIcon,
  SyncPendingSecondaryIcon,
  ViewInvoiceIcon,
  // ReportedIcon,
  // ThinArrowDownIcon,
} from '../../../assets/svg';
import {
  TYPE_TRANSACTION_PREMIUM,
  APP_TRANS_TYPE_INCOMING,
  HIT_SLOP_FIFTEEN,
  APP_TRANS_TYPE_OUTGOING,
} from '../../../utils/constants';
import CustomLeftHeader from '../../../components/headers/customLeftHeader';
import TransactionDetailsCard from '../../../components/cards/transactionDetailsCard';
import I18n from '../../../translations/text/i18n';
import CommonAlert from '../../../components/modals/commonAlert';
import DeleteTransactionView from '../../../components/deleteTransactionView';
import InvoiceModal from '../../../components/modals/invoiceModal';
import StyleSheetFactory from './styles';
import OptionMenu from '../../../components/popups/optionMenu';
import { findProduct } from '../../../db/services/ProductsHelper';
import {
  fetchFarmerByServerId,
  findFarmer,
} from '../../../db/services/FarmerHelper';
import { createBuyTransactionInvoice } from '../../../utils/createInvoice';
import { findCard } from '../../../db/services/CardHelper';

const TransactionDetails = ({ navigation, route }) => {
  const { transactionItem } = route.params;
  const {
    id,
    type,
    server_id,
    error,
    is_deleted,
    current_quantity_corrected,
    extra_fields,
    card_id,
    reference_id,
    node_name,
    product_name,
    quantity_corrected,
    product_price_corrected,
    price_corrected,
    total_corrected,
    created_on,
    invoice_file,
  } = transactionItem;
  const styles = StyleSheetFactory();

  const { theme } = useSelector((state) => state.common);
  const { userCompanyDetails } = useSelector((state) => state.login);
  const { quality_correction } = userCompanyDetails;
  const [openSetUpModal, setOpenSetUpModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [premiums, setPremiums] = useState([]);
  const [localPrice, setLocalPrice] = useState('');
  const [buyTnxFields, setBuyTnxFields] = useState([]);
  const [cardDetails, setCardDetails] = useState(null);
  const [menuModal, setMenuModal] = useState(false);
  const [alert, setAlert] = useState(null);
  const [alertModal, setAlertModal] = useState(false);

  // const [activeCollapse, setActiveCollapse] = useState(true);
  // const [reportedDetails, setReportedDetails] = useState(null);
  const androidVersion = getAndroidVersion();

  const transactionMenus = [
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
    {
      key: 'delete',
      title: 'delete',
      icon: <DeleteBinIcon width={22} height={22} />,
      visible:
        ((server_id === '' || server_id == null) && error !== '') ||
        (!is_deleted &&
          type === APP_TRANS_TYPE_INCOMING &&
          current_quantity_corrected !== 0),
    },
  ];

  useEffect(() => {
    setupDetails();
  }, []);

  /**
   * setting initial values
   */
  const setupDetails = async () => {
    if (type === APP_TRANS_TYPE_INCOMING) {
      const savedLocalPrice = await AsyncStorage.getItem('LocalPrice');
      if (savedLocalPrice) {
        setLocalPrice(savedLocalPrice);
      }

      if (transactionItem?.extra_fields) {
        const extraFields = await getSubmissionFields(extra_fields);
        setBuyTnxFields(extraFields);
      }

      if (card_id) {
        const card = await findCard(card_id);
        if (card) {
          setCardDetails(card);
        }
      }
    } else if (type === APP_TRANS_TYPE_OUTGOING && card_id) {
      const buyerCard = await getBuyerCard(card_id, 'id');
      setCardDetails(buyerCard);
    }

    const transactionPremiums = await fetchPremiumsByTransactionAndCategory(
      id,
      TYPE_TRANSACTION_PREMIUM,
    );

    const transPremiums = await Promise.all(
      transactionPremiums.map(async (p) => {
        const premium = await findPremium(p.premium_id);
        premium.total = p.amount_corrected;
        return premium;
      }),
    );
    setPremiums(transPremiums);

    // if (is_reported) {
    //   let reportedData = reported;

    //   if (reportedData && typeof reportedData === 'string') {
    //     reportedData = stringToJson(reportedData);
    //   }

    //   setReportedDetails(reportedData);
    // }
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
      case 'delete_transaction':
        handleDelete();
        break;
      default:
        break;
    }
  };

  const onCancelAlert = () => {
    setAlertModal(false);
    setAlert(null);
  };

  /**
   * delete transaction
   */
  const handleDelete = async () => {
    if (type === APP_TRANS_TYPE_INCOMING && error === '') {
      await disableTransaction(id);
    } else {
      await deleteTransaction(transactionItem, type);
    }

    const count = await countErroredTransactions();
    if (count === 0) {
      initiateSync();
    }

    onCancelAlert();
    navigation.goBack();
  };

  const disableTransaction = async (transactionId) => {
    await updateTransaction(transactionId, {
      is_deleted: true,
      is_edited: server_id !== '',
    });

    // delete transaction premiums
    const transactionPremiums = await fetchAllPremiumsByTransaction(
      transactionId,
    );
    await Promise.all(
      transactionPremiums.map(async (premium) => {
        await updateTransactionPremium(premium.id, {
          is_deleted: true,
          is_edited: server_id !== '',
        });
      }),
    );
  };

  // const goToReportPage = () => {
  //   navigation.navigate('ReportTransaction', {
  //     transactionItem,
  //   });
  // };

  const onPressMenu = (key) => {
    setMenuModal(false);
    if (key === 'view_invoice') {
      handleInvoice('view');
    } else if (key === 'print_invoice') {
      handleInvoice('print');
    } else if (key === 'delete') {
      createAlert('delete_transaction');
    }
  };

  const getUpdatedTransactionArray = async (array) => {
    try {
      const buyer = await getBuyer();

      for (const tx of array) {
        if (!tx.node_name || !tx.product_name) {
          let product = null;
          let node = null;
          if (tx?.product_id) {
            product = await findProduct(tx.product_id, true);
          }
          if (tx.type === APP_TRANS_TYPE_INCOMING) {
            node = await findFarmer(tx.node_id, true);
            if (!node) {
              node = await fetchFarmerByServerId(tx.node_id, true);
              node = node?.[0] ?? null;
            }
          } else if (tx.type === APP_TRANS_TYPE_OUTGOING) {
            node = buyer;
          }

          tx.product_name = product?.name ?? 'Not available';
          tx.node_name = node?.name ?? 'Not available';
          tx.node_image = node?.image ?? '';
        }
      }

      return array;
    } catch (err) {
      handleErrors(err, {
        ref: 'TransactionDetails_getUpdatedTransactionArray',
      });
      setActionLoading(false);
    }
  };

  const handleInvoice = async (action) => {
    try {
      const referenceId = transactionItem?.reference_id ?? null;

      if (!referenceId) {
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

      const refData = await getTransactionByReference(referenceId);

      if (refData.length === 0) {
        Toast.show({
          type: 'error',
          text1: I18n.t('invoice_not_found'),
          text2: I18n.t('could_not_find_invoice_id'),
        });
        setActionLoading(false);
        return;
      }

      const updatedArray = await getUpdatedTransactionArray(refData);

      const invoiceData = {
        action,
        referenceId,
        transactionArray: updatedArray,
      };

      if (action === 'view') {
        viewInvoice(invoiceData);
      } else {
        printInvoice(invoiceData);
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: I18n.t('error'),
        text2: I18n.t('something_went_wrong'),
      });
      handleErrors(err, {
        ref: 'TransactionDetails_handleInvoice',
      });
      setActionLoading(false);
    }
  };

  const viewInvoice = async (invoiceData) => {
    await createBuyTransactionInvoice(invoiceData);
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

      const printStatus = await createBuyTransactionInvoice(invoiceData);

      setActionLoading(false);
      if (printStatus) {
        onCancelAlert();
      } else {
        createAlert('no_printer_connected');
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: I18n.t('error'),
        text2: I18n.t('something_went_wrong'),
      });
      handleErrors(err, {
        ref: 'TransactionDetails_printInvoice',
      });
      setActionLoading(false);
    }
  };

  const openBluetoothSettings = () => {
    try {
      onCancelAlert();
      BluetoothStateManager.openSettings();
    } catch (err) {
      handleErrors(err, {
        ref: 'TransactionDetails_openBluetoothSettings',
      });
      setActionLoading(false);
    }
  };

  const submitBluetoothPermission = () => {
    try {
      onCancelAlert();
      Linking.openSettings();
    } catch (err) {
      handleErrors(err, {
        ref: 'TransactionDetails_submitBluetoothPermission',
      });
      setActionLoading(false);
    }
  };

  const submitCustomPermissionModal = async () => {
    onCancelAlert();
    await AsyncStorage.setItem('bluetooth_allowed', 'true');
    // printInvoice();
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomLeftHeader
        title={I18n.t('transaction_details')}
        onPress={() => navigation.goBack(null)}
        rightIcon={<MenuVerticalIcon width={22} height={22} />}
        onPressRightIcon={
          !actionLoading ? () => setMenuModal(!menuModal) : () => {}
        }
        extraStyle={{ paddingHorizontal: 20 }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {menuModal && (
          <OptionMenu
            visible={menuModal}
            onPress={onPressMenu}
            menus={transactionMenus}
            hideModal={() => setMenuModal(false)}
          />
        )}

        {actionLoading && (
          <ActivityIndicator size="small" color={theme.icon_1} />
        )}

        {(server_id === '' || server_id == null) && error === '' && (
          <View style={styles.syncWarningWrap}>
            <View style={{ marginHorizontal: 10, marginVertical: 5 }}>
              <SyncPendingSecondaryIcon />
            </View>
            <Text style={[styles.syncMsg, { width: '85%' }]}>
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

        {(server_id === '' || server_id == null) && error !== '' && (
          <DeleteTransactionView error={error} />
        )}

        {reference_id !== '' && (
          <View style={styles.formTitleContainer}>
            <Text style={styles.formSubTitle}>{I18n.t('reference_id')}</Text>
            <Text style={styles.formTitle}>{reference_id}</Text>
          </View>
        )}

        <View style={styles.formTitleContainer}>
          <Text style={styles.formSubTitle}>
            {type === APP_TRANS_TYPE_INCOMING
              ? I18n.t('transaction_received_from')
              : I18n.t('transaction_delivered_to')}
          </Text>
          <Text style={[styles.formTitle, { textTransform: 'capitalize' }]}>
            {node_name || `[${I18n.t('not_available')}]`}
          </Text>
        </View>

        <View style={styles.formTitleContainer}>
          <Text style={styles.formSubTitle}>{I18n.t('product')}</Text>
          <Text style={styles.formTitle}>
            {product_name || `[${I18n.t('not_available')}]`}
          </Text>
        </View>

        <View style={styles.formTitleContainer}>
          <Text style={styles.formSubTitle}>
            {type === APP_TRANS_TYPE_INCOMING
              ? `${I18n.t('total_quantity')} Kg`
              : `${I18n.t('total_quantity_delivered')} Kg`}
          </Text>
          <Text style={styles.formTitle}>
            {NumberFormatter.quantity(quantity_corrected)}
          </Text>
        </View>

        <View style={styles.formTitleContainer}>
          <Text style={styles.formSubTitle}>{I18n.t('transaction_date')}</Text>
          <Text style={styles.formTitle}>
            {moment(created_on * 1000).format('DD MMM YYYY hh:mm a')}
          </Text>
        </View>

        {buyTnxFields.map((i, n) => {
          return (
            <View key={n.toString()} style={styles.formTitleContainer}>
              <Text style={styles.formSubTitle}>{i.label || i.key}</Text>
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
              {`${cardDetails.card_id || '-'} ${
                cardDetails.display_id !== ''
                  ? `/ FF ${cardDetails.display_id}`
                  : '-'
              }`}
            </Text>
          </View>
        )}

        {invoice_file !== '' && invoice_file != null && (
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

        <View style={styles.cardWrap}>
          <TransactionDetailsCard
            type={type}
            productName={product_name}
            productQuantity={quantity_corrected}
            productPrice={product_price_corrected}
            price={price_corrected}
            premiums={premiums}
            totalPrice={total_corrected}
            localPrice={localPrice}
            qualityCorrectionEnabled={quality_correction}
            currency={getCurrency('code')}
          />
        </View>

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
              imageUri={invoice_file}
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

export default TransactionDetails;

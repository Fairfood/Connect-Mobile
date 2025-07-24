/* eslint-disable no-unused-vars */
import React, { memo, useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  SafeAreaView,
  Text,
  Dimensions,
  SectionList,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';
import FileViewer from 'react-native-file-viewer';
import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as Progress from 'react-native-progress';
import { updateSyncPercentage } from '../../../redux/LoginStore';
import {
  ExportAlertIcon,
  ExportIcon,
  FilterIcon,
  MenuVerticalIcon,
} from '../../../assets/svg';
import {
  exportCsv,
  getAlertConfig,
  getAndroidVersion,
  getBuyer,
  handleErrors,
  requestPermission,
  updateSyncIcon,
} from '../../../utils/commonFunctions';
import {
  countFarmerSyncPending,
  fetchFarmerByServerId,
  findFarmer,
} from '../../../db/services/FarmerHelper';
import { findPremium } from '../../../db/services/PremiumsHelper';
import { findProduct } from '../../../db/services/ProductsHelper';
import {
  countDeletedTransactions,
  countErroredTransactions,
  countNewTransactions,
  fetchAllTransactions,
  getTransactionByReference,
} from '../../../db/services/TransactionsHelper';
import {
  createPaymentInvoice,
  createBuyTransactionInvoice,
} from '../../../utils/createInvoice';
import {
  fetchAllTransactionPremiums,
  getPaymentByReference,
} from '../../../db/services/TransactionPremiumHelper';
import CustomHeader from '../../../components/headers/customHeader';
import SearchComponent from '../../../components/searchComponent';
import TransactionListItem from '../../../components/lists/transactionListItem';
import I18n from '../../../translations/text/i18n';
import SyncComponent from '../../../components/syncComponent';
import TransactionFilter from '../../../components/filters/transactionFilter';
import PaymentFilter from '../../../components/filters/paymentFilter';
import CommonAlert from '../../../components/modals/commonAlert';
import {
  APP_TRANS_TYPE_INCOMING,
  APP_TRANS_TYPE_OUTGOING,
  HIT_SLOP_TEN,
  PAYMENT_OUTGOING,
  TYPE_BASE_PRICE,
} from '../../../utils/constants';
import StyleSheetFactory from './styles';
import {
  getPaymentFilteredData,
  getReadablePaymentData,
  getReadableTransactionData,
  getSectionListData,
  getTransactionFilteredData,
} from './controller';
import PaymentListItem from '../../../components/lists/paymentListItem';
import {
  updatePaymentSearchText,
  updateTnxSearchText,
} from '../../../redux/CommonStore';

const { width } = Dimensions.get('window');

const TransactionHomeScreen = ({ navigation }) => {
  const tnxSearchTextRef = useRef();
  const paymentSearchTextRef = useRef();
  const styles = StyleSheetFactory();
  const { theme, tnxSearchText, paymentSearchText } = useSelector(
    (state) => state.common,
  );
  const { syncInProgress, syncSuccessful } = useSelector(
    (state) => state.login,
  );
  const { isConnected } = useSelector((state) => state.connection);
  const {
    tnxSyncing,
    tnxSyncCount,
    tnxSyncTotal,
    tnxSyncStatus,
    tnxSyncStage,
  } = useSelector((state) => state.sync);

  tnxSearchTextRef.current = tnxSearchText;
  paymentSearchTextRef.current = paymentSearchText;

  const transactionFilterItemRef = useRef(null);
  const paymentFilterItemRef = useRef(null);
  const [transactionsList, setTransactionsList] = useState([]);
  const [paymentList, setPaymentList] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [transactionSearch, setTransactionSearch] = useState(tnxSearchText);
  const [paymentSearch, setPaymentSearch] = useState(paymentSearchText);
  const [syncModal, setSyncModal] = useState(false);
  const [transactionFilterItem, setTransactionFilterItem] = useState(null);
  const [transactionFilterModal, setTransactionFilterModal] = useState(false);
  const [paymentFilterItem, setPaymentFilterItem] = useState(null);
  const [paymentFilterModal, setPaymentFilterModal] = useState(false);
  const [transactionFilterApplied, setTransactionFilterApplied] =
    useState(false);
  const [paymentFilterApplied, setPaymentFilterApplied] = useState(false);
  const [allTransactionData, setAllTransactionData] = useState([]);
  const [allPaymentData, setAllPaymentData] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [alertModal, setAlertModal] = useState(false);
  const [exportAlertModal, setExportAlertModal] = useState(false);
  const [exportInProgress, setExportInProgress] = useState(false);
  const [printLoading, setPrinterLoading] = useState(false);
  const [dropdownMenu, setDropdownMenu] = useState(false);
  const dispatch = useDispatch();
  const androidVersion = getAndroidVersion();

  const dropdownMenuList = [
    {
      key: 'filter',
      label: 'filter',
      icon: <FilterIcon width={18} height={18} fill={theme.icon_1} />,
    },
    {
      key: 'export',
      label: 'export',
      icon: <ExportIcon width={18} height={18} fill={theme.icon_1} />,
    },
  ];

  useFocusEffect(
    useCallback(() => {
      if (!tnxSyncing && !syncInProgress) {
        setUpTransactionValues();
        setUpPaymentValues();
      }
      return () => {};
    }, [tnxSyncing, syncInProgress]),
  );

  useFocusEffect(
    useCallback(() => {
      updateSyncIcon();
      return () => {};
    }, [isConnected, syncInProgress, syncSuccessful]),
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        dispatch(updateTnxSearchText(transactionSearch));
        dispatch(updatePaymentSearchText(paymentSearch));
      };
    }, [transactionSearch, paymentSearch]),
  );

  /**
   * setting initial values and sorting transaction list
   */
  const setUpTransactionValues = async () => {
    const allTransaction = await fetchAllTransactions();
    const updatedArray = await getUpdatedTransactionArray(allTransaction);
    setAllTransactionData(updatedArray);

    if (transactionFilterItemRef.current === null) {
      if (tnxSearchTextRef?.current) {
        onSearch(0, tnxSearchTextRef.current, updatedArray);
      } else {
        const listData = await getSectionListData('transaction', updatedArray);
        setTransactionsList(listData);
      }
    } else {
      applyTransactionFilters(
        transactionFilterItemRef.current,
        true,
        updatedArray,
      );
    }
  };

  /**
   * setting initial values and sorting transaction list
   */
  const setUpPaymentValues = async () => {
    const allTransactionPremium = await fetchAllTransactionPremiums();
    const updatedArray = await getUpdatedPaymentArray(allTransactionPremium);
    setAllPaymentData(updatedArray);

    if (paymentFilterItemRef.current === null) {
      if (paymentSearchTextRef?.current) {
        onSearch(1, paymentSearchTextRef.current, updatedArray);
      } else {
        const listData = await getSectionListData('payment', updatedArray);
        setPaymentList(listData);
      }
    } else {
      applyPaymentFilters(paymentFilterItemRef.current, true, updatedArray);
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
    } catch (error) {
      handleErrors(error, {
        ref: 'TransactionHomeScreen_getUpdatedTransactionArray',
      });
    }
  };

  const getUpdatedPaymentArray = async (array) => {
    try {
      const buyer = JSON.parse(await AsyncStorage.getItem('buyer'));
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
            node = buyer || null;
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
        ref: 'TransactionHomeScreen_getUpdatedPaymentArray',
      });
    }
  };

  /**
   * redirecting to transaction details page
   * @param {object} item transaction list item
   */
  const onSelectTransaction = useCallback(
    (item) => {
      navigation.navigate('TransactionDetails', { transactionItem: item });
    },
    [navigation],
  );

  /**
   * redirecting to payment details page
   * @param {object} item payment list item
   */
  const onSelectPayment = useCallback(
    (item) => {
      navigation.navigate('PaymentDetails', { paymentItem: item });
    },
    [navigation],
  );

  /**
   * sorting transaction list based on search text
   * @param {string} text farmer name
   */
  const onSearch = async (tab, text, dataArray = null) => {
    setDropdownMenu(false);
    const textSearch = text.toLowerCase();

    if (tab === 0) {
      setTransactionSearch(text);

      if (!dataArray && transactionFilterItemRef?.current) {
        const [filteredTransactions] = await getTransactionFilteredData(
          allTransactionData,
          transactionFilterItemRef.current,
        );
        dataArray = filteredTransactions;
      }

      const searchArray = dataArray || allTransactionData;

      if (textSearch === '') {
        const listData = await getSectionListData('transaction', searchArray);
        setTransactionsList(listData);
        setTransactionSearch('');
      } else {
        const filteredTransactions = searchArray.filter(
          (pay) =>
            pay.node_name?.toLowerCase().includes(textSearch.toLowerCase()) ||
            pay.product_name?.toLowerCase().includes(textSearch.toLowerCase()),
        );

        const listData = await getSectionListData(
          'transaction',
          filteredTransactions,
        );
        setTransactionsList(listData);
      }
    } else {
      setPaymentSearch(text);

      if (!dataArray && paymentFilterItemRef?.current) {
        const [filteredPayments] = await getPaymentFilteredData(
          allPaymentData,
          paymentFilterItemRef.current,
        );
        dataArray = filteredPayments;
      }

      const searchArray = dataArray || allPaymentData;

      if (textSearch === '') {
        const listData = await getSectionListData('payment', searchArray);
        setPaymentList(listData);
        setPaymentSearch('');
      } else {
        const filteredPayments = searchArray.filter(
          (pay) =>
            pay.node_name?.toLowerCase().includes(textSearch.toLowerCase()) ||
            pay.premium_name?.toLowerCase().includes(textSearch.toLowerCase()),
        );

        const listData = await getSectionListData('payment', filteredPayments);
        setPaymentList(listData);
      }
    }
  };

  /**
   * start syncing
   */
  const checkSyncing = useCallback(async () => {
    await setInitialValues();
    setSyncModal(true);
  }, []);

  /**
   * setting initial sync data
   * @returns {boolean} true
   */
  const setInitialValues = async () => {
    try {
      if (!syncInProgress) {
        const farmerPending = await countFarmerSyncPending();
        const newTransactions = await countNewTransactions();
        const erroredTransactions = await countErroredTransactions();
        const deletedTransactions = await countDeletedTransactions();

        let obj = await AsyncStorage.getItem('syncData');
        obj = JSON.parse(obj);

        const totalCount =
          farmerPending + newTransactions + deletedTransactions;

        if (farmerPending > 0) {
          obj.farmer.pending = farmerPending;
          obj.farmer.status = 'pending';
        }

        if (newTransactions > 0) {
          obj.transaction.pending = newTransactions + deletedTransactions;
          obj.transaction.failed = erroredTransactions;
          obj.transaction.status =
            erroredTransactions > 0 ? 'failed' : 'pending';
        }

        await AsyncStorage.setItem('syncData', JSON.stringify(obj));
        dispatch(updateSyncPercentage([0, totalCount]));
      }
      return true;
    } catch (err) {
      handleErrors(err);
    }
  };

  /**
   * apply filter on transaction list
   * @param {object}  filter            filter object
   * @param {boolean} applied           true if filter applied, false if not applied
   * @param {Array}   transactionArray  array that want to be filtered
   */
  const applyTransactionFilters = async (
    filter,
    applied,
    transactionArray = null,
  ) => {
    transactionFilterItemRef.current = filter;
    setTransactionFilterItem(filter);

    if (!applied) {
      if (transactionSearch) {
        onSearch(0, transactionSearch);
      } else {
        const listData = await getSectionListData(
          'transaction',
          allTransactionData,
        );
        setTransactionsList(listData);
      }

      setTransactionFilterApplied(0);
      setTransactionFilterModal(false);
      return;
    }

    const currentTransactions = transactionArray || allTransactionData;
    const [filteredTransactions, filterCount] =
      await getTransactionFilteredData(currentTransactions, filter);

    if (transactionSearch) {
      onSearch(0, transactionSearch, filteredTransactions);
    } else {
      const listData = await getSectionListData(
        'transaction',
        filteredTransactions,
        filter,
      );
      setTransactionsList(listData);
    }

    setTransactionFilterApplied(filterCount);
    setTransactionFilterModal(false);
  };

  /**
   * apply filter on payment list
   * @param {object}  filter        filter object
   * @param {boolean} applied       true if filter applied, false if not applied
   * @param {Array}   paymentArray  array that want to be filtered
   */
  const applyPaymentFilters = async (filter, applied, paymentArray = null) => {
    paymentFilterItemRef.current = filter;
    setPaymentFilterItem(filter);

    if (!applied) {
      if (paymentSearch) {
        onSearch(1, paymentSearch);
      } else {
        const listData = await getSectionListData('payment', allPaymentData);
        setPaymentList(listData);
      }
      setPaymentFilterApplied(0);
      setPaymentFilterModal(false);
      return;
    }

    const currentPayments = paymentArray || allPaymentData;
    const [filteredPayments, filterCount] = await getPaymentFilteredData(
      currentPayments,
      filter,
    );

    if (paymentSearch) {
      onSearch(1, paymentSearch, filteredPayments);
    } else {
      const listData = await getSectionListData(
        'payment',
        filteredPayments,
        filter,
      );
      setPaymentList(listData);
    }

    setPaymentFilterApplied(filterCount);
    setPaymentFilterModal(false);
  };

  const onPressFilterArea = () => {
    if (tnxSyncing) {
      Toast.show({
        type: 'warning',
        text1: I18n.t('fetching_transactions'),
        text2: I18n.t('tnx_sync_filter_msg'),
      });
    }
  };

  const openDropdownMenu = () => {
    setDropdownMenu(!dropdownMenu);
  };

  const handleDropdownMenu = (key) => {
    switch (key) {
      case 'filter':
        openFilterModals();
        break;
      case 'export':
        setExportAlertModal(true);
        break;
      default:
        break;
    }
    setDropdownMenu(false);
  };

  const openFilterModals = () => {
    if (activeTab === 0) {
      setTransactionFilterModal(true);
    } else {
      setPaymentFilterModal(true);
    }
  };

  const getProgressBarValue = () => {
    if (tnxSyncStage === 3) {
      return 1;
    }

    if (tnxSyncCount !== 0 && tnxSyncTotal !== 0) {
      return tnxSyncCount / tnxSyncTotal;
    }

    return 0;
  };

  const getHeaderText = (title) => {
    const groupByType =
      activeTab === 0
        ? transactionFilterItemRef?.current?.groupByType ?? 'date'
        : paymentFilterItemRef?.current?.groupByType ?? 'date';
    const headerText =
      groupByType === 'date' ? moment(title).format('DD MMM YYYY') : title;
    return [headerText, groupByType];
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

  const submitCustomPermissionModal = async () => {
    await AsyncStorage.setItem('bluetooth_allowed', 'true');
    onCancelAlert();
  };

  const handleInvoice = async (referenceId, action) => {
    try {
      if (action === 'view') {
        setInvoiceLoading(true);
      } else {
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
        } else {
          const bluetoothGranted = await requestPermission('bluetooth');
          if (!bluetoothGranted) {
            setPrinterLoading(false);
            createAlert('no_bluetooth_permission');
            return;
          }
        }
      }

      if (!referenceId) {
        setInvoiceLoading(false);
        // setPrinterLoading(false);
        return;
      }

      const refData =
        activeTab === 0
          ? await getTransactionByReference(referenceId)
          : await getPaymentByReference(referenceId);

      if (refData.length === 0) {
        setInvoiceLoading(false);
        // setPrinterLoading(false);
        return;
      }

      const updatedArray =
        activeTab === 0
          ? await getUpdatedTransactionArray(refData)
          : await getUpdatedPaymentArray(refData);

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
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: I18n.t('error'),
        text2: I18n.t('something_went_wrong'),
      });
      handleErrors(error, {
        ref: 'TransactionHomeScreen_handleInvoice',
      });
    }
  };

  const viewInvoice = async (invoiceData) => {
    if (activeTab === 0) {
      await createBuyTransactionInvoice(invoiceData);
    } else {
      await createPaymentInvoice(invoiceData);
    }
    setInvoiceLoading(false);
  };

  const printInvoice = async (invoiceData) => {
    try {
      const bluetoothState = await BluetoothStateManager.getState();
      if (bluetoothState !== 'PoweredOn') {
        createAlert('no_printer_connected');
        setPrinterLoading(false);
        return false;
      }

      let printStatus = false;
      if (activeTab === 0) {
        printStatus = await createBuyTransactionInvoice(invoiceData);
      } else {
        printStatus = await createPaymentInvoice(invoiceData);
      }

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
      handleErrors(error, {
        ref: 'TransactionHomeScreen_printInvoice',
      });
    }
  };

  const openBluetoothSettings = () => {
    try {
      onCancelAlert();
      BluetoothStateManager.openSettings();
    } catch (error) {
      handleErrors(error, {
        ref: 'TransactionHomeScreen_openBluetoothSettings',
      });
    }
  };

  const submitBluetoothPermission = () => {
    try {
      onCancelAlert();
      Linking.openSettings();
    } catch (error) {
      handleErrors(error, {
        ref: 'TransactionHomeScreen_submitBluetoothPermission',
      });
    }
  };

  /**
   * on refresh transaction list, removing filters
   */
  const onRefresh = async () => {
    setDropdownMenu(false);
    if (activeTab === 0) {
      const listData = await getSectionListData(
        'transaction',
        allTransactionData,
      );
      setTransactionsList(listData);
      setTransactionSearch('');
      transactionFilterItemRef.current = null;
      tnxSearchTextRef.current = null;
      dispatch(updateTnxSearchText(''));
      setTransactionFilterItem(null);
      setTransactionFilterApplied(0);
    } else {
      const listData = await getSectionListData('payment', allPaymentData);
      setPaymentList(listData);
      setPaymentSearch('');
      paymentFilterItemRef.current = null;
      paymentSearchTextRef.current = null;
      dispatch(updatePaymentSearchText(''));
      setPaymentFilterItem(null);
      setPaymentFilterApplied(0);
    }
  };

  const getEmptyText = () => {
    if (tnxSyncing || syncInProgress) {
      return `${I18n.t('loading')}..`;
    }

    return activeTab === 0 ? I18n.t('no_transactions') : I18n.t('no_payments');
  };

  const exportData = async () => {
    try {
      setExportInProgress(true);

      if (activeTab === 0) {
        let filteredTransactions = allTransactionData;
        if (transactionFilterItemRef.current !== null) {
          [filteredTransactions] = await getTransactionFilteredData(
            filteredTransactions,
            transactionFilterItemRef.current,
          );
        }

        filteredTransactions = filteredTransactions.filter((x) => {
          return x.is_deleted === false && x.error === '';
        });

        if (filteredTransactions.length > 0) {
          filteredTransactions = await getReadableTransactionData(
            filteredTransactions,
          );
          const exportedPath = await exportCsv(
            filteredTransactions,
            'transactions',
          );
          await FileViewer.open(exportedPath);
        }
      } else {
        let filteredPayments = allPaymentData;
        if (paymentFilterItemRef.current !== null) {
          [filteredPayments] = await getPaymentFilteredData(
            filteredPayments,
            paymentFilterItemRef.current,
          );
        }

        filteredPayments = filteredPayments.filter((x) => {
          return x.is_deleted === false;
        });

        if (filteredPayments.length > 0) {
          filteredPayments = await getReadablePaymentData(filteredPayments);
          const exportedPath = await exportCsv(filteredPayments, 'payments');
          await FileViewer.open(exportedPath);
        }
      }
    } catch (error) {
      if (!String(error).includes('No app associated with this mime type')) {
        Toast.show({
          type: 'error',
          text1: I18n.t('error'),
          text2: I18n.t('something_went_wrong'),
        });

        handleErrors(error, {
          ref: 'TransactionHomeScreen_exportData',
        });
      }
    } finally {
      setExportAlertModal(false);
      setExportInProgress(false);
    }
  };

  const changeActiveTab = (tab) => {
    setActiveTab(tab);
    setDropdownMenu(false);
  };

  const emptyView = () => {
    return (
      <View style={styles.emptyView}>
        <Text style={styles.emptyText}>{getEmptyText()}</Text>
      </View>
    );
  };

  const MemoizedSectionList = memo(({ sections }) => {
    const renderItem = useCallback(({ item }) => {
      if (activeTab === 0) {
        return (
          <TransactionListItem
            item={item}
            onSelect={() => onSelectTransaction(item)}
          />
        );
      }

      return (
        <PaymentListItem item={item} onSelect={() => onSelectPayment(item)} />
      );
    });

    const renderSectionHeader = useCallback(
      ({ section: { title } }) => {
        const headerText = getHeaderText(title);
        return (
          <View style={styles.header}>
            <Text style={styles.headerText}>{headerText[0]}</Text>
            {headerText[1] === 'reference_id' && (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => handleInvoice(headerText[0], 'view')}
                  disabled={invoiceLoading}
                  style={styles.iconWrapper}
                  hitSlop={HIT_SLOP_TEN}
                >
                  <Text
                    style={[
                      styles.invoiceText,
                      { color: invoiceLoading ? theme.text_3 : theme.text_1 },
                    ]}
                  >
                    {I18n.t('view')}
                  </Text>
                </TouchableOpacity>
                {androidVersion >= 12 && (
                  <TouchableOpacity
                    onPress={() => handleInvoice(headerText[0], 'print')}
                    disabled={printLoading}
                    style={styles.iconWrapper}
                    hitSlop={HIT_SLOP_TEN}
                  >
                    <Text
                      style={[
                        styles.invoiceText,
                        { color: printLoading ? theme.text_3 : theme.text_1 },
                      ]}
                    >
                      {I18n.t('print')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );
      },
      [invoiceLoading, printLoading, theme],
    );

    return (
      <SectionList
        sections={sections}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="always"
        stickySectionHeadersEnabled
        refreshing={false}
        onRefresh={onRefresh}
        progressViewOffset={100}
        ListEmptyComponent={emptyView}
        renderSectionHeader={renderSectionHeader}
        initialNumToRender={10} // Adjust this based on the data
        maxToRenderPerBatch={10} // Adjust this as needed
        style={{ backgroundColor: theme.background_1 }}
      />
    );
  });

  const DataList = () => {
    const sections = useMemo(
      () => (activeTab === 0 ? transactionsList : paymentList),
      [activeTab, transactionsList, paymentList],
    );

    return <MemoizedSectionList sections={sections} onRefresh={onRefresh} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader
        title={I18n.t('transactions')}
        onPressRight={checkSyncing}
      />

      <TouchableOpacity onPress={onPressFilterArea} style={styles.searchWrap}>
        <SearchComponent
          placeholder={
            activeTab === 0
              ? I18n.t('search_transactions')
              : I18n.t('search_payments')
          }
          onChangeText={(text) => onSearch(activeTab, text)}
          onFocus={() => setDropdownMenu(false)}
          value={activeTab === 0 ? transactionSearch : paymentSearch}
          extraStyle={{ width: '80%' }}
          editable={!tnxSyncing}
        />

        <TouchableOpacity
          onPress={openDropdownMenu}
          style={styles.sortIconWrap}
          disabled={tnxSyncing}
        >
          <MenuVerticalIcon width={22} height={22} />
          {activeTab === 0 && transactionFilterApplied > 0 && (
            <View style={styles.filterCountWrap}>
              <Text style={{ color: '#fff', fontSize: 14 }}>
                {transactionFilterApplied}
              </Text>
            </View>
          )}
          {activeTab === 1 && paymentFilterApplied > 0 && (
            <View style={styles.filterCountWrap}>
              <Text style={{ color: '#fff', fontSize: 14 }}>
                {paymentFilterApplied}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>

      {dropdownMenu && (
        <View style={styles.dropdownMenuWrap}>
          {dropdownMenuList.map((i, n) => (
            <TouchableOpacity
              key={n.toString()}
              onPress={() => handleDropdownMenu(i.key)}
              style={styles.dropdownItemWrap}
            >
              {i.icon}
              <Text style={styles.dropdownItemText}>{I18n.t(i.label)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {tnxSyncing && isConnected && (
        <View style={styles.tnxSyncWrap}>
          <View style={{ width: '85%' }}>
            <Text style={styles.tnxSyncTitle}>
              {`${I18n.t('fetching_transactions')}...`}
            </Text>
            <Progress.Bar
              progress={getProgressBarValue()}
              width={width * 0.75}
              height={8}
              color="#27AE60"
            />
            {tnxSyncCount === 0 ? (
              <View>
                {tnxSyncStage === 3 ? (
                  <Text style={styles.tnxSyncCount}>
                    {`${I18n.t('almost_finished')}..`}
                  </Text>
                ) : (
                  <Text style={styles.tnxSyncCount}>
                    {`${I18n.t('calculating')}..`}
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.tnxSyncCount}>
                {`${tnxSyncCount}/${tnxSyncTotal}`}
              </Text>
            )}
          </View>
          <View style={styles.loadingWarp}>
            <ActivityIndicator size="small" color="#27AE60" />
          </View>
        </View>
      )}

      {!tnxSyncing && tnxSyncStatus === 'failed' && (
        <View style={styles.tnxSyncErrWrap}>
          <Text style={styles.tnxSyncTitle}>
            {`${I18n.t('trans_fetch_pending')}..`}
          </Text>
          <Text style={styles.tnxSyncCount}>
            {`${I18n.t('trans_fetch_warning')}..`}
          </Text>
        </View>
      )}

      <View style={styles.tabWrap}>
        <TouchableOpacity
          onPress={() => changeActiveTab(0)}
          style={[
            styles.tabSubWrap,
            { borderBottomWidth: activeTab === 0 ? 3 : 0 },
          ]}
          disabled={activeTab === 0}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 0 ? theme.text_1 : theme.text_3,
              },
            ]}
          >
            {I18n.t('products_tab_title')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => changeActiveTab(1)}
          style={[
            styles.tabSubWrap,
            { borderBottomWidth: activeTab === 1 ? 3 : 0 },
          ]}
          disabled={activeTab === 1}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 1 ? theme.text_1 : theme.text_3,
              },
            ]}
          >
            {I18n.t('payments_tab_title')}
          </Text>
        </TouchableOpacity>
      </View>

      <DataList />

      {syncModal && (
        <SyncComponent
          visible={syncModal}
          hideModal={() => setSyncModal(false)}
        />
      )}

      {transactionFilterModal && (
        <TransactionFilter
          visible={transactionFilterModal}
          filterItem={transactionFilterItem}
          applyFilters={applyTransactionFilters}
          hideModal={() => setTransactionFilterModal(false)}
        />
      )}

      {paymentFilterModal && (
        <PaymentFilter
          visible={paymentFilterModal}
          filterItem={paymentFilterItem}
          applyFilters={applyPaymentFilters}
          hideModal={() => setPaymentFilterModal(false)}
        />
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

      {exportAlertModal && (
        <CommonAlert
          visible={exportAlertModal}
          title={I18n.t('export_modal_title')}
          message={I18n.t('export_modal_message')}
          submitText={I18n.t('export')}
          icon={<ExportAlertIcon width={width * 0.27} height={width * 0.27} />}
          onSubmit={exportData}
          onCancel={exportInProgress ? null : () => setExportAlertModal(false)}
          onRequestClose={
            exportInProgress ? null : () => setExportAlertModal(false)
          }
          isLoading={exportInProgress}
          disabled={exportInProgress}
        />
      )}
    </SafeAreaView>
  );
};

export default memo(TransactionHomeScreen);

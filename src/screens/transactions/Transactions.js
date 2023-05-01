/* eslint-disable global-require */
import React, { useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Text,
  Dimensions,
  SectionList,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import withObservables from '@nozbe/with-observables';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import * as Progress from 'react-native-progress';
import {
  erroredTransactionsCount,
  observeTransactions,
  newTransactionsCount,
} from '../../services/transactionsHelper';
import {
  findFarmerById,
  findFarmerByServerId,
  newFarmersCount,
  updatedFarmersCount,
} from '../../services/farmersHelper';
import { findProductById } from '../../services/productsHelper';
import { updateSyncPercentage } from '../../redux/LoginStore';
import { FilterIcon } from '../../assets/svg';
import { observeTransactionPremiums } from '../../services/transactionPremiumHelper';
import { findPremiumById } from '../../services/premiumsHelper';
import CustomHeader from '../../components/CustomHeader';
import SearchComponent from '../../components/SearchComponent';
import TransactionListItem from '../../components/TransactionListItem';
import I18n from '../../i18n/i18n';
import SyncComponent from '../../components/SyncComponent';
import TransactionFilter from '../../components/TransactionFilter';
import PaymentFilter from '../../components/PaymentFilter';
import * as consts from '../../services/constants';

const { width, height } = Dimensions.get('window');

const Transactions = ({ navigation, TRANSACTIONS, TRANSACTION_PREMIUMS }) => {
  const { theme } = useSelector((state) => state.common);
  const { syncInProgress, syncSuccessfull, userProjectDetails } = useSelector(
    (state) => state.login,
  );
  const { currency } = userProjectDetails;
  const { isConnected } = useSelector((state) => state.connection);
  const {
    tnxSyncing,
    tnxSyncCount,
    tnxSyncTotal,
    tnxSyncStatus,
    tnxSyncStage,
  } = useSelector((state) => state.sync);
  const [transactionsList, setTransactionsList] = useState([]);
  const [paymentList, setPaymentList] = useState([]);
  const [syncIcon, setSyncIcon] = useState(
    require('../../assets/images/sync_success.png'),
  );
  const [activeTab, setActiveTab] = useState(0);
  const [transactionSearchText, setTransactionSearchText] = useState('');
  const [paymentSearchText, setPaymentSearchText] = useState('');
  const [syncModal, setSyncModal] = useState(false);
  const [transactionFilterItem, setTransactionFilterItem] = useState(null);
  const [transactionFilterModal, setTransactionFilterModal] = useState(false);
  const [paymentFilterItem, setPaymentFilterItem] = useState(null);
  const [paymentFilterModal, setPaymentFilterModal] = useState(false);
  const [transactionFilterApplied, setTransactionFilterApplied] =
    useState(false);
  const [paymentFilterApplied, setPaymentFilterApplied] = useState(false);
  const isFocused = useIsFocused();
  const dispatch = useDispatch();

  useEffect(() => {
    setUpTransactionValues();
  }, [TRANSACTIONS]);

  useEffect(() => {
    setUpPaymentValues();
  }, [TRANSACTION_PREMIUMS]);

  useEffect(() => {
    setupSyncingIcon();
  }, [isConnected, isFocused, syncInProgress, syncSuccessfull]);

  /**
   * setting initial values and sorting transaction list
   */
  const setUpTransactionValues = async () => {
    const buyers = JSON.parse(await AsyncStorage.getItem('buyers'));
    TRANSACTIONS.map(async (tx) => {
      if (
        tx.type === consts.APP_TRANS_TYPE_INCOMING &&
        (!tx.node_name || !tx.product_name)
      ) {
        let product = null;
        let node = null;
        if (tx?.product_id) {
          product = await findProductById(tx.product_id);
        }
        if (tx?.node_id) {
          node = await findFarmerById(tx.node_id);
        }
        tx.product_name = product?.name ?? 'Not available';
        tx.node_name = node?.name ?? 'Not available';
        tx.node_image = node?.image ?? '';
      } else if (
        tx.type === consts.APP_TRANS_TYPE_OUTGOING &&
        (!tx.node_name || !tx.product_name)
      ) {
        let product = null;
        if (tx?.product_id) {
          product = await findProductById(tx.product_id);
        }
        const node = buyers?.[0] ?? null;
        tx.product_name = product?.name ?? 'Not available';
        tx.node_name = node?.name ?? 'Not available';
        tx.node_image = node?.image ?? '';
      } else if (
        tx.type === consts.APP_TRANS_TYPE_LOSS &&
        (!tx.node_name || !tx.product_name)
      ) {
        tx.node_name = 'Loss';
        tx.node_image = '';
        tx.product_name = '';
        if (tx?.product_id) {
          const product = await findProductById(tx.product_id);
          tx.product_name = product?.name ?? 'Not available';
        }
      }
    });

    setSectionListData('transaction', TRANSACTIONS);
  };

  /**
   * setting initial values and sorting transaction list
   */
  const setUpPaymentValues = async () => {
    const buyers = JSON.parse(await AsyncStorage.getItem('buyers'));
    TRANSACTION_PREMIUMS.map(async (tx) => {
      if (!tx.node_name || !tx.premium_name) {
        let node = null;
        let premium = null;
        if (tx._raw.type === consts.PAYMENT_OUTGOING) {
          if (tx._raw.destination === '') {
            tx.node_name = node?.[0]?.name ?? 'Not available';
            tx.node_image = node?.[0]?.image ?? '';
          } else {
            node = await findFarmerByServerId(tx._raw.destination);
            if (node.length > 0) {
              tx.node_name = node?.[0]?.name ?? 'Not available';
              tx.node_image = node?.[0]?.image ?? '';
            } else {
              node = await findFarmerById(tx._raw.destination);
              tx.node_name = node?.name ?? 'Not available';
              tx.node_image = node?.image ?? '';
            }
          }
        } else {
          node = buyers?.[0] ?? null;
          tx.node_name = node?.name ?? 'Not available';
          tx.node_image = node?.image ?? '';
        }

        if (tx._raw.category === consts.TYPE_BASE_PRICE) {
          tx.premium_name = 'Base price';
        } else {
          premium = await findPremiumById(tx._raw.premium_id);
          tx.premium_name = premium?.name ?? 'Not available';
        }
      }
    });
    setSectionListData('payment', TRANSACTION_PREMIUMS);
  };

  /**
   * setting syncing icon
   */
  const setupSyncingIcon = async () => {
    setTransactionSearchText('');
    const newFarmers = await newFarmersCount();
    const modifiedFarmers = await updatedFarmersCount();
    const newTransactions = await newTransactionsCount();

    const totalCount = newFarmers + modifiedFarmers + newTransactions;

    if (syncInProgress) {
      setSyncIcon(require('../../assets/images/sync_pending.png'));
    } else if (!syncInProgress && !syncSuccessfull) {
      setSyncIcon(require('../../assets/images/sync_error.png'));
    } else if (totalCount === 0) {
      setSyncIcon(require('../../assets/images/sync_success.png'));
    } else {
      setSyncIcon(require('../../assets/images/sync_pending.png'));
    }
  };

  /**
   * on select list item
   *
   * @param {object} item transaction list item
   */
  const onSelectItem = (item) => {
    onSearch('');

    if (item.type === consts.APP_TRANS_TYPE_OUTGOING) {
      navigation.navigate('SendTransactionDetails', { transactionItem: item });
    } else {
      navigation.navigate('TransactionDetails', { transactionItem: item });
    }
  };

  /**
   * sorting and setting section list data
   *
   * @param {string}  type  array type
   * @param {Array}   data  data array
   */
  const setSectionListData = (type, data) => {
    let localeData = null;

    if (type === 'transaction') {
      localeData = data.map((item) => {
        item.key = moment(item.created_on * 1000).format('YYYY-MM-DD');
        return item;
      });

      // Sort data by date time
      localeData.sort((a, b) => {
        return (
          moment(b.created_on * 1000).unix() -
          moment(a.created_on * 1000).unix()
        );
      });
    } else {
      localeData = data.map((item) => {
        item.key = moment(item._raw.date * 1000).format('YYYY-MM-DD');
        return item;
      });

      // Sort data by date time
      localeData.sort((a, b) => {
        return (
          moment(b._raw.date * 1000).unix() - moment(a._raw.date * 1000).unix()
        );
      });
    }

    // Reduce data for SectionList
    const groupedData = localeData.reduce(
      (
        accumulator,
        currentValue,
        currentIndex,
        array,
        key = currentValue.key,
      ) => {
        const keyObjectPosition = accumulator.findIndex(
          (item) => item.title === key,
        );
        if (keyObjectPosition >= 0) {
          accumulator[keyObjectPosition].data.push(currentValue);
          return accumulator;
        }

        return accumulator.concat({ data: [currentValue], title: key });
      },
      [],
    );

    if (type === 'transaction') {
      setTransactionsList(groupedData);
    } else {
      setPaymentList(groupedData);
    }
  };

  /**
   * sorting transaction list based on search text
   *
   * @param {string} text farmer name
   */
  const onSearch = (text) => {
    if (activeTab === 0) {
      setTransactionSearchText(text);
      const textSearch = text.toLowerCase();

      if (textSearch === '') {
        setSectionListData('transaction', TRANSACTIONS);
        setTransactionSearchText('');
      } else {
        const filteredTransactions = TRANSACTIONS.filter((trans) => {
          if (trans.node_name && trans.node_name !== '') {
            let nodeName = trans.node_name;
            nodeName = nodeName.toLowerCase();
            let productName = trans.product_name;
            productName = productName.toLowerCase();
            return (
              nodeName.includes(textSearch) || productName.includes(textSearch)
            );
          }
        });

        setSectionListData('transaction', filteredTransactions);
      }
    } else {
      setPaymentSearchText(text);
      const textSearch = text.toLowerCase();

      if (textSearch === '') {
        setSectionListData('payment', TRANSACTION_PREMIUMS);
        setPaymentSearchText('');
      } else {
        const filteredPayments = TRANSACTION_PREMIUMS.filter((pay) => {
          if (pay.node_name && pay.node_name !== '') {
            let nodeName = pay.node_name;
            nodeName = nodeName.toLowerCase();
            let premiumName = pay.premium_name;
            premiumName = premiumName.toLowerCase();
            return (
              nodeName.includes(textSearch) || premiumName.includes(textSearch)
            );
          }
        });

        setSectionListData('payment', filteredPayments);
      }
    }
  };

  /**
   * start syncing
   */
  const checkSyncing = async () => {
    await setInitialValues();
    setSyncModal(true);
  };

  /**
   * setting initial sync data
   */
  const setInitialValues = async () => {
    try {
      if (!syncInProgress) {
        const newFarmers = await newFarmersCount();
        const modifiedFarmers = await updatedFarmersCount();
        const newTransactions = await newTransactionsCount();
        const erroredTransactions = await erroredTransactionsCount();

        let obj = await AsyncStorage.getItem('syncData');
        obj = JSON.parse(obj);

        const farmerCount = newFarmers + modifiedFarmers;
        const totalCount = newFarmers + modifiedFarmers + newTransactions;

        if (farmerCount > 0) {
          obj.farmer.pending = farmerCount;
          obj.farmer.status = 'pending';
        }

        if (newTransactions > 0) {
          obj.transaction.pending = newTransactions;
          obj.transaction.failed = erroredTransactions;
          obj.transaction.status =
            erroredTransactions > 0 ? 'failed' : 'pending';
        }

        await AsyncStorage.setItem('syncData', JSON.stringify(obj));
        dispatch(updateSyncPercentage([0, totalCount]));
      }
      return true;
    } catch (error) {
      // console.log('error', error);
    }
  };

  /**
   * apply filter on transaction list
   *
   * @param {object}  filter  filter object
   * @param {boolean} applied true if filter applied, false if not applied
   */
  const applyTransactionFilters = (filter, applied) => {
    setTransactionFilterItem(filter);

    if (!applied) {
      setSectionListData('transaction', TRANSACTIONS);
      setTransactionFilterApplied(0);
      setTransactionFilterModal(false);
      return;
    }

    const { date, transactionType, product, verificationMethod, quantity } =
      filter;
    let currentTransactions = TRANSACTIONS;
    let filterCount = 0;

    if (date) {
      const { startDate, endDate } = date;
      if (startDate && endDate) {
        currentTransactions = currentTransactions.filter((tx) => {
          return (
            tx.created_on >= startDate / 1000 && tx.created_on <= endDate / 1000
          );
        });
        filterCount += 1;
      } else if (startDate) {
        currentTransactions = currentTransactions.filter((tx) => {
          return tx.created_on >= startDate / 1000;
        });
        filterCount += 1;
      } else if (endDate) {
        currentTransactions = currentTransactions.filter((tx) => {
          return tx.created_on <= endDate / 1000;
        });
        filterCount += 1;
      }
    }

    if (transactionType) {
      const tnxArr = [];
      const { buy, sent, loss } = transactionType;
      if (buy) {
        tnxArr.push(parseInt(consts.APP_TRANS_TYPE_INCOMING));
      }
      if (sent) {
        tnxArr.push(parseInt(consts.APP_TRANS_TYPE_OUTGOING));
      }
      if (loss) {
        tnxArr.push(parseInt(consts.APP_TRANS_TYPE_LOSS));
      }

      if (tnxArr.length > 0) {
        currentTransactions = currentTransactions.filter((tx) => {
          return tnxArr.includes(tx.type);
        });
        filterCount += 1;
      }
    }

    if (product && product.length > 0) {
      currentTransactions = currentTransactions.filter((tx) => {
        return product.includes(tx.product_name);
      });
      filterCount += 1;
    }

    if (verificationMethod) {
      const verifyArr = [];
      const { card, manual } = verificationMethod;
      if (card) {
        verifyArr.push(parseInt(consts.VERIFICATION_METHOD_CARD));
      }
      if (manual) {
        verifyArr.push(parseInt(consts.VERIFICATION_METHOD_MANUAL));
      }

      if (verifyArr.length > 0) {
        currentTransactions = currentTransactions.filter((tx) => {
          return verifyArr.includes(tx.verification_method);
        });
        filterCount += 1;
      }
    }

    if (quantity) {
      const { minQuantity, maxQuantity } = quantity;
      if (minQuantity && maxQuantity) {
        currentTransactions = currentTransactions.filter((tx) => {
          return (
            parseFloat(tx.quantity) >= parseFloat(minQuantity) &&
            parseFloat(tx.quantity) <= maxQuantity
          );
        });
        filterCount += 1;
      } else if (minQuantity) {
        currentTransactions = currentTransactions.filter((tx) => {
          return parseFloat(tx.quantity) >= parseFloat(minQuantity);
        });
        filterCount += 1;
      } else if (maxQuantity) {
        currentTransactions = currentTransactions.filter((tx) => {
          return parseFloat(tx.quantity) <= parseFloat(maxQuantity);
        });
        filterCount += 1;
      }
    }

    setSectionListData('transaction', currentTransactions);
    setTransactionFilterApplied(filterCount);
    setTransactionFilterModal(false);
  };

  /**
   * apply filter on payment list
   *
   * @param {object}  filter  filter object
   * @param {boolean} applied true if filter applied, false if not applied
   */
  const applyPaymentFilters = (filter, applied) => {
    setPaymentFilterItem(filter);

    if (!applied) {
      setSectionListData('payment', TRANSACTION_PREMIUMS);
      setPaymentFilterApplied(0);
      setPaymentFilterModal(false);
      return;
    }

    const { date, paymentType, premium, verificationMethod, amount } = filter;
    let currentPayments = TRANSACTION_PREMIUMS;
    let filterCount = 0;

    if (date) {
      const { startDate, endDate } = date;
      if (startDate && endDate) {
        currentPayments = currentPayments.filter((tx) => {
          return (
            tx._raw.date >= startDate / 1000 && tx._raw.date <= endDate / 1000
          );
        });
        filterCount += 1;
      } else if (startDate) {
        currentPayments = currentPayments.filter((tx) => {
          return tx._raw.date >= startDate / 1000;
        });
        filterCount += 1;
      } else if (endDate) {
        currentPayments = currentPayments.filter((tx) => {
          return tx._raw.date <= endDate / 1000;
        });
        filterCount += 1;
      }
    }

    if (paymentType) {
      const payArr = [];
      const { credit, debit } = paymentType;
      if (credit) {
        payArr.push(consts.PAYMENT_INCOMING);
      }
      if (debit) {
        payArr.push(consts.PAYMENT_OUTGOING);
      }

      if (payArr.length > 0) {
        currentPayments = currentPayments.filter((tx) => {
          return payArr.includes(tx._raw.type);
        });
        filterCount += 1;
      }
    }

    if (premium && premium.length > 0) {
      currentPayments = currentPayments.filter((tx) => {
        return premium.includes(tx.premium_name);
      });
      filterCount += 1;
    }

    if (verificationMethod) {
      const verifyArr = [];
      const { card, manual } = verificationMethod;
      if (card) {
        verifyArr.push(parseInt(consts.VERIFICATION_METHOD_CARD));
      }
      if (manual) {
        verifyArr.push(parseInt(consts.VERIFICATION_METHOD_MANUAL));
      }

      if (verifyArr.length > 0) {
        currentPayments = currentPayments.filter((tx) => {
          return verifyArr.includes(tx._raw.verification_method);
        });
        filterCount += 1;
      }
    }

    if (amount) {
      const { minAmount, maxAmount } = amount;
      if (minAmount && maxAmount) {
        currentPayments = currentPayments.filter((tx) => {
          return (
            parseFloat(tx.amount) >= parseFloat(minAmount) &&
            parseFloat(tx.amount) <= maxAmount
          );
        });
        filterCount += 1;
      } else if (minAmount) {
        currentPayments = currentPayments.filter((tx) => {
          return parseFloat(tx.amount) >= parseFloat(minAmount);
        });
        filterCount += 1;
      } else if (maxAmount) {
        currentPayments = currentPayments.filter((tx) => {
          return parseFloat(tx.amount) <= parseFloat(maxAmount);
        });
        filterCount += 1;
      }
    }

    setSectionListData('payments', currentPayments);
    setPaymentFilterApplied(filterCount);
    setPaymentFilterModal(false);
  };

  /**
   * on refresh transaction list, removing filters
   */
  const onRefresh = () => {
    if (activeTab === 0) {
      setSectionListData('transaction', TRANSACTIONS);
      setTransactionSearchText('');
      setTransactionFilterItem(null);
      setTransactionFilterApplied(0);
    } else {
      setSectionListData('payment', TRANSACTION_PREMIUMS);
      setPaymentSearchText('');
      setPaymentFilterItem(null);
      setPaymentFilterApplied(0);
    }
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

  const openModals = () => {
    if (activeTab === 0) {
      setTransactionFilterModal(true);
    } else {
      setPaymentFilterModal(true);
    }
  };

  const emptyView = () => {
    return (
      <View style={styles.emptyView}>
        {tnxSyncing && (
          <Text style={styles.emptyText}>{I18n.t('loading')}</Text>
        )}
        {!tnxSyncing && activeTab === 0 && (
          <Text style={styles.emptyText}>{I18n.t('no_transactions')}</Text>
        )}
        {!tnxSyncing && activeTab === 1 && (
          <Text style={styles.emptyText}>{I18n.t('no_payments')}</Text>
        )}
      </View>
    );
  };

  const renderItem = ({ item }) => {
    if (activeTab === 0) {
      return (
        <TransactionListItem
          item={item}
          onSelect={onSelectItem}
          listView
          displayUnSync
        />
      );
    }

    return (
      <TransactionListItem
        item={item}
        onSelect={() => {}}
        currency={currency}
        paymentView
        displayUnSync
      />
    );
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

  const styles = StyleSheetFactory(theme);

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader
        title={I18n.t('transactions')}
        rightImage={syncIcon}
        onPressRight={() => checkSyncing()}
        rightImageSize={25}
      />

      <TouchableOpacity
        onPress={() => onPressFilterArea()}
        style={styles.searchWrap}
      >
        <SearchComponent
          placeholder={
            activeTab === 0
              ? I18n.t('search_transactions')
              : I18n.t('search_payments')
          }
          onChangeText={(text) => onSearch(text)}
          value={activeTab === 0 ? transactionSearchText : paymentSearchText}
          extraStyle={{ width: '80%' }}
          editable={!tnxSyncing}
        />

        <TouchableOpacity
          onPress={() => openModals()}
          style={styles.sortIconWrap}
          disabled={tnxSyncing}
        >
          <FilterIcon width={18} height={18} />
          {activeTab === 0 && transactionFilterApplied > 0 && (
            <View style={styles.filterCountWrap}>
              <Text style={{ color: '#fff', fontSize: 9 }}>
                {transactionFilterApplied}
              </Text>
            </View>
          )}
          {activeTab === 1 && paymentFilterApplied > 0 && (
            <View style={styles.filterCountWrap}>
              <Text style={{ color: '#fff', fontSize: 9 }}>
                {paymentFilterApplied}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>

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
              color='#27AE60'
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
            <ActivityIndicator size='small' color='#27AE60' />
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
          onPress={() => setActiveTab(0)}
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
                color:
                  activeTab === 0 ? theme.text_1 : theme.text_3,
              },
            ]}
          >
            Product
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab(1)}
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
                color:
                  activeTab === 1 ? theme.text_1 : theme.text_3,
              },
            ]}
          >
            Payments
          </Text>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={activeTab === 0 ? transactionsList : paymentList}
        renderItem={renderItem}
        keyExtractor={(item, index) => item + index}
        keyboardShouldPersistTaps='always'
        stickySectionHeadersEnabled
        refreshing={false}
        onRefresh={() => onRefresh()}
        progressViewOffset={100}
        ListEmptyComponent={emptyView}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.header}>
            {moment(title).format('DD MMM YYYY')}
          </Text>
        )}
        style={{ backgroundColor: theme.background_1 }}
      />

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
          currency={currency}
          applyFilters={applyPaymentFilters}
          hideModal={() => setPaymentFilterModal(false)}
        />
      )}
    </SafeAreaView>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#92DDF6',
    },
    tnxSyncWrap: {
      width: '100%',
      backgroundColor: theme.background_2,
      flexDirection: 'row',
      alignItems: 'center',
      padding: width * 0.05,
    },
    tnxSyncErrWrap: {
      width: '100%',
      backgroundColor: '#f9a19a',
      padding: width * 0.05,
    },
    tnxSyncTitle: {
      color: theme.text_1,
      fontFamily: theme.font_medium,
      fontSize: 15,
      marginVertical: 5,
    },
    tnxSyncCount: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontSize: 14,
      marginVertical: 5,
    },
    loadingWarp: {
      width: '15%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyText: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontSize: 16,
      letterSpacing: 0.3,
    },
    header: {
      fontFamily: theme.font_regular,
      fontSize: 14,
      color: theme.text_1,
      fontWeight: '400',
      backgroundColor: '#C5EDFA',
      width,
      paddingVertical: 10,
      paddingHorizontal: '7%',
    },
    emptyView: {
      height: 100,
      width: '100%',
      justifyContent: 'center',
      alignSelf: 'center',
      alignItems: 'center',
      marginTop: 30,
      backgroundColor: theme.background_1,
    },
    searchWrap: {
      width: '90%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      alignSelf: 'center',
    },
    sortIconWrap: {
      width: '15%',
      height: 48,
      marginVertical: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderColor: theme.border_1,
      borderWidth: 1,
      borderRadius: theme.border_radius,
    },
    filterCountWrap: {
      width: 15,
      height: 15,
      borderRadius: theme.border_radius,
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
      top: 2,
      right: 2,
      backgroundColor: '#003A60',
    },
    tabWrap: {
      width: '100%',
      height: height * 0.075,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ffffff',
    },
    tabSubWrap: {
      width: '50%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      borderBottomColor: '#003A60',
    },
    tabText: {
      fontSize: 16,
      letterSpacing: 0.3,
      fontFamily: theme.font_regular,
    },
  });
};

const enhanceWithWeights = withObservables([], () => ({
  TRANSACTIONS: observeTransactions(),
  TRANSACTION_PREMIUMS: observeTransactionPremiums(),
}));

export default enhanceWithWeights(Transactions);

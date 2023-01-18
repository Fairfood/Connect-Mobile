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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import withObservables from '@nozbe/with-observables';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  erroredTransactionsCount,
  observeTransactions,
  newTransactionsCount,
} from '../../services/transactionsHelper';
import { findProductById, getAllProducts } from '../../services/productsHelper';
import {
  findFarmerById,
  newFarmersCount,
  updatedFarmersCount,
} from '../../services/farmersHelper';
import { updateSyncPercentage } from '../../redux/LoginStore';
import { FilterIcon } from '../../assets/svg';
import CustomHeader from '../../components/CustomHeader';
import SearchComponent from '../../components/SearchComponent';
import TransactionListItem from '../../components/TransactionListItem';
import I18n from '../../i18n/i18n';
import SyncComponent from '../../components/SyncComponent';
import TransactionFilter from '../../components/TransactionFilter';
import * as consts from '../../services/constants';

const { width } = Dimensions.get('window');

const Transactions = ({ navigation, TRANSACTIONS }) => {
  const { syncInProgress, syncSuccessfull } = useSelector(
    (state) => state.login,
  );
  const { isConnected } = useSelector((state) => state.connection);
  const [transactionsList, setTransactionsList] = useState([]);
  const [syncIcon, setSyncIcon] = useState(
    require('../../assets/images/sync_success.png'),
  );
  const [searchText, setSearchText] = useState('');
  const [syncModal, setSyncModal] = useState(false);
  const [filterItem, setFilterItem] = useState(null);
  const [filterModal, setFilterModal] = useState(false);
  const [products, setProducts] = useState(false);
  const [filterApplied, setFilterApplied] = useState(false);
  const isFocused = useIsFocused();
  const dispatch = useDispatch();

  useEffect(() => {
    setupInitialValues();
  }, [TRANSACTIONS]);

  useEffect(() => {
    setupSyncingIcon();
  }, [isConnected, isFocused, syncInProgress, syncSuccessfull]);

  useEffect(() => {
    setupProducts();
  }, []);

  const setupInitialValues = async () => {
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

    setSectionListData(TRANSACTIONS);
  };

  const setupSyncingIcon = async () => {
    setSearchText('');
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

  const setupProducts = async () => {
    const allProducts = await getAllProducts();
    const activeProducts = allProducts.reverse().filter((prod) => {
      return prod.is_active;
    });
    setProducts(activeProducts);
  };

  const onSelectItem = (item) => {
    onSearch('');

    if (item.type === consts.APP_TRANS_TYPE_OUTGOING) {
      navigation.navigate('SendTransactionDetails', { transactionItem: item });
    } else {
      navigation.navigate('TransactionDetails', { transactionItem: item });
    }
  };

  const setSectionListData = (transactions) => {
    const localeData = transactions.map((item) => {
      item.key = moment(item.created_on * 1000).format('YYYY-MM-DD');
      return item;
    });

    // Sort data by datetime
    localeData.sort((a, b) => {
      return (
        moment(b.created_on * 1000).unix() - moment(a.created_on * 1000).unix()
      );
    });

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

    setTransactionsList(groupedData);
  };

  const onSearch = (text) => {
    setSearchText(text);
    textSerch = text.toLowerCase();

    if (textSerch === '') {
      setSectionListData(TRANSACTIONS);
      setSearchText('');
    } else {
      const filteredTransactions = TRANSACTIONS.filter((trans) => {
        if (trans.node_name && trans.node_name !== '') {
          let nodeName = trans.node_name;
          nodeName = nodeName.toLowerCase();
          let productName = trans.product_name;
          productName = productName.toLowerCase();
          return (
            nodeName.includes(textSerch) || productName.includes(textSerch)
          );
        }
      });

      setSectionListData(filteredTransactions);
    }
  };

  const checkSyncing = async () => {
    await setInitailValues();
    setSyncModal(true);
  };

  const setInitailValues = async () => {
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
      // console.log('errorrrrrrrrr', error);
    }
  };

  const applyFilters = (filter, applied) => {
    setFilterItem(filter);

    if (!applied) {
      setSectionListData(TRANSACTIONS);
      setFilterApplied(0);
      setFilterModal(false);
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

    setSectionListData(currentTransactions);
    setFilterApplied(filterCount);
    setFilterModal(false);
  };

  const onRefresh = () => {
    setSectionListData(TRANSACTIONS);
    setSearchText('');
    setFilterItem(null);
    setFilterApplied(0);
  };

  const emptyView = () => {
    return (
      <View style={styles.emptyView}>
        <Text style={styles.emptyText}>{I18n.t('no_transactions')}</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    return (
      <TransactionListItem
        item={item}
        onSelect={onSelectItem}
        listview
        displayUnSync
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader
        title={I18n.t('transactions')}
        rightImage={syncIcon}
        onPressRight={() => checkSyncing()}
        rightImageSize={25}
      />

      <View style={styles.searchWrap}>
        <SearchComponent
          placeholder={I18n.t('search_transactions')}
          onChangeText={(text) => onSearch(text)}
          value={searchText}
          extraStyle={{ width: '80%' }}
        />

        <TouchableOpacity
          onPress={() => setFilterModal(true)}
          style={styles.sortIconWrap}
        >
          <FilterIcon width={18} height={18} />
          {filterApplied > 0 && (
            <View
              style={{
                width: 15,
                height: 15,
                borderRadius: consts.BORDER_RADIUS,
                position: 'absolute',
                justifyContent: 'center',
                alignItems: 'center',
                top: 2,
                right: 2,
                backgroundColor: '#003A60',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 9 }}>
                {filterApplied}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <SectionList
        sections={transactionsList}
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
        style={{ backgroundColor: consts.APP_BG_COLOR }}
      />

      {syncModal && (
        <SyncComponent
          visible={syncModal}
          hideModal={() => setSyncModal(false)}
        />
      )}

      {filterModal && (
        <TransactionFilter
          filterItem={filterItem}
          products={products}
          visible={filterModal}
          applyFilters={applyFilters}
          hideModal={() => setFilterModal(false)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#92DDF6',
  },
  emptyText: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: '500',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  header: {
    fontFamily: consts.FONT_REGULAR,
    fontSize: 14,
    color: consts.TEXT_PRIMARY_COLOR,
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
    backgroundColor: consts.APP_BG_COLOR,
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
    borderColor: consts.BORDER_COLOR,
    borderWidth: 1,
    borderRadius: consts.BORDER_RADIUS,
  },
});

const enhanceWithWeights = withObservables([], () => ({
  TRANSACTIONS: observeTransactions(),
}));

export default enhanceWithWeights(Transactions);

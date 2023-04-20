/* eslint-disable function-paren-newline */
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import withObservables from '@nozbe/with-observables';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  findAllUpdatedCards,
  observeFarmers,
  newFarmersCount,
  updatedFarmersCount,
} from '../../services/farmersHelper';
import {
  erroredTransactionsCount,
  newTransactionsCount,
} from '../../services/transactionsHelper';
import { updateSyncPercentage } from '../../redux/LoginStore';
import { SortIcon } from '../../assets/svg';
import CustomSmallButton from '../../components/CustomSmallButton';
import SearchComponent from '../../components/SearchComponent';
import FarmerListItem from '../../components/FarmerListItem';
import CustomHeader from '../../components/CustomHeader';
import I18n from '../../i18n/i18n';
import SyncComponent from '../../components/SyncComponent';
import {
  SORT_MENUS,
  AVATAR_AS_LETTERS,
  AVATAR_BG_COLORS,
} from '../../services/constants';

const { width } = Dimensions.get('window');

const FarmersHomeScreen = ({ navigation, FARMERS }) => {
  const { syncInProgress, syncSuccessfull } = useSelector(
    (state) => state.login,
  );
  const { theme } = useSelector((state) => state.common);
  const { isConnected } = useSelector((state) => state.connection);
  const [farmersList, setFarmersList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [syncModal, setSyncModal] = useState(false);
  const [sortModal, setSortModal] = useState(false);
  const [sortValue, setSortValue] = useState(SORT_MENUS[0].key);
  const [syncIcon, setSyncIcon] = useState(
    require('../../assets/images/sync_success.png'),
  );
  const isFocused = useIsFocused();
  const dispatch = useDispatch();

  useEffect(() => {
    setupInitialValues();
  }, [FARMERS]);

  useEffect(() => {
    setupSyncingIcon();
  }, [isConnected, isFocused, syncInProgress, syncSuccessfull]);

  const setupInitialValues = async () => {
    // default sorting for farmers
    const sortedFarmers = await sortFarmers(FARMERS, sortValue);
    setFarmersList(sortedFarmers);
  };

  /**
   * setting sync icon based on sync count
   */
  const setupSyncingIcon = async () => {
    setSearchText('');

    const newFarmers = await newFarmersCount();
    const modifiedFarmers = await updatedFarmersCount();
    const unSyncCards = await findAllUpdatedCards();
    const newTransactions = await newTransactionsCount();

    const totalCount =
      newFarmers + modifiedFarmers + newTransactions + unSyncCards.length;

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
   * start syncing
   */
  const checkSyncing = async () => {
    await setInitialValues();
    setSyncModal(true);
  };

  /**
   * setting initial sync data
   *
   * @returns {boolean} true
   */
  const setInitialValues = async () => {
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
        obj.transaction.status = erroredTransactions > 0 ? 'failed' : 'pending';
      }

      await AsyncStorage.setItem('syncData', JSON.stringify(obj));
      dispatch(updateSyncPercentage([0, totalCount]));
    }
    return true;
  };

  /**
   * sorting farmers list based on search text
   *
   * @param {string} text farmer name
   */
  const onSearch = async (text) => {
    setSearchText(text);
    const textSearch = text.toLowerCase();
    if (textSearch === '') {
      onRefresh();
    } else {
      const filteredFarmers = FARMERS.filter((farmer) => {
        const name = farmer.name.toLowerCase();
        return name.includes(textSearch);
      });

      const sortedFarmers = await sortFarmers(filteredFarmers, sortValue);
      setFarmersList(sortedFarmers);
    }
  };

  /**
   * navigates to farmer details page
   *
   * @param {object} node farmer object
   * @param {string} avatarBgColor avatar background color code
   */
  const onSelectNode = (node, avatarBgColor) => {
    navigation.navigate('FarmerDetails', {
      node,
      avatarBgColor,
    });
  };

  /**
   * on submit of sort modal, sorting farmers list based on sort item
   *
   * @param {object} item selected sort option
   */
  const onSelectItem = async (item) => {
    if (item.key !== sortValue) {
      setSortValue(item.key);
      const sortedFarmers = await sortFarmers(farmersList, item.key);
      setFarmersList(sortedFarmers);
    }
    setSortModal(false);
  };

  /**
   * sorting farmer based on selected sort option
   *
   * @param   {Array}  farmers farmers list
   * @param   {string} sortKey selected sort option key
   * @returns {Array}          sorted farmer list
   */
  const sortFarmers = async (farmers, sortKey) => {
    const key = sortKey || sortValue || SORT_MENUS[0].key;

    switch (key) {
      case 'created_descending':
        farmers.sort((a, b) => b.created_on.getTime() - a.created_on.getTime());
        return farmers;
      case 'created_ascending':
        farmers.sort((a, b) => a.created_on.getTime() - b.created_on.getTime());
        return farmers;
      case 'name_ascending':
        farmers.sort((a, b) =>
          a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
        );
        return farmers;
      case 'name_descending':
        farmers.sort((a, b) =>
          b.name.toLowerCase().localeCompare(a.name.toLowerCase()),
        );
        return farmers;
      default:
        farmers.sort((a, b) => b.created_on.getTime() - a.created_on.getTime());
        return farmers;
    }
  };

  /**
   * on refresh remove sorted and search filter
   */
  const onRefresh = async () => {
    setSearchText('');
    const sortedFarmers = await sortFarmers(FARMERS, SORT_MENUS[0].key);
    setFarmersList(sortedFarmers);
    setSortValue(SORT_MENUS[0].key);
  };

  const renderItem = ({ item, index }) => (
    <FarmerListItem
      item={item}
      onPress={onSelectNode}
      avatarBgColor={
        AVATAR_AS_LETTERS
          ? AVATAR_BG_COLORS[index % AVATAR_BG_COLORS.length]
          : null
      }
      displayUnSync
    />
  );

  const styles = StyleSheetFactory(theme);

  const emptyComponent = () => {
    return (
      <View style={styles.emptyView}>
        <Text style={styles.emptyFarmerText}>{I18n.t('no_farmers')}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader
        title={I18n.t('farmers')}
        rightImage={syncIcon}
        onPressRight={() => checkSyncing()}
        rightImageSize={25}
      />

      <View style={styles.searchWrap}>
        <SearchComponent
          placeholder={I18n.t('search_farmers')}
          onChangeText={(text) => onSearch(text)}
          value={searchText}
          extraStyle={{ width: '80%' }}
        />

        <TouchableOpacity
          onPress={() => setSortModal(true)}
          style={styles.sortIconWrap}
        >
          <SortIcon width={18} height={18} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={farmersList}
        renderItem={renderItem}
        keyboardShouldPersistTaps='always'
        refreshing={false}
        onRefresh={() => onRefresh()}
        progressViewOffset={100}
        ListEmptyComponent={emptyComponent}
        style={styles.flatListStyle}
        keyExtractor={(item, index) => index.toString()}
      />

      <View style={styles.floatingIcon}>
        <CustomSmallButton
          buttonText={I18n.t('add_farmer')}
          textIcon='Add'
          onPress={() => navigation.navigate('AddNewFarmer')}
        />
      </View>

      {syncModal && (
        <SyncComponent
          visible={syncModal}
          hideModal={() => setSyncModal(false)}
        />
      )}

      {sortModal && (
        <SortFarmerModal
          data={SORT_MENUS}
          activeValue={sortValue}
          visible={sortModal}
          hideModal={() => setSortModal(false)}
          onSelectItem={onSelectItem}
        />
      )}
    </SafeAreaView>
  );
};

const SortFarmerModal = ({ ...props }) => {
  return (
    <Modal
      animationType='fade'
      transparent
      visible={props.visible}
      onRequestClose={() => props.hideModal()}
    >
      <TouchableOpacity
        onPress={() => props.hideModal()}
        style={styles.modalContainer}
      >
        <View style={styles.modalContainerSub}>
          <View style={styles.modalTitleSection}>
            <Text style={styles.modalTitle}>{I18n.t('sort_by')}</Text>
          </View>

          {props.data.map((item, index) => (
            <TouchableOpacity
              key={index.toString()}
              onPress={() => props.onSelectItem(item)}
              style={styles.modalItemWrap}
            >
              <Text style={styles.modalItem}>{I18n.t(item.title)}</Text>
              <View
                style={[
                  styles.radioOuter,
                  {
                    borderColor:
                      props.activeValue === item.key ? '#4DCAF4' : '#003A60',
                  },
                ]}
              >
                {props.activeValue === item.key ? (
                  <View style={styles.radioInner} />
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.header_bg,
    },
    floatingIcon: {
      position: 'absolute',
      bottom: 20,
      right: -10,
    },
    emptyFarmerText: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 16,
      letterSpacing: 0.3,
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
    flatListStyle: {
      flex: 1,
      backgroundColor: theme.background_1,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    modalContainerSub: {
      marginTop: 'auto',
      paddingHorizontal: width * 0.05,
      backgroundColor: '#ffffff',
    },
    modalTitleSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: width * 0.05,
      paddingHorizontal: width * 0.03,
    },
    modalItemWrap: {
      padding: width * 0.03,
      marginBottom: width * 0.01,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalItem: {
      color: theme.text_1,
      fontSize: 14,
      fontFamily: theme.font_regular,
    },
    modalTitle: {
      color: theme.text_1,
      fontSize: 16,
      fontFamily: theme.font_medium,
      fontWeight: '500',
      marginTop: 15,
    },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 22 / 2,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioInner: {
      width: 15,
      height: 15,
      borderRadius: 15 / 2,
      backgroundColor: '#4DCAF4',
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
  });
};

const enhanceWithWeights = withObservables([], () => ({
  FARMERS: observeFarmers(),
}));

export default enhanceWithWeights(FarmersHomeScreen);

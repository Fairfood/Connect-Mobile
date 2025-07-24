import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  SafeAreaView,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';
import FileViewer from 'react-native-file-viewer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SORT_MENUS, AVATAR_BG_COLORS } from '../../../utils/constants';
import { updateSyncPercentage } from '../../../redux/LoginStore';
import {
  AddIcon,
  ExportAlertIcon,
  ExportIcon,
  MenuVerticalIcon,
  SortIcon,
} from '../../../assets/svg';
import { logAnalytics } from '../../../utils/serviceHelper';
import {
  countFarmerSyncPending,
  fetchAllFarmers,
} from '../../../db/services/FarmerHelper';
import {
  countDeletedTransactions,
  countErroredTransactions,
  countNewTransactions,
} from '../../../db/services/TransactionsHelper';
import {
  appUpdateValidation,
  exportCsv,
  handleErrors,
  updateSyncIcon,
} from '../../../utils/commonFunctions';
import { getReadableFarmerData, sortFarmers } from './controller';
import CustomSmallButton from '../../../components/buttons/customSmallButton';
import SearchComponent from '../../../components/searchComponent';
import FarmerListItem from '../../../components/lists/farmerListItem';
import CustomHeader from '../../../components/headers/customHeader';
import I18n from '../../../translations/text/i18n';
import SyncComponent from '../../../components/syncComponent';
import CommonAlert from '../../../components/modals/commonAlert';
import StyleSheetFactory from './styles';
import SortFarmerModal from '../../../components/modals/sortFarmerModal';
import { updateFarmerSearchText } from '../../../redux/CommonStore';

const { width } = Dimensions.get('window');

const FarmersHomeScreen = ({ navigation }) => {
  const sortValueRef = useRef();
  const farmerSearchTextRef = useRef();
  const { syncInProgress } = useSelector((state) => state.login);
  const { theme, farmerSearchText } = useSelector((state) => state.common);
  farmerSearchTextRef.current = farmerSearchText;

  const { isConnected } = useSelector((state) => state.connection);
  const { farmerSyncing } = useSelector((state) => state.sync);
  const [load, setLoad] = useState(false);
  const [allFarmers, setAllFarmers] = useState([]);
  const [farmersList, setFarmersList] = useState([]);
  const [searchText, setSearchText] = useState(farmerSearchText);
  const [syncModal, setSyncModal] = useState(false);
  const [sortModal, setSortModal] = useState(false);
  const [dropdownMenu, setDropdownMenu] = useState(false);
  const [exportAlertModal, setExportAlertModal] = useState(false);
  const [exportInProgress, setExportInProgress] = useState(false);
  const styles = StyleSheetFactory();
  const dispatch = useDispatch();

  const dropdownMenuList = [
    {
      key: 'sort',
      label: 'sort',
      icon: <SortIcon width={16} height={16} fill={theme.icon_1} />,
    },
    {
      key: 'export',
      label: 'export',
      icon: <ExportIcon width={18} height={18} fill={theme.icon_1} />,
    },
  ];

  useFocusEffect(
    useCallback(() => {
      updateSyncIcon();
      return () => {};
    }, [isConnected, syncInProgress]),
  );

  useFocusEffect(
    useCallback(() => {
      setupInitialValues();
      return () => {};
    }, [syncInProgress, farmerSyncing]),
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        dispatch(updateFarmerSearchText(searchText));
      };
    }, [searchText]),
  );

  const setupInitialValues = async () => {
    const farmers = await fetchAllFarmers();

    // default sorting for farmers
    setAllFarmers(farmers);

    if (farmerSearchTextRef?.current) {
      onSearch(farmerSearchTextRef.current, farmers);
    } else {
      const sortedFarmers = await sortFarmers(farmers, sortValueRef.current);
      setFarmersList(sortedFarmers);
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
    if (!syncInProgress) {
      const farmerPending = await countFarmerSyncPending();
      const newTransactions = await countNewTransactions();
      const deletedTransactions = await countDeletedTransactions();
      const erroredTransactions = await countErroredTransactions();

      let obj = await AsyncStorage.getItem('syncData');
      obj = JSON.parse(obj);

      const totalCount = farmerPending + newTransactions + deletedTransactions;

      if (farmerPending > 0) {
        obj.farmer.pending = farmerPending;
        obj.farmer.status = 'pending';
      }

      if (newTransactions > 0) {
        obj.transaction.pending = newTransactions + deletedTransactions;
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
   * @param {string}  text       farmer name
   * @param {Array}   farmerList all farmer list
   */
  const onSearch = async (text, farmerList = null) => {
    const farmers = farmerList || allFarmers;
    setSearchText(text);
    setDropdownMenu(false);

    const textSearch = text.toLowerCase();
    if (textSearch === '') {
      onRefresh();
    } else {
      const filteredFarmers = farmers.filter((farmer) => {
        const arr = [
          farmer.name.toLowerCase(),
          farmer.card_id.toLowerCase(),
          farmer.display_id.toLowerCase(),
        ];

        return arr.some((str) => str.includes(textSearch));
      });

      const sortedFarmers = await sortFarmers(
        filteredFarmers,
        sortValueRef.current,
      );
      setFarmersList(sortedFarmers);
    }
  };

  /**
   * navigates to farmer details page
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
   * @param {object} item selected sort option
   */
  const onSelectItem = async (item) => {
    if (item.key !== sortValueRef.current) {
      logAnalytics('sort_farmer', {
        sort_by: item.key,
      });

      sortValueRef.current = item.key;
      const sortedFarmers = await sortFarmers(allFarmers, item.key);
      setFarmersList(sortedFarmers);
    }
    setSortModal(false);
  };

  const openDropdownMenu = () => {
    setDropdownMenu(!dropdownMenu);
  };

  const handleDropdownMenu = (key) => {
    switch (key) {
      case 'sort':
        setSortModal(true);
        break;
      case 'export':
        setExportAlertModal(true);
        break;
      default:
        break;
    }
    setDropdownMenu(false);
  };

  const exportData = async () => {
    try {
      setExportInProgress(true);
      const filteredFarmersList = await getReadableFarmerData(farmersList);
      if (filteredFarmersList.length > 0) {
        const exportedPath = await exportCsv(filteredFarmersList, 'farmers');
        await FileViewer.open(exportedPath);
      }
    } catch (error) {
      if (!String(error).includes('No app associated with this mime type')) {
        Toast.show({
          type: 'error',
          text1: I18n.t('error'),
          text2: I18n.t('something_went_wrong'),
        });

        handleErrors(error, {
          ref: 'FarmerHomeScreen_exportData',
        });
      }
    } finally {
      setExportAlertModal(false);
      setExportInProgress(false);
    }
  };

  const addFarmer = async () => {
    const valid = await appUpdateValidation();
    if (valid) {
      navigation.navigate('AddNewFarmer');
    }
  };

  /**
   * on refresh remove sorted and search filter
   */
  const onRefresh = async () => {
    setSearchText('');
    dispatch(updateFarmerSearchText(''));
    setDropdownMenu(false);
    sortValueRef.current = SORT_MENUS[0].key;
    const sortedFarmers = await sortFarmers(allFarmers, SORT_MENUS[0].key);
    setFarmersList(sortedFarmers);
    setLoad(!load);
  };

  const renderItem = ({ item, index }) => {
    return (
      <FarmerListItem
        index={index}
        item={item}
        onPress={onSelectNode}
        avatarBgColor={AVATAR_BG_COLORS[index % AVATAR_BG_COLORS.length]}
        displayUnSync
      />
    );
  };

  const emptyComponent = () => {
    return (
      <View style={styles.emptyView}>
        {farmerSyncing ? (
          <Text style={styles.emptyFarmerText}>
            {`${I18n.t('loading')}...`}
          </Text>
        ) : (
          <Text style={styles.emptyFarmerText}>{I18n.t('no_farmers')}</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomHeader
        title={I18n.t('farmers')}
        onPressRight={checkSyncing}
        testID="farmer-home-header"
      />

      <View style={styles.searchWrap}>
        <SearchComponent
          placeholder={I18n.t('search_by_name_or_card')}
          onChangeText={(text) => onSearch(text)}
          onFocus={() => setDropdownMenu(false)}
          value={searchText}
          extraStyle={{ width: '80%' }}
          onPressRightIcon={() => navigation.navigate('SearchCard')}
        />

        <TouchableOpacity
          onPress={openDropdownMenu}
          style={styles.sortIconWrap}
          testID="menu-icon"
        >
          <MenuVerticalIcon width={22} height={22} />
        </TouchableOpacity>
      </View>

      {dropdownMenu && (
        <View style={styles.dropdownMenuWrap} testID="menu-list">
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

      {farmersList ? (
        <FlatList
          data={farmersList}
          extraData={farmersList}
          renderItem={renderItem}
          keyboardShouldPersistTaps="always"
          refreshing={false}
          onRefresh={onRefresh}
          progressViewOffset={100}
          ListEmptyComponent={emptyComponent}
          style={styles.flatListStyle}
          keyExtractor={(item, index) => index.toString()}
        />
      ) : null}

      <View style={styles.floatingIcon}>
        <CustomSmallButton
          buttonText={I18n.t('add_farmer')}
          textIcon={<AddIcon />}
          onPress={addFarmer}
          testID="add-farmer-button"
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
          activeValue={sortValueRef.current || SORT_MENUS[0].key}
          visible={sortModal}
          hideModal={() => setSortModal(false)}
          onSelectItem={onSelectItem}
        />
      )}

      {exportAlertModal && (
        <CommonAlert
          title={I18n.t('export_modal_title')}
          visible={exportAlertModal}
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

export default FarmersHomeScreen;

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import {
  updateSyncPercentage,
  setSyncInProgressSuccess,
  updateLoginLoadingStatus,
} from '../../../../redux/LoginStore';
import {
  checkAppUpdateAvailable,
  handleErrors,
  requestPermission,
  updateSyncIcon,
} from '../../../../utils/commonFunctions';
import { initiateSync } from '../../../../sync/SyncInitials';
import { fetchAllActiveProducts } from '../../../../db/services/ProductsHelper';
import { fetchActivePayoutPremiums } from '../../../../db/services/PremiumsHelper';
import { countFarmerSyncPending } from '../../../../db/services/FarmerHelper';
import {
  countDeletedTransactions,
  countErroredTransactions,
  countNewTransactions,
} from '../../../../db/services/TransactionsHelper';
import { UploadIcon, RightArrowIcon } from '../../../../assets/svg';
import { changeAppUpdateClicked } from '../../../../redux/CommonStore';
import CustomButton from '../../../../components/buttons/customButton';
import I18n from '../../../../translations/text/i18n';
import SyncComponent from '../../../../components/syncComponent';
import HelpTutorial from '../../../../components/modals/helpTutorial';
import CommonAlert from '../../../../components/modals/commonAlert';
import apiConfig from '../../../../api/config';
import StyleSheetFactory from './styles';
import DashboardHeader from '../../../../components/headers/dashboardHeader';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { isConnected } = useSelector((state) => state.connection);
  const { syncStage } = useSelector((state) => state.sync);
  const { theme, appUpdate, appForceUpdate, appUpdateClicked } = useSelector(
    (state) => state.common,
  );
  const { syncInProgress, syncSuccessful, userCompanyDetails } = useSelector(
    (state) => state.login,
  );

  const styles = useMemo(() => StyleSheetFactory(theme), [theme]);
  const dispatch = useDispatch();

  const buyEnabled = userCompanyDetails?.buy_enabled ?? false;
  const sellEnabled = userCompanyDetails?.sell_enabled ?? false;

  const [syncModal, setSyncModal] = useState(false);
  const [helpModal, setHelpModal] = useState(false);
  const [products, setProducts] = useState(null);
  const [premiums, setPremiums] = useState(null);
  const [payEnabled, setPayEnabled] = useState(false);
  const [updateModal, setUpdateModal] = useState(false);

  useEffect(() => {
    setInitials();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setUpProducts();
      setUpGenericPremiums();
      return () => {};
    }, [syncInProgress]),
  );

  useEffect(() => {
    if (isConnected && !syncInProgress) {
      startSyncing();
    }
  }, [isConnected]);

  useFocusEffect(
    useCallback(() => {
      updateSyncIcon();
      return () => {};
    }, [isConnected, syncInProgress, syncSuccessful]),
  );

  useFocusEffect(
    useCallback(() => {
      if (appUpdateClicked) {
        checkAppUpdateAvailable();
      }
      return () => {};
    }, []),
  );

  const setInitials = async () => {
    dispatch(setSyncInProgressSuccess());
    dispatch(updateLoginLoadingStatus(false, 'continue'));

    const helpTutorial = await AsyncStorage.getItem('help_tutorial');
    if (!helpTutorial) {
      setHelpModal(true);
    }
  };

  /**
   * setting up available products for buy transaction
   */
  const setUpProducts = async () => {
    const activeProducts = await fetchAllActiveProducts();
    setProducts(activeProducts);
  };

  /**
   * setting up available premiums for buy transaction
   */
  const setUpGenericPremiums = async () => {
    const genericPremiums = await fetchActivePayoutPremiums();
    setPremiums(genericPremiums);
    setPayEnabled(genericPremiums.length > 0);
  };

  /**
   * starting syncing process
   */
  const startSyncing = async () => {
    await setInitialValues();
    initiateSync();
  };

  /**
   * setting initial syncing count
   */
  const setInitialValues = async () => {
    try {
      if (!syncInProgress) {
        const farmerPending = await countFarmerSyncPending();
        const newTransactions = await countNewTransactions();
        const deletedTransactions = await countDeletedTransactions();
        const erroredTransactions = await countErroredTransactions();

        const obj = JSON.parse(await AsyncStorage.getItem('syncData'));

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
      // return true;
    } catch (err) {
      handleErrors(err);
    }
  };

  /**
   * opening sync modal
   */
  const checkSyncing = useCallback(async () => {
    await setInitialValues();
    setSyncModal(true);
  }, []);

  /**
   * requesting geo location access permission
   * @param {string} type option that user chose.
   */
  const onSelect = async (type) => {
    try {
      if (appForceUpdate) {
        if (syncInProgress) {
          Toast.show({
            type: 'error',
            text1: I18n.t('in_progress'),
            text2: I18n.t('try_after_sync'),
          });
          return;
        }

        setUpdateModal(true);
        return;
      }

      const lastUpdatedPremiums = await AsyncStorage.getItem(
        'last_updated_premiums',
      );
      const lastUpdatedProducts = await AsyncStorage.getItem(
        'last_updated_products',
      );
      if (!lastUpdatedPremiums || !lastUpdatedProducts) {
        Toast.show({
          type: 'error',
          text1: I18n.t('in_progress'),
          text2: I18n.t('initial_try_after_sync'),
        });
        return;
      }

      if (type === 'send' && syncStage === 2) {
        Toast.show({
          type: 'error',
          text1: I18n.t('in_progress'),
          text2: I18n.t('transaction_sync_onprogress'),
        });
        return;
      }

      if (!products || products.length === 0 || !premiums) {
        Toast.show({
          type: 'error',
          text1: I18n.t('data_not_found'),
          text2: I18n.t('product_or_premium_not_found'),
        });
        return;
      }

      const locationGranted = await requestPermission('location');

      if (type === 'buy') {
        navigation.navigate(products.length > 1 ? 'ChooseProducts' : 'Buy', {
          locationAllowed: locationGranted,
          allProducts: products,
          selectedProducts: products,
        });
      } else if (type === 'send') {
        navigation.navigate('Send', {
          locationAllowed: locationGranted,
        });
      } else if (type === 'pay') {
        navigation.navigate(
          premiums.length > 1 ? 'ChooseMultiPremiums' : 'PayFarmer',
          {
            locationAllowed: locationGranted,
            allPremiums: premiums,
            selectedPremiums: premiums,
          },
        );
      }
    } catch (error) {
      handleErrors(error);
    }
  };

  const update = useCallback(() => {
    if (syncInProgress) {
      Toast.show({
        type: 'error',
        text1: I18n.t('in_progress'),
        text2: I18n.t('try_after_sync'),
      });
    } else {
      dispatch(changeAppUpdateClicked(true));
      Linking.openURL(apiConfig.GOOGLE_PLAY_STORE_URL);
    }
  }, [syncInProgress]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer} testID="home-header">
        <DashboardHeader navigation={navigation} checkSyncing={checkSyncing} />

        {/* update view */}
        <View>
          {appUpdate && apiConfig.APP_ENVIRONMENT === 'production' && (
            <TouchableOpacity onPress={update} style={styles.updateWrap}>
              <View style={styles.updateWrapSub}>
                <Text style={styles.updateTitle}>
                  {appForceUpdate
                    ? I18n.t('app_update_require')
                    : I18n.t('update_available')}
                </Text>
                <Text style={styles.updateMessage}>
                  {appForceUpdate
                    ? I18n.t('app_force_update_msg')
                    : I18n.t('app_update_msg')}
                </Text>
              </View>
              <RightArrowIcon
                width={width * 0.04}
                height={width * 0.04}
                stroke={theme.icon_1}
              />
            </TouchableOpacity>
          )}

          <Image
            source={require('../../../../assets/images/lines.png')}
            style={styles.linesImage}
          />
        </View>
      </View>

      {/* Click receive or deliver to start a transaction */}
      {sellEnabled && (
        <Text style={[styles.buyText]}>{I18n.t('greeting')}</Text>
      )}

      {!sellEnabled && (
        <Text style={[styles.buyText]}>{I18n.t('greeting_with_buy')}</Text>
      )}

      {buyEnabled && (
        <CustomButton
          buttonText={I18n.t('buy')}
          medium
          onPress={() => onSelect('buy')}
          testID="buy-button"
        />
      )}

      {sellEnabled && (
        <View style={styles.buttonMargin}>
          <CustomButton
            buttonText={I18n.t('sell')}
            medium
            onPress={() => onSelect('send')}
            textColor={theme.primary}
            backgroundColor={theme.background_1}
          />
        </View>
      )}

      {payEnabled && (
        <View style={styles.buttonMargin}>
          <CustomButton
            buttonText={I18n.t('pay')}
            medium
            onPress={() => onSelect('pay')}
            textColor={theme.primary}
            backgroundColor={theme.background_1}
          />
        </View>
      )}

      {syncModal && (
        <SyncComponent
          visible={syncModal}
          hideModal={() => setSyncModal(false)}
        />
      )}

      {helpModal && (
        <HelpTutorial
          visible={helpModal}
          hideModal={() => setHelpModal(false)}
        />
      )}

      {updateModal && apiConfig.APP_ENVIRONMENT === 'production' && (
        <CommonAlert
          title={
            appForceUpdate
              ? I18n.t('app_update_require')
              : I18n.t('update_available')
          }
          visible={updateModal}
          message={
            appForceUpdate
              ? I18n.t('app_force_update_msg')
              : I18n.t('app_update_msg')
          }
          submitText={I18n.t('update')}
          icon={<UploadIcon width={width * 0.3} height={width * 0.3} />}
          onSubmit={update}
          onCancel={appForceUpdate ? null : () => setUpdateModal(false)}
          onRequestClose={appForceUpdate ? null : () => setUpdateModal(false)}
        />
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;

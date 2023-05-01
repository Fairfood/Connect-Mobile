import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import {
  updateSyncPercentage,
  setSyncInProgressSuccess,
} from '../../../redux/LoginStore';
import {
  newFarmersCount,
  updatedFarmersCount,
} from '../../../services/farmersHelper';
import {
  erroredTransactionsCount,
  newTransactionsCount,
} from '../../../services/transactionsHelper';
import { requestPermission } from '../../../services/commonFunctions';
import { populateDatabase } from '../../../services/populateDatabase';
import {
  HIT_SLOP_FIFTEEN,
  HIT_SLOP_TEN,
  AVATAR_BG_COLORS,
  TYPE_GENERIC_PREMIUM,
} from '../../../services/constants';
import { getAllProducts } from '../../../services/productsHelper';
import { getPremiumByCategory } from '../../../services/premiumsHelper';
import Icon from '../../../icons';
import CustomButton from '../../../components/CustomButton';
import I18n from '../../../i18n/i18n';
import Avatar from '../../../components/Avatar';
import SyncComponent from '../../../components/SyncComponent';
import HelpTutorial from '../../../components/HelpTutorial';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { isConnected } = useSelector((state) => state.connection);
  const { theme } = useSelector((state) => state.common);
  const {
    syncInProgress,
    syncSuccessfull,
    userProjectDetails,
    userCompanyDetails,
    loggedInUser,
  } = useSelector((state) => state.login);
  const { syncStage } = useSelector((state) => state.sync);
  const [load, setLoad] = useState(false);
  const [syncModal, setSyncModal] = useState(false);
  const [helpModal, setHelpModal] = useState(false);
  const [products, setProducts] = useState(null);
  const [premiums, setPremiums] = useState(null);
  const [payEnabled, setPayEnabled] = useState(false);
  const [SyncIcon, setSyncIcon] = useState(
    require('../../../assets/images/sync_pending.png'),
  );
  const dispatch = useDispatch();

  useEffect(() => {
    setInitials();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setUpProducts();
      setUpPremiums();
      return () => {};
    }, [syncInProgress]),
  );

  useEffect(() => {
    startSyncing();
  }, [isConnected]);

  useFocusEffect(
    useCallback(() => {
      setupSyncingIcon();
      return () => {};
    }, [isConnected, syncInProgress, syncSuccessfull]),
  );

  const setInitials = async () => {
    dispatch(setSyncInProgressSuccess());

    const helpTutorial = await AsyncStorage.getItem('help_tutorial');
    if (!helpTutorial) {
      setHelpModal(true);
    }
  };

  /**
   * setting up available products for buy transaction
   */
  const setUpProducts = async () => {
    const allProducts = await getAllProducts();

    // filtering products only eligible for that company
    const companyProducts = userCompanyDetails?.products ?? [];
    const filteredProducts = allProducts.filter((prod) => {
      return companyProducts.includes(prod.server_id);
    });

    // filtering products by active status
    const productActiveList = filteredProducts.filter((prod) => {
      return prod.is_active;
    });

    setProducts(productActiveList);
    setLoad(!load);
  };

  /**
   * setting up available premiums for buy transaction
   */
  const setUpPremiums = async () => {
    const genericPremiums = await getPremiumByCategory(TYPE_GENERIC_PREMIUM);
    setPremiums(genericPremiums);
    if (genericPremiums.length > 0) {
      setPayEnabled(true);
    } else {
      setPayEnabled(false);
    }
    setLoad(!load);
  };

  /**
   * starting syncing process
   */
  const startSyncing = async () => {
    if (isConnected && !syncInProgress) {
      await setInitialValues();
      populateDatabase();
    }
  };

  /**
   * setting initial syncing count
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
      // return true;
    } catch (error) {
      // console.log('error', error);
    }
  };

  /**
   * setting sync icons based on sync counts
   */
  const setupSyncingIcon = async () => {
    const newFarmers = await newFarmersCount();
    const modifiedFarmers = await updatedFarmersCount();
    const newTransactions = await newTransactionsCount();
    const totalCount = newFarmers + modifiedFarmers + newTransactions;

    if (syncInProgress) {
      setSyncIcon(require('../../../assets/images/sync_pending.png'));
    } else if (!syncInProgress && !syncSuccessfull) {
      setSyncIcon(require('../../../assets/images/sync_error.png'));
    } else if (totalCount === 0) {
      setSyncIcon(require('../../../assets/images/sync_success.png'));
    } else {
      setSyncIcon(require('../../../assets/images/sync_pending.png'));
    }
  };

  /**
   * opening sync modal
   */
  const checkSyncing = async () => {
    await setInitialValues();
    setSyncModal(true);
  };

  /**
   * naviagtion rp profile page
   */
  const openProfile = () => {
    navigation.navigate('Profile');
  };

  /**
   * requesting geo location access permission
   *
   * @param {string} type option that user chose,'Buy' or 'Send'
   */
  const requestLocationPermission = async (type) => {
    if (products && premiums) {
      if (type === 'Send' && syncStage === 2) {
        Toast.show({
          type: 'error',
          text1: I18n.t('in_progress'),
          text2: I18n.t('transaction_sync_onprogress'),
        });
        return;
      }

      const locationGranted = await requestPermission('location');

      if (type === 'Buy') {
        if (products.length > 1) {
          navigation.navigate('ChooseProducts', {
            locationAllowed: locationGranted,
            allProducts: products,
          });
        } else {
          navigation.navigate('Buy', {
            locationAllowed: locationGranted,
            allProducts: products,
            selectedProducts: products,
          });
        }
      } else if (type === 'Send') {
        navigation.navigate('Send', { locationAllowed: locationGranted });
      } else if (type === 'pay_farmer') {
        if (premiums.length > 1) {
          navigation.navigate('ChooseMultiPremiums', {
            locationAllowed: locationGranted,
            allPremiums: premiums,
          });
        } else {
          navigation.navigate('PayFarmer', {
            locationAllowed: locationGranted,
            allPremiums: premiums,
            selectedPremiums: premiums,
          });
        }
      }
    }
  };

  const styles = StyleSheetFactory(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={{ flex: 1 }}>
          <View style={styles.headerContainerSub}>
            <View style={styles.headerInnerWrap}>
              <View style={styles.onlineWrap}>
                <Icon
                  name='Online'
                  size={20}
                  color={isConnected ? '#27AE60' : theme.button_bg_1}
                />
                <Text
                  style={[
                    styles.online,
                    {
                      marginTop: 0,
                      color: isConnected ? '#27AE60' : theme.button_bg_1,
                    },
                  ]}
                >
                  {isConnected ? I18n.t('online') : I18n.t('offline')}
                </Text>
              </View>
              <View style={styles.iconWrap}>
                <TouchableOpacity
                  onPress={() => checkSyncing()}
                  style={styles.syncWrap}
                  hitSlop={HIT_SLOP_FIFTEEN}
                >
                  <Image source={SyncIcon} style={{ width: 25, height: 25 }} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openProfile()}
                  style={styles.proPicWrap}
                  hitSlop={HIT_SLOP_TEN}
                >
                  <Avatar
                    image={loggedInUser.image}
                    containerStyle={styles.proPic}
                    avatarBgColor={AVATAR_BG_COLORS[0]}
                    avatarName={`${loggedInUser.first_name} ${loggedInUser.last_name}`}
                    avatarNameStyle={styles.avatarNameStyle}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        <Image
          source={require('../../../assets/images/lines.png')}
          style={styles.linesImage}
        />
      </View>

      {/* Click receive or deliver to start a transaction */}
      {userProjectDetails?.sell_enabled && (
        <Text style={[styles.buyText]}>{I18n.t('greeting')}</Text>
      )}

      {!userProjectDetails?.sell_enabled && (
        <Text style={[styles.buyText]}>{I18n.t('greeting_with_buy')}</Text>
      )}

      {userProjectDetails?.buy_enabled && (
        <View>
          <CustomButton
            buttonText={I18n.t('buy')}
            medium
            onPress={() => {
              requestLocationPermission('Buy');
            }}
          />
        </View>
      )}

      {userProjectDetails?.sell_enabled && (
        <View style={styles.buttonMargin}>
          <CustomButton
            buttonText={I18n.t('sell')}
            medium
            onPress={() => {
              requestLocationPermission('Send');
            }}
            backgroundColor={theme.background_1}
          />
        </View>
      )}

      {payEnabled && (
        <View style={styles.buttonMargin}>
          <CustomButton
            buttonText={I18n.t('pay')}
            medium
            onPress={() => {
              requestLocationPermission('pay_farmer');
            }}
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
    </SafeAreaView>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background_1,
    },
    buyText: {
      fontSize: 18,
      fontFamily: theme.font_regular,
      lineHeight: 28,
      paddingBottom: 30,
      color: theme.text_1,
      marginHorizontal: '7.5%',
      marginTop: 50,
    },
    online: {
      color: '#27AE60',
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 16,
      marginLeft: 10,
      marginTop: 10,
    },
    headerContainer: {
      height: '50%',
      backgroundColor: '#92DDF6',
    },
    headerContainerSub: {
      flex: 1,
      alignItems: 'flex-start',
      margin: 15,
    },
    headerInnerWrap: {
      flex: 1,
      alignContent: 'space-around',
      flexDirection: 'row',
    },
    onlineWrap: {
      flex: 1,
      flexDirection: 'row',
      marginTop: 10,
    },
    iconWrap: {
      flex: 1,
      flexDirection: 'row',
      alignContent: 'flex-end',
      justifyContent: 'flex-end',
    },
    syncWrap: {
      marginHorizontal: 15,
      marginTop: 10,
      width: 30,
      height: 40,
    },
    proPicWrap: {
      marginTop: 10,
      width: 30,
      height: 30,
    },
    proPic: {
      width: 25,
      height: 25,
      borderRadius: 25 / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    linesImage: {
      width: '100%',
      height: 40,
      bottom: -5,
    },
    avatarNameStyle: {
      color: '#ffffff',
      fontSize: 11,
      fontFamily: theme.font_bold,
    },
    buttonMargin: {
      marginTop: width * 0.05,
    },
  });
};

export default HomeScreen;

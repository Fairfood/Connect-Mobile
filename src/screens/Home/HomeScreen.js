import React, { useEffect, useState } from 'react';
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
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  updateSyncPercentage,
  setSyncInProgressSuccess,
} from '../../redux/LoginStore';
import {
  newFarmersCount,
  updatedFarmersCount,
} from '../../services/farmersHelper';
import {
  erroredTransactionsCount,
  newTransactionsCount,
} from '../../services/transactionsHelper';
import { requestPermission } from '../../services/commonFunctions';
import Icon from '../../icons';
import CustomButton from '../../components/CustomButton';
import I18n from '../../i18n/i18n';
import { populateDatabase } from '../../services/populateDatabase';
import Avatar from '../../components/Avatar';
import SyncComponent from '../../components/SyncComponent';
import HelpTutorial from '../../components/HelpTutorial';
import * as consts from '../../services/constants';
import { getAllProducts } from '../../services/productsHelper';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { isConnected } = useSelector((state) => state.connection);
  const {
    syncInProgress,
    syncSuccessfull,
    userProjectDetails,
    userCompanyDetails,
    loggedInUser,
  } = useSelector((state) => state.login);
  const [syncModal, setSyncModal] = useState(false);
  const [helpModal, setHelpModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [SyncIcon, setSyncIcon] = useState(
    require('../../assets/images/sync_pending.png'),
  );
  const dispatch = useDispatch();
  const isFocused = useIsFocused();

  useEffect(() => {
    setupProducts();
  }, []);

  useEffect(() => {
    startSyncing();
  }, [isConnected]);

  useEffect(() => {
    setupSyncingIcon();
  }, [isConnected, isFocused, syncInProgress, syncSuccessfull]);

  const setupProducts = async () => {
    dispatch(setSyncInProgressSuccess());

    const helpTutorial = await AsyncStorage.getItem('help_tutorial');
    if (!helpTutorial) {
      setHelpModal(true);
    }

    const allProducts = await getAllProducts();

    // filtering products only eligilbe for that company
    const companyProducts = userCompanyDetails?.products ?? [];
    const filteredProducts = allProducts.filter((prod) => {
      return companyProducts.includes(prod.server_id);
    });

    // filtering products by active status
    const productActiveList = filteredProducts.filter((prod) => {
      return prod.is_active;
    });

    setProducts(productActiveList);
  };

  const startSyncing = async () => {
    if (isConnected && !syncInProgress) {
      await setInitailValues();
      populateDatabase();
    }
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
      // return true;
    } catch (error) {
      // console.log('errorrrrrrrrr', error);
    }
  };

  const setupSyncingIcon = async () => {
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

  const checkSyncing = async () => {
    await setInitailValues();
    setSyncModal(true);
  };

  const openProfile = () => {
    navigation.navigate('Profile');
  };

  const requestLocationPermission = async (type) => {
    if (products.length !== 0) {
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
      } else {
        navigation.navigate('Send', { locationAllowed: locationGranted });
      }
    }
  };

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
                  color={isConnected ? '#27AE60' : consts.BUTTON_COLOR_PRIMARY}
                />
                <Text
                  style={[
                    styles.online,
                    {
                      marginTop: 0,
                      color: isConnected
                        ? '#27AE60'
                        : consts.BUTTON_COLOR_PRIMARY,
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
                  hitSlop={consts.HIT_SLOP_FIFTEEN}
                >
                  <Image source={SyncIcon} style={{ width: 25, height: 25 }} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openProfile()}
                  style={styles.propicWrap}
                  hitSlop={consts.HIT_SLOP_TEN}
                >
                  <Avatar
                    image={loggedInUser.image}
                    containerStyle={styles.propic}
                    avatarBgColor={consts.AVATAR_BG_COLORS[0]}
                    avatarName={`${loggedInUser.first_name} ${loggedInUser.last_name}`}
                    avatarNameStyle={styles.avatarNameStyle}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        <Image
          source={require('../../assets/images/lines.png')}
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
        <View
          style={{
            marginBottom: width * 0.05,
          }}
        >
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
        <View>
          <CustomButton
            buttonText={I18n.t('sell')}
            medium
            onPress={() => {
              requestLocationPermission('Send');
            }}
            backgroundColor={consts.APP_BG_COLOR}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: consts.APP_BG_COLOR,
  },
  buyText: {
    fontSize: 18,
    fontFamily: consts.FONT_REGULAR,
    lineHeight: 28,
    paddingBottom: 30,
    color: consts.TEXT_PRIMARY_COLOR,
    marginHorizontal: '7.5%',
    marginTop: 50,
  },
  online: {
    color: '#27AE60',
    fontWeight: '500',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 16,
    marginLeft: 10,
    marginTop: 10,
  },
  fields: {
    fontSize: 20,
    fontFamily: consts.FONT_REGULAR,
    color: consts.TEXT_PRIMARY_COLOR,
    paddingLeft: 10,
    marginLeft: 15,
    marginTop: 10,
  },
  modalView: {
    flex: 1,
  },
  logoContainer: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 15,
    marginHorizontal: 20,
  },
  forgotpassword: {
    fontSize: 14,
    fontFamily: consts.FONT_REGULAR,
    lineHeight: 28,
    paddingBottom: 10,
    textAlign: 'left',
    marginRight: 30,
    color: consts.TEXT_PRIMARY_COLOR,
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
  propicWrap: {
    marginTop: 10,
    width: 30,
    height: 30,
  },
  propic: {
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
    fontFamily: consts.FONT_BOLD,
  },
});

export default HomeScreen;

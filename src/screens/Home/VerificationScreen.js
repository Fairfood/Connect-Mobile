/* eslint-disable camelcase */
/* eslint-disable global-require */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Modal,
  BackHandler,
  ActivityIndicator,
  Linking,
  ToastAndroid,
} from 'react-native';
import { useSelector } from 'react-redux';
import NfcManager, { NfcEvents } from 'react-native-nfc-manager';
import moment from 'moment';
import Geolocation from 'react-native-geolocation-service';
import * as Sentry from '@sentry/react-native';
import { findFarmerById, getAllFarmers } from '../../services/farmersHelper';
import { saveTransaction } from '../../services/transactionsHelper';
import { saveBatch } from '../../services/batchesHelper';
import { saveTransactionPremium } from '../../services/transactionPremiumHelper';
import { syncTransactions } from '../../services/syncTransactions';
import { findCardByCardId } from '../../services/cardsHelper';
import { requestPermission } from '../../services/commonFunctions';
import FarmerListItem from '../../components/FarmerListItem';
import CustomTextInput from '../../components/CustomTextInput';
import SearchComponent from '../../components/SearchComponent';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import CardNew from '../../components/CardNew';
import TransparentButton from '../../components/TransparentButton';
import CustomButton from '../../components/CustomButton';
import I18n from '../../i18n/i18n';
import Icon from '../../icons';
import CommonAlert from '../../components/CommonAlert';
import * as consts from '../../services/constants';
import { NfcNotSupportIcon, TurnOnNfcIcon } from '../../assets/svg';

const { height, width } = Dimensions.get('window');
const defaultPosition = { coords: { longitude: 0, latitude: 0 } };

const VerificationScreen = ({ navigation, route }) => {
  const { isConnected } = useSelector((state) => state.connection);
  const { products, totalPrice, newFarmer, preLocation } = route.params;
  const { userProjectDetails, syncInProgress } = useSelector(
    (state) => state.login,
  );
  const { currency, quality_correction } = userProjectDetails;
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [noCard, setNoCard] = useState(false);
  const [error, setError] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [selectedColor, setSelectedColor] = useState(consts.AVATAR_BG_COLORS[0]);
  const [farmersList, setFarmersList] = useState(null);
  const [allFarmersList, setAllFarmersList] = useState(null);
  const [displayModal, setDisplayModal] = useState(false);
  const [alertModal, setAlertModal] = useState(false);
  const [alertKey, setAlertKey] = useState('');
  const [alertMessage, setAllertMessage] = useState(
    I18n.t('something_went_wrong'),
  );
  const [alertTitle, setAlertTitle] = useState('Alert');
  const [alertSubmitText, setAlertSubmitText] = useState('Ok');
  const [alertIcon, setAlertIcon] = useState(null);

  const backNavigation = () => {
    NfcManager.unregisterTagEvent().catch(() => 0);
    cleanUp(false);
    setVerifyLoading(false);
    navigation.goBack(null);
  };

  useEffect(() => {
    setupInitialValues();
  }, []);

  const setupInitialValues = async () => {
    const farmers = await getAllFarmers();
    farmers.forEach((f) => {
      f.label = f.name;
      f.value = f.id;
    });

    farmers.sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    if (newFarmer) {
      setSelectedFarmer(newFarmer);
    }

    setAllFarmersList(farmers);
    setFarmersList(farmers);
    initNfc();
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackButtonClick,
    );
    return () => {
      subscription.remove();
    };
  }, []);

  /**
   * clearing NFC event
   */
  function handleBackButtonClick() {
    NfcManager.unregisterTagEvent().catch(() => 0);
    cleanUp();
    navigation.goBack(null);
  }

  const initNfc = async () => {
    NfcManager.isSupported()
      .then(async (supported) => {
        if (supported) {
          const isEnabled = await NfcManager.isEnabled();
          if (isEnabled) {
            await NfcManager.start();
            readNdef();
          } else {
            createAlert('nfc_no_turned_on');
          }
        } else {
          createAlert('nfc_unsupported');
        }
      })
      .catch((err) => {
        Sentry.captureException(`error initiating${err}`);
      });
  };

  const readNdef = () => {
    return new Promise((resolve) => {
      let tagFound = null;

      NfcManager.setEventListener(NfcEvents.DiscoverTag, async (tag) => {
        setVerifyLoading(true);
        tagFound = tag;
        // resolve(tagFound);

        const isCardExist = await findCardByCardId(tagFound.id);
        if (isCardExist.length === 0) {
          incompleteTransaction();
          return;
        }

        if (!isCardExist[0].node_id) {
          incompleteTransaction();
          return;
        }
        const farmer = await findFarmerById(isCardExist[0].node_id);

        if (farmer) {
          requestAccessLocationPermission(farmer);
        } else {
          incompleteTransaction();
          return;
        }

        NfcManager.unregisterTagEvent().catch((err) => {
          Sentry.captureMessage(`tag error>>>${err}`);
        });
      });

      NfcManager.setEventListener(NfcEvents.SessionClosed, () => {
        cleanUp(true);
        if (!tagFound) {
          resolve();
        }
      });

      NfcManager.registerTagEvent();
    });
  };

  const turnOnNFC = async () => {
    NfcManager.goToNfcSetting();
  };

  const cleanUp = (tryagain) => {
    NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
    NfcManager.setEventListener(NfcEvents.SessionClosed, null);
    if (tryagain) {
      initNfc();
    }
  };

  const requestAccessLocationPermission = async (farmer) => {
    if (preLocation) {
      transactionValidate(farmer, preLocation);
    } else {
      const locationGranted = await requestPermission('location');

      if (locationGranted) {
        Geolocation.getCurrentPosition(
          (position) => {
            transactionValidate(farmer, position);
            return position.coords;
          },
          () => {
            transactionValidate(farmer, defaultPosition);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 },
        );
      } else {
        transactionValidate(farmer, defaultPosition);
      }
    }
  };

  const incompleteTransaction = () => {
    setVerifyLoading(false);
    createAlert('card_not_found_for_farmer');
    readNdef();
  };

  // get total amount of individual product excluding card depentent premium
  const getTotal = async (ProductTotal, Premiums) => {
    if (noCard) {
      const total = Premiums.reduce((a, b) => {
        if (b?._raw?.is_card_dependent) {
          return a - b.total;
        }
        return a;
      }, Math.round(ProductTotal));
      return total;
    }

    return Math.round(ProductTotal);
  };

  // get total amount of all products including premium amounts
  const getTotalPrice = () => {
    let total = 0;
    products.map((product) => {
      if (!product.quantity || !product.base_price || !product.total_amount) {
        return 0;
      }
      total += product.total_amount;
      total += product.premium_total;
    });
    return Math.round(parseFloat(total));
  };

  const getPremiumRemovedValues = (key) => {
    let allTotal = totalPrice;

    const mainObj = {};
    products.map((product) => {
      product.applied_premiums.map((premium) => {
        const serverId = premium._raw.server_id;
        if (mainObj[serverId]) {
          if (!premium._raw.is_card_dependent) {
            const obj = mainObj[serverId];
            let { total } = obj;
            total += premium.total;
            obj.total = total;
            mainObj[serverId] = obj;
          } else {
            allTotal -= premium.total;
          }
        } else if (!premium._raw.is_card_dependent) {
          const obj = {
            name: premium._raw.name,
            total: premium.total,
          };
          mainObj[serverId] = obj;
        } else {
          allTotal -= premium.total;
        }
      });
    });

    if (key === 'total') {
      return allTotal;
    }
    return Object.values(mainObj);
  };

  const transactionValidate = async (node, position) => {
    let valid = true;

    await Promise.all(
      products.map(async (product) => {
        const quantity = parseFloat(product.quantity);
        const price = product.total_amount;
        const total = await getTotal(
          product.total_amount + product.premium_total,
          product.applied_premiums,
        );

        const product_price = product.base_price;

        if (
          quantity === '' ||
          quantity <= consts.MINIMUM_TRANSACTION_QUANTITY ||
          quantity >= consts.MAXIMUM_TRANSACTION_QUANTITY ||
          price === '' ||
          price <= 0 ||
          total === '' ||
          total <= 0 ||
          product_price === '' ||
          product_price <= 0
        ) {
          valid = false;
          setError(`${I18n.t('check_the_values_entered')} ${product.name}`);
        } else {
          await Promise.all(
            product.applied_premiums.map(async (premium) => {
              const amount =
                parseFloat(premium.amount) * parseFloat(product.quantity);
              if (amount <= 0) {
                valid = false;
                setError(
                  `${I18n.t('check_the_values_entered')} ${product.name}`,
                );
              }
            }),
          );
        }
      }),
    );

    if (valid) {
      setError('');
      completeTransaction(node, position);
    } else {
      setVerifyLoading(false);
    }
  };

  const completeTransaction = async (node, position) => {
    const transactionArray = [];

    await Promise.all(
      products.map(async (product) => {
        const date = new Date();
        const quantity = parseFloat(product.quantity);
        const price = product.total_amount;
        const total = await getTotal(
          product.total_amount + product.premium_total,
          product.applied_premiums,
        );
        const product_price = product.base_price;
        const extra_fields = product.extra_fields ?? null;

        const transactionObj = {
          server_id: null,
          node_id: node.id,
          node_name: node.name,
          currency,
          product_id: product.id,
          type: consts.APP_TRANS_TYPE_INCOMING,
          quantity,
          ref_number: null,
          price,
          invoice: null,
          date: moment(Math.round(date)).format('DD MMM YYYY'),
          total,
          created_on: parseInt(Math.round(date) / 1000),
          quality_correction: 100,
          product_price,
          product_name: product.name,
          verification_method: consts.VERIFICATION_METHOD_CARD,
          verification_longitude: position.coords.longitude,
          verification_latitude: position.coords.latitude,
          extra_fields: extra_fields ?? '',
        };

        const transactionId = await saveTransaction(transactionObj);
        transactionObj.id = transactionId;
        transactionObj.total_amount = product.total_amount;
        transactionObj.premium_total =
          parseFloat(total) - parseFloat(product.total_amount);
        transactionArray.push(transactionObj);

        const batch = {
          server_id: null,
          product_id: product.id,
          transaction_id: transactionId,
          name: product.name,
          initial_quantity: parseFloat(product.quantity),
          current_quantity: parseFloat(product.quantity),
          ref_number: null,
          unit: 1,
        };

        await saveBatch(batch);
        await saveAllTransactionPremium(
          product.applied_premiums,
          product.quantity,
          transactionId,
        );
      }),
    ).then(async () => {
      let checkTransactionStatus = false;

      if (isConnected && !syncInProgress) {
        checkTransactionStatus = true;
        await syncTransactions();
      }

      setVerifyLoading(false);

      NfcManager.unregisterTagEvent().catch(() => 0);
      cleanUp(false);

      navigation.navigate('TransactionComplete', {
        farmerName: node.name,
        total: totalPrice,
        transactionArray,
        checkTransactionStatus,
      });
    });
  };

  const saveAllTransactionPremium = async (
    applied_premiums,
    product_quality,
    transaction_id,
  ) => {
    await Promise.all(
      applied_premiums.map(async (premium) => {
        const amount =
          parseFloat(premium._raw.amount) * parseFloat(product_quality);
        await saveTransactionPremium(premium._raw.id, transaction_id, amount);
      }),
    );
  };

  const requestCameraPermission = async () => {
    if (selectedFarmer != null) {
      const cameraGranted = await requestPermission('camera');
      const microphoneGranted = await requestPermission('microphone');

      if (!cameraGranted || !microphoneGranted) {
        ToastAndroid.show(
          I18n.t('allow_camera_permission'),
          ToastAndroid.SHORT,
        );
        Linking.openSettings();
      } else {
        goToTakePicture();
      }
    } else {
      setError(I18n.t('select_a_farmer'));
    }
  };

  const goToTakePicture = () => {
    setError('');

    const farmer = {
      farmer_name: selectedFarmer.name,
      node_name: selectedFarmer.name,
      node_id: selectedFarmer.id,
    };

    NfcManager.unregisterTagEvent().catch(() => 0);
    cleanUp(false);

    setVerifyLoading(false);

    const params = {
      products,
      totalPrice: getPremiumRemovedValues('total'),
      farmer,
    };

    navigation.navigate('TakePicture', params);
  };

  const onSearch = (text) => {
    searchText = text.toLowerCase();
    if (searchText === '') {
      setFarmersList(allFarmersList);
    } else {
      const filteredFarmers = allFarmersList.filter((farmer) => {
        let { name } = farmer;
        name = name.toLowerCase();
        return name.includes(searchText);
      });
      filteredFarmers.reverse();
      setFarmersList(filteredFarmers);
    }
  };

  const createAlert = (key) => {
    setAlertKey(key);
    setVerifyLoading(false);

    if (key === 'nfc_no_turned_on') {
      setAlertTitle(I18n.t('nfc_no_turned_on'));
      setAllertMessage(I18n.t('turn_on_nfc_continue'));
      setAlertSubmitText(I18n.t('turn_on'));
      setAlertIcon(
        <TurnOnNfcIcon width={width * 0.27} height={width * 0.27} />,
      );
    } else if (key === 'nfc_unsupported') {
      setAlertTitle(I18n.t('nfc_unsupported'));
      setAllertMessage(I18n.t('nfc_not_support_device'));
      setAlertSubmitText(I18n.t('ok'));
      setAlertIcon(
        <NfcNotSupportIcon width={width * 0.27} height={width * 0.27} />,
      );
    } else if (key === 'card_not_found_for_farmer') {
      setAlertTitle(I18n.t('card_not_found_for_farmer'));
      setAllertMessage(I18n.t('card_not_issued_for_farmer'));
      setAlertSubmitText(I18n.t('ok'));
      setAlertIcon(
        <Image
          source={require('../../assets/images/card-not-found.png')}
          resizeMode='contain'
          style={{ width: width * 0.3, height: width * 0.3 }}
        />,
      );
    }
    setAlertModal(true);
  };

  const onPressAlert = (key) => {
    if (key === 'nfc_no_turned_on') {
      turnOnNFC();
    } else if (key === 'card_not_found_for_farmer') {
      readNdef();
    }
    setAlertModal(false);
  };

  // get premium array with name and total (group by premium)
  const getPremiumTotals = () => {
    if (products.length > 0) {
      const mainObj = {};
      products.map((product) => {
        product.applied_premiums.map((premium) => {
          const serverId = premium._raw.server_id;
          if (mainObj[serverId]) {
            const obj = mainObj[serverId];
            let { total } = obj;
            total += premium.total;
            obj.total = total;
            mainObj[serverId] = obj;
          } else {
            const obj = {
              name: premium._raw.name,
              total: premium.total,
            };
            mainObj[serverId] = obj;
          }
        });
      });
      return Object.values(mainObj);
    }

    return [];
  };

  const onNoCardSubmit = () => {
    setNoCard(true);

    NfcManager.unregisterTagEvent().catch((err) => {
      Sentry.captureMessage(`tag unregisterTagEvent error${err}`);
    });

    cleanUp(false);
  };

  const renderItem = ({ item, index }) => (
    <FarmerListItem
      item={item}
      onPress={(i, avatarBgColor) => {
        setDisplayModal(false);
        setSelectedFarmer(i);
        setSelectedColor(avatarBgColor);
        setError('');
        setFarmersList(allFarmersList);
      }}
      avatarBgColor={
        consts.AVATAR_AS_LETTERS
          ? consts.AVATAR_BG_COLORS[index % consts.AVATAR_BG_COLORS.length]
          : null
      }
    />
  );

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: noCard ? consts.APP_BG_COLOR : '#D5ECFB' },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {!noCard && (
        <>
          <View style={styles.noCardBackground}>
            <CustomLeftHeader
              title={I18n.t('premium_verification')}
              leftIcon='Close'
              onPress={() => backNavigation()}
            />

            <View style={styles.infoWrap}>
              <View style={{ alignItems: 'center', marginRight: 10 }}>
                <Icon name='info' color='#FFFFFF' size={14} />
              </View>
              <View style={{ width: '95%' }}>
                <Text style={styles.policyText}>
                  {I18n.t('privacy_policy')}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.cardReaderImageContainer}>
            <Image
              source={require('../../assets/images/scanning.gif')}
              resizeMode='contain'
              style={{ width, height: width }}
            />
          </View>

          <View style={styles.withCardBottomWrap}>
            <View style={styles.withCardBottomSubWrap}>
              {verifyLoading ? (
                <View style={styles.cardReadingWrap}>
                  <ActivityIndicator color={consts.TEXT_PRIMARY_COLOR} />
                  <Text style={[styles.scanning, { marginLeft: 10 }]}>
                    {I18n.t('reading_farmer_card')}
                  </Text>
                </View>
              ) : (
                <Text style={styles.scanning}>
                  {I18n.t('scanning_farmer_card')}
                </Text>
              )}
            </View>
            <View style={styles.formTitleContainer}>
              <Text style={styles.formTitle}>
                {I18n.t('tap_farmer_card_to_verify_premium')}
              </Text>
            </View>
            <View style={styles.noCardButton}>
              <TransparentButton
                buttonText={`${I18n.t('no_farmer_card')}?`}
                onPress={() => onNoCardSubmit()}
                padding={7}
                color='#4DCAF4'
              />
            </View>

            {error !== '' && <Text style={styles.errorMessage}>{error}</Text>}

            {products && (
              <View style={{ width: '95%', alignSelf: 'center' }}>
                <CardNew
                  products={products}
                  cardColor='#5691AE'
                  textColor={consts.APP_BG_COLOR}
                  premiums={getPremiumTotals()}
                  totalPrice={getTotalPrice()}
                  currency={currency}
                  qualityCorrectionEnabled={quality_correction}
                />
              </View>
            )}
          </View>
        </>
      )}

      {noCard && (
        <View style={{ paddingHorizontal: width * 0.03 }}>
          <CustomLeftHeader
            backgroundColor={consts.APP_BG_COLOR}
            title={I18n.t('premium_verification')}
            leftIcon='arrow-left'
            onPress={() => backNavigation()}
          />
          <View>
            {products && (
              <CardNew
                products={products}
                cardColor='#5691AE'
                textColor={consts.APP_BG_COLOR}
                premiums={getPremiumRemovedValues('premium')}
                totalPrice={getPremiumRemovedValues('total')}
                currency={currency}
                qualityCorrectionEnabled={quality_correction}
              />
            )}

            <View style={styles.formTitleContainer}>
              <Text style={[styles.formTitle, { textAlign: 'left' }]}>
                {I18n.t('select_farmer')}
                *
              </Text>
            </View>

            {selectedFarmer == null && (
              <TouchableOpacity
                onPress={() => setDisplayModal(true)}
                style={{ zIndex: 1 }}
              >
                <CustomTextInput
                  placeholder={I18n.t('select_a_farmer')}
                  editable={false}
                  extraStyle={{ width: '100%', alignSelf: 'center' }}
                />
              </TouchableOpacity>
            )}

            {error !== '' && <Text style={styles.errorMessage}>{error}</Text>}

            {displayModal && selectedFarmer == null && (
              <Modal
                animationType='slide'
                transparent
                visible={displayModal}
                onRequestClose={() => setDisplayModal(false)}
              >
                <View
                  style={{ flex: 1, backgroundColor: 'rgba(0, 58, 96, 0.2)' }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedFarmer(null);
                      setSelectedFarmer(null);
                      setDisplayModal(false);
                    }}
                    style={{ height: '40%' }}
                  />
                  <View style={styles.searchFarmerWrap}>
                    <SearchComponent
                      placeholder={I18n.t('search_farmers')}
                      onChangeText={(text) => onSearch(text)}
                    />
                    <FlatList
                      data={farmersList}
                      renderItem={renderItem}
                      keyboardShouldPersistTaps='always'
                      style={styles.flatlist}
                      ListEmptyComponent={(
                        <View style={styles.emptyList}>
                          <Text style={styles.formTitle}>
                            {I18n.t('no_farmers')}
                          </Text>
                        </View>
                      )}
                      keyExtractor={(item, index) => index.toString()}
                    />
                  </View>
                </View>
              </Modal>
            )}

            {selectedFarmer != null && (
              <View style={{ width: '100%', alignSelf: 'center' }}>
                <FarmerListItem
                  item={selectedFarmer}
                  onClose={() => {
                    setSelectedFarmer(null);
                    setSelectedColor(null);
                  }}
                  avatarBgColor={selectedColor}
                  displayClose
                />
              </View>
            )}

            <View style={styles.buttonWrap}>
              <CustomButton
                buttonText={I18n.t('verify_with_photo')}
                onPress={() => requestCameraPermission()}
                extraStyle={{ width: '100%' }}
              />
            </View>
          </View>
        </View>
      )}

      {alertModal && (
        <CommonAlert
          visible={alertModal}
          title={alertTitle}
          message={alertMessage}
          submitText={alertSubmitText}
          icon={alertIcon}
          onSubmit={() => onPressAlert(alertKey)}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: width * 0.04,
  },
  formTitleContainer: {
    marginTop: 35,
    marginBottom: 20,
  },
  formTitle: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 16,
    textAlign: 'center',
  },
  cardReaderImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noCardButton: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  scanning: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: 'normal',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 10,
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: consts.FONT_REGULAR,
    lineHeight: 28,
    paddingBottom: 10,
    textAlign: 'center',
    color: consts.ERROR_ICON_COLOR,
  },
  noCardBackground: {
    backgroundColor: 'transparent',
    width: '100%',
  },
  infoWrap: {
    backgroundColor: consts.TEXT_PRIMARY_LIGHT_COLOR,
    flexDirection: 'row',
    width: '95%',
    padding: 10,
    alignSelf: 'center',
  },
  policyText: {
    fontFamily: 'Moderat-Medium',
    fontSize: 12,
    color: '#FFFFFF',
  },
  searchFarmerWrap: {
    height: '60%',
    marginTop: 'auto',
    backgroundColor: consts.APP_BG_COLOR,
  },
  emptyList: {
    height: 100,
    width: '100%',
    justifyContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 30,
    backgroundColor: consts.APP_BG_COLOR,
  },
  buttonWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    marginVertical: 20,
  },
  withCardBottomWrap: {
    marginTop: height * -0.12,
    paddingBottom: 15,
  },
  withCardBottomSubWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardReadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flatlist: {
    flex: 1,
    marginHorizontal: 10,
    backgroundColor: consts.APP_BG_COLOR,
  },
});

export default VerificationScreen;

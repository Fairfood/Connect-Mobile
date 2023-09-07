/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
/* eslint-disable no-return-assign */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Keyboard,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useSelector } from 'react-redux';
import Collapsible from 'react-native-collapsible';
import Geolocation from 'react-native-geolocation-service';

import {
  BlueRoundTickIcon,
  DeleteBinIcon,
  PlusRoundIcon,
  ThinArrowDownIcon,
} from '../../../assets/svg';
import {
  MINIMUM_PAY_FARMER_AMOUNT,
  MAXIMUM_PAY_FARMER_AMOUNT,
  HIT_SLOP_TEN,
  HIT_SLOP_TWENTY,
} from '../../../services/constants';
import { convertCurrency, stringToJson } from '../../../services/commonFunctions';
import I18n from '../../../i18n/i18n';
import FormTextInput from '../../../components/FormTextInput';
import CustomLeftHeader from '../../../components/CustomLeftHeader';
import CustomButton from '../../../components/CustomButton';
import CustomInputFields from '../../../components/CustomInputFields';

const { width, height } = Dimensions.get('window');

const PayFarmer = ({ navigation, route }) => {
  const { allPremiums, selectedPremiums, locationAllowed, newFarmer } =
    route.params;
  const payedAmountRefs = useRef([]);

  const { userProjectDetails, userCompanyDetails } = useSelector(
    (state) => state.login,
  );
  const { theme } = useSelector((state) => state.common);
  const { currency } = userProjectDetails;
  const appCustomFields = userCompanyDetails?.app_custom_fields
    ? stringToJson(userCompanyDetails.app_custom_fields)
    : null;

  const [load, setLoad] = useState(false);
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);
  const [premiums, setPremiums] = useState([]);
  const [initialPremiums, setInitialPremiums] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [location, setLocation] = useState(null);
  const [activeCollapse, setActiveCollapse] = useState(null);
  const [premiumModal, setPremiumModal] = useState(false);
  const [error, setError] = useState('');

  const backNavigation = () => {
    navigation.goBack(null);
  };

  useEffect(() => {
    setupInitialValues();
  }, []);

  /**
   * setting up initial product values
   */
  const setupInitialValues = async () => {
    setLoading(true);
    if (locationAllowed) {
      fetchLocation();
    }

    const allPrem = allPremiums.map((premium) => {
      premium.label = premium.name;
      premium.value = premium.id;
      premium.paid_amount = ''; // calculated
      premium.extra_fields =
        appCustomFields && Object.keys(appCustomFields).length > 0
          ? appCustomFields
          : null;
      return premium;
    });

    const firstPremium = allPrem.filter((x) => {
      return x.id === selectedPremiums[0].id;
    });

    if (firstPremium.length > 0) {
      setPremiums(firstPremium);
      setActiveCollapse(firstPremium[0].id);
    } else {
      setPremiums(allPrem[0]);
      setActiveCollapse(allPrem[0].id);
    }

    setInitialPremiums(allPrem);
    setLoading(false);
  };

  /**
   * fetching geo location
   */
  const fetchLocation = async () => {
    Geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
      },
      (error) => {
        setLocation(null);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 },
    );
  };

  /**
   * creating an alert message that card is already assigned
   * @param {object} updatedPremiums updated premium array
   */
  const updateValues = (updatedPremiums) => {
    setPremiums((premiums) => updatedPremiums);
    calculateTotalPrice(updatedPremiums);
    validateData(updatedPremiums);
    setLoad(!load);
  };

  /**
   * setting quantity of each product based on the array index
   * @param {string}  paidAmount product paidAmount
   * @param {number}  orIndex  index of updated product in product array
   */
  const onChangeAmount = (paidAmount, orIndex) => {
    let premiumAmount = paidAmount.toString().replace(',', '.');
    if (premiumAmount === '.') {
      premiumAmount = '0.';
    }

    premiums.find((i, index) => index === orIndex).paid_amount = premiumAmount;
    updateValues(premiums);
  };

  /**
   * validating input data
   */
  const validateData = async () => {
    if (premiums.length === 0) {
      setValid(false);
      setLoad(!load);
      return;
    }

    let success = true;

    premiums.map((premium) => {
      if (!premium.paid_amount || premium.paid_amount === 0) {
        success = false;
      }
    });

    if (success) {
      setError('');
    }
    setValid(success);
    setLoad(!load);
  };

  /**
   * updating custom field values based on premiumId and index
   * @param {object}  item    updated custom fields object
   * @param {number}  index   index of updated product in product array
   * @param {Array}   itemId  updated product's itemId
   */
  const updateCustomData = (item, index, itemId) => {
    premiums.map((premium) => {
      if (premium.id === itemId) {
        if (
          premium?.extra_fields?.custom_fields?.pay_farmer_fields?.[index]
            ?.key === item.key
        ) {
          premium.extra_fields.custom_fields.pay_farmer_fields[index].value =
            item.value;

          setPremiums((premiums) => premiums);
          validateData(updatedPremiums);
          setLoad(!load);
        }
      }
    });
  };

  /**
   * submit validation
   * @returns {boolean} valid or not
   */
  const validateSubmit = async () => {
    if (premiums.length === 0) {
      setLoad(!load);
      return false;
    }

    let valid = true;

    premiums.map((premium) => {
      if (!premium.paid_amount) {
        setError(`${I18n.t('price')} ${premium.name} ${I18n.t('required')}.`);

        valid = false;
        return;
      }

      const paidAmount = parseFloat(premium.paid_amount);

      if (paidAmount <= MINIMUM_PAY_FARMER_AMOUNT) {
        setError(
          `${I18n.t('price_of')} ${premium.name} ${I18n.t(
            'must_be_greater_than',
          )} ${MINIMUM_PAY_FARMER_AMOUNT}${currency}`,
        );
        valid = false;
        return;
      }

      if (paidAmount >= MAXIMUM_PAY_FARMER_AMOUNT) {
        success = false;
        setError(
          `${I18n.t('price_of')} ${premium.name} ${I18n.t(
            'must_be_lower_than',
          )} ${MAXIMUM_PAY_FARMER_AMOUNT}${currency}`,
        );
        valid = false;
      }
    });

    if (valid) {
      setError('');
    }
    setLoad(!load);
    return valid;
  };

  /**
   * submit function
   */
  const confirmBuy = async () => {
    const fieldsValid = await validateSubmit();
    if (!fieldsValid) {
      return;
    }

    setError('');

    const applicablePremiums = premiums.filter((prem) => {
      return parseFloat(prem.paid_amount) > MINIMUM_PAY_FARMER_AMOUNT;
    });

    const params = {
      premiums: applicablePremiums,
      totalPrice,
      newFarmer: newFarmer ?? null,
      preLocation: location,
    };

    navigation.navigate('PayFarmerVerification', params);
  };

  /**
   * calculate and set total price based on updated product array
   * @param {Array} premiums updated product array
   */
  const calculateTotalPrice = (premiums) => {
    let total = 0;
    premiums.map((product) => {
      if (product.paid_amount === '') {
        return 0;
      }
      total += parseFloat(product.paid_amount);
    });

    total = parseFloat(total);

    setTotalPrice(total);
  };

  /**
   * opening add product modal
   */
  const openPremiumModal = async () => {
    const valid = await validateSubmit();
    if (valid) {
      setPremiumModal(true);
    }
  };

  /**
   * opening collapse based on product id
   * @param {string} key product id
   */
  const toggleExpanded = (key) => {
    if (activeCollapse === key) {
      setActiveCollapse(null);
    } else {
      setActiveCollapse(key);
    }
  };

  /**
   * adding premiums to current product array
   * @param {object} item new product object
   */
  const addPremium = (item) => {
    item.paid_amount = '';
    premiums.push(item);

    setActiveCollapse(item.id);
    updateValues(premiums);
    setPremiumModal(false);
  };

  /**
   * removing product from product array
   * @param {string} id product id
   */
  const removePremium = (id) => {
    if (premiums.length === 1) {
      navigation.goBack();
    } else {
      const filteredProducts = premiums.filter((x) => {
        return x.id !== id;
      });
      updateValues(filteredProducts);
    }
  };

  const styles = StyleSheetFactory(theme);

  return (
    <SafeAreaView style={styles.container}>
      <CustomLeftHeader
        backgroundColor={theme.background_1}
        title={I18n.t('pay')}
        leftIcon="arrow-left"
        onPress={() => backNavigation()}
      />

      {loading && <ActivityIndicator size="small" color={theme.text_1} />}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        {premiums.map((item, index) => (
          <View key={index.toString()} style={styles.productWrap}>
            <TouchableOpacity
              hitSlop={HIT_SLOP_TWENTY}
              onPress={() => toggleExpanded(item.id)}
              style={[
                styles.topWrap,
                {
                  backgroundColor:
                    activeCollapse === item.id ? null : 'rgba(221,243,255,0.3)',
                },
              ]}
              disabled={allPremiums.length <= 1}
            >
              <View style={styles.titleWrap}>
                <Text style={styles.fieldTitle}>{item.name}</Text>
                {activeCollapse === item.id && allPremiums.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removePremium(item.id)}
                    style={styles.detailsWrap}
                    hitSlop={HIT_SLOP_TEN}
                  >
                    <DeleteBinIcon
                      width={width * 0.04}
                      height={width * 0.04}
                      fill={theme.icon_error}
                    />
                    <Text style={styles.removeText}>{I18n.t('remove')}</Text>
                  </TouchableOpacity>
                )}

                {activeCollapse !== item.id && allPremiums.length > 1 && (
                  <ThinArrowDownIcon
                    width={width * 0.04}
                    height={width * 0.04}
                    fill="#7091A6"
                  />
                )}
              </View>

              {activeCollapse !== item.id && (
                <View style={styles.detailsWrap}>
                  <Text
                    style={[
                      styles.detailsText,
                      {
                        color: item.paid_amount
                          ? theme.placeholder
                          : theme.icon_error,
                      },
                    ]}
                  >
                    {`${I18n.t('price')}: `}
                  </Text>
                  <Text style={styles.detailsText}>
                    {convertCurrency(item.paid_amount)}
                    {item.paid_amount ? ` ${currency}` : ''}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <Collapsible collapsed={activeCollapse !== item.id} align="center">
              <View key={index.toString()} style={styles.bottomWrap}>
                <FormTextInput
                  inputRef={(el) => (payedAmountRefs.current[index] = el)}
                  mandatory
                  placeholder={`${I18n.t('price')} (${currency})`}
                  value={item.paid_amount
                    .toLocaleString('id')
                    .replace('.', ',')}
                  onChangeText={(text) => {
                    onChangeAmount(text, index);
                  }}
                  keyboardType="number-pad"
                  color={theme.text_1}
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    if (payedAmountRefs?.current?.[index + 1]) {
                      payedAmountRefs.current[index + 1].focus();
                    } else {
                      Keyboard.dismiss();
                    }
                  }}
                  blurOnSubmit={false}
                  extraStyle={{ width: '100%' }}
                />

                {/* custom fields */}
                {item?.extra_fields?.custom_fields?.buy_txn_fields && (
                  <>
                    {item.extra_fields.custom_fields.buy_txn_fields.map(
                      (i, n) => {
                        return (
                          <CustomInputFields
                            key={n.toString()}
                            productId={item.id}
                            item={i}
                            index={n}
                            updatedItem={updateCustomData}
                          />
                        );
                      },
                    )}
                  </>
                )}
              </View>
            </Collapsible>
          </View>
        ))}

        {allPremiums.length > 1 && (
          <TouchableOpacity
            onPress={() => openPremiumModal()}
            style={styles.addProductWarp}
          >
            <Text style={styles.addText}>
              {initialPremiums.length > 0 &&
              initialPremiums.length === premiums.length
                ? I18n.t('all_premiums_added')
                : I18n.t('add_another_premium')}
            </Text>

            {initialPremiums.length > 0 &&
            initialPremiums.length === premiums.length ? null : (
              <PlusRoundIcon
                width={width * 0.05}
                height={width * 0.05}
                fill="#4DCAF4"
              />
            )}
          </TouchableOpacity>
        )}

        {valid && premiums.length > 0 && (
          <View style={[styles.cardContainer]}>
            {premiums.map((item, index) => {
              return (
                <View key={index.toString()} style={styles.basePriceWrap}>
                  <View style={{ width: '70%' }}>
                    <Text style={styles.cardLeftItem}>{`${item.name} :`}</Text>
                  </View>
                  <View style={{ width: '30%' }}>
                    <Text style={styles.cardRightItem}>
                      {`${convertCurrency(item.paid_amount)} ${currency}`}
                    </Text>
                  </View>
                </View>
              );
            })}

            <View style={styles.dottedLine} />

            <View style={styles.totalWrap}>
              <View style={{ width: '30%' }}>
                <Text style={styles.totalText}>
                  {`${I18n.t('total').toUpperCase()}:`}
                </Text>
              </View>
              <View style={{ width: '70%' }}>
                <Text style={styles.totalValue}>
                  {`${convertCurrency(totalPrice)} ${currency}`}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.buttonWrap}>
        {error !== '' && <Text style={styles.errorMessage}>{error}</Text>}

        <CustomButton
          buttonText={I18n.t('next')}
          onPress={() => confirmBuy()}
          extraStyle={{ width: '100%' }}
        />
      </View>

      {premiumModal && (
        <ProductsModal
          visible={premiumModal}
          initialPremiums={initialPremiums}
          premiums={premiums}
          hideModal={() => setPremiumModal(false)}
          addPremium={addPremium}
          theme={theme}
        />
      )}
    </SafeAreaView>
  );
};

const ProductsModal = ({
  visible,
  premiums,
  initialPremiums,
  hideModal,
  addPremium,
  theme,
}) => {
  const getIsSelected = (id) => {
    const isExist = premiums.filter((x) => {
      return x.id === id;
    });
    return isExist.length > 0;
  };

  const styles = StyleSheetFactory(theme);

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={() => hideModal()}
    >
      <TouchableOpacity
        onPress={() => hideModal()}
        style={styles.modalContainer}
      />
      <View style={styles.modalContainerSub}>
        <View style={styles.modalTitleSection}>
          <Text style={styles.modalTitle}>{I18n.t('add_another_premium')}</Text>
        </View>

        {initialPremiums.map((item, index) => (
          <TouchableOpacity
            key={index.toString()}
            onPress={() => addPremium(item)}
            style={styles.modalItemWrap}
            disabled={getIsSelected(item.id)}
          >
            <Text style={styles.modalItem}>{item.name}</Text>
            {getIsSelected(item.id) ? (
              <BlueRoundTickIcon width={width * 0.055} height={width * 0.055} />
            ) : (
              <PlusRoundIcon
                width={width * 0.05}
                height={width * 0.05}
                fill="#4DCAF4"
              />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Modal>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background_1,
      paddingHorizontal: width * 0.05,
    },
    productWrap: {
      borderColor: theme.placeholder,
      borderWidth: 1,
      borderRadius: theme.border_radius,
      marginTop: height * 0.02,
    },
    fieldTitle: {
      color: theme.text_1,
      fontFamily: theme.font_medium,
      fontSize: 16,
    },
    removeText: {
      color: theme.icon_error,
      fontFamily: theme.font_medium,
      fontSize: 14,
      paddingLeft: width * 0.01,
    },
    detailsText: {
      color: theme.placeholder,
      fontFamily: theme.font_medium,
      fontSize: 12,
      marginTop: height * 0.005,
    },
    topWrap: {
      padding: width * 0.04,
      borderRadius: theme.border_radius,
    },
    titleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    detailsWrap: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    bottomWrap: {
      paddingHorizontal: width * 0.03,
    },
    addProductWarp: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderColor: '#4DCAF4',
      borderWidth: 1,
      borderRadius: theme.border_radius,
      padding: width * 0.035,
      marginVertical: height * 0.02,
    },
    addText: {
      color: '#4DCAF4',
      fontFamily: theme.font_regular,
      fontSize: 16,
      marginRight: width * 0.03,
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
      padding: width * 0.035,
      marginBottom: height * 0.015,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderColor: theme.border_1,
      borderWidth: 1,
      borderRadius: theme.border_radius,
    },
    modalItem: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
    },
    modalTitle: {
      color: theme.text_1,
      fontSize: 17,
      fontFamily: theme.font_medium,
      fontWeight: '500',
      marginTop: 15,
    },
    errorMessage: {
      fontSize: 14,
      fontFamily: theme.font_regular,
      lineHeight: 28,
      paddingBottom: 10,
      textAlign: 'center',
      marginHorizontal: 30,
      color: theme.button_bg_1,
    },
    cardContainer: {
      marginVertical: 30,
      padding: 10,
      backgroundColor: theme.background_2,
    },
    cardLeftItem: {
      fontFamily: theme.font_regular,
      fontWeight: '400',
      fontStyle: 'normal',
      fontSize: 14,
      color: theme.text_1,
      opacity: 0.7,
      letterSpacing: 0.2,
    },
    cardRightItem: {
      fontFamily: theme.font_regular,
      fontWeight: '400',
      fontStyle: 'normal',
      fontSize: 13,
      color: theme.text_1,
      textAlign: 'right',
    },
    totalText: {
      fontFamily: theme.font_bold,
      fontStyle: 'normal',
      fontSize: 20,
      color: theme.text_1,
      opacity: 0.7,
      letterSpacing: 0.2,
    },
    totalValue: {
      fontFamily: theme.font_bold,
      fontStyle: 'normal',
      fontSize: 20,
      color: theme.text_1,
      textAlign: 'right',
    },
    dottedLine: {
      borderStyle: 'dotted',
      borderWidth: 1,
      borderRadius: theme.border_radius,
      borderColor: theme.text_2,
      marginHorizontal: 0,
      marginTop: 5,
    },
    basePriceWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    totalWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 10,
    },
    buttonWrap: {
      justifyContent: 'flex-end',
      marginBottom: 20,
    },
  });
};

export default PayFarmer;

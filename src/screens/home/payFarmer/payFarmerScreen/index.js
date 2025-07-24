/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Keyboard,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import Collapsible from 'react-native-collapsible';
import Geolocation from 'react-native-geolocation-service';

import {
  BlueRoundTickIcon,
  DeleteBinIcon,
  PlusRoundIcon,
  ThinArrowDownIcon,
} from '../../../../assets/svg';
import {
  MINIMUM_PAY_FARMER_AMOUNT,
  HIT_SLOP_TEN,
  HIT_SLOP_TWENTY,
  CURRENCY_FORMAT,
  NUMBER_REGEX,
  FORM_TYPE_PAYMENT,
} from '../../../../utils/constants';
import {
  NumberFormatter,
  getCurrency,
} from '../../../../utils/commonFunctions';
import { stringToJson } from '../../../../utils/helperFunctions';
import I18n from '../../../../translations/text/i18n';
import FormTextInput from '../../../../components/inputs/formTextInput';
import CustomLeftHeader from '../../../../components/headers/customLeftHeader';
import CustomButton from '../../../../components/buttons/customButton';
import CustomInputFields from '../../../../components/inputs/customInputFields';
import StyleSheetFactory from './styles';
import {
  calculateTotalPrice,
  fieldLabel,
  fieldVisibility,
  validatePayFarmerForm,
} from './controller';

const { width, height } = Dimensions.get('window');

const PayFarmer = ({ navigation, route }) => {
  const { allPremiums, selectedPremiums, locationAllowed, newFarmer } =
    route.params;
  const payedAmountRefs = useRef([]);
  const commentRefs = useRef([]);
  const styles = StyleSheetFactory();

  const { userCompanyDetails } = useSelector((state) => state.login);
  const forms = userCompanyDetails?.forms ?? [];
  const { theme, currencyFormat } = useSelector((state) => state.common);
  const { decimalSeparator } = currencyFormat;
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
  const [commonCustomFields, setCommonCustomFields] = useState([]);

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

    if (forms.length > 0) {
      const paymentForm = forms.filter((x) => {
        return x.form_type === FORM_TYPE_PAYMENT;
      });
      setCommonCustomFields(paymentForm);
    }

    const allPrem = allPremiums.map((premium) => {
      premium.label = premium.name;
      premium.value = premium.id;
      premium.paid_amount = '';
      premium.comment = '';
      return premium;
    });

    const firstPremium = allPrem.filter((x) => {
      return x.id === selectedPremiums[0].id;
    });

    if (firstPremium.length > 0) {
      setPremiums(firstPremium);
      setTimeout(() => {
        setActiveCollapse(firstPremium[0].id);
      }, 100);
    } else {
      setPremiums(allPrem[0]);
      setTimeout(() => {
        setActiveCollapse(allPrem[0].id);
      }, 100);
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
  const updateValues = async (updatedPremiums) => {
    setPremiums((premiums) => updatedPremiums);
    const total = await calculateTotalPrice(updatedPremiums);
    setTotalPrice(total);
    validateData(updatedPremiums);
    setLoad(!load);
  };

  const getFieldValue = (value) => {
    return NumberFormatter.numberToFormat(
      value,
      decimalSeparator === '.'
        ? CURRENCY_FORMAT.EMPTY_DOT
        : CURRENCY_FORMAT.EMPTY_COMA,
    );
  };

  /**
   * setting quantity of each product based on the array index
   * @param {string}  paidAmount product paidAmount
   * @param {number}  orIndex  index of updated product in product array
   */
  const onChangeAmount = (paidAmount, orIndex) => {
    let premiumAmount = NumberFormatter.formatToNumber(
      paidAmount,
      decimalSeparator === '.'
        ? CURRENCY_FORMAT.EMPTY_DOT
        : CURRENCY_FORMAT.EMPTY_COMA,
    );

    if (!NUMBER_REGEX.test(premiumAmount)) {
      return;
    }

    if (premiumAmount === '.') {
      premiumAmount = '0.';
    }

    premiums.find((i, index) => index === orIndex).paid_amount = premiumAmount;
    updateValues(premiums);
  };

  /**
   * setting quantity of each product based on the array index
   * @param {string}  comment product paidAmount
   * @param {number}  orIndex  index of updated product in product array
   */
  const onChangeComment = (comment, orIndex) => {
    premiums.find((i, index) => index === orIndex).comment = comment.trim();
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
   * updating custom field values based on productId and index
   * @param {object}  item    updated custom fields object
   */
  const updateCommonCustomData = (item) => {
    const fieldCopy = [...commonCustomFields];
    const updatedArr = fieldCopy.map((i) => {
      const updatedFields = i.fields.map((field) => {
        if (field.id === item.id) {
          return {
            ...field,
            value: item.value,
          };
        }
        return field;
      });

      return {
        ...i,
        fields: updatedFields,
      };
    });

    setCommonCustomFields((commonCustomFields) => updatedArr);
    setLoad(!load);
  };

  /**
   * submit validation
   * @param   {object} type section where this function called
   * @returns {boolean}     valid or not
   */
  const handleValidate = async (type = null) => {
    if (premiums.length === 0) {
      setLoad(!load);
      return false;
    }

    // checking custom form values
    if (type && type === 'confirm_buy') {
      let valid = true;
      if (commonCustomFields?.[0]?.fields.length > 0) {
        for (const field of commonCustomFields[0].fields) {
          if (
            field.required === true &&
            (field.value == null ||
              field.value === undefined ||
              field.value === '')
          ) {
            setError(`${field.label || field.key} ${I18n.t('required')}`);
            valid = false;
            break;
          }
        }
      }

      if (!valid) {
        return;
      }
    }

    const currencyCode = getCurrency('code');
    const [isValid, validError] = await validatePayFarmerForm(
      premiums,
      currencyCode,
      forms,
    );

    if (isValid) {
      setError('');
    } else {
      setError(validError);
    }

    setLoad(!load);
    return isValid;
  };

  /**
   * adding common custom fields to each premiums
   * @param   {Array} premiums Current product array
   * @returns {Array}           updated product array
   */
  const addCommonCustomFields = async (premiums) => {
    if (commonCustomFields.length === 0) {
      return premiums;
    }

    await Promise.all(
      premiums.map((p) => {
        p.pay_common_form = commonCustomFields;
      }),
    );

    return premiums;
  };

  /**
   * submit function
   */
  const confirmBuy = async () => {
    const fieldsValid = await handleValidate('confirm_buy');
    if (!fieldsValid) {
      return;
    }

    setError('');

    const applicablePremiums = premiums.filter((prem) => {
      return parseFloat(prem.paid_amount) > MINIMUM_PAY_FARMER_AMOUNT;
    });

    const commonCustomFieldsArr = await addCommonCustomFields(
      applicablePremiums,
    );

    if (commonCustomFieldsArr.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'No product found.',
        text2: I18n.t('something_went_wrong'),
      });
      return;
    }

    const params = {
      premiums: commonCustomFieldsArr,
      totalPrice,
      newFarmer: newFarmer ?? null,
      preLocation: location,
    };

    navigation.navigate('PayFarmerVerification', params);
  };

  /**
   * opening add product modal
   */
  const openPremiumModal = async () => {
    const valid = await handleValidate();
    if (valid) {
      setPremiumModal(true);
    }
  };

  /**
   * opening collapse based on product id
   * @param {string} key product id
   */
  const toggleExpanded = (key) => {
    setActiveCollapse((prevKey) => (prevKey === key ? null : key));
  };

  /**
   * adding premiums to current product array
   * @param {object} item new product object
   */
  const addPremium = (item) => {
    item.paid_amount = '';
    item.comment = '';
    premiums.push(item);

    setTimeout(() => {
      setActiveCollapse(item.id);
    }, 100);
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

  const onSubmittingAmount = (index) => {
    if (commentRefs?.current?.[index]) {
      commentRefs.current[index].focus();
    } else {
      onSubmittingComment(index);
    }
  };

  const onSubmittingComment = (index) => {
    if (payedAmountRefs?.current?.[index + 1]) {
      payedAmountRefs.current[index + 1].focus();
      if (premiums?.[index + 1]?.id) {
        setActiveCollapse(premiums[index + 1].id);
      }
    } else {
      Keyboard.dismiss();
    }
  };

  const onRefresh = async () => {
    if (commonCustomFields.length > 0) {
      setLoading(true);

      const copiedField = JSON.parse(JSON.stringify(commonCustomFields));

      await Promise.all(
        copiedField.map((x) => {
          x.value = null;
        }),
      );
      setCommonCustomFields((commonCustomFields) => copiedField);
      setLoading(false);
      setLoad(!load);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <CustomLeftHeader
        title={I18n.t('pay')}
        onPress={() => navigation.goBack(null)}
      />

      {loading && <ActivityIndicator size="small" color={theme.text_1} />}

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{ paddingTop: 5 }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} />
        }
      >
        {/* common custom fields */}
        {!loading && commonCustomFields?.[0]?.fields && (
          <>
            {commonCustomFields[0].fields.map((i, n) => {
              return (
                <CustomInputFields
                  key={n.toString()}
                  fieldItem={i}
                  formId={commonCustomFields[0].id}
                  updatedItem={updateCommonCustomData}
                />
              );
            })}
          </>
        )}

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
                <Text style={styles.fieldTitle}>
                  {item.label || item.name || 'NA'}
                </Text>
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
                    {`${fieldLabel(forms, 'amount')}: `}
                  </Text>
                  <Text style={styles.detailsText}>
                    {NumberFormatter.currency(item.paid_amount, true)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <Collapsible
              collapsed={activeCollapse !== item.id}
              align="center"
              style={{ flex: 1, paddingBottom: 10 }}
            >
              <View key={index.toString()} style={styles.bottomWrap}>
                <FormTextInput
                  inputRef={(el) => (payedAmountRefs.current[index] = el)}
                  mandatory
                  placeholder={`${fieldLabel(forms, 'amount')} (${getCurrency(
                    'code',
                  )})`}
                  value={getFieldValue(item.paid_amount)}
                  onChangeText={(text) => onChangeAmount(text, index)}
                  keyboardType="number-pad"
                  color={theme.text_1}
                  returnKeyType="next"
                  onSubmitEditing={() => onSubmittingAmount(index)}
                  extraStyle={{ width: '100%' }}
                />

                {fieldVisibility(forms, 'comment') && (
                  <FormTextInput
                    inputRef={(el) => (commentRefs.current[index] = el)}
                    placeholder={fieldLabel(forms, 'comment')}
                    value={item.comment}
                    onChangeText={(text) => onChangeComment(text, index)}
                    color={theme.text_1}
                    returnKeyType="next"
                    autoCapitalize="sentences"
                    onSubmitEditing={() => onSubmittingComment(index)}
                    extraStyle={{ width: '100%' }}
                  />
                )}
              </View>
            </Collapsible>
          </View>
        ))}

        {allPremiums.length > 1 && (
          <TouchableOpacity
            onPress={openPremiumModal}
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
                      {NumberFormatter.currency(item.paid_amount, true)}
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
                  {NumberFormatter.currency(totalPrice, true)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.buttonWrap}>
        {error && <Text style={styles.errorMessage}>{error}</Text>}

        <CustomButton
          buttonText={I18n.t('next')}
          onPress={confirmBuy}
          extraStyle={{ width: '100%', marginVertical: 10 }}
        />
      </View>

      {premiumModal && (
        <ProductsModal
          visible={premiumModal}
          initialPremiums={initialPremiums}
          premiums={premiums}
          hideModal={() => setPremiumModal(false)}
          addPremium={addPremium}
          styles={styles}
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
  styles,
}) => {
  const getIsSelected = (id) => {
    const isExist = premiums.filter((x) => {
      return x.id === id;
    });
    return isExist.length > 0;
  };

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={hideModal}
    >
      <TouchableOpacity onPress={hideModal} style={styles.modalContainer} />
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

export default PayFarmer;

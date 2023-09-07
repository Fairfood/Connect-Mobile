import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import DatePicker from 'react-native-date-picker';
import Toast from 'react-native-toast-message';
import { ISOdateConvert } from '../services/commonFunctions';
import { logAnalytics } from '../services/googleAnalyticsHelper';
import { CloseIcon } from '../assets/svg';
import {
  VERIFICATION_METHOD_CARD,
  VERIFICATION_METHOD_MANUAL,
  APP_TRANS_TYPE_INCOMING,
  APP_TRANS_TYPE_OUTGOING,
  APP_TRANS_TYPE_LOSS,
  DEFAULT_TRANSACTION_FILTER,
  HIT_SLOP_TEN,
} from '../services/constants';
import I18n from '../i18n/i18n';
import FormTextInput from './FormTextInput';
import TransparentButton from './TransparentButton';
import CustomButton from './CustomButton';
import ToastConfig from './ToastConfig';
import { fetchAllProducts } from '../db/services/ProductsHelper';

const { width } = Dimensions.get('window');
const floatRegExp = /^[+-]?([0-9]+([.,][0-9]*)?|[.,][0-9]+)$/;

const verificationMethods = [
  {
    key: 'card',
    title: 'card',
    value: VERIFICATION_METHOD_CARD,
  },
  {
    key: 'manual',
    title: 'manual',
    value: VERIFICATION_METHOD_MANUAL,
  },
];

const TransactionTypes = [
  {
    key: 'buy',
    title: 'buy',
    value: APP_TRANS_TYPE_INCOMING,
  },
  {
    key: 'sent',
    title: 'sent',
    value: APP_TRANS_TYPE_OUTGOING,
  },
  {
    key: 'loss',
    title: 'loss',
    value: APP_TRANS_TYPE_LOSS,
  },
];

const TransactionFilter = ({
  filterItem,
  visible,
  hideModal,
  applyFilters,
}) => {
  const { theme } = useSelector((state) => state.common);
  const [load, setLoad] = useState(false);
  const [filter, setFilter] = useState({});
  const [activeDate, setActiveDate] = useState('');
  const [activeDateType, setActiveDateType] = useState('');
  const [dateModal, setDateModal] = useState(false);
  const [products, setProducts] = useState([]);

  /**
   * setting default filter
   */
  useEffect(() => {
    setupProducts();

    if (filterItem) {
      setFilter(filterItem);
    } else {
      const defaultFilter = JSON.parse(
        JSON.stringify(DEFAULT_TRANSACTION_FILTER),
      );
      setFilter(defaultFilter);
    }

    setLoad(!load);
  }, []);

  /**
   * setting active products
   */
  const setupProducts = async () => {
    const allProducts = await fetchAllProducts();
    const activeProducts = allProducts.filter((prod) => {
      return prod.is_active;
    });
    setProducts(activeProducts);
    setLoad(!load);
  };

  /**
   * updating quantity change
   * @param {string} quantity quantity value entered
   * @param {string} type     quantity field type: 'minQuantity' or 'maxQuantity'
   */
  const onChangeQuantity = (quantity, type) => {
    productQuantity = quantity.replace(',', '.');
    if (productQuantity === '.') {
      productQuantity = '0.';
    }

    if (productQuantity === '' || floatRegExp.test(productQuantity)) {
      if (type === 'minQuantity') {
        filter.quantity.minQuantity = productQuantity;
      } else {
        filter.quantity.maxQuantity = productQuantity;
      }

      setFilter(filter);
      setLoad(!load);
    }
  };

  /**
   * opening date modal based on type
   * @param {string} type date field type: 'start_date' or 'end_date'
   */
  const openDateModal = (type) => {
    if (type === 'start_date') {
      setActiveDateType(type);
      setActiveDate(filter.date.startDate);
    } else if (type === 'end_date') {
      setActiveDateType(type);
      setActiveDate(filter.date.endDate);
    }

    setDateModal(true);
  };

  /**
   * updating date value
   * @param {Date} value selected date
   */
  const onSelectingDate = (value) => {
    const selectedDate = new Date(value).getTime();

    if (activeDateType === 'start_date') {
      filter.date.startDate = selectedDate;
    } else if (activeDateType === 'end_date') {
      filter.date.endDate = selectedDate;
    }

    setFilter(filter);
    setLoad(!load);
    setDateModal(false);
  };

  /**
   * updating transaction type value
   * @param {boolean} key current updated transaction type key
   */
  const updateTransactionType = (key) => {
    filter.transactionType[key] = !filter.transactionType[key];
    setFilter(filter);
    setLoad(!load);
  };

  /**
   * updating product value
   * @param {string} name selected product
   */
  const updateProducts = (name) => {
    let currentProducts = filter.product;
    if (currentProducts.includes(name)) {
      currentProducts = currentProducts.filter((x) => {
        return x !== name;
      });
    } else {
      currentProducts.push(name);
    }

    filter.product = currentProducts;
    setFilter(filter);
    setLoad(!load);
  };

  /**
   * updating verification method value
   * @param {boolean} key selected verification method key
   */
  const updateVerificationMethod = (key) => {
    filter.verificationMethod[key] = !filter.verificationMethod[key];
    setFilter(filter);
    setLoad(!load);
  };

  /**
   * filter validate before submit
   */
  const validateFilter = async () => {
    if (filter.quantity) {
      const { minQuantity, maxQuantity } = filter.quantity;

      // minimum quantity should be less than maximum quantity
      if (parseFloat(minQuantity) > parseFloat(maxQuantity)) {
        Toast.show({
          type: 'error',
          text1: I18n.t('validation'),
          text2: I18n.t('quality_filter_warning'),
        });
        return;
      }
    }

    if (filter.date) {
      const { startDate, endDate } = filter.date;

      // start date should be less than enda date
      if (startDate && endDate && startDate > endDate) {
        Toast.show({
          type: 'error',
          text1: I18n.t('validation'),
          text2: I18n.t('startdate_cannot_greater_enddate'),
        });
        return;
      }
    }

    logAnalytics('filters', {
      filter_type: 'transaction_filter',
    });

    applyFilters(filter, true);
  };

  /**
   * reset filter to default state
   */
  const resetFilter = () => {
    const defaultFilter = JSON.parse(
      JSON.stringify(DEFAULT_TRANSACTION_FILTER),
    );
    setFilter(defaultFilter);

    setActiveDate('');
    setActiveDateType('');
    setDateModal(false);
    setLoad(!load);
    applyFilters(defaultFilter, false);
  };

  const styles = StyleSheetFactory(theme);

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={hideModal}
    >
      <View style={styles.container}>
        <View style={styles.container}>
          {Object.keys(filter).length > 0 && (
            <ScrollView
              contentContainerStyle={styles.containerSub}
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity
                onPress={hideModal}
                style={styles.closeIconWrap}
                hitSlop={HIT_SLOP_TEN}
              >
                <Text style={styles.fieldTitle}>{I18n.t('filters')}</Text>
                <CloseIcon width={width * 0.04} height={width * 0.04} />
              </TouchableOpacity>

              <View style={[styles.itemWrap, { paddingBottom: 0 }]}>
                <Text style={styles.fieldTitle}>{I18n.t('date')}</Text>

                <View style={styles.dateItemWrap}>
                  <TouchableOpacity
                    onPress={() => openDateModal('start_date')}
                    style={{ width: '48%' }}
                  >
                    <View pointerEvents="none">
                      <FormTextInput
                        placeholder={I18n.t('start_date')}
                        value={
                          filter.date.startDate
                            ? ISOdateConvert(filter.date.startDate)
                            : ''
                        }
                        color={theme.text_1}
                        extraStyle={{ width: '100%' }}
                        showDropdown
                      />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => openDateModal('end_date')}
                    style={{ width: '48%' }}
                  >
                    <View pointerEvents="none">
                      <FormTextInput
                        placeholder={I18n.t('end_date')}
                        value={
                          filter.date.endDate
                            ? ISOdateConvert(filter.date.endDate)
                            : ''
                        }
                        color={theme.text_1}
                        extraStyle={{ width: '100%' }}
                        showDropdown
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {products.length > 1 && (
                <View style={styles.itemWrap}>
                  <Text style={styles.fieldTitle}>
                    {I18n.t('transaction_type')}
                  </Text>

                  <View style={styles.tnxCheckBox}>
                    {TransactionTypes.map((item) => (
                      <View key={item.key}>
                        <TouchableOpacity
                          onPress={() => updateTransactionType(item.key)}
                          style={styles.tnxCheckBoxSub}
                        >
                          <CheckBox
                            value={filter.transactionType[item.key]}
                            styles={styles}
                          />
                          <Text style={styles.checkBoxText}>
                            {I18n.t(item.title)}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {products.length > 1 && (
                <View style={styles.itemWrap}>
                  <Text style={styles.fieldTitle}>{I18n.t('product')}</Text>

                  {products.map((item, index) => (
                    <TouchableOpacity
                      key={index.toString()}
                      onPress={() => updateProducts(item.name)}
                      style={styles.productCheckBox}
                      disabled={products.length < 2}
                    >
                      <CheckBox
                        value={filter.product.includes(item.name)}
                        editable={products.length > 1}
                        styles={styles}
                      />
                      <Text style={styles.checkBoxText}>{item.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <View style={styles.itemWrap}>
                <Text style={styles.fieldTitle}>
                  {I18n.t('verification_method')}
                </Text>
                <View style={styles.tnxCheckBox}>
                  {verificationMethods.map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => updateVerificationMethod(item.key)}
                      style={styles.tnxCheckBoxSub}
                    >
                      <CheckBox
                        value={filter.verificationMethod[item.key]}
                        styles={styles}
                      />
                      <Text style={styles.checkBoxText}>
                        {I18n.t(item.title)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.itemWrap}>
                <Text style={styles.fieldTitle}>
                  {`${I18n.t('quantity')} (kg)`}
                </Text>
                <View
                  style={{
                    width: '100%',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 5,
                  }}
                >
                  <View style={{ width: '48%' }}>
                    <FormTextInput
                      placeholder={I18n.t('minimum')}
                      value={filter.quantity.minQuantity.replace('.', ',')}
                      maxLength={6}
                      onChangeText={(text) =>
                        onChangeQuantity(text, 'minQuantity')}
                      keyboardType="number-pad"
                      color={theme.text_1}
                      extraStyle={{ width: '100%', paddingLeft: 0 }}
                    />
                  </View>
                  <View style={{ width: '48%' }}>
                    <FormTextInput
                      placeholder={I18n.t('maximum')}
                      value={filter.quantity.maxQuantity.replace('.', ',')}
                      maxLength={6}
                      onChangeText={(text) =>
                        onChangeQuantity(text, 'maxQuantity')}
                      keyboardType="number-pad"
                      color={theme.text_1}
                      extraStyle={{ width: '100%', paddingLeft: 0 }}
                    />
                  </View>
                </View>
              </View>

              {dateModal && (
                <DatePicker
                  theme="light"
                  modal
                  open={dateModal}
                  date={activeDate ? new Date(activeDate) : new Date()}
                  mode="date"
                  maximumDate={new Date()}
                  onConfirm={(date) => onSelectingDate(date)}
                  onCancel={() => setDateModal(false)}
                />
              )}
            </ScrollView>
          )}
        </View>
        <View style={styles.buttonWrap}>
          <TransparentButton
            buttonText={I18n.t('reset_filter')}
            onPress={() => resetFilter()}
            color="#EA2553"
            extraStyle={{
              width: '48%',
              marginHorizontal: 0,
              paddingHorizontal: 0,
            }}
          />

          <CustomButton
            buttonText={I18n.t('apply_filter')}
            onPress={() => validateFilter()}
            extraStyle={{
              width: '48%',
            }}
          />
        </View>
      </View>

      <Toast config={ToastConfig} visibilityTime={2000} />
    </Modal>
  );
};

const CheckBox = ({ value, size = 20, editable = true, styles }) => {
  return (
    <View
      style={[
        styles.checkBoxOuter,
        {
          width: size,
          height: size,
          borderColor: value ? '#4DCAF4' : '#003A60',
        },
      ]}
    >
      {value || !editable ? (
        <View
          style={[styles.checkBoxInner, { width: size - 5, height: size - 5 }]}
        />
      ) : null}
    </View>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#ffffff',
    },
    containerSub: {
      flexGrow: 1,
      // marginTop: 'auto',
      padding: width * 0.06,
      backgroundColor: theme.background_1,
    },
    closeIconWrap: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignSelf: 'center',
      marginBottom: width * 0.03,
    },
    fieldTitle: {
      color: theme.text_1,
      fontFamily: theme.font_medium,
      fontSize: 16,
    },
    itemWrap: {
      paddingVertical: 15,
      borderBottomColor: '#E5EBEF',
      borderBottomWidth: 1,
    },
    tnxCheckBox: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 15,
      width: '100%',
    },
    dateItemWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 15,
      width: '100%',
      justifyContent: 'space-between',
    },
    tnxCheckBoxSub: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 40,
    },
    checkBoxOuter: {
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: theme.border_radius,
      borderWidth: 1,
    },
    checkBoxInner: {
      borderRadius: theme.border_radius,
      backgroundColor: '#4DCAF4',
    },
    checkBoxText: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontSize: 16,
      marginLeft: 10,
    },
    productCheckBox: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 20,
    },
    viewMore: {
      color: '#4DCAF4',
      fontFamily: theme.font_regular,
      fontSize: 16,
      marginTop: 15,
    },
    buttonWrap: {
      width: '90%',
      alignSelf: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 15,
      backgroundColor: '#ffffff',
    },
  });
};

export default TransactionFilter;

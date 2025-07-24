import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import DatePicker from 'react-native-date-picker';
import Toast from 'react-native-toast-message';
import { CloseIcon } from '../../../assets/svg';
import { getCurrency, NumberFormatter } from '../../../utils/commonFunctions';
import {
  ISOdateConvert,
  getTimestampWithEndTime,
  getTimestampWithStartTime,
} from '../../../utils/helperFunctions';
import { logAnalytics } from '../../../utils/serviceHelper';
import { getAllActivePremiums } from '../../../db/services/PremiumsHelper';
import {
  VERIFICATION_METHOD_CARD,
  VERIFICATION_METHOD_MANUAL,
  PAYMENT_INCOMING,
  PAYMENT_OUTGOING,
  DEFAULT_PAYMENT_FILTER,
  HIT_SLOP_TEN,
  NUMBER_REGEX,
  CURRENCY_FORMAT,
} from '../../../utils/constants';
import I18n from '../../../translations/text/i18n';
import ToastConfig from '../../toastConfig';
import FormTextInput from '../../inputs/formTextInput';
import TransparentButton from '../../buttons/transparentButton';
import CustomButton from '../../buttons/customButton';
import StyleSheetFactory from './styles';

const { width } = Dimensions.get('window');

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

const PaymentTypes = [
  {
    key: 'credit',
    title: 'credit',
    value: PAYMENT_INCOMING,
  },
  {
    key: 'debit',
    title: 'debit',
    value: PAYMENT_OUTGOING,
  },
];

const GroupByTypes = [
  {
    key: 'date',
    title: 'by_date',
    value: 'date',
  },
  {
    key: 'reference_id',
    title: 'by_reference_id',
    value: 'reference_id',
  },
];

const PaymentFilter = ({ filterItem, visible, hideModal, applyFilters }) => {
  const styles = StyleSheetFactory();
  const { theme, currencyFormat } = useSelector((state) => state.common);
  const { decimalSeparator } = currencyFormat;
  const [load, setLoad] = useState(false);
  const [filter, setFilter] = useState({});
  const [activeDate, setActiveDate] = useState('');
  const [activeDateType, setActiveDateType] = useState('');
  const [dateModal, setDateModal] = useState(false);
  const [premiums, setPremiums] = useState([]);

  /**
   * setting default filter
   */
  useEffect(() => {
    setupPremiums();

    if (filterItem) {
      setFilter(filterItem);
    } else {
      const defaultFilter = JSON.parse(JSON.stringify(DEFAULT_PAYMENT_FILTER));
      setFilter(defaultFilter);
    }

    setLoad(!load);
  }, []);

  /**
   * setting premiums
   */
  const setupPremiums = async () => {
    const activePremiums = await getAllActivePremiums();
    const convertedActivePremiums = Array.from(activePremiums);
    // adding base_price type for payment filter
    const obj = {
      name: 'Base price',
    };
    convertedActivePremiums.push(obj);
    setPremiums(convertedActivePremiums);
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
   * updating amount change
   * @param {string} amount amount value entered
   * @param {string} type     amount field type: 'minAmount' or 'maxAmount'
   */
  const onChangeAmount = (amount, type) => {
    let paymentAmount = NumberFormatter.formatToNumber(
      amount,
      decimalSeparator === '.'
        ? CURRENCY_FORMAT.EMPTY_DOT
        : CURRENCY_FORMAT.EMPTY_COMA,
    );

    if (!NUMBER_REGEX.test(paymentAmount)) {
      return;
    }

    if (paymentAmount === '.') {
      paymentAmount = '0.';
    }

    if (type === 'minAmount') {
      filter.amount.minAmount = paymentAmount;
    } else {
      filter.amount.maxAmount = paymentAmount;
    }

    setFilter(filter);
    setLoad(!load);
  };

  /**
   * updating group by type value
   * @param {string} key current updated transaction type key
   */
  const updateGroupByType = (key) => {
    filter.groupByType = key;
    setFilter(filter);
    setLoad(!load);
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
    if (activeDateType === 'start_date') {
      const date = getTimestampWithStartTime(value);
      filter.date.startDate = date;
    } else if (activeDateType === 'end_date') {
      const date = getTimestampWithEndTime(value);
      filter.date.endDate = date;
    }

    setFilter(filter);
    setLoad(!load);
    setDateModal(false);
  };

  /**
   * updating payment type value
   * @param {boolean} key current updated payment type key
   */
  const updatePaymentType = (key) => {
    filter.paymentType[key] = !filter.paymentType[key];
    setFilter(filter);
    setLoad(!load);
  };

  /**
   * updating premium value
   * @param {string} name selected premium
   */
  const updatePremiums = (name) => {
    let currentPremiums = filter.premium;
    if (currentPremiums.includes(name)) {
      currentPremiums = currentPremiums.filter((x) => {
        return x !== name;
      });
    } else {
      currentPremiums.push(name);
    }

    filter.premium = currentPremiums;
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
  const validateFilter = () => {
    if (filter.amount) {
      const { minAmount, maxAmount } = filter.amount;

      // minimum amount should be less than maximum amount
      if (parseFloat(minAmount) > parseFloat(maxAmount)) {
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

      // start date should be less than end date
      if (startDate && endDate && startDate > endDate) {
        Toast.show({
          type: 'error',
          text1: I18n.t('validation'),
          text2: I18n.t('start_date_cannot_greater'),
        });
        return;
      }
    }

    logAnalytics('filters', {
      filter_type: 'payment_filter',
    });

    applyFilters(filter, true);
  };

  /**
   * reset filter to default state
   */
  const resetFilter = () => {
    const defaultFilter = JSON.parse(JSON.stringify(DEFAULT_PAYMENT_FILTER));
    setFilter(defaultFilter);

    setActiveDate('');
    setActiveDateType('');
    setDateModal(false);
    setLoad(!load);
    applyFilters(defaultFilter, false);
  };

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

              <View style={styles.itemWrap}>
                <Text style={styles.fieldTitle}>{I18n.t('group_by')}</Text>

                <View style={styles.tnxCheckBox}>
                  {GroupByTypes.map((item) => (
                    <View key={item.key}>
                      <TouchableOpacity
                        onPress={() => updateGroupByType(item.value)}
                        style={styles.tnxCheckBoxSub}
                      >
                        <CheckBox
                          value={filter.groupByType === item.value}
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

              {premiums.length > 1 && (
                <View style={styles.itemWrap}>
                  <Text style={styles.fieldTitle}>
                    {I18n.t('payment_type')}
                  </Text>

                  <View style={styles.tnxCheckBox}>
                    {PaymentTypes.map((item) => (
                      <View key={item.key}>
                        <TouchableOpacity
                          onPress={() => updatePaymentType(item.key)}
                          style={styles.tnxCheckBoxSub}
                        >
                          <CheckBox
                            value={filter.paymentType[item.key]}
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

              {premiums.length > 1 && filter.groupByType !== 'reference_id' && (
                <View style={styles.itemWrap}>
                  <Text style={styles.fieldTitle}>{I18n.t('category')}</Text>

                  {premiums.map((item, index) => (
                    <TouchableOpacity
                      key={index.toString()}
                      onPress={() => updatePremiums(item.name)}
                      style={styles.productCheckBox}
                      disabled={premiums.length < 2}
                    >
                      <CheckBox
                        value={filter.premium.includes(item.name)}
                        editable={premiums.length > 1}
                        styles={styles}
                      />
                      <Text style={styles.checkBoxText}>{item.name}</Text>
                    </TouchableOpacity>
                  ))}

                  {/** Not completed the case of view more option */}
                  {/* {premiums.length > 5 && (
                  <TouchableOpacity>
                    <Text style={[styles.viewMore, { color: '#4DCAF4' }]}>
                      {`+ ${I18n.t('view_more')}`}
                    </Text>
                  </TouchableOpacity>
                )} */}
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

              {filter.groupByType !== 'reference_id' && (
                <View style={styles.itemWrap}>
                  <Text style={styles.fieldTitle}>
                    {`${I18n.t('amount')} (${getCurrency('code')})`}
                  </Text>
                  <View
                    style={{
                      width: '100%',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: 5,
                      paddingTop: 10,
                    }}
                  >
                    <View style={{ width: '48%' }}>
                      <FormTextInput
                        placeholder={I18n.t('minimum')}
                        value={getFieldValue(filter.amount.minAmount)}
                        maxLength={6}
                        onChangeText={(text) =>
                          onChangeAmount(text, 'minAmount')
                        }
                        keyboardType="number-pad"
                        color={theme.text_1}
                        extraStyle={{ width: '100%', paddingLeft: 0 }}
                      />
                    </View>
                    <View style={{ width: '48%' }}>
                      <FormTextInput
                        placeholder={I18n.t('maximum')}
                        value={getFieldValue(filter.amount.maxAmount)}
                        maxLength={6}
                        onChangeText={(text) =>
                          onChangeAmount(text, 'maxAmount')
                        }
                        keyboardType="number-pad"
                        color={theme.text_1}
                        extraStyle={{ width: '100%', paddingLeft: 0 }}
                      />
                    </View>
                  </View>
                </View>
              )}

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
            onPress={resetFilter}
            color="#EA2553"
            extraStyle={{
              width: '48%',
              marginHorizontal: 0,
              paddingHorizontal: 0,
            }}
          />

          <CustomButton
            buttonText={I18n.t('apply_filter')}
            onPress={validateFilter}
            extraStyle={{
              width: '48%',
            }}
          />
        </View>
      </View>
      <Toast config={ToastConfig} visibilityTime={3500} />
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

export default PaymentFilter;

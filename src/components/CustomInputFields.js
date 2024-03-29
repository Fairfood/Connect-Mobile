import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Modal,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { useSelector } from 'react-redux';
import { ISOdateConvert } from '../services/commonFunctions';
import { HIT_SLOP_FIFTEEN } from '../services/constants';
import I18n from '../i18n/i18n';
import FormTextInput from './FormTextInput';
import SearchComponent from './SearchComponent';

const { width } = Dimensions.get('window');

const CustomInputFields = ({ ...props }) => {
  const { key, item, index, productId = null, updatedItem } = props;
  const { theme } = useSelector((state) => state.common);

  const defaultBooleanValue =
    item.type === 'bool' ? item.value ?? 'true' : 'true';
  const defaultDropdownOptions =
    item.type === 'dropdown' ? item.options ?? [] : [];
  const defaultDropdownVal =
    item.type === 'dropdown' ? item.value ?? item.options[0].value : '';
  const defaultRadio =
    item.type === 'radio' ? item.value ?? item.options[0].value : '';
  const defaultInput = item?.value ?? '';
  const defaultDateValue = item.type === 'date' ? item.value ?? null : null;

  const [booleanValue, setBooleanValue] = useState(defaultBooleanValue);
  const [radio, setRadio] = useState(defaultRadio);
  const [input, setInput] = useState(defaultInput);
  const [dropdownModal, setDropdownModal] = useState(false);
  const [dropdownList, setDropdownList] = useState(defaultDropdownOptions);
  const [allDropdownList] = useState(defaultDropdownOptions);
  const [dropdownValue, setDropdownValue] = useState(defaultDropdownVal);
  const [dateValue, setDateValue] = useState(defaultDateValue);
  const [dateModal, setDateModal] = useState(false);

  useEffect(() => {
    if (item.type === 'date' && !defaultDateValue) {
      let newDate = new Date();
      newDate = newDate.getTime();
      updateItem(newDate);
    }
  }, []);

  /**
   * For changing boolean input field
   *
   * @param {string} value 'true' or 'false'
   */
  const changeBooleanValue = (value) => {
    setBooleanValue(value);
    updateItem(value);
  };

  /**
   * For changing radio input field
   *
   * @param {string} value radio item value
   */
  const changeRadio = (value) => {
    setRadio(value);
    updateItem(value);
  };

  /**
   * For text-input field
   *
   * @param {string} value input value type: 'string','int' or 'float'
   */
  const changeInput = (value) => {
    let inputValue = value;
    if (item.type === 'int') {
      inputValue = inputValue.replace(/[^0-9]/g, '');
    }

    setInput(inputValue);

    // value is converting to the corresponding type
    if (item.type === 'string') {
      inputValue = inputValue.toString();
    } else if (item.type === 'int') {
      inputValue = parseInt(inputValue);
    } else if (item.type === 'float') {
      inputValue = parseFloat(inputValue);
    }

    updateItem(inputValue);
  };

  /**
   * For dropdown input field
   *
   * @param {string} value value of the selected dropdown item
   */
  const onSelectingDropdownItem = (value) => {
    setDropdownValue(value);
    setDropdownList(allDropdownList);
    updateItem(value);
    setDropdownModal(false);
  };

  /**
   * For date input field
   *
   * @param {Date} value value of the selected date
   */
  const onSelectingDate = (value) => {
    setDateValue(new Date(value).getTime());
    updateItem(new Date(value).getTime());
    setDateModal(false);
  };

  /**
   * For updating current input field values to parent component
   *
   * @param {any} value value of the selected date
   */
  const updateItem = (value) => {
    item.value = value;
    updatedItem(item, index, productId);
  };

  /**
   * filtering dropdownlist based on the search text
   *
   * @param {string} text dropdown search text
   */
  const onSearchDropdownItem = (text) => {
    const searchText = text.toLowerCase();

    if (searchText === '') {
      setDropdownList(allDropdownList);
    } else {
      const filteredDropdownList = allDropdownList.filter((x) => {
        const list = x.value.toLowerCase();
        return list.includes(searchText);
      });
      setDropdownList(filteredDropdownList);
    }
  };

  const renderItem = ({ i }) => {
    return (
      <TouchableOpacity
        onPress={() => onSelectingDropdownItem(i.value)}
        style={styles.countryItems}
      >
        <Text style={styles.countryItemText}>{i.value}</Text>
      </TouchableOpacity>
    );
  };

  const styles = StyleSheetFactory(theme);

  return (
    <View key={key}>
      {(item.type === 'string' ||
        item.type === 'int' ||
        item.type === 'float') && (
        <FormTextInput
          mandatory={item.required}
          placeholder={item.label.en ?? item.key}
          value={input.toString()}
          onChangeText={(text) => changeInput(text)}
          keyboardType={item.type === 'int' ? 'numeric' : null}
          autoCapitalize='sentences'
          color={theme.text_1}
          extraStyle={{ width: '100%' }}
        />
      )}

      {item.type === 'bool' && (
        <View style={styles.customBoolWrap}>
          <Text style={styles.radioTitle}>
            {item?.label?.en ?? item.key}
            {item?.required ? '*' : null}
          </Text>

          <View style={styles.radioWrap}>
            <View style={styles.radioItemWrap}>
              <TouchableOpacity
                onPress={() => changeBooleanValue('true')}
                style={styles.radioItemSub}
                hitSlop={HIT_SLOP_FIFTEEN}
              >
                <View style={styles.radioOuter}>
                  {booleanValue === 'true' ? (
                    <View style={styles.radioInner} />
                  ) : null}
                </View>
                <Text style={styles.radioText}>{I18n.t('yes')}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.radioItemWrap]}>
              <TouchableOpacity
                onPress={() => changeBooleanValue('false')}
                style={styles.radioItemSub}
                hitSlop={HIT_SLOP_FIFTEEN}
              >
                <View style={styles.radioOuter}>
                  {booleanValue === 'false' ? (
                    <View style={styles.radioInner} />
                  ) : null}
                </View>
                <Text style={styles.radioText}>{I18n.t('no')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {item.type === 'radio' && (
        <View style={styles.customBoolWrap}>
          <Text style={styles.radioTitle}>
            {item?.label?.en ?? item.key}
            {item?.required ? '*' : null}
          </Text>

          {item.options.map((i, n) => (
            <View key={n.toString()} style={styles.radioWrap}>
              <View style={styles.radioItemWrap}>
                <TouchableOpacity
                  onPress={() => changeRadio(i.value)}
                  style={styles.radioItemSub}
                  hitSlop={HIT_SLOP_FIFTEEN}
                >
                  <View style={styles.radioOuter}>
                    {radio === i.value ? (
                      <View style={styles.radioInner} />
                    ) : null}
                  </View>
                  <Text style={styles.radioText}>{i.value}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {item.type === 'dropdown' && (
        <View style={styles.customBoolWrap}>
          <TouchableOpacity onPress={() => setDropdownModal(true)}>
            <View pointerEvents='none'>
              <FormTextInput
                mandatory={item.required}
                placeholder={item.label.en ?? item.key}
                value={dropdownValue.toString()}
                color={theme.text_1}
                extraStyle={{ width: '100%' }}
                showDropdown
              />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {item.type === 'date' && (
        <View style={styles.customBoolWrap}>
          <TouchableOpacity onPress={() => setDateModal(true)}>
            <View pointerEvents='none'>
              <FormTextInput
                mandatory={item.required}
                placeholder={item.label.en ?? item.key}
                value={ISOdateConvert(dateValue)}
                color={theme.text_1}
                extraStyle={{ width: '100%' }}
                showDropdown
              />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {dropdownModal && item.type === 'dropdown' && (
        <Modal
          animationType='slide'
          transparent
          visible={dropdownModal}
          onRequestClose={() => setDropdownModal(false)}
        >
          <View style={styles.countryModalContainer}>
            <TouchableOpacity
              onPress={() => setDropdownModal(false)}
              style={{ height: '40%' }}
            />
            <View style={styles.countryModalSub}>
              <SearchComponent
                placeholder={I18n.t('search')}
                onChangeText={(text) => onSearchDropdownItem(text)}
              />

              <FlatList
                data={dropdownList}
                renderItem={renderItem}
                keyboardShouldPersistTaps='always'
                style={styles.countryFlatList}
                ListEmptyComponent={() => (
                  <Text style={styles.emptyText}>
                    {I18n.t('no_matches_found')}
                  </Text>
                )}
                keyExtractor={(i, n) => n.toString()}
              />
            </View>
          </View>
        </Modal>
      )}

      {dateModal && item.type === 'date' && (
        <DatePicker
          theme='light'
          modal
          open={dateModal}
          date={dateValue ? new Date(dateValue) : new Date()}
          mode='date'
          maximumDate={new Date()}
          onConfirm={(date) => onSelectingDate(date)}
          onCancel={() => setDateModal(false)}
        />
      )}
    </View>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    customBoolWrap: {
      marginBottom: 10,
    },
    radioWrap: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
    },
    radioTitle: {
      color: theme.placeholder,
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 12,
      marginBottom: 15,
    },
    radioItemSub: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    radioItemWrap: {
      width: '50%',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      marginLeft: 5,
    },
    radioOuter: {
      height: width * 0.06,
      width: width * 0.06,
      borderRadius: (width * 0.06) / 2,
      justifyContent: 'center',
      alignItems: 'center',
      borderColor: theme.placeholder,
      borderWidth: 1.5,
    },
    radioInner: {
      height: width * 0.04,
      width: width * 0.04,
      borderRadius: (width * 0.04) / 2,
      backgroundColor: theme.text_1,
    },
    countryItems: {
      flex: 1,
      height: 40,
      marginTop: 10,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.12)',
      alignContent: 'center',
      justifyContent: 'center',
    },
    countryItemText: {
      marginLeft: 10,
      fontFamily: theme.font_regular,
      color: theme.text_2,
    },
    countryModalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 58, 96, 0.2);',
    },
    countryModalSub: {
      height: '60%',
      marginTop: 'auto',
      backgroundColor: theme.background_1,
    },
    countryFlatList: {
      flex: 1,
      marginHorizontal: 10,
      backgroundColor: theme.background_1,
    },
    radioText: {
      color: theme.text_1,
      fontSize: 13,
      fontFamily: theme.font_regular,
      paddingLeft: 5,
    },
    emptyText: {
      color: theme.text_1,
      fontSize: 13,
      fontFamily: theme.font_regular,
      textAlign: 'center',
    },
  });
};

export default CustomInputFields;

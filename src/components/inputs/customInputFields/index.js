/* eslint-disable no-shadow */
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { useSelector } from 'react-redux';
import { ISOdateConvert, stringToJson } from '../../../utils/helperFunctions';
import { HIT_SLOP_FIFTEEN } from '../../../utils/constants';
import I18n from '../../../translations/text/i18n';
import FormTextInput from '../formTextInput';
import SearchComponent from '../../searchComponent';
import StyleSheetFactory from './styles';

const CustomInputFields = ({ ...props }) => {
  const {
    inputRef = null,
    key,
    fieldItem,
    productId = null,
    formId = null,
    updatedItem,
    onSubmitEditing = null,
  } = props;
  const { type } = fieldItem;
  const styles = StyleSheetFactory();
  const { theme } = useSelector((state) => state.common);

  const defaultInput = fieldItem?.default_value ?? '';
  // let defaultBooleanValue = null;
  let defaultDropdownOptions = [];
  let defaultRadioOptions = [];
  let defaultDropdownVal = '';
  let defaultRadio = '';
  let defaultDateValue = null;

  if (type === 'DROPDOWN') {
    defaultDropdownOptions = fieldItem?.options
      ? stringToJson(fieldItem.options)
      : [];
    defaultDropdownVal = fieldItem.default_value ?? '';
  } else if (type === 'RADIO') {
    defaultRadioOptions = fieldItem?.options
      ? stringToJson(fieldItem.options)
      : [];
    defaultRadio = fieldItem.default_value ?? '';
  } else if (type === 'DATE') {
    defaultDateValue = fieldItem.value ?? null;
  } else if (type === 'BOOLEAN') {
    // defaultBooleanValue = fieldItem.default_value || 'true';
  }

  const [booleanValue, setBooleanValue] = useState(null);
  const [radio, setRadio] = useState(defaultRadio);
  const [input, setInput] = useState(defaultInput);
  const [dropdownModal, setDropdownModal] = useState(false);
  const [dropdownList, setDropdownList] = useState(defaultDropdownOptions);
  const [radioOptions] = useState(defaultRadioOptions);
  const [dropdownValue, setDropdownValue] = useState(defaultDropdownVal);
  const [dateValue, setDateValue] = useState(defaultDateValue);
  const [dateModal, setDateModal] = useState(false);

  useEffect(() => {
    if (type === 'DATE' && !defaultDateValue) {
      let newDate = new Date();
      newDate = newDate.getTime();
      updateItem(newDate);
    } else if (type === 'BOOLEAN') {
      // updateItem('true'); // need_fix when one field value set, another remains old
    }
  }, []);

  /**
   * For changing boolean input field
   * @param {string} value 'true' or 'false'
   */
  const changeBooleanValue = (value) => {
    setBooleanValue(value);
    updateItem(value);
  };

  /**
   * For changing radio input field
   * @param {string} value radio fieldItem value
   */
  const changeRadio = (value) => {
    setRadio(value);
    updateItem(value);
  };

  /**
   * For text-input field
   * @param {string} value input value
   */
  const changeInput = (value) => {
    let inputValue = value;
    if (type === 'PHONE' || type === 'INTEGER') {
      inputValue = inputValue.replace(/[^0-9]/g, '');
    } else if (type === 'FLOAT') {
      inputValue = inputValue.replace(/[^0-9.,]/g, '');
    }

    setInput(inputValue);

    // value is converting to the corresponding type
    if (type === 'TEXT' || type === 'EMAIL') {
      inputValue = inputValue.toString();
    } else if (type === 'PHONE' || type === 'INTEGER') {
      inputValue = parseInt(inputValue);
    } else if (type === 'FLOAT') {
      inputValue = parseFloat(inputValue);
    }

    updateItem(inputValue);
  };

  /**
   * For dropdown input field
   * @param {object} selectedItem value of the selected dropdown fieldItem
   */
  const onSelectingDropdownItem = (selectedItem) => {
    setDropdownValue(selectedItem || '');
    setDropdownList(defaultDropdownOptions);
    updateItem(selectedItem);
    setDropdownModal(false);
  };

  /**
   * For date input field
   * @param {Date} value value of the selected date
   */
  const onSelectingDate = (value) => {
    setDateValue(new Date(value).getTime());
    updateItem(new Date(value).getTime());
    setDateModal(false);
  };

  /**
   * For updating current input field values to parent component
   * @param {any} value value of the selected date
   */
  const updateItem = (value) => {
    const updated = { ...fieldItem, value };
    updatedItem(updated, productId, formId);
  };

  /**
   * filtering dropdownlist based on the search text
   * @param {string} text dropdown search text
   */
  const onSearchDropdownItem = (text) => {
    const searchText = text.toLowerCase();

    if (searchText === '') {
      setDropdownList(defaultDropdownOptions);
    } else {
      const filteredDropdownList = defaultDropdownOptions.filter((x) => {
        const list = x.toLowerCase();
        return list.includes(searchText);
      });
      setDropdownList(filteredDropdownList);
    }
  };

  const closeDropDownModal = () => {
    setDropdownList(defaultDropdownOptions);
    setDropdownModal(false);
  };

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() => onSelectingDropdownItem(item)}
        style={styles.countryItems}
      >
        <Text style={styles.countryItemText}>{item}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View key={key}>
      {(type === 'TEXT' ||
        type === 'PHONE' ||
        type === 'INTEGER' ||
        type === 'FLOAT' ||
        type === 'EMAIL') && (
        <FormTextInput
          inputRef={inputRef}
          mandatory={fieldItem.required}
          placeholder={fieldItem.label || fieldItem.key}
          value={input.toString()}
          onChangeText={(text) => changeInput(text)}
          onSubmitEditing={onSubmitEditing}
          keyboardType={
            type === 'PHONE' || type === 'INTEGER' || type === 'FLOAT'
              ? 'numeric'
              : null
          }
          returnKeyType="next"
          autoCapitalize="sentences"
          color={theme.text_1}
          extraStyle={{ width: '100%' }}
        />
      )}

      {type === 'BOOLEAN' && (
        <View>
          <Text style={styles.radioTitle}>
            {fieldItem.label || fieldItem.key}
            {fieldItem?.required ? '*' : null}
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

      {type === 'RADIO' && (
        <View style={styles.customBoolWrap}>
          <Text style={styles.radioTitle}>
            {fieldItem?.label ?? fieldItem.key}
            {fieldItem?.required ? '*' : null}
          </Text>

          {radioOptions.map((i, n) => (
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

      {type === 'DROPDOWN' && (
        <TouchableOpacity onPress={() => setDropdownModal(true)}>
          <View pointerEvents="none">
            <FormTextInput
              mandatory={fieldItem.required}
              placeholder={fieldItem.label || fieldItem.key}
              value={dropdownValue.toString()}
              color={theme.text_1}
              extraStyle={{ width: '100%' }}
              showDropdown
              onCloseIconPress={() => onSelectingDropdownItem(null)}
            />
          </View>
        </TouchableOpacity>
      )}

      {type === 'DATE' && (
        <TouchableOpacity onPress={() => setDateModal(true)}>
          <View pointerEvents="none">
            <FormTextInput
              mandatory={fieldItem.required}
              placeholder={fieldItem.label ?? fieldItem.key}
              value={ISOdateConvert(dateValue)}
              color={theme.text_1}
              extraStyle={{ width: '100%' }}
              showDropdown
            />
          </View>
        </TouchableOpacity>
      )}

      {dropdownModal && type === 'DROPDOWN' && (
        <Modal
          animationType="slide"
          transparent
          visible={dropdownModal}
          onRequestClose={() => closeDropDownModal(false)}
        >
          <View style={styles.countryModalContainer}>
            <TouchableOpacity
              onPress={() => closeDropDownModal(false)}
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
                keyboardShouldPersistTaps="always"
                style={styles.countryFlatList}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    {I18n.t('no_matches_found')}
                  </Text>
                }
                keyExtractor={(i, n) => n.toString()}
              />
            </View>
          </View>
        </Modal>
      )}

      {dateModal && type === 'DATE' && (
        <DatePicker
          theme="light"
          modal
          open={dateModal}
          date={dateValue ? new Date(dateValue) : new Date()}
          mode="date"
          maximumDate={new Date()}
          onConfirm={(date) => onSelectingDate(date)}
          onCancel={() => setDateModal(false)}
        />
      )}
    </View>
  );
};

export default CustomInputFields;

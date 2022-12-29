import React from 'react';
import { StyleSheet, View } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import * as consts from '../services/constants';

const Picker = ({ ...props }) => {
  const { extrastyle, borderColor, value, listofvalues, onValueChange } = props;
  return (
    <View style={[styles.container, extrastyle ?? {}, { borderColor: borderColor ?? 'rgba(0, 0, 0, 0.12)' }]}>
      <View style={styles.textInputWrapper}>
        <View style={{ flex: 6.2, marginLeft: -15 }}>
          <RNPickerSelect
            placeholder={{}}
            value={value}
            items={listofvalues}
            onValueChange={onValueChange}
            style={pickerSelectStyles}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '85%',
    borderColor: 'rgba(0, 0, 0, 0.12)',
    borderWidth: 1,
    height: 53,
    marginHorizontal: 30,
    marginTop: 10,
    paddingLeft: 15,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontWeight: 'normal',
  },
});

const pickerSelectStyles = {
  inputIOS: {
    fontFamily: consts.FONT_REGULAR,
    paddingTop: 7,
    backgroundColor: 'transparent',
    fontSize: 15,
    paddingHorizontal: 5,
    paddingBottom: 7,
    borderBottomWidth: 0,
    borderColor: '#999999',
    borderRadius: consts.BORDER_RADIUS,
    color: '#999999',
  },
  inputAndroid: {
    color: consts.INPUT_PLACEHOLDER,
    fontSize: 14,
    fontFamily: consts.FONT_BOLD,
  },
  placeholderColor: consts.INPUT_PLACEHOLDER,
  underline: { borderTopWidth: 0 },
};

export default Picker;

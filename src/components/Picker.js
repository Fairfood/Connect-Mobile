import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import RNPickerSelect from 'react-native-picker-select';

const Picker = ({ ...props }) => {
  const { extraStyle, borderColor, value, listOfValues, onValueChange } = props;
  const { theme } = useSelector((state) => state.common);
  const styles = StyleSheetFactory(theme);

  return (
    <View
      style={[
        styles.container,
        extraStyle ?? {},
        { borderColor: borderColor ?? 'rgba(0, 0, 0, 0.12)' },
      ]}
    >
      <View style={styles.textInputWrapper}>
        <View style={{ flex: 6.2, marginLeft: -15 }}>
          <RNPickerSelect
            placeholder={{}}
            value={value}
            items={listOfValues}
            onValueChange={onValueChange}
            style={styles}
          />
        </View>
      </View>
    </View>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
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
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontWeight: 'normal',
    },
    inputIOS: {
      fontFamily: theme.font_regular,
      paddingTop: 7,
      backgroundColor: 'transparent',
      fontSize: 15,
      paddingHorizontal: 5,
      paddingBottom: 7,
      borderBottomWidth: 0,
      borderColor: '#999999',
      borderRadius: theme.border_radius,
      color: '#999999',
    },
    inputAndroid: {
      color: theme.placeholder,
      fontSize: 14,
      fontFamily: theme.font_bold,
    },
    placeholderColor: theme.placeholder,
    underline: { borderTopWidth: 0 },
  });
};

export default Picker;

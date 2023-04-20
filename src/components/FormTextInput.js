import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { ArrowDownIcon } from '../assets/svg';
import Picker from './Picker';
import Icon from '../icons';

const { width } = Dimensions.get('window');

const FormTextInput = (props) => {
  const {
    placeholder,
    displayPicker,
    inputRef,
    secureTextEntry,
    editable,
    onFocus,
    onBlur,
    mandatory,
    extraStyle = {},
    visibility = true,
    autoCapitalize = 'none',
    internalPadding,
    values,
    onValueChange,
    defaultValue,
    showPasswords,
    showEye,
    showDropdown,
    ...otherProps
  } = props;

  const { theme } = useSelector((state) => state.common);
  const styles = StyleSheetFactory(theme);

  return (
    <>
      {!displayPicker && visibility && (
        <TextInput
          style={[
            styles.container,
            extraStyle,
            { paddingLeft: internalPadding ?? 15 },
          ]}
          ref={inputRef}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          onFocus={onFocus}
          onBlur={onBlur}
          {...otherProps}
        />
      )}

      {displayPicker && visibility && (
        <Picker
          listOfValues={values}
          borderColor={theme.placeholder}
          onValueChange={onValueChange}
          disabled={false}
          value={defaultValue}
          ref={inputRef}
          extraStyle={extraStyle}
        />
      )}

      {visibility && (
        <View style={styles.subWrap}>
          {placeholder && (
            <Text style={styles.placeholderText}>
              {` ${placeholder}${mandatory ? '*' : ''} `}
            </Text>
          )}

          {showEye && (
            <TouchableOpacity
              onPress={() => showPasswords()}
              style={styles.showEyeWrap}
            >
              {secureTextEntry && (
                <View style={{ opacity: 0.5 }}>
                  <Icon name='eye' size={24} color={theme.placeholder} />
                </View>
              )}

              {!secureTextEntry && (
                <View style={{ opacity: 0.5 }}>
                  <Icon name='eye-closed' size={24} color={theme.placeholder} />
                </View>
              )}
            </TouchableOpacity>
          )}

          {showDropdown && (
            <TouchableOpacity style={styles.dropdownWrap}>
              <View style={{ opacity: 0.5 }}>
                <ArrowDownIcon width={12} height={12} fill={theme.text_1} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      width: '85%',
      alignSelf: 'center',
      borderColor: theme.placeholder,
      borderWidth: 1,
      borderRadius: theme.border_radius,
      height: 53,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
      paddingLeft: 15,
      fontSize: 18,
      lineHeight: 24,
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontWeight: 'normal',
    },
    showEyeWrap: {
      position: 'relative',
      alignSelf: 'flex-end',
      justifyContent: 'flex-end',
      right: width * 0.01,
      top: 7,
      width: 30,
    },
    dropdownWrap: {
      position: 'relative',
      alignSelf: 'flex-end',
      justifyContent: 'center',
      alignItems: 'center',
      right: width * 0.01,
      top: 15,
      width: 30,
    },
    subWrap: {
      left: 5,
      bottom: 60,
      height: 25,
      paddingHorizontal: 8,
      justifyContent: 'space-between',
    },
    placeholderText: {
      color: theme.placeholder,
      backgroundColor: theme.background_1,
      alignSelf: 'flex-start',
      fontSize: 12,
      fontFamily: theme.font_regular,
      letterSpacing: 0.4,
    },
  });
};

export default FormTextInput;

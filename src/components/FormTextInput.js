import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

import * as consts from '../services/constants';
import Picker from './Picker';
import Icon from '../icons';
import { ArrowDownIcon } from '../assets/svg';

const { width } = Dimensions.get('window');

const FormTextInput = (props) => {
  const {
    placeholder,
    displayPicker,
    inputRef,
    secureTextEntry,
    showPassoword,
    editable,
    onFocus,
    onBlur,
    mandatory,
    extraStyle = {},
    visibility = true,
    autoCapitalize = 'none',
    internalpadding,
    values,
    onValueChange,
    defaultValue,
    showPassword,
    showEye,
    showDropdown,
    ...otherProps
  } = props;
  return (
    <>
      {!displayPicker && visibility && (
        <TextInput
          style={[
            styles.container,
            extraStyle,
            { paddingLeft: internalpadding ?? 15 },
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
          listofvalues={values}
          borderColor={consts.INPUT_PLACEHOLDER}
          onValueChange={onValueChange}
          disabled={false}
          value={defaultValue}
          ref={inputRef}
          extrastyle={extraStyle}
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
              onPress={() => showPassword()}
              style={styles.showEyeWrap}
            >
              {secureTextEntry && (
                <View style={{ opacity: 0.5 }}>
                  <Icon name='eye' size={24} color={consts.INPUT_PLACEHOLDER} />
                </View>
              )}

              {!secureTextEntry && (
                <View style={{ opacity: 0.5 }}>
                  <Icon
                    name='eye-closed'
                    size={24}
                    color={consts.INPUT_PLACEHOLDER}
                  />
                </View>
              )}
            </TouchableOpacity>
          )}

          {showDropdown && (
            <TouchableOpacity style={styles.dropdownWrap}>
              <View style={{ opacity: 0.5 }}>
                <ArrowDownIcon
                  width={12}
                  height={12}
                  fill={consts.TEXT_PRIMARY_COLOR}
                />
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '85%',
    alignSelf: 'center',
    borderColor: consts.INPUT_PLACEHOLDER,
    borderWidth: 1,
    borderRadius: consts.BORDER_RADIUS,
    height: 53,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    paddingLeft: 15,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: consts.FONT_REGULAR,
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
    color: consts.INPUT_PLACEHOLDER,
    backgroundColor: consts.APP_BG_COLOR,
    alignSelf: 'flex-start',
    fontSize: 12,
    fontFamily: consts.FONT_REGULAR,
    letterSpacing: 0.4,
  },
});

export default FormTextInput;

import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';

import Icon from '../icons';
import * as consts from '../services/constants';

const CustomTextInput = (props) => {
  const {
    placeholder,
    rightIcon,
    showPassoword,
    inputRef,
    extraStyle = {},
    autoCapitalize = 'none',
    showEye,
    secureTextEntry,
    ...otherProps
  } = props;
  return (
    <View>
      <TextInput
        style={[styles.container, extraStyle]}
        placeholder={placeholder}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={consts.INPUT_PLACEHOLDER}
        ref={inputRef}
        {...otherProps}
      />

      {showEye && (
        <TouchableOpacity onPress={showPassoword} style={styles.showEyeWrap}>
          {secureTextEntry && (
            <View style={{ opacity: 0.5 }}>
              <Icon name='eye' size={24} color={consts.INPUT_PLACEHOLDER} />
            </View>
          )}
          {!secureTextEntry && (
            <View style={{ opacity: 0.5 }}>
              <Icon name='eye-off' size={24} color={consts.INPUT_PLACEHOLDER} />
            </View>
          )}
        </TouchableOpacity>
      )}

      {rightIcon && (
        <View style={styles.rightIconWrap}>
          <Icon name={rightIcon} size={20} color='#B3B3B3' />
        </View>
      )}
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
    justifyContent: 'center',
    alignItems: 'center',
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
    right: 30,
    bottom: 37,
    width: 30,
  },
  rightIconWrap: {
    position: 'relative',
    alignItems: 'flex-end',
    right: 40,
    bottom: 37,
  },
});

export default CustomTextInput;

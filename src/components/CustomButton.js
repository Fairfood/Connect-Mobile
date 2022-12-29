import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import * as consts from '../services/constants';

const CustomButton = ({
  buttonText,
  onPress,
  isLoading,
  backgroundColor,
  medium,
  disabled,
  extraStyle = {},
  testID = 'CustomButton',
}) => (
  <TouchableOpacity
    style={[
      styles.container,
      extraStyle,
      { backgroundColor: backgroundColor ?? consts.BUTTON_COLOR_PRIMARY },
    ]}
    disabled={disabled}
    onPress={onPress}
    activeOpacity={0.5}
    testID={testID}
  >
    {!isLoading && (
      <Text
        style={[
          styles.buttonText,
          {
            color: backgroundColor
              ? consts.BUTTON_COLOR_PRIMARY
              : consts.APP_BG_COLOR,
            fontFamily: medium ? consts.FONT_MEDIUM : consts.FONT_REGULAR,
          },
        ]}
      >
        {buttonText}
      </Text>
    )}
    {isLoading && <ActivityIndicator color={consts.APP_BG_COLOR} />}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    width: '85%',
    backgroundColor: consts.COLOR_PRIMARY,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: consts.COLOR_PRIMARY,
    borderWidth: 1,
    borderRadius: consts.BORDER_RADIUS,
  },
  buttonText: {
    color: consts.APP_BG_COLOR,
    fontStyle: 'normal',
    fontWeight: '500',
  },
});

export default CustomButton;

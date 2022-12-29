import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import * as consts from '../services/constants';

const TransparentButton = ({
  buttonText,
  onPress,
  color,
  padding,
  icon,
  paddingHorizontal,
  isDisabled,
  extraStyle = {},
}) => (
  <TouchableOpacity
    style={[styles.container, extraStyle, { borderColor: color ?? consts.COLOR_PRIMARY }]}
    onPress={onPress}
    disabled={isDisabled}
  >
    {icon ?? null}
    <Text
      style={[
        styles.buttonText,
        {
          color: color ?? consts.COLOR_PRIMARY,
          padding: padding ?? 0,
          paddingHorizontal: paddingHorizontal ?? 10,
        },
      ]}
    >
      {buttonText}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    backgroundColor: consts.APP_BG_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: consts.COLOR_PRIMARY,
    borderRadius: consts.BORDER_RADIUS,
    marginHorizontal: 25,
    flexDirection: 'row',
    zIndex: 1,
    minHeight: 30,
    height: 55,
  },
  buttonText: {
    color: consts.COLOR_PRIMARY,
    fontFamily: consts.FONT_REGULAR,
    paddingHorizontal: 10,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingVertical: 0,
  },
});

export default TransparentButton;

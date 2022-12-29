import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import Icon from '../icons';
import * as consts from '../services/constants';

const CustomSmallButton = ({
  buttonText,
  onPress,
  textIcon,
  padding,
  noMargin,
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.container, { marginHorizontal: noMargin ? 0 : 30 }]}
  >
    {textIcon ? (
      <Icon name={textIcon} size={20} color={consts.APP_BG_COLOR} />
    ) : null}
    <Text
      style={[
        styles.buttonText,
        { padding: padding ?? 0, marginLeft: textIcon ? 5 : 0 },
      ]}
    >
      {buttonText}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: consts.COLOR_PRIMARY,
    height: 50,
    marginHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: 'rgba(37, 37, 37, 0.2)',
    shadowOpacity: 1,
    elevation: 1,
    paddingVertical: 10,
    borderRadius: consts.BORDER_RADIUS,
  },
  buttonText: {
    fontFamily: consts.FONT_MEDIUM,
    color: consts.APP_BG_COLOR,
    fontWeight: '600',
  },
});

export default CustomSmallButton;

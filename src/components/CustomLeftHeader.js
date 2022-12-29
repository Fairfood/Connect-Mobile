import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import Icon from '../icons';
import * as consts from '../services/constants';

const CustomHeader = ({
  backgroundColor,
  leftIcon,
  title,
  onPress,
  titleColor,
  onPressRight,
  rightText,
  rightTextColor,
  extraStyle = {},
}) => {
  return (
    <View style={[styles.container, { backgroundColor }, extraStyle]}>
      <View style={{ justifyContent: 'center' }}>
        {leftIcon && (
          <TouchableOpacity style={styles.leftIcon} onPress={onPress}>
            <Icon
              name={leftIcon}
              size={20}
              color={titleColor ?? consts.TEXT_PRIMARY_COLOR}
            />
            <Text
              style={[
                styles.headerText,
                { color: titleColor ?? consts.TEXT_PRIMARY_COLOR },
              ]}
            >
              {title}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.headerContainer} />
      {rightText && (
        <TouchableOpacity style={styles.righIcon} onPress={onPressRight}>
          <Text
            style={[
              styles.rightText,
              {
                color: rightTextColor ?? consts.TEXT_PRIMARY_COLOR,
              },
            ]}
          >
            {rightText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: consts.APP_BG_COLOR,
    flexDirection: 'row',
    width: '100%',
    height: 40,
    marginTop: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftIcon: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginLeft: -4,
  },
  righIcon: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginRight: 20,
  },
  headerContainer: {
    marginLeft: 10,
    marginTop: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontFamily: consts.FONT_REGULAR,
    fontSize: 20,
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: '500',
    marginLeft: 10,
  },
  rightText: {
    fontFamily: consts.FONT_REGULAR,
    fontSize: 18,
    color: consts.TEXT_PRIMARY_COLOR,
  },
  tinyLogo: {
    width: 25,
    height: 25,
    resizeMode: 'contain',
  },
});

export default CustomHeader;

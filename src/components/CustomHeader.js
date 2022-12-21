import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from '../icons';
import * as consts from '../services/constants';

const CustomHeader = ({
  backgroundColor,
  leftIcon,
  title,
  onPress,
  titleColor,
  onPressRight,
  rightImage,
  rightImageSize,
  leftTextColor,
  leftText,
  rightText,
  rightTextColor,
  testID = 'CustomHeader',
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
        },
      ]}
    >
      <View>
        {leftIcon && (
          <TouchableOpacity
            style={styles.leftIcon}
            onPress={onPress}
            hitSlop={consts.HIT_SLOP_FIFTEEN}
          >
            <Icon
              name={leftIcon}
              size={28}
              color={titleColor ?? consts.TEXT_PRIMARY_COLOR}
            />
          </TouchableOpacity>
        )}

        {leftText && (
          <TouchableOpacity
            style={styles.leftIcon}
            onPress={onPress}
            testID={testID}
            hitSlop={consts.HIT_SLOP_FIFTEEN}
          >
            <Text
              style={[
                styles.headerText,
                {
                  color: leftTextColor ?? consts.TEXT_PRIMARY_COLOR,
                  fontSize: 18,
                },
              ]}
            >
              {leftText}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.headerContainer}>
          <Text
            style={[
              styles.headerText,
              { color: titleColor ?? consts.TEXT_PRIMARY_COLOR },
            ]}
          >
            {title}
          </Text>
        </View>
      </View>

      <View>
        {rightText && (
          <TouchableOpacity
            style={styles.righIcon}
            onPress={onPressRight}
            testID={testID}
            hitSlop={consts.HIT_SLOP_FIFTEEN}
          >
            <Text
              style={[
                styles.headerText,
                {
                  color: rightTextColor ?? consts.TEXT_PRIMARY_COLOR,
                  fontSize: 18,
                },
              ]}
            >
              {rightText}
            </Text>
          </TouchableOpacity>
        )}

        {rightImage && (
          <TouchableOpacity
            style={[styles.righIcon]}
            onPress={onPressRight}
            hitSlop={consts.HIT_SLOP_FIFTEEN}
          >
            <Image
              style={[
                styles.tinyLogo,
                { width: rightImageSize, height: rightImageSize },
              ]}
              source={rightImage}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: consts.APP_BG_COLOR,
    flexDirection: 'row',
    width: '100%',
    height: 40,
    marginTop: 30,
    justifyContent: 'space-between',
  },
  leftIcon: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginLeft: 10,
  },
  righIcon: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    marginRight: 20,
  },
  headerContainer: {
    marginLeft: 25,
    marginTop: 3,
  },
  headerText: {
    fontFamily: consts.FONT_REGULAR,
    fontSize: 20,
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: '500',
  },
  tinyLogo: {
    width: 25,
    height: 25,
    resizeMode: 'contain',
  },
});

export default CustomHeader;

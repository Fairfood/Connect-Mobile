import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSelector } from 'react-redux';
import { HIT_SLOP_FIFTEEN } from '../services/constants';
import Icon from '../icons';

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
  const { theme } = useSelector((state) => state.common);
  const styles = StyleSheetFactory(theme);

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
            hitSlop={HIT_SLOP_FIFTEEN}
          >
            <Icon
              name={leftIcon}
              size={28}
              color={titleColor ?? theme.text_1}
            />
          </TouchableOpacity>
        )}

        {leftText && (
          <TouchableOpacity
            style={styles.leftIcon}
            onPress={onPress}
            testID={testID}
            hitSlop={HIT_SLOP_FIFTEEN}
          >
            <Text
              style={[
                styles.headerText,
                {
                  color: leftTextColor ?? theme.text_1,
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
            style={[styles.headerText, { color: titleColor ?? theme.text_1 }]}
          >
            {title}
          </Text>
        </View>
      </View>

      <View>
        {rightText && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onPressRight}
            testID={testID}
            hitSlop={HIT_SLOP_FIFTEEN}
          >
            <Text
              style={[
                styles.headerText,
                {
                  color: rightTextColor ?? theme.text_1,
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
            style={[styles.rightIcon]}
            onPress={onPressRight}
            hitSlop={HIT_SLOP_FIFTEEN}
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

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.background_1,
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
    rightIcon: {
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      marginRight: 20,
    },
    headerContainer: {
      marginLeft: 25,
      marginTop: 3,
    },
    headerText: {
      fontFamily: theme.font_regular,
      fontSize: 20,
      color: theme.text_1,
      fontWeight: '500',
    },
    tinyLogo: {
      width: 25,
      height: 25,
      resizeMode: 'contain',
    },
  });
};

export default CustomHeader;

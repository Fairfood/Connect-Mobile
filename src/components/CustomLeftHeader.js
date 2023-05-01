import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import Icon from '../icons';

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
  const { theme } = useSelector((state) => state.common);
  const styles = StyleSheetFactory(theme);

  return (
    <View style={[styles.container, { backgroundColor }, extraStyle]}>
      <View style={{ justifyContent: 'center' }}>
        {leftIcon && (
          <TouchableOpacity style={styles.leftIcon} onPress={onPress}>
            <Icon
              name={leftIcon}
              size={20}
              color={titleColor ?? theme.text_1}
            />
            <Text
              style={[styles.headerText, { color: titleColor ?? theme.text_1 }]}
            >
              {title}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.headerContainer} />
      {rightText && (
        <TouchableOpacity style={styles.rightIcon} onPress={onPressRight}>
          <Text
            style={[
              styles.rightText,
              {
                color: rightTextColor ?? theme.text_1,
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

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.background_1,
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
    rightIcon: {
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
      fontFamily: theme.font_regular,
      fontSize: 20,
      color: theme.text_1,
      fontWeight: '500',
      marginLeft: 10,
    },
    rightText: {
      fontFamily: theme.font_regular,
      fontSize: 18,
      color: theme.text_1,
    },
    tinyLogo: {
      width: 25,
      height: 25,
      resizeMode: 'contain',
    },
  });
};

export default CustomHeader;

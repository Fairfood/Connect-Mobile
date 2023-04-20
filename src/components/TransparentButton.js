import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

const TransparentButton = ({
  buttonText,
  onPress,
  color,
  padding,
  icon,
  paddingHorizontal,
  isDisabled,
  extraStyle = {},
}) => {
  const { theme } = useSelector((state) => state.common);
  const styles = StyleSheetFactory(theme);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        extraStyle,
        { borderColor: color ?? theme.primary },
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {icon ?? null}
      <Text
        style={[
          styles.buttonText,
          {
            color: color ?? theme.primary,
            padding: padding ?? 0,
            paddingHorizontal: paddingHorizontal ?? 10,
          },
        ]}
      >
        {buttonText}
      </Text>
    </TouchableOpacity>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      alignSelf: 'center',
      backgroundColor: theme.background_1,
      justifyContent: 'center',
      alignItems: 'center',
      alignContent: 'center',
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: theme.primary,
      borderRadius: theme.border_radius,
      marginHorizontal: 25,
      flexDirection: 'row',
      zIndex: 1,
      minHeight: 30,
      height: 55,
    },
    buttonText: {
      color: theme.primary,
      fontFamily: theme.font_regular,
      paddingHorizontal: 10,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      paddingVertical: 0,
    },
  });
};

export default TransparentButton;

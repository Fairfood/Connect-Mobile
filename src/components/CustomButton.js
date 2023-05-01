import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';

const CustomButton = ({
  buttonText,
  onPress,
  isLoading,
  backgroundColor,
  medium,
  disabled,
  extraStyle = {},
  testID = 'CustomButton',
}) => {
  const { theme } = useSelector((state) => state.common);
  const styles = StyleSheetFactory(theme);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        extraStyle,
        { backgroundColor: backgroundColor ?? theme.button_bg_1 },
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
              color: backgroundColor ? theme.button_bg_1 : theme.background_1,
              fontFamily: medium ? theme.font_medium : theme.font_regular,
            },
          ]}
        >
          {buttonText}
        </Text>
      )}
      {isLoading && <ActivityIndicator color={theme.background_1} />}
    </TouchableOpacity>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      alignSelf: 'center',
      width: '85%',
      backgroundColor: theme.primary,
      height: 55,
      justifyContent: 'center',
      alignItems: 'center',
      borderColor: theme.primary,
      borderWidth: 1,
      borderRadius: theme.border_radius,
    },
    buttonText: {
      color: theme.background_1,
      fontStyle: 'normal',
      fontWeight: '500',
    },
  });
};

export default CustomButton;

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import StyleSheetFactory from './styles';
import { HIT_SLOP_TEN } from '../../../utils/constants';

const CustomButton = ({
  testID = '',
  buttonText,
  onPress,
  isLoading,
  backgroundColor,
  textColor,
  medium,
  disabled = false,
  extraStyle = {},
  hitSlop = null,
}) => {
  const { theme } = useSelector((state) => state.common);
  const styles = StyleSheetFactory();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        extraStyle,
        { backgroundColor: backgroundColor ?? theme.button_bg_1 },
      ]}
      disabled={disabled}
      activeOpacity={0.5}
      hitSlop={hitSlop || HIT_SLOP_TEN}
      testID={testID}
    >
      <View>
        {!isLoading && (
          <Text
            style={[
              styles.buttonText,
              {
                color: textColor ?? theme.background_1,
                fontFamily: medium ? theme.font_medium : theme.font_regular,
              },
            ]}
          >
            {buttonText}
          </Text>
        )}
        {isLoading && <ActivityIndicator color={theme.background_1} />}
      </View>
    </TouchableOpacity>
  );
};

export default CustomButton;

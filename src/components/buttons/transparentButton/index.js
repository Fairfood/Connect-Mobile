import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import StyleSheetFactory from './styles';
import { HIT_SLOP_TEN } from '../../../utils/constants';

const TransparentButton = ({
  buttonText,
  onPress,
  color,
  icon,
  disabled = false,
  isLoading = false,
  extraStyle = {},
  hitSlop = null,
  testID = '',
}) => {
  const { theme } = useSelector((state) => state.common);
  const styles = StyleSheetFactory();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      hitSlop={hitSlop || HIT_SLOP_TEN}
      style={[
        styles.container,
        {
          borderColor: color ?? theme.primary,
        },
        extraStyle,
      ]}
      testID={testID}
    >
      {isLoading && <ActivityIndicator color={theme.icon_1} />}

      {!isLoading && (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {icon ?? null}
          <Text
            style={[
              styles.buttonText,
              {
                color: color ?? theme.primary,
              },
            ]}
          >
            {buttonText}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default TransparentButton;

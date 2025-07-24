import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import StyleSheetFactory from './styles';
import { HIT_SLOP_FIFTEEN } from '../../../utils/constants';
import { BackIcon } from '../../../assets/svg';

const CustomLeftHeader = ({
  title,
  onPress,
  titleColor,
  onPressRight,
  rightText,
  rightTextColor,
  extraStyle = {},
  rightIcon,
  onPressRightIcon,
  testID = '',
}) => {
  const { theme } = useSelector((state) => state.common);
  const styles = StyleSheetFactory();

  return (
    <View style={[styles.container, extraStyle]}>
      <View style={{ justifyContent: 'center' }}>
        <TouchableOpacity
          style={styles.leftIcon}
          onPress={onPress}
          hitSlop={HIT_SLOP_FIFTEEN}
        >
          <BackIcon width={18} height={18} fill={titleColor || theme.icon_1} />
          <Text
            style={[styles.headerText, { color: titleColor || theme.text_1 }]}
            testID={testID}
          >
            {title}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.headerContainer} />
      {rightText && (
        <TouchableOpacity
          style={styles.rightTextWrap}
          onPress={onPressRight}
          hitSlop={HIT_SLOP_FIFTEEN}
        >
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
      {rightIcon && (
        <TouchableOpacity
          style={styles.rightIcon}
          onPress={onPressRightIcon}
          hitSlop={HIT_SLOP_FIFTEEN}
        >
          {rightIcon}
        </TouchableOpacity>
      )}
    </View>
  );
};

export default CustomLeftHeader;

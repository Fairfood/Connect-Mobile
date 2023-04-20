import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import Icon from '../icons';

const CustomSmallButton = ({
  buttonText,
  onPress,
  textIcon,
  padding,
  noMargin,
}) => {
  const { theme } = useSelector((state) => state.common);
  const styles = StyleSheetFactory(theme);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, { marginHorizontal: noMargin ? 0 : 30 }]}
    >
      {textIcon ? (
        <Icon name={textIcon} size={20} color={theme.background_1} />
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
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: theme.primary,
      height: 50,
      marginHorizontal: 30,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      shadowColor: 'rgba(37, 37, 37, 0.2)',
      shadowOpacity: 1,
      elevation: 1,
      paddingVertical: 10,
      borderRadius: theme.border_radius,
    },
    buttonText: {
      fontFamily: theme.font_medium,
      color: theme.background_1,
      fontWeight: '600',
    },
  });
};

export default CustomSmallButton;

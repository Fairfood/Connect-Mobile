import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import StyleSheetFactory from './styles';

const CustomSmallButton = ({
  buttonText,
  onPress,
  textIcon = null,
  testID = '',
}) => {
  const styles = StyleSheetFactory();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      testID={testID}
    >
      {textIcon}
      <Text style={[styles.buttonText, { marginLeft: textIcon ? 5 : 0 }]}>
        {buttonText}
      </Text>
    </TouchableOpacity>
  );
};

export default CustomSmallButton;

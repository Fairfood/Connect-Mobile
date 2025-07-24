import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSelector } from 'react-redux';
import StyleSheetFactory from './styles';
import { HIT_SLOP_TEN } from '../../../utils/constants';
import I18n from '../../../translations/text/i18n';

const LoginButton = ({
  testID = '',
  onPress,
  extraStyle = {},
  loginLoadingText,
  loginButtonLoading,
}) => {
  const { theme } = useSelector((state) => state.common);
  const styles = StyleSheetFactory();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, extraStyle]}
      disabled={loginButtonLoading}
      activeOpacity={0.5}
      hitSlop={HIT_SLOP_TEN}
      testID={testID}
    >
      <Text style={styles.buttonText}>{I18n.t(loginLoadingText)}</Text>
      {loginButtonLoading && <ActivityIndicator color={theme.background_1} />}
    </TouchableOpacity>
  );
};

export default LoginButton;

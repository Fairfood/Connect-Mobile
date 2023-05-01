import React from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import Icon from '../../icons';
import I18n from '../../i18n/i18n';

const NoInternetConnection = () => {
  const { theme } = useSelector((state) => state.common);
  const styles = StyleSheetFactory(theme);

  return (
    <SafeAreaView style={styles.container}>
      <CustomLeftHeader
        backgroundColor={theme.background_2}
        onPress={() => {}}
      />
      <View style={styles.iconWrap}>
        <Icon name='no_internet' size={120} color={theme.text_1} />
      </View>
      <View style={styles.formTitleContainer}>
        <Text style={styles.formTitle}>{I18n.t('no_internet_connection')}</Text>
      </View>
      <Text style={styles.messageText}>
        {I18n.t('you_are_not_connected_to_internet')}
      </Text>
    </SafeAreaView>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background_2,
    },
    iconWrap: {
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: -50,
    },
    messageText: {
      color: theme.text_2,
      fontSize: 14,
      fontFamily: theme.font_regular,
      fontWeight: 'normal',
      fontStyle: 'normal',
      width: 250,
      justifyContent: 'center',
      textAlign: 'center',
    },
    formTitleContainer: {
      marginTop: 30,
      marginBottom: 10,
    },
    formTitle: {
      color: theme.text_1,
      fontFamily: 'Moderat-Medium',
      fontStyle: 'normal',
      fontSize: 18,
      textAlign: 'center',
    },
  });
};

export default NoInternetConnection;

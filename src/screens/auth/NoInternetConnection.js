import React from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import Icon from '../../icons';
import I18n from '../../i18n/i18n';
import * as consts from '../../services/constants';

const NoInternetConnection = () => {
  return (
    <SafeAreaView style={styles.container}>
      <CustomLeftHeader
        backgroundColor={consts.CARD_BACKGROUND_COLOR}
        onPress={() => {}}
      />
      <View style={styles.iconWrap}>
        <Icon
          name='no_internet'
          size={120}
          color={consts.TEXT_PRIMARY_COLOR}
        />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: consts.CARD_BACKGROUND_COLOR,
  },
  iconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -50,
  },
  messageText: {
    color: consts.TEXT_PRIMARY_LIGHT_COLOR,
    fontSize: 14,
    fontFamily: consts.FONT_REGULAR,
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
    color: consts.TEXT_PRIMARY_COLOR,
    fontFamily: 'Moderat-Medium',
    fontStyle: 'normal',
    fontSize: 18,
    textAlign: 'center',
  },
});

export default NoInternetConnection;

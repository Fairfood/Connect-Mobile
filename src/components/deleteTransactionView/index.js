import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { ErrorTnxWarningIcon } from '../../assets/svg';
import I18n from '../../translations/text/i18n';
import StyleSheetFactory from './styles';

const { width } = Dimensions.get('window');

const DeleteTransactionView = ({ error }) => {
  const styles = StyleSheetFactory();

  return (
    <View style={styles.errorWrap}>
      <View style={styles.errorTitleWrap}>
        <ErrorTnxWarningIcon width={width * 0.05} height={width * 0.05} />
        <Text style={styles.errorTile}>{I18n.t('error_in_transaction')}</Text>
      </View>

      <View style={styles.errorMessageWrap}>
        <View style={styles.leftColumn}>
          <View style={styles.bulletin} />
        </View>
        <View style={styles.rightColumn}>
          <Text style={styles.errorMessage}>{error}</Text>
        </View>
      </View>

      <View style={styles.errorMessageWrap}>
        <View style={styles.leftColumn}>
          <View style={styles.bulletin} />
        </View>
        <View style={styles.rightColumn}>
          <Text style={styles.errorMessage}>
            {I18n.t('try_syncing_or_contact')}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default DeleteTransactionView;

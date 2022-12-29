import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

import { ErrorTnxWarningIcon } from '../assets/svg';
import I18n from '../i18n/i18n';
import * as consts from '../services/constants';

const { width } = Dimensions.get('window');

const DeleteTransactionView = ({ error, reportButton, onReport, deleteButton, onDelete }) => {
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
          <Text style={styles.errorMessage}>{I18n.t('try_syncing_or_contact')}</Text>
        </View>
      </View>

      <View style={styles.buttonWrap}>
        {reportButton && (
          <TouchableOpacity onPress={onReport} style={styles.button}>
            <Text style={[styles.buttonText, { color: '#053B5F' }]}>{`${I18n.t('report_issue')} >`}</Text>
          </TouchableOpacity>
        )}

        {deleteButton && (
          <TouchableOpacity
            onPress={onDelete}
            style={[
              styles.button,
              {
                borderLeftColor: '#EA2553',
                borderLeftWidth: reportButton ? 1 : 0,
              },
            ]}
          >
            <Text style={[styles.buttonText, { color: '#EA2553' }]}>{`${I18n.t('delete_transaction')} >`}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  errorTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 2,
    paddingHorizontal: 25,
  },
  errorMessageWrap: {
    flexDirection: 'row',
    paddingHorizontal: 25,
  },
  leftColumn: {
    width: '5%',
    alignItems: 'center',
    paddingTop: 12,
  },
  rightColumn: {
    width: '95%',
    justifyContent: 'center',
    paddingLeft: 5,
  },
  bulletin: {
    width: 5,
    height: 5,
    borderRadius: 5 / 2,
    backgroundColor: '#053B5F',
  },
  errorTile: {
    fontSize: 17,
    fontFamily: consts.FONT_BOLD,
    lineHeight: 28,
    color: consts.BUTTON_COLOR_PRIMARY,
    marginLeft: 10,
  },
  errorMessage: {
    fontSize: 14,
    fontFamily: consts.FONT_REGULAR,
    lineHeight: 25,
    paddingBottom: 5,
    color: '#053B5F',
  },
  errorWrap: {
    width: '90%',
    alignSelf: 'center',
    paddingVertical: 15,
    marginVertical: 10,
    backgroundColor: 'rgba(255, 176, 170, 0.04)',
    borderRadius: consts.BORDER_RADIUS,
    borderColor: 'rgba(255, 176, 170, 1)',
    borderWidth: 1,
  },
  buttonWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  button: {
    width: '50%',
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontFamily: consts.FONT_REGULAR,
    color: '#053B5F',
  },
});

export default DeleteTransactionView;

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import moment from 'moment';
import Icon from '../icons';
import I18n from '../i18n/i18n';
import Avatar from './Avatar';
import { ErrorTnxWarningIcon } from '../assets/svg';
import * as consts from '../services/constants';

const TransactionItem = ({
  item,
  onSelect,
  listview,
  historyview,
  displayUnSync,
  currency,
}) => {
  return (
    <TouchableOpacity
      onPress={() => onSelect(item)}
      style={[
        styles.container,
        {
          borderColor: consts.BORDER_COLOR,
          backgroundColor:
            item.error !== '' ? 'rgba(255, 117, 129, 0.17)' : null,
        },
      ]}
    >
      {listview && (
        <>
          <View style={styles.leftSideWrap}>
            <View style={{ flexDirection: 'row' }}>
              {item.type !== consts.APP_TRANS_TYPE_LOSS && (
                <Avatar
                  image={item.node_image}
                  containerStyle={styles.person}
                  avatarName={item.node_name}
                  avatarNameStyle={styles.avatarNameStyle}
                />
              )}

              {item.type === consts.APP_TRANS_TYPE_LOSS && (
                <View style={[styles.person, { backgroundColor: '#EA2553' }]}>
                  <Text style={styles.symbolText}>!</Text>
                </View>
              )}

              <View style={{ width: '50%' }}>
                <Text
                  style={[
                    styles.title,
                    {
                      width: '50%',
                      color:
                        item.node_name === 'Not available'
                          ? 'orange'
                          : consts.TEXT_PRIMARY_COLOR,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.node_name}
                </Text>

                <Text
                  style={[
                    styles.subtitle,
                    { color: consts.TEXT_PRIMARY_LIGHT_COLOR, marginTop: 8 },
                  ]}
                >
                  {item.product_name}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.rightSideWrap}>
            <Text
              style={[
                styles.subtitle,
                {
                  fontSize: 17,
                  alignSelf: 'flex-end',
                  color:
                    item.type === consts.APP_TRANS_TYPE_LOSS
                      ? consts.ERROR_ICON_COLOR
                      : consts.TEXT_PRIMARY_COLOR,
                },
              ]}
              numberOfLines={1}
            >
              {`${
                item.type === consts.APP_TRANS_TYPE_INCOMING ? '+' : '-'
              } ${parseFloat(item.quantity).toLocaleString('pt-BR')} kg`}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text
                style={[
                  styles.subtitle,
                  {
                    marginVertical: 8,
                    color: '#979797',
                    alignSelf: 'flex-end',
                  },
                ]}
              >
                {moment(parseInt(item.created_on * 1000)).format('hh:mm A')}
              </Text>

              {displayUnSync && item.server_id === '' ? (
                <>
                  {item.error !== '' && (
                    <View style={styles.syncPendingIconWrap}>
                      <ErrorTnxWarningIcon width={18} height={18} />
                    </View>
                  )}

                  {item.error === '' && (
                    <View style={styles.syncPendingIconWrap}>
                      <Icon name='Sync-warning2' size={25} color='#F2994A' />
                    </View>
                  )}
                </>
              ) : null}
            </View>
          </View>
        </>
      )}

      {historyview && (
        <View style={styles.historyViewWrap}>
          <View style={{ width: '75%' }}>
            <Text style={[styles.title, { width: '95%' }]} numberOfLines={1}>
              {`${parseFloat(item.quantity).toLocaleString('pt-BR')} kg ${
                item.product_name
              } ${I18n.t('bought')}`}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: consts.TEXT_PRIMARY_LIGHT_COLOR },
              ]}
            >
              {`${I18n.t('paid_a_total_amount_of')} ${Math.round(
                parseInt(item.total),
              ).toLocaleString('pt-BR')} ${currency}`}
            </Text>
          </View>
          <View style={{ width: '25%' }}>
            <Text style={styles.dateText}>
              {moment(parseInt(item.created_on * 1000)).format('MMM DD YYYY')}
            </Text>
            <Text style={styles.dateText}>
              {moment(parseInt(item.created_on * 1000)).format('hh:mm a')}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    width: '100%',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEEEF',
  },
  person: {
    backgroundColor: '#F2F2F2',
    height: 50,
    width: 50,
    borderRadius: 50 / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  title: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 16,
    fontFamily: consts.FONT_REGULAR,
    fontWeight: '500',
    fontStyle: 'normal',
    textTransform: 'capitalize',
  },
  subtitle: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 13,
    fontFamily: consts.FONT_REGULAR,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
  },
  dateText: {
    color: consts.TEXT_PRIMARY_LIGHT_COLOR,
    fontSize: 13,
    fontFamily: consts.FONT_REGULAR,
    fontWeight: 'normal',
    fontStyle: 'normal',
    textTransform: 'none',
    textAlign: 'right',
  },
  horizontal_line: {
    borderBottomWidth: 1,
    borderColor: consts.BORDER_COLOR,
    marginHorizontal: 30,
  },
  symbolText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: consts.FONT_BOLD,
  },
  historyViewWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  syncPendingIconWrap: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginLeft: 5,
  },
  rightSideWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 10,
  },
  avatarNameStyle: {
    color: '#ffffff',
    fontSize: 17,
    fontFamily: consts.FONT_BOLD,
  },
  leftSideWrap: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
});

export default TransactionItem;

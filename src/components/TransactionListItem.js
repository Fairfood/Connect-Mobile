import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import moment from 'moment';

import {
  APP_TRANS_TYPE_LOSS,
  APP_TRANS_TYPE_INCOMING,
  PAYMENT_INCOMING,
} from '../services/constants';
import { ErrorTnxWarningIcon } from '../assets/svg';
import Icon from '../icons';
import I18n from '../i18n/i18n';
import Avatar from './Avatar';
import { convertCurrency, convertQuantity } from '../services/commonFunctions';

const { width } = Dimensions.get('window');

const TransactionItem = ({
  item,
  onSelect,
  listView,
  historyView,
  paymentView,
  displayUnSync,
  currency,
}) => {
  const { theme } = useSelector((state) => state.common);

  // useEffect(() => {
  //   if (historyView) {
  //     if (!item.product_name) {
  //       addProductName();
  //     }
  //   }
  // }, [item]);

  // const addProductName = async () => {
  //   const product = await findProduct(item.product_id, true);
  //   const name = product?.name ?? '';
  //   item.product_name = name;
  // };

  const getQuantity = (quantity) => {
    productQuantity = quantity;
    if (
      String(productQuantity).includes('.00') ||
      String(productQuantity).includes('.99')
    ) {
      productQuantity = Math.round(productQuantity);
    }
    return productQuantity;
  };

  const getBackGroundColor = (itemObj) => {
    if (listView) {
      if (itemObj.error !== '' || itemObj.is_reported) {
        return 'rgba(255, 117, 129, 0.17)';
      }
    } else if (paymentView && itemObj.is_reported) {
      return 'rgba(255, 117, 129, 0.17)';
    }
    return null;
  };

  const styles = StyleSheetFactory(theme);

  return (
    <TouchableOpacity
      onPress={() => onSelect(item)}
      style={[
        styles.container,
        {
          backgroundColor: getBackGroundColor(item),
        },
      ]}
    >
      {listView && (
        <>
          <View style={styles.leftSideWrap}>
            <View style={{ flexDirection: 'row' }}>
              {item.type !== APP_TRANS_TYPE_LOSS && (
                <Avatar
                  image={item.node_image}
                  containerStyle={styles.person}
                  avatarName={item.node_name}
                  avatarNameStyle={styles.avatarNameStyle}
                />
              )}

              {item.type === APP_TRANS_TYPE_LOSS && (
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
                          : theme.text_1,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.node_name}
                </Text>

                <Text
                  style={[
                    styles.subtitle,
                    { color: theme.text_2, marginTop: 8 },
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
                    item.type === APP_TRANS_TYPE_LOSS
                      ? theme.icon_error
                      : theme.text_1,
                },
              ]}
              numberOfLines={1}
            >
              {`${
                item.type === APP_TRANS_TYPE_INCOMING ? '+' : '-'
              } ${convertQuantity(getQuantity(item.quantity))} kg`}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {displayUnSync ? (
                <>
                  {/* {item.is_reported && (
                    <View style={styles.syncErrorIconWrap}>
                      <ReportedIcon width={15} height={15} />
                    </View>
                  )} */}

                  {item.error !== '' && item.server_id === '' && (
                    <View style={styles.syncErrorIconWrap}>
                      <ErrorTnxWarningIcon width={15} height={15} />
                    </View>
                  )}

                  {item.server_id === '' && (
                    <View style={styles.syncPendingIconWrap}>
                      <Icon name="Sync-warning2" size={20} color="#F2994A" />
                    </View>
                  )}
                </>
              ) : null}

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
            </View>
          </View>
        </>
      )}

      {historyView && (
        <View style={styles.historyViewWrap}>
          <View style={{ width: '75%' }}>
            <Text style={[styles.title, { width: '95%' }]} numberOfLines={1}>
              {`${convertQuantity(item.quantity)} kg ${item?.product_name ?? ''} ${I18n.t('bought')}`}
            </Text>
            <Text style={[styles.subtitle, { color: theme.text_2 }]}>
              {`${I18n.t('paid_a_total_amount_of')} ${convertCurrency(
                item.total,
              )} ${currency}`}
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

      {paymentView && (
        <View style={styles.paymentWrap}>
          <View style={styles.paymentLeftSideWrap}>
            <View style={{ flex: 1, flexDirection: 'row' }}>
              <Avatar
                image={item.node_image}
                containerStyle={styles.person}
                avatarName={item.node_name}
                avatarNameStyle={styles.avatarNameStyle}
              />

              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.title,
                    {
                      width: '50%',
                      color:
                        item.node_name === 'Not available'
                          ? 'orange'
                          : theme.text_1,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.node_name}
                </Text>

                <Text
                  style={[
                    styles.subtitle,
                    { color: theme.text_2, marginTop: 8 },
                  ]}
                  numberOfLines={1}
                >
                  {item.premium_name}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.paymentRightSideWrap}>
            <Text
              style={[
                styles.subtitle,
                {
                  fontSize: 17,
                  alignSelf: 'flex-end',
                  color: theme.text_1,
                },
              ]}
              numberOfLines={1}
            >
              {`${item.type === PAYMENT_INCOMING ? '+' : '-'} ${convertCurrency(item.amount)} ${currency}`}
            </Text>
            <View style={{ flexDirection: 'row', alignSelf: 'flex-end' }}>
              {displayUnSync ? (
                <>
                  {/* {item.is_reported && (
                    <View style={[styles.syncErrorIconWrap, { marginTop: 5 }]}>
                      <ReportedIcon width={15} height={15} />
                    </View>
                  )} */}

                  {item.server_id === '' && (
                    <View style={styles.syncPendingIconWrap}>
                      <Icon name="Sync-warning2" size={20} color="#F2994A" />
                    </View>
                  )}
                </>
              ) : null}

              <Text
                style={[
                  styles.subtitle,
                  {
                    marginVertical: 4,
                    color: '#979797',
                    textAlign: 'right',
                  },
                ]}
              >
                {moment(item.date * 1000).format('hh:mm A')}
              </Text>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
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
      borderBottomColor: theme.border_1,
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
      color: theme.text_1,
      fontSize: 16,
      fontFamily: theme.font_regular,
      fontWeight: '500',
      fontStyle: 'normal',
      textTransform: 'capitalize',
    },
    subtitle: {
      color: theme.text_1,
      fontSize: 13,
      fontFamily: theme.font_regular,
      fontWeight: 'normal',
      textAlign: 'left',
    },
    dateText: {
      color: theme.text_2,
      fontSize: 13,
      fontFamily: theme.font_regular,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textTransform: 'none',
      textAlign: 'right',
    },
    horizontal_line: {
      borderBottomWidth: 1,
      borderColor: theme.border_1,
      marginHorizontal: 30,
    },
    symbolText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: theme.font_bold,
    },
    historyViewWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 5,
    },
    syncPendingIconWrap: {
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      marginRight: 2,
      marginTop: 3,
    },
    syncErrorIconWrap: {
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      marginRight: 3,
    },
    rightSideWrap: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingRight: 10,
    },
    avatarNameStyle: {
      color: '#ffffff',
      fontSize: 17,
      fontFamily: theme.font_bold,
    },
    leftSideWrap: {
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
    },
    paymentWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      width,
    },
    paymentLeftSideWrap: {
      width: '50%',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
    },
    paymentRightSideWrap: {
      width: '40%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    reportSectionWrap: {
      width: '90%',
      alignSelf: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 5,
    },
    reportTitleText: {
      color: theme.text_2,
      fontFamily: theme.font_regular,
      fontSize: width * 0.035,
    },
    reportButtonText: {
      color: theme.primary,
      fontFamily: theme.font_medium,
      fontSize: width * 0.035,
    },
  });
};

export default TransactionItem;

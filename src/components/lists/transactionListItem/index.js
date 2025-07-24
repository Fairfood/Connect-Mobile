import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import moment from 'moment';
import { APP_TRANS_TYPE_INCOMING } from '../../../utils/constants';
import {
  BannedIcon,
  ErrorTnxWarningIcon,
  SyncPendingSecondaryIcon,
} from '../../../assets/svg';
import { NumberFormatter } from '../../../utils/commonFunctions';
import Avatar from '../../avatar';
import StyleSheetFactory from './styles';

const TransactionListItem = ({ item, onSelect }) => {
  const { theme } = useSelector((state) => state.common);
  const styles = useMemo(() => StyleSheetFactory(theme), [theme]);
  const deleted = item.is_deleted;

  const getBackGroundColor = () => {
    if (item.is_deleted) {
      return '#f5f6f7';
    }

    if (item.error !== '' || item.is_reported) {
      return 'rgba(255, 117, 129, 0.17)';
    }

    return theme.background_1;
  };

  const getSyncIconStatus = () => {
    if (item.is_deleted) {
      if (item.is_edited) {
        return true;
      }
      return false;
    }

    if (item.server_id === '') {
      return true;
    }

    return false;
  };

  return (
    <TouchableOpacity
      onPress={onSelect}
      style={[
        styles.container,
        {
          backgroundColor: getBackGroundColor(),
        },
      ]}
      disabled={deleted}
    >
      <>
        <View style={styles.leftSideWrap}>
          <View style={{ flexDirection: 'row' }}>
            {deleted ? (
              <View style={[styles.person, { backgroundColor: '#e8e8e8' }]}>
                <BannedIcon width={25} height={25} />
              </View>
            ) : (
              <Avatar
                image={item.node_image}
                containerStyle={styles.person}
                avatarName={item.node_name}
                avatarNameStyle={styles.avatarNameStyle}
              />
            )}

            <View style={{ width: '60%' }}>
              <Text
                style={[
                  styles.title,
                  {
                    color: deleted
                      ? theme.text_3
                      : item.node_name === 'Not available'
                      ? 'orange'
                      : theme.text_1,
                    textDecorationLine: deleted ? 'line-through' : 'none',
                  },
                ]}
                numberOfLines={1}
              >
                {item.node_name}
              </Text>

              <Text
                style={[
                  styles.subtitle,
                  {
                    color: deleted ? theme.text_3 : theme.text_2,
                    textDecorationLine: deleted ? 'line-through' : 'none',
                  },
                ]}
                numberOfLines={1}
              >
                {item.product_name}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.rightSideWrap}>
          <Text
            style={[
              styles.quantityText,
              {
                textDecorationLine: deleted ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={1}
          >
            {`${
              item.type === APP_TRANS_TYPE_INCOMING ? '+' : '-'
            } ${NumberFormatter.quantity(item.quantity_corrected, true)}`}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-end',
            }}
          >
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

              {getSyncIconStatus() && (
                <View style={styles.syncPendingIconWrap}>
                  <SyncPendingSecondaryIcon />
                </View>
              )}
            </>

            <Text
              style={[
                styles.dateText,
                {
                  textDecorationLine: deleted ? 'line-through' : 'none',
                },
              ]}
            >
              {moment(parseInt(item.created_on * 1000)).format('hh:mm a')}
            </Text>
          </View>
        </View>
      </>
    </TouchableOpacity>
  );
};

export default memo(TransactionListItem);

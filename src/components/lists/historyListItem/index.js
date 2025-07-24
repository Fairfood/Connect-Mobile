import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import moment from 'moment';
import { NumberFormatter } from '../../../utils/commonFunctions';
import I18n from '../../../translations/text/i18n';
import StyleSheetFactory from './styles';

const HistoryListItem = ({ item, onSelect }) => {
  const { theme } = useSelector((state) => state.common);
  const styles = useMemo(() => StyleSheetFactory(theme), [theme]);
  const deleted = item.is_deleted;

  const getBackGroundColor = () => {
    if (item.is_deleted) {
      return '#f5f6f7';
    }

    return theme.background_1;
  };

  return (
    <TouchableOpacity
      onPress={() => onSelect(item)}
      style={[
        styles.container,
        {
          backgroundColor: getBackGroundColor(),
        },
      ]}
      disabled={deleted}
    >
      <View style={styles.historyViewWrap}>
        <View style={{ width: '70%' }}>
          <Text
            style={[
              styles.title,
              {
                color: deleted ? theme.text_3 : theme.text_1,
                textDecorationLine: deleted ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={1}
          >
            {`${NumberFormatter.quantity(item.quantity_corrected, true)} ${
              item?.product_name ?? ''
            } ${I18n.t('bought')}`}
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                textDecorationLine: deleted ? 'line-through' : 'none',
              },
            ]}
          >
            {`${I18n.t('paid_a_total_amount_of')} ${NumberFormatter.currency(
              item.total_corrected,
              true,
            )}`}
          </Text>
        </View>
        <View style={{ width: '30%' }}>
          <Text
            style={[
              styles.dateText,
              { textDecorationLine: deleted ? 'line-through' : 'none' },
            ]}
          >
            {moment(parseInt(item.created_on * 1000)).format('MMM DD YYYY')}
          </Text>
          <Text
            style={[
              styles.dateText,
              { textDecorationLine: deleted ? 'line-through' : 'none' },
            ]}
          >
            {moment(parseInt(item.created_on * 1000)).format('hh:mm a')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default HistoryListItem;

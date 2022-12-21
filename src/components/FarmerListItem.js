import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from '../icons';
import Avatar from './Avatar';
import * as consts from '../services/constants';

const FarmerListItem = ({
  item,
  displayClose,
  onClose,
  onPress,
  displayUnSync,
  avatarBgColor = '#607d8b',
}) => {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: displayClose ? '#DDF3FF' : null },
      ]}
    >
      <TouchableOpacity
        style={styles.containerSub}
        onPress={() => onPress(item, avatarBgColor)}
        disabled={displayClose}
      >
        <View style={{ flexDirection: 'row' }}>
          <Avatar
            image={item.image}
            containerStyle={styles.person}
            avatarName={item.name}
            avatarBgColor={avatarBgColor}
          />

          <View style={{ width: '65%', marginLeft: 15 }}>
            <Text style={styles.title} numberOfLines={1}>
              {item.name}
            </Text>

            <Text style={styles.subtitle} numberOfLines={1}>
              {`${item.city}, ${item.country}`}
            </Text>
          </View>
        </View>

        {displayUnSync &&
          (item.server_id === '' ||
            item.is_modified ||
            item.is_card_modified) && (
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.person,
                { backgroundColor: null, marginRight: 0, width: '10%' },
              ]}
              hitSlop={consts.HIT_SLOP_TWENTY}
            >
              <Icon name='Sync-warning2' size={25} color='#F2994A' />
            </TouchableOpacity>
          )}

        {displayClose && (
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.person,
              { backgroundColor: null, marginRight: 0, width: '15%' },
            ]}
            hitSlop={consts.HIT_SLOP_TWENTY}
          >
            <Icon name='Close' size={25} color={consts.ICON_COLOR} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerSub: {
    flexDirection: 'row',
    alignSelf: 'center',
    width: '100%',
    padding: 20,
    justifyContent: 'space-between',
    alignContent: 'space-between',
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
  },
  title: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 16,
    fontFamily: consts.FONT_REGULAR,
    fontWeight: '500',
    fontStyle: 'normal',
    paddingBottom: 5,
    marginTop: 5,
  },
  subtitle: {
    color: consts.TEXT_PRIMARY_LIGHT_COLOR,
    fontSize: 14,
    fontFamily: consts.FONT_REGULAR,
    fontWeight: 'normal',
    fontStyle: 'normal',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: consts.FONT_BOLD,
  },
});

export default FarmerListItem;

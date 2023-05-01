import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { HIT_SLOP_TWENTY } from '../services/constants';
import Icon from '../icons';
import Avatar from './Avatar';

const FarmerListItem = ({
  item,
  displayClose,
  onClose,
  onPress,
  displayUnSync,
  avatarBgColor = '#607d8b',
}) => {
  const { theme } = useSelector((state) => state.common);
  const styles = StyleSheetFactory(theme);

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
              hitSlop={HIT_SLOP_TWENTY}
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
            hitSlop={HIT_SLOP_TWENTY}
          >
            <Icon name='Close' size={25} color={theme.icon_1} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: theme.border_radius,
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
      color: theme.text_1,
      fontSize: 16,
      fontFamily: theme.font_regular,
      fontWeight: '500',
      fontStyle: 'normal',
      paddingBottom: 5,
      marginTop: 5,
    },
    subtitle: {
      color: theme.text_2,
      fontSize: 14,
      fontFamily: theme.font_regular,
      fontWeight: 'normal',
      fontStyle: 'normal',
    },
    avatarText: {
      color: '#ffffff',
      fontSize: 16,
      fontFamily: theme.font_bold,
    },
  });
};

export default FarmerListItem;

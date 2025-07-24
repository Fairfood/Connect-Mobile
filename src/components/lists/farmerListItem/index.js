import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { HIT_SLOP_TWENTY } from '../../../utils/constants';
import { CloseIcon, SyncPendingSecondaryIcon } from '../../../assets/svg';
import Avatar from '../../avatar';
import StyleSheetFactory from './styles';

const FarmerListItem = ({
  item,
  index,
  displayClose,
  onClose,
  onPress,
  displayUnSync,
  avatarBgColor = '#607d8b',
}) => {
  const { theme } = useSelector((state) => state.common);
  const styles = useMemo(() => StyleSheetFactory(theme), [theme]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: displayClose ? theme.background_2 : null },
      ]}
      testID={`farmer-item-container-${index}`}
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
            <Text
              style={styles.title}
              numberOfLines={1}
              testID="farmer-item-name"
            >
              {item?.name ?? 'AA'}
            </Text>

            <Text
              style={styles.subtitle}
              numberOfLines={1}
              testID="farmer-item-address"
            >
              {`${item?.city}, ${item?.country}`}
            </Text>
          </View>
        </View>

        {displayUnSync &&
          (item?.server_id === '' ||
            item?.is_modified ||
            item?.is_card_modified) && (
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.person,
                { backgroundColor: null, marginRight: 0, width: '10%' },
              ]}
              hitSlop={HIT_SLOP_TWENTY}
              testID="farmer-item-sync-pending"
            >
              <SyncPendingSecondaryIcon />
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
            testID="farmer-item-close-icon"
          >
            <CloseIcon width={19} height={19} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default FarmerListItem;

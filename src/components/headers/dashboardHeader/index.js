import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useSelector } from 'react-redux';
import {
  HIT_SLOP_FIFTEEN,
  HIT_SLOP_TEN,
  AVATAR_BG_COLORS,
} from '../../../utils/constants';
import { OnlineIcon } from '../../../assets/svg';
import I18n from '../../../translations/text/i18n';
import Avatar from '../../avatar';
import StyleSheetFactory from './styles';

const DashboardHeader = ({ navigation, checkSyncing }) => {
  const { isConnected } = useSelector((state) => state.connection);
  const { loggedInUser } = useSelector((state) => state.login);
  const { theme } = useSelector((state) => state.common);
  const { syncIconStatus } = useSelector((state) => state.sync);
  const styles = useMemo(() => StyleSheetFactory(theme), [theme]);

  const getSyncStatus = useMemo(() => {
    switch (syncIconStatus) {
      case 'success':
        return require('../../../assets/images/sync_success.png');
      case 'pending':
        return require('../../../assets/images/sync_pending.png');
      case 'failed':
        return require('../../../assets/images/sync_error.png');
      default:
        return require('../../../assets/images/sync_pending.png');
    }
  }, [syncIconStatus]);

  return (
    <View style={styles.container}>
      <View style={styles.onlineWrap}>
        <OnlineIcon
          fill={isConnected ? '#27AE60' : theme.button_bg_1}
          width={28}
          height={28}
        />
        <Text
          style={[
            styles.online,
            {
              color: isConnected ? '#27AE60' : theme.button_bg_1,
            },
          ]}
        >
          {isConnected ? I18n.t('online') : I18n.t('offline')}
        </Text>
      </View>
      <View style={styles.iconWrap}>
        <TouchableOpacity onPress={checkSyncing} hitSlop={HIT_SLOP_FIFTEEN}>
          <Image
            source={getSyncStatus}
            style={{ width: 30, height: 30, marginRight: 20 }}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          hitSlop={HIT_SLOP_TEN}
        >
          <Avatar
            image={loggedInUser.image}
            containerStyle={styles.proPic}
            avatarBgColor={AVATAR_BG_COLORS[0]}
            avatarName={`${loggedInUser.first_name} ${loggedInUser.last_name}`}
            avatarNameStyle={styles.avatarNameStyle}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DashboardHeader;

import React from 'react';
import { View, Text } from 'react-native';
import { getAddressText, getPhoneText } from './controller';
import StyleSheetFactory from './styles';
import Avatar from '../../avatar';
import I18n from '../../../translations/text/i18n';

const ProfileCard = ({ user, type }) => {
  const styles = StyleSheetFactory();

  return (
    <View>
      <Text style={styles.titleText}>{I18n.t('card_verification')}</Text>
      <Text style={styles.subTitleText}>{I18n.t('details_from_card')}</Text>
      <View style={styles.container}>
        <Avatar
          image={user.image}
          containerStyle={styles.person}
          avatarName={user.name || 'NA'}
          avatarBgColor="#2196f3"
        />
        <View style={{ width: '80%' }}>
          <Text style={styles.nameText}>{user.name}</Text>

          {type === 'farmer' && (
            <View>
              {user?.phone && getPhoneText(user.phone) !== '' && (
                <Text style={styles.addressText}>
                  {getPhoneText(user.phone)}
                </Text>
              )}

              <Text style={styles.addressText}>{getAddressText(user)}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={styles.subTitleText}>
        {I18n.t('confirm_card_transaction_msg')}
      </Text>
    </View>
  );
};

export default ProfileCard;

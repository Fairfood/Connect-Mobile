import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, SafeAreaView, Image } from 'react-native';
import { useSelector } from 'react-redux';
import Icon from '../../icons';
import CustomButton from '../../components/CustomButton';
import I18n from '../../i18n/i18n';
import Avatar from '../../components/Avatar';
import HelpTutorial from '../../components/HelpTutorial';
import * as consts from '../../services/constants';

const HelpTutorialScreen = ({ navigation }) => {
  const [helpModal, setHelpModal] = useState(false);
  const { userProjectDetails, loggedInUser } = useSelector(
    (state) => state.login,
  );
  const { isConnected } = useSelector((state) => state.connection);

  useEffect(() => {
    setHelpModal(true);
  }, []);

  const closeModal = () => {
    setHelpModal(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={{ flex: 1 }}>
          <View style={styles.headerContainerSub}>
            <View style={styles.headerInnerWrap}>
              <View style={styles.onlineWrap}>
                <Icon
                  name='Online'
                  size={20}
                  color={isConnected ? '#27AE60' : consts.BUTTON_COLOR_PRIMARY}
                />
                <Text
                  style={[
                    styles.online,
                    {
                      marginTop: 0,
                      color: isConnected
                        ? '#27AE60'
                        : consts.BUTTON_COLOR_PRIMARY,
                    },
                  ]}
                >
                  {isConnected ? I18n.t('online') : I18n.t('offline')}
                </Text>
              </View>
              <View style={styles.righIconsWrap}>
                <View style={styles.syncIcon}>
                  <Image
                    source={require('../../assets/images/sync_success.png')}
                    style={{ width: 25, height: 25 }}
                  />
                </View>
                <View style={styles.profileIconWrap}>
                  <Avatar
                    image={loggedInUser.image}
                    containerStyle={styles.profileIcon}
                    avatarBgColor={consts.AVATAR_BG_COLORS[0]}
                    avatarName={`${loggedInUser.first_name} ${loggedInUser.last_name}`}
                    avatarNameStyle={styles.avatarNameStyle}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
        <Image
          source={require('../../assets/images/lines.png')}
          style={styles.linesImage}
        />
      </View>
      {/* Click receive or deliver to start a transaction */}
      {userProjectDetails?.sell_enabled && (
        <Text style={[styles.buyText]}>{I18n.t('greeting')}</Text>
      )}
      {!userProjectDetails?.sell_enabled && (
        <Text style={[styles.buyText, { textAlign: 'center' }]}>
          {I18n.t('greeting_with_buy')}
        </Text>
      )}

      {userProjectDetails?.buy_enabled && (
        <View style={styles.buyButtonWrap}>
          <CustomButton buttonText={I18n.t('buy')} medium onPress={() => {}} />
        </View>
      )}
      {userProjectDetails?.sell_enabled && (
        <View style={styles.sellButtonWrap}>
          <CustomButton
            buttonText={I18n.t('sell')}
            medium
            onPress={() => {}}
            backgroundColor={consts.APP_BG_COLOR}
          />
        </View>
      )}

      {helpModal && (
        <HelpTutorial visible={helpModal} hideModal={() => closeModal()} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: consts.APP_BG_COLOR,
  },
  buyText: {
    fontSize: 18,
    fontFamily: consts.FONT_REGULAR,
    lineHeight: 28,
    paddingBottom: 30,
    color: consts.TEXT_PRIMARY_COLOR,
    marginHorizontal: 30,
    marginBottom: 50,
    marginTop: 50,
  },
  online: {
    color: '#27AE60',
    fontWeight: '500',
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontSize: 16,
    marginLeft: 10,
    marginTop: 10,
  },
  headerContainer: {
    height: '55%',
    backgroundColor: '#92DDF6',
  },
  headerContainerSub: {
    flex: 1,
    alignItems: 'flex-start',
    margin: 15,
  },
  headerInnerWrap: {
    flex: 1,
    alignContent: 'space-around',
    flexDirection: 'row',
  },
  onlineWrap: {
    flex: 1,
    flexDirection: 'row',
    marginTop: 10,
  },
  righIconsWrap: {
    flex: 1,
    flexDirection: 'row',
    alignContent: 'flex-end',
    justifyContent: 'flex-end',
  },
  syncIcon: {
    marginHorizontal: 15,
    marginTop: 10,
    width: 30,
    height: 40,
  },
  profileIconWrap: {
    marginTop: 10,
    width: 30,
    height: 30,
    marginHorizontal: 0,
  },
  profileIcon: {
    width: 25,
    height: 25,
    borderRadius: 25 / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linesImage: {
    width: '100%',
    height: 40,
    bottom: -5,
  },
  buyButtonWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    bottom: 50,
    marginTop: 20,
    marginBottom: 30,
  },
  sellButtonWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    bottom: 50,
    marginTop: 20,
  },
  avatarNameStyle: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: consts.FONT_BOLD,
  },
});

export default HelpTutorialScreen;

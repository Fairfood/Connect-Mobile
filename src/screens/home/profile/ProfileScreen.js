import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  Linking,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import DeviceInfo from 'react-native-device-info';
import Toast from 'react-native-toast-message';

import { logoutUser } from '../../../services/syncInitials';
import { EmailIcon, LogoutIcon } from '../../../assets/svg';
import { AVATAR_BG_COLORS, PROFILE_MENUS } from '../../../services/constants';
import { countNewFarmers, countUpdatedFarmers } from '../../../db/services/FarmerHelper';
import { countNewTransactions } from '../../../db/services/TransactionsHelper';
import CustomLeftHeader from '../../../components/CustomLeftHeader';
import TransparentButton from '../../../components/TransparentButton';
import CommonAlert from '../../../components/CommonAlert';
import I18n from '../../../i18n/i18n';
import Icon from '../../../icons';
import api from '../../../api/config';
import Avatar from '../../../components/Avatar';

const { width, height } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const { theme } = useSelector((state) => state.common);
  const { loggedInUser, userCompanyDetails } = useSelector(
    (state) => state.login,
  );
  const { isConnected } = useSelector((state) => state.connection);
  const [pendingSync, setPendingSync] = useState([]);
  const [logoutModal, setLogoutModal] = useState(false);

  /**
   * calculating pending sync counts on logout
   */
  const logoutCurrentUser = async () => {
    const newFarmers = await countNewFarmers();
    const modifiedFarmers = await countUpdatedFarmers();
    const newTransactions = await countNewTransactions();
    const arr = [];

    const farmerCount = newFarmers + modifiedFarmers;

    if (farmerCount > 0) {
      const obj = {
        field: I18n.t('farmers'),
        value: farmerCount,
      };
      arr.push(obj);
    }

    if (newTransactions > 0) {
      const obj = {
        field: I18n.t('transactions'),
        value: newTransactions,
      };
      arr.push(obj);
    }

    // eslint-disable-next-line no-shadow, no-unused-vars
    setPendingSync((pendingSync) => arr);
    setLogoutModal(true);
  };

  /**
   * logging out user on confirm logout
   */
  const logout = async () => {
    logoutUser();
  };

  /**
   * navigation to edit profile page
   */
  const onPressRight = () => {
    if (isConnected) {
      navigation.navigate('EditProfile');
    } else {
      Toast.show({
        type: 'error',
        text1: I18n.t('connection_error'),
        text2: I18n.t('no_active_internet_connection_to_update_profile'),
      });
    }
  };

  /**
   * managing operations based on settings options
   * @param {string} key selected settings option key
   */
  const onPressMenu = (key) => {
    switch (key) {
      case 'privacy_statement':
        Linking.openURL('https://fairfood.nl/en/privacy-statement/');
        break;
      case 'terms_&_conditions':
        Linking.openURL('https://fairfood.nl/en/terms-and-conditions/');
        break;
      case 'help':
        navigation.navigate('HelpTutorialScreen');
        break;
      case 'how_to_use':
        Linking.openURL(
          'https://fairfood.atlassian.net/wiki/spaces/THD/pages/33390593/How+to+install+and+update+the+app',
        );
        break;
      case 'contact_us':
        Linking.openURL('https://fairfood.nl/en/contact');
        break;
      case 'report_issue':
        Linking.openURL(
          'https://fairfood.atlassian.net/servicedesk/customer/portal/3',
        );
        break;
      case 'settings':
        navigation.navigate('Settings');
        break;
      default:
        break;
    }
  };

  const styles = StyleSheetFactory(theme);

  return (
    <View style={styles.container}>
      <CustomLeftHeader
        backgroundColor={theme.background_2}
        title={I18n.t('account')}
        leftIcon="arrow-left"
        onPress={() => navigation.goBack(null)}
        rightText={I18n.t('edit_profile')}
        rightTextColor={isConnected ? '#EA2553' : '#808080'}
        onPressRight={() => onPressRight()}
        extraStyle={{ paddingLeft: 20 }}
      />
      <ScrollView
        style={styles.subContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.firstSectionWrap}>
          <Avatar
            image={loggedInUser.image}
            containerStyle={styles.proPic}
            avatarBgColor={AVATAR_BG_COLORS[0]}
            avatarName={`${loggedInUser.first_name} ${loggedInUser.last_name}`}
            avatarNameStyle={styles.avatarNameStyle}
          />
          <Text style={styles.nameText}>
            {`${loggedInUser.first_name} ${loggedInUser.last_name}`}
          </Text>
          <View style={styles.companyWrap}>
            <Text style={styles.companyText}>Company: </Text>
            <Text style={styles.companyName}>
              {userCompanyDetails.full_name}
            </Text>
          </View>
          <View style={styles.emailWrap}>
            <EmailIcon width={17} height={17} fill={theme.text_2} />
            <Text style={styles.emailText}>{loggedInUser.email}</Text>
          </View>
        </View>
        <View
          style={{ width: '90%', alignSelf: 'center', paddingVertical: 10 }}
        >
          {PROFILE_MENUS.map((item) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => onPressMenu(item.key)}
              style={styles.listItem}
              testID="ChangeLanguageTouch"
            >
              <View style={styles.listItemRightIcon}>
                <Text style={styles.listItemLeft}>{I18n.t(item.title)}</Text>
              </View>
              <View style={styles.listItemRightIcon}>
                {item.rightArrow && (
                  <Icon name="right-arrow" size={20} color="#5691AE" />
                )}
              </View>
            </TouchableOpacity>
          ))}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/images/fairfood_logo.png')}
              style={styles.logo}
            />
            <Text style={styles.versionText}>
              {`Version: ${api.APP_ENV} v${DeviceInfo.getVersion()}`}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TransparentButton
          buttonText={I18n.t('logout')}
          onPress={() => logoutCurrentUser()}
          color="#EA2553"
          padding={7}
          extraStyle={{ width: '90%' }}
        />
      </View>

      {logoutModal && (
        <CommonAlert
          title={I18n.t('logout')}
          visible={logoutModal}
          data={pendingSync}
          infoText={pendingSync.length > 0 ? I18n.t('un_synched_data') : null}
          message={
            pendingSync.length > 0
              ? `${I18n.t('found_un_synced_data')}`
              : I18n.t('are_you_sure_logout')
          }
          submitText={I18n.t('logout')}
          icon={<LogoutIcon width={width * 0.27} height={width * 0.27} />}
          onSubmit={() => logout()}
          onCancel={() => setLogoutModal(false)}
        />
      )}
    </View>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      height: '100%',
      backgroundColor: theme.background_1,
    },
    subContainer: {
      flex: 1,
    },
    logoContainer: {
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      marginTop: 5,
    },
    versionText: {
      fontSize: 12,
      fontFamily: theme.font_regular,
      lineHeight: 28,
      paddingBottom: 10,
      textAlign: 'left',
      marginRight: 30,
      color: theme.text_1,
      opacity: 0.7,
    },
    firstSectionWrap: {
      backgroundColor: theme.background_2,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: height * 0.045,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    nameText: {
      color: theme.text_1,
      fontFamily: theme.font_bold,
      fontSize: width * 0.05,
      marginTop: 15,
    },
    companyWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 7,
    },
    emailWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 7,
    },
    companyText: {
      color: theme.text_2,
      fontSize: width * 0.04,
      fontFamily: theme.font_medium,
    },
    companyName: {
      color: theme.text_1,
      fontSize: width * 0.04,
      fontFamily: theme.font_medium,
    },
    emailText: {
      fontSize: width * 0.038,
      color: theme.text_2,
      fontFamily: theme.font_regular,
      marginLeft: 5,
    },
    listItem: {
      width: '100%',
      height: 40,
      justifyContent: 'space-between',
      alignContent: 'space-between',
      flexDirection: 'row',
      marginVertical: 5,
    },
    listItemLeft: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 16,
      letterSpacing: 0.15,
    },
    listItemRightIcon: {
      flexDirection: 'row',
      alignSelf: 'center',
    },
    headerContainer: {
      alignItems: 'flex-start',
      marginTop: 15,
    },
    headerContainerSub: {
      alignContent: 'space-around',
      flexDirection: 'row',
    },
    leftIconsWrap: {
      flexDirection: 'row',
      marginTop: 10,
    },
    editProfileWrap: {
      flex: 1,
      flexDirection: 'row',
      alignContent: 'flex-end',
      justifyContent: 'flex-end',
    },
    proPic: {
      width: 90,
      height: 90,
      borderRadius: 90 / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    footer: {
      marginBottom: 20,
      justifyContent: 'flex-end',
    },
    logo: {
      height: 25,
      width: width * 0.35,
      resizeMode: 'contain',
    },
    rightTextStyle: {
      color: theme.text_2,
      fontSize: 14,
      paddingHorizontal: 20,
      fontStyle: 'normal',
      fontFamily: theme.font_regular,
    },
    avatarNameStyle: {
      color: '#ffffff',
      fontSize: 22,
      fontFamily: theme.font_bold,
    },
  });
};

export default ProfileScreen;

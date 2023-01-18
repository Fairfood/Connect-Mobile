import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Image,
  ToastAndroid,
  Linking,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { logoutUser } from '../../redux/LoginStore';
import {
  newFarmersCount,
  updatedFarmersCount,
} from '../../services/farmersHelper';
import { newTransactionsCount } from '../../services/transactionsHelper';
import { LogoutIcon } from '../../assets/svg';
import CustomLeftHeader from '../../components/CustomLeftHeader';
import TransparentButton from '../../components/TransparentButton';
import CommonAlert from '../../components/CommonAlert';
import I18n from '../../i18n/i18n';
import Icon from '../../icons';
import api from '../../api/config';
import Avatar from '../../components/Avatar';
import * as consts from '../../services/constants';

const { width } = Dimensions.get('window');
const Languages = { 'en-GB': 'English', 'id-ID': 'Indonesian' };

const ProfileScreen = ({ navigation }) => {
  const { loggedInUser } = useSelector((state) => state.login);
  const { isConnected } = useSelector((state) => state.connection);
  const [appLanguage, setAppLanguage] = useState(null);
  const [pendingSync, setPendingSync] = useState([]);
  const [logoutModal, setLogoutModal] = useState(false);
  const dispatch = useDispatch();
  const isFocused = useIsFocused();

  useEffect(() => {
    setupInitialValues();
  }, [isFocused]);

  const setupInitialValues = async () => {
    const language = await AsyncStorage.getItem('app_language');
    setAppLanguage(Languages[language]);
  };

  const logoutCurrentUser = async () => {
    const newFarmers = await newFarmersCount();
    const modifiedFarmers = await updatedFarmersCount();
    const newTransactions = await newTransactionsCount();
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

  const logout = async () => {
    dispatch(logoutUser());
  };

  const onPressRight = () => {
    if (isConnected) {
      navigation.navigate('EditProfile');
    } else {
      ToastAndroid.show(
        I18n.t('no_active_internet_connection_to_update_profile'),
        ToastAndroid.SHORT,
      );
    }
  };

  const onPressMenu = (key) => {
    switch (key) {
      case 'language':
        navigation.navigate('ChangeLanguage');
        break;
      case 'privacy_statement':
        Linking.openURL('https://fairfood.nl/en/privacy-statement/');
        break;
      case 'terms_&_conditions':
        Linking.openURL('https://fairfood.nl/en/terms-and-conditions/');
        break;
      case 'contact_us':
        Linking.openURL('https://fairfood.nl/en/contact');
        break;
      case 'help':
        navigation.navigate('HelpTutorialScreen');
        break;
      case 'settings':
        navigation.navigate('Settings');
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <CustomLeftHeader
          backgroundColor={consts.APP_BG_COLOR}
          title={I18n.t('account')}
          leftIcon='arrow-left'
          onPress={() => navigation.goBack(null)}
          rightText={I18n.t('edit_profile')}
          rightTextColor={isConnected ? '#EA2553' : '#808080'}
          onPressRight={() => onPressRight()}
        />
        <View style={styles.firstSectionWrap}>
          <View style={styles.firstSectionSubWrap}>
            <Avatar
              image={loggedInUser.image}
              containerStyle={styles.propic}
              avatarBgColor={consts.AVATAR_BG_COLORS[0]}
              avatarName={`${loggedInUser.first_name} ${loggedInUser.last_name}`}
              avatarNameStyle={styles.avatarNameStyle}
            />
            <View style={{ marginLeft: 15 }}>
              <Text style={styles.nameText}>
                {`${loggedInUser.first_name} ${loggedInUser.last_name}`}
              </Text>
              <Text style={styles.phoneText}>
                {`${loggedInUser.phone.dial_code} ${loggedInUser.phone.phone}`}
              </Text>
            </View>
          </View>
          <View style={styles.horizontalLine} />
        </View>

        {consts.PROFILE_MENUS.map((item) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => onPressMenu(item.key)}
            style={styles.listItem}
            testID='ChangeLanguageTouch'
          >
            <View style={styles.listItemRightIcon}>
              <Text style={styles.listItemLeft}>{I18n.t(item.title)}</Text>
            </View>
            <View style={styles.listItemRightIcon}>
              {item.key === 'language' && (
                <Text style={styles.rightTextStyle}>{appLanguage}</Text>
              )}
              {item.rightArrow && (
                <Icon name='right-arrow' size={20} color='#5691AE' />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.footer}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/fairfood_logo.png')}
            style={styles.logo}
          />
          <Text style={styles.versionText}>
            {`Version: ${api.APP_ENV} v${DeviceInfo.getVersion()}`}
          </Text>
        </View>
        <TransparentButton
          buttonText={I18n.t('logout')}
          onPress={() => logoutCurrentUser()}
          color='#EA2553'
          padding={7}
          extraStyle={{ width: '100%' }}
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
              ? `${I18n.t('found_unsynced_data')}`
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

const styles = StyleSheet.create({
  container: {
    height: '100%',
    backgroundColor: consts.APP_BG_COLOR,
    paddingHorizontal: width * 0.05,
  },
  logoContainer: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  versionText: {
    fontSize: 12,
    fontFamily: consts.FONT_REGULAR,
    lineHeight: 28,
    paddingBottom: 10,
    textAlign: 'left',
    marginRight: 30,
    color: consts.TEXT_PRIMARY_COLOR,
    opacity: 0.7,
  },
  firstSectionWrap: {
    marginVertical: 20,
  },
  firstSectionSubWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameText: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: '500',
    fontFamily: consts.FONT_MEDIUM,
    fontStyle: 'normal',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.3,
    marginVertical: 5,
  },
  phoneText: {
    fontSize: 14,
    marginBottom: 10,
    color: consts.TEXT_PRIMARY_COLOR,
    marginVertical: 5,
  },
  horizontalLine: {
    borderBottomWidth: 1,
    borderColor: consts.BORDER_COLOR,
    marginTop: 20,
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
    color: consts.TEXT_PRIMARY_COLOR,
    fontWeight: '500',
    fontFamily: consts.FONT_REGULAR,
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
  propic: {
    width: 70,
    height: 70,
    borderRadius: 70 / 2,
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
    color: consts.TEXT_PRIMARY_LIGHT_COLOR,
    fontSize: 14,
    paddingHorizontal: 20,
    fontStyle: 'normal',
    fontFamily: consts.FONT_REGULAR,
  },
  avatarNameStyle: {
    color: '#ffffff',
    fontSize: 22,
    fontFamily: consts.FONT_BOLD,
  },
});

export default ProfileScreen;

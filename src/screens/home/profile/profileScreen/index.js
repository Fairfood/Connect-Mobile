/* eslint-disable no-unused-vars */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Linking,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';

import {
  EmailIcon,
  LogoutIcon,
  RightArrowIcon,
  UploadIcon,
} from '../../../../assets/svg';
import { AVATAR_BG_COLORS, PROFILE_MENUS } from '../../../../utils/constants';
import { countFarmerSyncPending } from '../../../../db/services/FarmerHelper';
import { countNewTransactions } from '../../../../db/services/TransactionsHelper';
import { userLogout } from '../../../../sync/SyncAuth';
import {
  appUpdateValidation,
  checkAppUpdateAvailable,
  getVersionText,
} from '../../../../utils/commonFunctions';
import CustomLeftHeader from '../../../../components/headers/customLeftHeader';
import TransparentButton from '../../../../components/buttons/transparentButton';
import CommonAlert from '../../../../components/modals/commonAlert';
import I18n from '../../../../translations/text/i18n';
import api from '../../../../api/config';
import Avatar from '../../../../components/avatar';
import { changeAppUpdateClicked } from '../../../../redux/CommonStore';
import StyleSheetFactory from './styles';

const { width } = Dimensions.get('window');

const ProfileScreen = ({ navigation }) => {
  const styles = StyleSheetFactory();

  const { theme, appUpdate, appForceUpdate, appUpdateClicked } = useSelector(
    (state) => state.common,
  );
  const { loggedInUser, userCompanyDetails } = useSelector(
    (state) => state.login,
  );

  const { isConnected } = useSelector((state) => state.connection);
  const [pendingSync, setPendingSync] = useState([]);
  const [logoutLoading, setLoading] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [updateModal, setUpdateModal] = useState(false);
  const dispatch = useDispatch();

  useFocusEffect(
    useCallback(() => {
      if (appUpdateClicked) {
        checkAppUpdateAvailable();
      }
      return () => {};
    }, []),
  );

  /**
   * managing operations based on settings options
   * @param {string} key selected settings option key
   */
  const onPressMenu = (key) => {
    switch (key) {
      case 'update':
        checkUpdate();
        break;
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

  /**
   * calculating pending sync counts on logout
   */
  const logoutCurrentUser = async () => {
    const farmerPending = await countFarmerSyncPending();
    const newTransactions = await countNewTransactions();
    const arr = [];

    if (farmerPending > 0) {
      const obj = {
        field: I18n.t('farmers'),
        value: farmerPending,
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

    setPendingSync((pendingSync) => arr);
    setLogoutModal(true);
  };

  /**
   * logging out user on confirm logout
   */
  const logout = async () => {
    setLoading(true);
    userLogout();
  };

  /**
   * navigation to edit profile page
   */
  const editProfile = async () => {
    const valid = await appUpdateValidation();
    if (valid) {
      if (isConnected) {
        navigation.navigate('EditProfile');
      } else {
        Toast.show({
          type: 'error',
          text1: I18n.t('connection_error'),
          text2: I18n.t('no_active_internet_connection_to_update_profile'),
        });
      }
    }
  };

  const checkUpdate = async () => {
    if (!appUpdate) {
      await checkAppUpdateAvailable();
    }
    setUpdateModal(true);
  };

  const update = () => {
    dispatch(changeAppUpdateClicked(true));
    Linking.openURL(api.GOOGLE_PLAY_STORE_URL);
  };

  return (
    <View style={styles.container}>
      <CustomLeftHeader
        title={I18n.t('account')}
        onPress={() => navigation.goBack(null)}
        rightText={I18n.t('edit_profile')}
        rightTextColor={isConnected ? '#EA2553' : '#808080'}
        onPressRight={editProfile}
        extraStyle={{ paddingLeft: 20, backgroundColor: theme.background_2 }}
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
            <Text style={styles.companyText}>{`${I18n.t('company')}: `}</Text>
            <Text style={styles.companyName}>{userCompanyDetails.name}</Text>
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
                {item.key === 'update' && appUpdate && (
                  <View style={styles.updateIndication} />
                )}
              </View>
              <View style={styles.listItemRightIcon}>
                {item.rightArrow && (
                  <RightArrowIcon stroke={theme.background_3} />
                )}
              </View>
            </TouchableOpacity>
          ))}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../../assets/images/fairfood_logo.png')}
              style={styles.logo}
            />
            <Text style={styles.versionText}>{getVersionText()}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TransparentButton
          buttonText={I18n.t('logout')}
          onPress={logoutCurrentUser}
          color="#EA2553"
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
          onSubmit={logout}
          onCancel={!logoutLoading ? () => setLogoutModal(false) : null}
          isLoading={logoutLoading}
          disabled={logoutLoading}
        />
      )}

      {updateModal && (
        <CommonAlert
          title={
            appUpdate
              ? appForceUpdate
                ? I18n.t('app_update_require')
                : I18n.t('update_available')
              : I18n.t('already_up_to_date')
          }
          visible={updateModal}
          message={
            !appUpdate
              ? I18n.t('already_up_to_date_msg')
              : appForceUpdate > 0
              ? I18n.t('app_force_update_msg')
              : I18n.t('app_update_msg')
          }
          submitText={appUpdate ? I18n.t('update') : I18n.t('ok')}
          icon={<UploadIcon width={width * 0.3} height={width * 0.3} />}
          onSubmit={appUpdate ? () => update() : () => setUpdateModal(false)}
          onCancel={
            appForceUpdate || !appUpdate ? null : () => setUpdateModal(false)
          }
          onRequestClose={
            appForceUpdate || !appUpdate ? null : () => setUpdateModal(false)
          }
        />
      )}
    </View>
  );
};

export default ProfileScreen;

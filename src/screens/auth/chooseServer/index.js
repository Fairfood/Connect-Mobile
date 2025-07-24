import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Linking,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  signOutUser,
  SyncProcessComplete,
  updateForceLogin,
  updateLoginLoadingStatus,
} from '../../../redux/LoginStore';
import {
  checkAppUpdateAvailable,
  getQueryParam,
  getVersionText,
  handleErrors,
  manageUserDatabase,
} from '../../../utils/commonFunctions';
import { UploadIcon } from '../../../assets/svg';
import { changeAppUpdateClicked } from '../../../redux/CommonStore';
import {
  AddServerModal,
  ServerInputField,
  ServerList,
} from '../../../components/serverSwitch';
import I18n from '../../../translations/text/i18n';
import CommonAlert from '../../../components/modals/commonAlert';
import StyleSheetFactory from './styles';
import { AUTH_PASSWORD_GRANT, AUTH_EXTERNAL } from '../../../utils/constants';
import {
  authenticateSSOUser,
  deviceRegistration,
  fetchUserDetails,
  getSSOToken,
  serverHandshake,
} from '../../../sync/SyncAuth';
import ForceLoginModal from '../../../components/modals/forceLoginModal';
import LoginButton from '../../../components/buttons/loginButton';

const { width, height } = Dimensions.get('window');

const ChooseServerScreen = ({ navigation }) => {
  const scrollRef = useRef(null);
  const appLinkRef = useRef(null);
  const { isLoggedIn, loginLoadingText, loginButtonLoading } = useSelector(
    (state) => state.login,
  );
  const { isConnected, apiConfig, servers } = useSelector(
    (state) => state.connection,
  );
  const { appUpdate, appForceUpdate, appUpdateClicked } = useSelector(
    (state) => state.common,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState(null);
  const [updateModal, setUpdateModal] = useState(false);
  const [serverModal, setServerModal] = useState(false);
  const [showServerList, setShowServerList] = useState(false);
  const [currentApiConfig, setCurrentApiConfig] = useState(apiConfig);
  const [currentConfigIndex, setCurrentConfigIndex] = useState(0);
  const [token, setToken] = useState({});
  const [forceLoginModal, setForceLoginModal] = useState(false);
  const dispatch = useDispatch();
  const styles = StyleSheetFactory();

  useFocusEffect(
    useCallback(() => {
      setErrorText(null);

      // incase of logout while syncing, process need to be completed for next syncing
      dispatch(SyncProcessComplete());
      return () => {};
    }, []),
  );

  useFocusEffect(
    React.useCallback(() => {
      async function handleButtonLoading() {
        if (loginLoadingText == 'redirecting') {
          setTimeout(() => {
            dispatch(updateLoginLoadingStatus(true, 'loading'));
          }, 5000);
        } else if (loginLoadingText == 'loading') {
          setTimeout(() => {
            if (loginLoadingText == 'loading') {
              dispatch(updateLoginLoadingStatus(false, 'continue'));
            }
          }, 3000);
        }
      }

      handleButtonLoading();

    }, [loginLoadingText]),
  );

  useFocusEffect(
    useCallback(() => {
      if (appUpdateClicked) {
        checkAppUpdateAvailable();
      }

      // Handle the initial deep link if the app was opened by one
      Linking.getInitialURL().then(async (url) => {
        if (url && !appLinkRef.current) {
          appLinkRef.current = true;
          dispatch(updateLoginLoadingStatus(true, 'validating_url'));
          handleIncomingUrl(url);
        }
      });

      // Listen for incoming deep links while the app is running
      const subscription = Linking.addListener('url', async (event) => {
        if (event?.url && !appLinkRef.current) {
          appLinkRef.current = true;
          dispatch(updateLoginLoadingStatus(true, 'validating_url'));
          handleIncomingUrl(event.url);
        }
      });

      // Cleanup the event listener on component unmount
      return () => {
        appLinkRef.current = null;
        subscription.remove();
      };
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      const indexOfObj = servers.findIndex(
        (x) => x.API_BASE_URL === apiConfig.API_BASE_URL,
      );
      setCurrentApiConfig(apiConfig);
      setCurrentConfigIndex(indexOfObj);
      if (apiConfig.APP_ENVIRONMENT === 'production') {
        setUpdateModal(appUpdate || false);
      }
      return () => {};
    }, [appUpdate, apiConfig]),
  );

  const handleIncomingUrl = async (url) => {
    try {
      if (isLoggedIn) {
        dispatch(updateLoginLoadingStatus(false, 'continue'));
        return;
      }

      const code = getQueryParam(url, 'code');

      if (!code) {
        setErrorText('No access found for this application, try again.');
        dispatch(updateLoginLoadingStatus(false, 'continue'));
        return;
      }

      const [response] = await getSSOToken(code);

      if (!response) {
        setErrorText(I18n.t('something_went_wrong'));
        dispatch(updateLoginLoadingStatus(false, 'continue'));
        return;
      }

      setErrorText(null);
      setToken(response);
      registerDevice(response, false);
    } catch (err) {
      handleErrors(err, {
        ref: 'ChooseServerScreen_validateServer',
      });
      dispatch(updateLoginLoadingStatus(false, 'continue'));
    }
  };

  /**
   * server validation
   */
  const validateServer = async () => {
    try {
      dispatch(updateLoginLoadingStatus(true, 'validating_server'));
      appLinkRef.current = null;

      if (!isConnected) {
        setErrorText(I18n.t('not_connected_to_the_internet'));
        dispatch(updateLoginLoadingStatus(false, 'continue'));
        return;
      }

      setErrorText(null);
      const [response, error] = await serverHandshake();

      if (response) {
        const authType = response?.authentication_method?.auth_type ?? null;

        if (authType === AUTH_EXTERNAL) {
          await AsyncStorage.setItem('sso', JSON.stringify(response));
          dispatch(updateLoginLoadingStatus(true, 'redirecting'));
          authenticateSSOUser(response);
        } else if (authType === AUTH_PASSWORD_GRANT) {
          await AsyncStorage.removeItem('sso');
          dispatch(updateLoginLoadingStatus(true, 'redirecting'));
          navigation.navigate('Login');
        } else {
          setErrorText(I18n.t('something_went_wrong'));
          dispatch(updateLoginLoadingStatus(false, 'continue'));
          throw new Error('Invalid auth_type');
        }
      } else {
        setErrorText(error);
        dispatch(updateLoginLoadingStatus(false, 'continue'));
      }
    } catch (err) {
      handleErrors(err, {
        ref: 'ChooseServerScreen_validateServer',
      });
      dispatch(updateLoginLoadingStatus(false, 'continue'));
    }
  };

  const registerDevice = async (tokenData, forceLogout) => {
    dispatch(updateLoginLoadingStatus(true, 'registering_device'));
    const [response, error] = await deviceRegistration(tokenData, forceLogout);

    if (response) {
      manageUser(response, tokenData);
      return;
    }

    if (error.includes('User is already logged in another device')) {
      setForceLoginModal(true);
      dispatch(updateLoginLoadingStatus(false, 'continue'));
      return;
    }

    setErrorText(error);
  };

  const manageUser = async (response, tokenData) => {
    await manageUserDatabase(response);
    const updatedObj = { ...response, ...tokenData };

    dispatch(updateLoginLoadingStatus(true, 'fetching_details'));
    const [res, err] = await fetchUserDetails(updatedObj);
    if (!res) {
      setErrorText(err);
      dispatch(updateLoginLoadingStatus(false, 'continue'));
    }
  };

  const onCancelLogoutModal = async () => {
    dispatch(signOutUser());
    dispatch(updateForceLogin());
    setForceLoginModal(false);
  };

  const update = () => {
    dispatch(changeAppUpdateClicked(true));
    Linking.openURL(apiConfig.GOOGLE_PLAY_STORE_URL);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setErrorText(null);
    dispatch(updateLoginLoadingStatus(false, 'continue'));
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.linearGradient}>
        <Image
          source={require('../../../assets/images/lines.png')}
          resizeMode="stretch"
          style={styles.lines}
        />
      </View>
      <ScrollView
        contentContainerStyle={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        testID="scroll-view"
      >
        <View style={styles.scrollViewWrap}>
          <View style={styles.logoContainer}>
            <View style={styles.logoWrap}>
              <Image
                source={require('../../../assets/images/fairfood_logo.png')}
                style={styles.logo}
                testID="logo"
              />
            </View>
            <Text style={styles.versionText} testID="version-text">
              {getVersionText()}
            </Text>
          </View>

          <Text style={styles.loginMsg} testID="action-text">
            Hey,
          </Text>
          <Text style={styles.loginMsg} testID="action-text">
            Want to change the server?
          </Text>
          <Text style={styles.loginMsg2} testID="action-text">
            Select from available servers or add new ones to the list.
          </Text>

          <View style={{ marginTop: height * 0.035 }}>
            <ServerInputField
              apiConfig={currentApiConfig}
              currentConfigIndex={currentConfigIndex}
              onPress={() => setShowServerList(!showServerList)}
              testID="server-input"
            />
            {showServerList && (
              <ServerList
                onAddServer={() => setServerModal(true)}
                onSelectServer={() => setShowServerList(false)}
                testID="server-dropdown"
              />
            )}
          </View>

          <View style={[styles.bottomWrap, { marginTop: 'auto' }]}>
            {errorText && (
              <Text style={styles.errorMsg} testID="error-text">
                {errorText}
              </Text>
            )}

            <LoginButton
              testID="submit-button"
              onPress={validateServer}
              loginLoadingText={loginLoadingText}
              loginButtonLoading={loginButtonLoading}
            />
          </View>
        </View>
      </ScrollView>

      {updateModal && (
        <CommonAlert
          title={
            appForceUpdate
              ? I18n.t('app_update_require')
              : I18n.t('update_available')
          }
          visible={updateModal}
          message={
            appForceUpdate
              ? I18n.t('app_force_update_msg')
              : I18n.t('app_update_msg')
          }
          submitText={I18n.t('update')}
          icon={<UploadIcon width={width * 0.3} height={width * 0.3} />}
          onSubmit={update}
          onCancel={appForceUpdate ? null : () => setUpdateModal(false)}
          onRequestClose={appForceUpdate ? null : () => setUpdateModal(false)}
        />
      )}

      {serverModal && (
        <AddServerModal
          visible={serverModal}
          onSubmit={() => setServerModal(false)}
          onCancel={() => setServerModal(false)}
          hideModal={() => setServerModal(false)}
        />
      )}

      {forceLoginModal && (
        <ForceLoginModal
          OpenModal={forceLoginModal}
          onNext={() => registerDevice(token, true)}
          onCancel={onCancelLogoutModal}
        />
      )}
    </SafeAreaView>
  );
};

export default ChooseServerScreen;

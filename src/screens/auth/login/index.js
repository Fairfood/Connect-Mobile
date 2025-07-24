import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  SafeAreaView,
  Keyboard,
  Dimensions,
  ScrollView,
  Linking,
  RefreshControl,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import {
  updateForceLogin,
  SyncProcessComplete,
  signOutUser,
} from '../../../redux/LoginStore';
import {
  checkAppUpdateAvailable,
  getVersionText,
  handleErrors,
} from '../../../utils/commonFunctions';
import { UploadIcon } from '../../../assets/svg';
import { changeAppUpdateClicked } from '../../../redux/CommonStore';
import {
  fetchUserDetails,
  userLogin,
  userLogout,
} from '../../../sync/SyncAuth';
import FormTextInput from '../../../components/inputs/formTextInput';
import I18n from '../../../translations/text/i18n';
import CustomButton from '../../../components/buttons/customButton';
import CommonAlert from '../../../components/modals/commonAlert';
import ForceLoginModal from '../../../components/modals/forceLoginModal';
import StyleSheetFactory from './styles';
import { validateLoginForm } from './controller';

const { width } = Dimensions.get('window');

const LoginScreen = () => {
  const passwordRef = useRef(null);
  const scrollRef = useRef(null);
  const { isConnected, apiConfig } = useSelector((state) => state.connection);
  const { theme, appUpdate, appForceUpdate, appUpdateClicked } = useSelector(
    (state) => state.common,
  );
  const [buttonLoading, setButtonLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorText, setErrorText] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [forceLoginModal, setForceLoginModal] = useState(false);
  const [updateModal, setUpdateModal] = useState(false);
  const dispatch = useDispatch();
  const styles = StyleSheetFactory();

  useEffect(() => {
    setButtonLoading(false);
    setErrorText(null);

    // incase of logout while syncing, process need to be completed for next syncing
    dispatch(SyncProcessComplete());
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (appUpdateClicked) {
        checkAppUpdateAvailable();
      }
      return () => {};
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      if (apiConfig.APP_ENVIRONMENT === 'production') {
        setUpdateModal(appUpdate || false);
      }
      return () => {};
    }, [appUpdate, apiConfig]),
  );

  /**
   * submit function
   */
  const handleSubmit = async () => {
    Keyboard.dismiss();
    setErrorText(null);
    validateSignIn();
  };

  const validateSignIn = async () => {
    try {
      setButtonLoading(true);

      const userEmail = email.toLowerCase().trim();
      const userPassword = password.trim();

      const [isValid, formError] = await validateLoginForm(
        userEmail,
        userPassword,
      );

      if (!isValid) {
        setErrorText(formError);
        setButtonLoading(false);
        return;
      }

      if (!isConnected) {
        setErrorText(I18n.t('not_connected_to_the_internet'));
        setButtonLoading(false);
        return;
      }

      const [user, err] = await userLogin(userEmail, userPassword, false);
      if (!user) {
        setErrorText(err);
        setButtonLoading(false);
        return;
      }

      if (!user?.is_granted) {
        setForceLoginModal(true);
        setButtonLoading(false);
      } else {
        onNext(user);
      }
    } catch (error) {
      setButtonLoading(false);
      handleErrors(error, {
        ref: 'LoginScreen_validateSignIn',
      });
    }
  };

  const onNext = async (user = null) => {
    try {
      let currentUser = user;
      let err = null;

      if (!currentUser) {
        const userEmail = email.toLowerCase().trim();
        const userPassword = password.trim();

        [currentUser, err] = await userLogin(userEmail, userPassword, true);

        if (!currentUser) {
          setButtonLoading(false);
          setErrorText(err);
          return;
        }
      }

      if (!currentUser?.is_granted) {
        userLogout(currentUser);
        setButtonLoading(false);
      } else {
        const [response, err] = await fetchUserDetails(currentUser);
        if (!response) {
          setErrorText(err);
          setButtonLoading(false);
        }
      }
    } catch (error) {
      setButtonLoading(false);
      handleErrors(error, {
        ref: 'LoginScreen_onNext',
      });
    }
  };

  const update = () => {
    dispatch(changeAppUpdateClicked(true));
    Linking.openURL(apiConfig.GOOGLE_PLAY_STORE_URL);
  };

  const onCancel = async () => {
    dispatch(signOutUser());
    dispatch(updateForceLogin());
    setForceLoginModal(false);
  };

  const onSubmittingEmail = () => {
    if (passwordRef?.current) {
      passwordRef.current.focus();
    } else {
      Keyboard.dismiss();
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setEmail('');
    setPassword('');
    setErrorText(null);
    setRefreshing(false);
    setButtonLoading(false);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.linearGradient}>
          <View style={styles.linesWrap}>
            <Image
              source={require('../../../assets/images/lines.png')}
              resizeMode="stretch"
              style={{ width }}
            />
          </View>
        </View>
        <ScrollView
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
              {I18n.t('log_in_using_your_trace_email')}
            </Text>

            <FormTextInput
              placeholder={I18n.t('email_id')}
              value={email}
              onChangeText={(text) => setEmail(text)}
              color={theme.text_1}
              returnKeyType="next"
              onSubmitEditing={onSubmittingEmail}
              blurOnSubmit={false}
              extraStyle={{ width: '100%' }}
              testID="email-input"
            />

            <FormTextInput
              inputRef={passwordRef}
              placeholder={I18n.t('password')}
              value={password}
              onChangeText={(text) => setPassword(text)}
              color={theme.text_1}
              showEye
              showPasswords={() => setShowPassword(!showPassword)}
              secureTextEntry={!showPassword}
              onFocus={() => scrollRef.current.scrollToEnd({ animated: true })}
              extraStyle={{ width: '100%' }}
              testID="password-input"
            />

            <View style={styles.bottomWrap}>
              {errorText && !buttonLoading && (
                <View style={styles.errorWrap}>
                  <Text style={styles.errorMsg} testID="error-text">
                    {errorText}
                  </Text>
                </View>
              )}

              <CustomButton
                testID="login-button"
                buttonText={I18n.t('login')}
                isLoading={buttonLoading}
                disabled={buttonLoading}
                onPress={handleSubmit}
                extraStyle={{ width: '100%', marginBottom: 15 }}
              />
            </View>
          </View>
        </ScrollView>
      </View>

      {forceLoginModal && (
        <ForceLoginModal
          OpenModal={forceLoginModal}
          onNext={() => onNext()}
          onCancel={onCancel}
        />
      )}

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
    </SafeAreaView>
  );
};

export default LoginScreen;

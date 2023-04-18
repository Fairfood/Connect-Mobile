/* eslint-disable no-control-regex */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  Keyboard,
  Dimensions,
  ScrollView,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import DeviceInfo from 'react-native-device-info';
import {
  loginSelector,
  signInFailure,
  loginUser,
  clearError,
  logoutUser,
  updateForceLogin,
  getUserDetails,
  SyncProcessComplete,
  signOutUser,
} from '../../redux/LoginStore';
import {
  checkEmojis,
  removeLocalStorage,
} from '../../services/commonFunctions';
import FormTextInput from '../../components/FormTextInput';
import I18n from '../../i18n/i18n';
import TransparentButton from '../../components/TransparentButton';
import CustomButton from '../../components/CustomButton';
import api from '../../api/config';
import * as consts from '../../services/constants';

const { height, width } = Dimensions.get('window');
const emailRegex =
  /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;

const LoginScreen = () => {
  const passwordRef = useRef(null);
  const scrollRef = useRef(null);
  const { isConnected } = useSelector((state) => state.connection);
  const { syncInProgress } = useSelector((state) => state.login);
  const { loginLoading, loginError } = useSelector(loginSelector);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [onModalOpen, setModalOpen] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(clearError(''));

    // incase of logout while syncing, process need to be completed for next syncing
    dispatch(SyncProcessComplete());
  }, []);

  const validateSignIn = async () => {
    // incase of logout while syncing, process need to be completed for next syncing
    if (syncInProgress) {
      dispatch(SyncProcessComplete());
    }

    if (!isConnected) {
      dispatch(signInFailure(I18n.t('not_connected_to_the_internet')));
      return;
    }

    const userEmail = email.toLowerCase().trim();
    const userPassword = password.trim();

    if (!userEmail || !userPassword) {
      dispatch(signInFailure(I18n.t('email_and_password_are_mandatory')));
      return;
    }

    // checking emoji in fields
    const emojiFields = [
      { name: I18n.t('email_id'), value: userEmail },
      { name: I18n.t('password'), value: userPassword },
    ];

    const [emojiValid, emojiError] = await checkEmojis(emojiFields);
    if (!emojiValid) {
      dispatch(signInFailure(emojiError));
      return;
    }

    if (!emailRegex.test(userEmail)) {
      dispatch(signInFailure(I18n.t('enter_a_valid_email')));
      return;
    }

    const user = await dispatch(loginUser(userEmail, userPassword, false));

    if (!user) {
      return;
    }

    if (!user?.is_granted) {
      setModalOpen(true);
    } else {
      onNext(user);
    }
  };

  const onNext = async (user) => {
    let currentUser = null;
    if (user) {
      currentUser = user;
    } else {
      const userEmail = email.toLowerCase().trim();
      const userPassword = password.trim();

      currentUser = await dispatch(loginUser(userEmail, userPassword, true));

      if (!currentUser) {
        return;
      }
    }

    const deviceId = currentUser?.last_active_device?.device_id ?? null;

    currentUser = { ...currentUser, device_id: deviceId };
    if (!currentUser?.is_granted) {
      dispatch(logoutUser(currentUser));
    } else {
      dispatch(getUserDetails(currentUser));
    }
  };

  const onCancel = async () => {
    removeLocalStorage();
    dispatch(signOutUser());
    dispatch(updateForceLogin());
    setModalOpen(false);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.linearGradient}>
          <View style={styles.linesWrap}>
            <Image
              source={require('../../assets/images/lines.png')}
              resizeMode='stretch'
              style={{ width }}
            />
          </View>
        </View>
        <ScrollView
          keyboardShouldPersistTaps='handled'
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.scrollViewWrap}>
            <View style={styles.logoContainer}>
              <View style={styles.logoWrap}>
                <Image
                  source={require('../../assets/images/fairfood_logo.png')}
                  style={styles.logo}
                />
              </View>
              <Text style={styles.versionText}>
                {`Version: ${api.APP_ENV} v${DeviceInfo.getVersion()}`}
              </Text>
            </View>

            <Text style={styles.loginMsg}>
              {I18n.t('log_in_using_your_trace_email')}
            </Text>

            <FormTextInput
              placeholder={I18n.t('email_id')}
              value={email}
              onChangeText={(text) => setEmail(text)}
              color={consts.TEXT_PRIMARY_COLOR}
              returnKeyType='next'
              onSubmitEditing={() => passwordRef.current.focus()}
              blurOnSubmit={false}
              extraStyle={{ width: '100%' }}
            />

            <FormTextInput
              inputRef={passwordRef}
              placeholder={I18n.t('password')}
              value={password}
              onChangeText={(text) => setPassword(text)}
              showEye
              showPassword={() => setShowPassword(!showPassword)}
              secureTextEntry={!showPassword}
              onFocus={() => {
                scrollRef.current.scrollToEnd({ animated: true });
              }}
              extraStyle={{ width: '100%' }}
            />

            <Text style={styles.forgotPassword}>
              {I18n.t('forgot_password')}
            </Text>

            <View
              style={{ justifyContent: 'flex-end', marginTop: height * 0.04 }}
            >
              {loginError?.error && !loginLoading && (
                <View style={styles.errorWrap}>
                  <Text style={styles.errorMsg}>{loginError.message}</Text>
                </View>
              )}

              <CustomButton
                buttonText={I18n.t('login')}
                isLoading={loginLoading}
                onPress={() => {
                  Keyboard.dismiss();
                  dispatch(clearError(''));
                  validateSignIn();
                }}
                extraStyle={{ width: '100%', marginBottom: 15 }}
              />
            </View>
          </View>
        </ScrollView>
      </View>

      <ForceLoginModal
        OpenModal={onModalOpen}
        onNext={() => onNext()}
        onCancel={() => onCancel()}
      />
    </SafeAreaView>
  );
};

const ForceLoginModal = ({ OpenModal, onNext, onCancel }) => {
  return (
    <Modal
      animationType='slide'
      transparent
      visible={OpenModal}
      onRequestClose={() => {}}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalInnerWrap}>
          <Text style={styles.alreadtActiveText}>
            {I18n.t('already_active_device')}
          </Text>

          <Text style={styles.continueText}>{I18n.t('on_click_continue')}</Text>

          <View style={styles.buttonWrap}>
            <TransparentButton
              buttonText={I18n.t('cancel')}
              onPress={() => onCancel()}
              color='#EA2553'
              paddingHorizontal={45}
            />

            <TouchableOpacity
              onPress={() => onNext()}
              style={styles.buttonContainer}
            >
              <Text style={styles.buttonText}>{I18n.t('continue')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    flexGrow: 1,
    flex: 1,
  },
  forgotPassword: {
    fontSize: 13,
    fontFamily: consts.FONT_REGULAR,
    lineHeight: 28,
    paddingBottom: 10,
    textAlign: 'right',
    color: consts.TEXT_PRIMARY_COLOR,
    marginTop: height * -0.025,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.07,
    marginBottom: height * 0.035,
  },
  linearGradient: {
    height: '30%',
    backgroundColor: '#92ddf6',
    width: '100%',
    marginBottom: 20,
  },
  buttonContainer: {
    backgroundColor: consts.COLOR_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: consts.COLOR_PRIMARY,
    marginHorizontal: 25,
    flexDirection: 'row',
    zIndex: 1,
  },
  buttonText: {
    color: consts.APP_BG_COLOR,
    fontFamily: consts.FONT_REGULAR,
    paddingHorizontal: 45,
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
  },
  linesWrap: {
    position: 'absolute',
    bottom: -5,
  },
  scrollViewWrap: {
    flex: 1,
    paddingHorizontal: width * 0.06,
  },
  logoWrap: {
    height: 30,
    width: width * 0.5,
  },
  logo: {
    height: 30,
    width: width * 0.5,
    resizeMode: 'stretch',
  },
  versionText: {
    fontSize: 12,
    fontFamily: consts.FONT_REGULAR,
    lineHeight: 28,
    paddingBottom: 10,
    textAlign: 'center',
    color: consts.TEXT_PRIMARY_COLOR,
    opacity: 0.7,
  },
  loginMsg: {
    fontSize: 13,
    fontFamily: consts.FONT_REGULAR,
    lineHeight: 28,
    paddingBottom: 10,
    textAlign: 'center',
    color: consts.TEXT_PRIMARY_COLOR,
    marginRight: 0,
    marginBottom: height * 0.02,
  },
  errorMsg: {
    fontSize: 14,
    fontFamily: consts.FONT_REGULAR,
    lineHeight: 28,
    paddingBottom: 10,
    textAlign: 'center',
    color: consts.BUTTON_COLOR_PRIMARY,
  },
  errorWrap: {
    justifyContent: 'flex-start',
    marginLeft: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 58, 96, 0.2)',
  },
  modalInnerWrap: {
    marginTop: 'auto',
    backgroundColor: consts.APP_BG_COLOR,
  },
  alreadtActiveText: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 20,
    fontFamily: 'Moderat-Medium',
    margin: 25,
  },
  continueText: {
    color: consts.TEXT_PRIMARY_COLOR,
    fontSize: 14,
    fontFamily: 'Moderat-Regular',
    lineHeight: 20,
    margin: 25,
    marginTop: 0,
  },
  buttonWrap: {
    marginVertical: 25,
    marginHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
});

export default LoginScreen;

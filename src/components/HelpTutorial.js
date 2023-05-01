/* eslint-disable no-shadow */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TriangleIcon } from '../assets/svg';
import { AVATAR_BG_COLORS, HIT_SLOP_FIFTEEN } from '../services/constants';
import I18n from '../i18n/i18n';
import Icon from '../icons';
import CustomSmallButton from './CustomSmallButton';
import Avatar from './Avatar';

const { height, width } = Dimensions.get('window');
const screenCount = 4;

const HelpTutorial = ({ ...props }) => {
  const { theme } = useSelector((state) => state.common);
  const { loggedInUser } = useSelector((state) => state.login);
  const [currentScreen, setCurrentScreen] = useState(1);

  const onNext = () => {
    if (currentScreen !== screenCount) {
      setCurrentScreen((currentScreen) => currentScreen + 1);
    } else {
      completedTutorial();
    }
  };

  const onSkip = () => {
    completedTutorial();
  };

  const completedTutorial = () => {
    AsyncStorage.setItem('help_tutorial', 'true');
    props.hideModal();
  };

  const styles = StyleSheetFactory(theme);

  return (
    <Modal animationType='slide' transparent visible={props.visible}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 58, 96, 0.3)',
        }}
      >
        {currentScreen === 1 && (
          <>
            <WhiteBoxView
              boxBottom={height * 0.09}
              boxLeft={width * 0.05}
              arrowPosition='bottom'
              arrowLeft={width * 0.41}
              text1={I18n.t('farmers')}
              text2={I18n.t('tutorial_farmer_sub')}
              onSkip={() => onSkip()}
              onNext={() => onNext()}
              styles={styles}
            />
            <RoundView
              roundStyle={styles.round1}
              roundIcon={<Icon name='farmer' size={20} color='#5691AE' />}
              roundText={I18n.t('farmers')}
              theme={theme}
            />
          </>
        )}

        {currentScreen === 2 && (
          <>
            <WhiteBoxView
              boxBottom={height * 0.09}
              boxLeft={width * 0.15}
              arrowPosition='bottom'
              arrowLeft={width * 0.65}
              text1={I18n.t('transaction_list')}
              text2={I18n.t('tutorial_transaction_sub')}
              onSkip={() => onSkip()}
              onNext={() => onNext()}
              styles={styles}
            />
            <RoundView
              roundStyle={styles.round2}
              roundIcon={<Icon name='transaction' size={20} color='#5691AE' />}
              roundText={I18n.t('transactions')}
              theme={theme}
            />
          </>
        )}

        {currentScreen === 3 && (
          <>
            <WhiteBoxView
              boxTop={height * 0.1}
              boxLeft={width * 0.15}
              arrowPosition='top'
              arrowRight={5}
              text1={I18n.t('profile_and_settings')}
              text2={I18n.t('tutorial_profile_sub')}
              onSkip={() => onSkip()}
              onNext={() => onNext()}
              styles={styles}
            />
            <RoundView
              roundStyle={styles.round3}
              roundIcon={(
                <Avatar
                  image={loggedInUser.image}
                  containerStyle={styles.profileIcon}
                  avatarBgColor={AVATAR_BG_COLORS[0]}
                  avatarName={`${loggedInUser.first_name} ${loggedInUser.last_name}`}
                  avatarNameStyle={styles.avatarNameStyle}
                />
              )}
              theme={theme}
            />
          </>
        )}

        {currentScreen === 4 && (
          <>
            <WhiteBoxView
              boxTop={height * 0.1}
              boxLeft={width * 0.15}
              arrowPosition='top'
              arrowRight={45}
              text1={I18n.t('sync_status')}
              text2={I18n.t('tutorial_sync_sub')}
              onSkip={() => onSkip()}
              onNext={() => onNext()}
              styles={styles}
            />
            <RoundView
              roundStyle={styles.round4}
              roundIcon={(
                <Image
                  source={require('../assets/images/sync_success.png')}
                  style={{ width: 25, height: 25 }}
                />
              )}
              theme={theme}
            />
          </>
        )}
      </View>
    </Modal>
  );
};

const WhiteBoxView = ({ ...props }) => {
  const {
    boxBottom,
    boxTop,
    boxLeft,
    arrowPosition,
    arrowLeft,
    arrowRight,
    text1,
    text2,
    onSkip,
    onNext,
    styles,
  } = props;
  return (
    <View
      style={{
        position: 'absolute',
        bottom: boxBottom ?? null,
        top: boxTop ?? null,
        left: boxLeft,
      }}
    >
      {arrowPosition === 'top' && (
        <View style={{ height: 10 }}>
          <View style={[styles.arrowTopWrap, { right: arrowRight }]}>
            <TriangleIcon width={25} height={25} fill='#ffffff' />
          </View>
        </View>
      )}

      <View style={styles.whiteWrap}>
        <Text style={styles.text1Style}>{text1}</Text>
        <Text style={styles.text2Style}>{text2}</Text>
        <View style={styles.actionWrap}>
          {onSkip ? (
            <TouchableOpacity onPress={onSkip} hitSlop={HIT_SLOP_FIFTEEN}>
              <Text style={styles.skipText}>{I18n.t('skip_tutorial')}</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          <CustomSmallButton
            buttonText={I18n.t('next')}
            onPress={onNext}
            noMargin
          />
        </View>
      </View>

      {arrowPosition === 'bottom' && (
        <View style={{ height: 10 }}>
          <View style={[styles.arrowBottomWrap, { left: arrowLeft }]}>
            <TriangleIcon width={25} height={25} fill='#ffffff' />
          </View>
        </View>
      )}
    </View>
  );
};

const RoundView = ({ ...props }) => {
  const { roundStyle, roundIcon, roundText, theme } = props;
  return (
    <View style={roundStyle}>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {roundIcon}
        {roundText ? (
          <Text
            style={{
              color: theme.text_2,
              fontSize: 12,
              fontFamily: theme.font_regular,
            }}
          >
            {roundText}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    round1: {
      position: 'absolute',
      bottom: -20,
      left: width * 0.4,
      width: width * 0.2,
      height: 70,
      borderRadius: 40,
      backgroundColor: '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 7,
    },
    round2: {
      position: 'absolute',
      bottom: -20,
      left: width * 0.75,
      width: width * 0.2,
      height: 70,
      borderRadius: 40,
      backgroundColor: '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 7,
    },
    round3: {
      position: 'absolute',
      top: 15,
      right: 15,
      width: 45,
      height: 45,
      borderRadius: 45 / 2,
      backgroundColor: '#92DDF6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    round4: {
      position: 'absolute',
      top: 15,
      right: 55,
      width: 45,
      height: 45,
      borderRadius: 45 / 2,
      backgroundColor: '#92DDF6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    arrowTopWrap: {
      position: 'absolute',
      top: -10,
      transform: [{ rotate: '180deg' }],
    },
    arrowBottomWrap: {
      position: 'absolute',
      top: -5,
    },
    whiteWrap: {
      width: width * 0.8,
      padding: width * 0.05,
      backgroundColor: 'white',
      zIndex: 99,
    },
    text1Style: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_bold,
    },
    text2Style: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
      marginTop: 5,
    },
    actionWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 10,
    },
    skipText: {
      color: '#EA2553',
      fontSize: 15,
      fontFamily: theme.font_medium,
    },
    profileIcon: {
      width: 25,
      height: 25,
      borderRadius: 25 / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarNameStyle: {
      color: '#ffffff',
      fontSize: 11,
      fontFamily: theme.font_bold,
    },
  });
};

export default HelpTutorial;

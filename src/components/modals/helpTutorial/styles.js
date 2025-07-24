import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

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
      borderRadius: theme.border_radius,
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
      width: 30,
      height: 30,
      borderRadius: 30 / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarNameStyle: {
      color: '#ffffff',
      fontSize: 15,
      fontFamily: theme.font_bold,
    },
  });
};

export default StyleSheetFactory;

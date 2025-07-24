import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { height, width } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      backgroundColor: theme.background_1,
      flex: 1,
    },
    logoContainer: {
      marginTop: height * 0.04,
      marginBottom: height * 0.035,
    },
    linearGradient: {
      height: '27%',
      backgroundColor: '#92ddf6',
      width: '100%',
    },
    buttonText: {
      color: theme.background_1,
      fontFamily: theme.font_regular,
      paddingHorizontal: 45,
      fontSize: 16,
      lineHeight: 20,
      textAlign: 'center',
    },
    lines: {
      width,
      position: 'absolute',
      bottom: -5,
    },
    scrollViewWrap: {
      flexGrow: 1,
      paddingHorizontal: width * 0.06,
    },
    logoWrap: {
      height: 30,
      width: width * 0.5,
    },
    logo: {
      height: 22,
      width: width * 0.35,
      resizeMode: 'stretch',
    },
    versionText: {
      fontSize: 14,
      fontFamily: theme.font_regular,
      color: theme.text_1,
    },
    loginMsg: {
      fontSize: 20,
      fontFamily: theme.font_bold,
      color: theme.text_1,
    },
    loginMsg2: {
      fontSize: 15,
      fontFamily: theme.font_regular,
      color: theme.text_2,
      marginTop: 5,
    },
    errorMsg: {
      fontSize: 15,
      fontFamily: theme.font_regular,
      lineHeight: 20,
      paddingBottom: 10,
      textAlign: 'center',
      color: theme.button_bg_1,
    },
    errorWrap: {
      justifyContent: 'flex-start',
      marginLeft: 20,
    },
  });
};

export default StyleSheetFactory;

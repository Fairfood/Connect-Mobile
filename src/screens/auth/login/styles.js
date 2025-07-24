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
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: height * 0.07,
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
      fontSize: 15,
      fontFamily: theme.font_regular,
      lineHeight: 28,
      paddingBottom: 10,
      textAlign: 'center',
      color: theme.text_1,
      opacity: 0.7,
    },
    loginMsg: {
      fontSize: 15,
      fontFamily: theme.font_regular,
      lineHeight: 28,
      paddingBottom: 10,
      textAlign: 'center',
      color: theme.text_1,
      marginRight: 0,
      marginBottom: height * 0.02,
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

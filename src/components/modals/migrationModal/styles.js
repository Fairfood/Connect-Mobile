import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor: 'rgba(0, 58, 96, 0.4)',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    topSection: {
      width: '100%',
      height: height * 0.27,
      backgroundColor: '#ffffff',
    },
    imageWrap: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageWrapSub: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
    imageWrapSub2: {
      width: '70%',
      height: '70%',
      resizeMode: 'contain',
    },
    contentWrap: {
      width: '100%',
      backgroundColor: '#ffffff',
      paddingHorizontal: width * 0.06,
      paddingBottom: width * 0.06,
    },
    titleText: {
      color: theme.text_1,
      fontSize: 20,
      fontFamily: theme.font_bold,
      marginBottom: 5,
    },
    messageText1: {
      color: theme.icon_error,
      fontSize: 15,
      fontFamily: theme.font_regular,
    },
    messageText2: {
      color: theme.text_2,
      fontSize: 15,
      fontFamily: theme.font_regular,
      marginTop: height * 0.02,
    },
    messageText3: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
    },
    buttonWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: height * 0.035,
    },
    progressBarTitleWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: height * 0.035,
      marginBottom: height * 0.01,
    },
    progressBarTitle: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
    },
    progressBarPercentage: {
      color: theme.text_2,
      fontSize: 15,
      fontFamily: theme.font_regular,
    },
    subContainer: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingLeft: 5,
    },
    radioWrap: {
      width: '7%',
      justifyContent: 'center',
      position: 'absolute',
      top: 33,
      left: 0,
    },
    radio: {
      width: 12,
      height: 12,
      borderRadius: 12 / 2,
      backgroundColor: theme.radio_2,
    },
    mainContentWrap: {
      width: '90%',
      borderBottomColor: theme.border_1,
      borderBottomWidth: 1,
      paddingBottom: 10,
    },
  });
};

export default StyleSheetFactory;

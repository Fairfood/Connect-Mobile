import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'rgba(0, 58, 96, 0.4)',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    topSection: {
      width: '100%',
      height: height * 0.27,
      backgroundColor: '#ffffff',
    },
    iconWrap: {
      position: 'absolute',
      bottom: 0,
      alignSelf: 'center',
    },
    imageWrap: {
      width: '100%',
      resizeMode: 'contain',
    },
    contentWrap: {
      width: '100%',
      backgroundColor: '#ffffff',
      paddingHorizontal: width * 0.06,
      paddingBottom: width * 0.06,
    },
    fieldText: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
    },
    valueText: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_bold,
      textAlign: 'right',
    },
    infoText: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_bold,
      marginBottom: 5,
    },
    titleText: {
      color: theme.icon_error,
      fontSize: 16,
      fontFamily: theme.font_medium,
      textAlign: 'center',
      marginVertical: height * 0.03,
    },
    messageText: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
      textAlign: 'center',
      marginVertical: height * 0.03,
    },
    buttonWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dataMainWrap: {
      width: '100%',
      backgroundColor: theme.background_2,
      padding: width * 0.05,
      marginBottom: 20,
    },
    dataWrap: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 5,
    },
  });
};

export default StyleSheetFactory;

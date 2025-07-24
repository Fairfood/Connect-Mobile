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
    inputContainer: {
      width: '100%',
      alignSelf: 'center',
      borderColor: theme.placeholder,
      borderWidth: 1,
      borderRadius: theme.border_radius,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 25,
      paddingVertical: 10,
      paddingHorizontal: 5,
    },
    serverImageWrap: {
      width: height * 0.062,
      height: height * 0.062,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: (height * 0.062) / 2,
      backgroundColor: '#eee',
      marginHorizontal: 5,
    },
    serverImage: {
      width: width * 0.07,
      height: width * 0.07,
      resizeMode: 'contain',
    },
    serverDetailsWrap: {
      width: '70%',
      paddingLeft: 5,
    },
    serverName: {
      color: theme.text_1,
      fontSize: 17,
      fontFamily: theme.font_medium,
    },
    serverUrl: {
      color: theme.text_2,
      fontSize: width * 0.028,
      fontFamily: theme.font_regular,
    },
    dropdownIconWrap: {
      width: '10%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    serverListContainer: {
      width: '100%',
      borderRadius: theme.border_radius,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: width * 0.02,
      paddingVertical: width * 0.005,
    },
    serverListImageWrap: {
      width: width * 0.13,
      height: width * 0.13,
      borderRadius: (width * 0.13) / 2,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#eee',
    },
    serverListImage: {
      width: width * 0.07,
      height: width * 0.07,
      resizeMode: 'contain',
    },
    serverListSecondWrap: {
      width: '83%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingLeft: 5,
      paddingVertical: 10,
      borderBottomColor: theme.border_1,
    },
    serveListName: {
      color: theme.text_1,
      fontSize: 17,
      fontFamily: theme.font_medium,
    },
    serverListUrl: {
      color: theme.text_2,
      fontSize: width * 0.028,
      fontFamily: theme.font_regular,
    },
    radioWrap: {
      width: '10%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    titleWrap: {
      zIndex: 99,
      position: 'absolute',
      top: -10,
      left: 7,
    },
    placeholderText: {
      color: theme.placeholder,
      backgroundColor: theme.background_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
      letterSpacing: 0.4,
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
      fontSize: 20,
      fontFamily: theme.font_medium,
      marginBottom: height * 0.025,
    },
    fieldTitle: {
      color: theme.text_1,
      fontSize: 17,
      fontFamily: theme.font_medium,
    },
    buttonWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    radioOuter: {
      height: width * 0.06,
      width: width * 0.06,
      borderRadius: (width * 0.06) / 2,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: theme.radio_2,
    },
    radioInner: {
      height: width * 0.04,
      width: width * 0.04,
      borderRadius: (width * 0.04) / 2,
      backgroundColor: theme.radio_2,
    },
    closeIconWrap: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignSelf: 'center',
      paddingVertical: height * 0.03,
    },
    errorWrap: {
      justifyContent: 'flex-start',
      marginLeft: 20,
    },
    errorMsg: {
      fontSize: 15,
      fontFamily: theme.font_regular,
      lineHeight: 28,
      paddingBottom: 10,
      textAlign: 'center',
      color: theme.button_bg_1,
    },
    serverListMain: {
      position: 'absolute',
      top: height * 0.098,
      width: '100%',
      zIndex: 999,
      backgroundColor: theme.background_1,
      borderBottomLeftRadius: theme.border_radius,
      borderBottomRightRadius: theme.border_radius,
      elevation: 5,
    },
    serverListSub: {
      flex: 1,
      maxHeight: height * 0.225,
      padding: width * 0.015,
    },
    addServerWrap: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: width * 0.05,
      borderTopColor: theme.border_1,
      borderTopWidth: 1,
    },
    addText: {
      color: '#4DCAF4',
      fontFamily: theme.font_regular,
      fontSize: 16,
      marginRight: width * 0.03,
    },
  });
};

export default StyleSheetFactory;

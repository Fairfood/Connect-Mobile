import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      height: '100%',
      backgroundColor: theme.background_1,
      paddingHorizontal: width * 0.05,
    },
    listItem: {
      width: '100%',
      justifyContent: 'space-between',
      alignContent: 'space-between',
      flexDirection: 'row',
      paddingVertical: height * 0.01,
    },
    listItemSub: {
      width: '100%',
      justifyContent: 'space-between',
      alignContent: 'space-between',
      flexDirection: 'row',
      paddingVertical: height * 0.017,
      borderTopColor: theme.border_1,
      borderTopWidth: 0.7,
    },
    listItemLeft: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontSize: 16,
      letterSpacing: 0.15,
    },
    listSubItemLeft: {
      color: theme.text_2,
      fontFamily: theme.font_regular,
      fontSize: 15,
      letterSpacing: 0.15,
    },
    listItemRight: {
      color: theme.text_2,
      fontFamily: theme.font_bold,
      fontSize: 15,
      letterSpacing: 0.15,
    },
    listItemRightIcon: {
      flexDirection: 'row',
      alignSelf: 'center',
    },
    listMainItem: {
      flexDirection: 'row',
      alignSelf: 'center',
      paddingVertical: height * 0.01,
    },
    rightTextStyle: {
      color: theme.text_2,
      fontSize: 15,
      paddingHorizontal: 20,
      fontStyle: 'normal',
      fontFamily: theme.font_regular,
    },
    toggleOuter: {
      flexDirection: 'row',
      alignItems: 'center',
      width: width * 0.14,
      height: 28,
      borderColor: theme.border_1,
      paddingHorizontal: 1,
      borderWidth: 1,
      borderRadius: 20,
    },
    toggleInner: {
      width: width * 0.075,
      height: 24,
      borderColor: theme.border_1,
      backgroundColor: theme.background_1,
      borderWidth: 1,
      borderRadius: 20,
    },
    developerWrap: {
      paddingHorizontal: width * 0.05,
    },
    buttonWrap: {
      width: '87%',
      alignSelf: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: 20,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 58, 96, 0.4)',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    topSection: {
      width: '100%',
      height: height * 0.27,
      backgroundColor: theme.background_1,
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
      backgroundColor: theme.background_1,
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
      color: theme.text_1,
      fontSize: 24,
      fontFamily: theme.font_bold,
      marginTop: height * 0.03,
    },
    messageText: {
      color: theme.text_2,
      fontSize: 15,
      fontFamily: theme.font_regular,
      marginTop: height * 0.01,
    },
    messageText2: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
    },
    modalButtonWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: height * 0.025,
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
    filedWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 7,
      height: height * 0.06,
    },
    firstPart: {
      width: '10%',
      height: '100%',
      justifyContent: 'center',
    },
    secondPart: {
      width: '85%',
      height: '100%',
      borderBottomColor: theme.border_1,
      justifyContent: 'center',
    },
  });
};

export default StyleSheetFactory;

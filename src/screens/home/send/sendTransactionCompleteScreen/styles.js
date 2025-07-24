import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background_1,
    },
    topSection: {
      width,
      height: height * 0.33,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.header_bg,
    },
    successTitle: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 20,
      textAlign: 'center',
      marginTop: 30,
    },
    toWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
    },
    toText: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontSize: 15,
      textAlign: 'center',
    },
    buyerName: {
      color: theme.text_1,
      fontFamily: theme.font_medium,
      fontSize: 16,
      textAlign: 'center',
    },
    bottomSection: {
      flexGrow: 1,
      padding: width * 0.05,
    },
    titleContainer: {
      marginTop: height * 0.01,
      paddingBottom: height * 0.02,
      paddingHorizontal: width * 0.04,
      borderBottomColor: theme.border_1,
      borderBottomWidth: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    fieldContainer: {
      borderBottomColor: theme.border_1,
      borderBottomWidth: 1,
      paddingVertical: height * 0.015,
    },
    fieldWrap: {
      width: '100%',
      paddingVertical: height * 0.005,
      paddingHorizontal: width * 0.04,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    titleText: {
      color: theme.text_1,
      fontSize: 16,
      fontFamily: theme.font_medium,
    },
    fieldTitle: {
      color: '#427290',
      fontSize: 15,
      fontFamily: theme.font_regular,
    },
    totalText: {
      color: theme.text_1,
      fontSize: 16,
      fontFamily: theme.font_bold,
      marginTop: height * 0.005,
    },
    fieldValue: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_medium,
    },
    productCountText: {
      color: '#427290',
      fontSize: 16,
      fontFamily: theme.font_regular,
    },
    transactionText: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
      fontWeight: 'normal',
      fontStyle: 'normal',
    },
    cardContainer: {
      backgroundColor: theme.background_2,
      marginHorizontal: '7.5%',
      padding: 25,
    },
    formTitleContainer: {
      margin: 30,
      marginBottom: 10,
    },
    formTitle: {
      color: theme.text_1,
      fontWeight: '600',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 18,
      textAlign: 'center',
      marginBottom: 20,
    },
    cardReaderImageContainer: {
      height: '30%',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
    },
    buttonWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '85%',
      alignSelf: 'center',
      marginTop: 10,
    },
    buttonStyle: {
      marginTop: 10,
      marginBottom: 20,
      paddingHorizontal: 0,
    },
    transparentButtonStyle: {
      paddingHorizontal: 0,
      height: 35,
      width: '48%',
    },
    dot: {
      backgroundColor: theme.text_1,
      width: 5,
      height: 5,
      borderRadius: 5 / 2,
      marginRight: 5,
    },
    tnxStatusWrap: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    tnxStatusText: {
      fontFamily: theme.font_regular,
      fontSize: 15,
      paddingLeft: width * 0.015,
    },
    errorWrap: {
      width: '100%',
      backgroundColor: 'rgba(255, 176, 170, 0.3)',
      marginBottom: 10,
      padding: 10,
      borderRadius: theme.border_radius,
    },
    errorTnxWarning: {
      fontFamily: theme.font_regular,
      color: theme.icon_error,
      fontSize: 15,
      marginHorizontal: width * 0.04,
      textAlign: 'center',
    },
  });
};

export default StyleSheetFactory;

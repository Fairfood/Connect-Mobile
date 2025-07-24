import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background_1,
    },
    formTitleContainer: {
      alignSelf: 'center',
      width: '90%',
      marginVertical: 10,
    },
    formTitle: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 16,
    },
    formSubTitle: {
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 16,
      marginBottom: 10,
      color: theme.background_3,
    },
    lossTitleWrap: {
      width: '90%',
      alignSelf: 'center',
      marginVertical: 10,
      backgroundColor: theme.background_2,
      flexDirection: 'row',
      alignItems: 'center',
      padding: width * 0.025,
    },
    lossTitle: {
      fontWeight: '500',
      fontStyle: 'normal',
      fontSize: 17,
      color: theme.text_1,
      fontFamily: theme.font_regular,
      marginLeft: width * 0.02,
    },
    lossSymbol: {
      color: '#FFFFFF',
      fontSize: 15,
      fontFamily: theme.font_bold,
    },
    person: {
      backgroundColor: '#EA2553',
      height: 30,
      width: 30,
      borderRadius: 30 / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    viewImage: {
      flexDirection: 'row',
      width: '100%',
      justifyContent: 'space-between',
      alignContent: 'space-between',
    },
    viewImageText: {
      fontSize: 15,
      marginBottom: 10,
      color: theme.text_2,
      justifyContent: 'center',
      alignSelf: 'center',
      width: '60%',
      marginVertical: 10,
    },
    viewImageButtonText: {
      fontSize: 15,
      textDecorationLine: 'underline',
      color: '#4DCAF4',
      fontFamily: theme.font_bold,
      textAlign: 'right',
      marginVertical: 10,
    },
    syncWarningWrap: {
      width: '90%',
      alignSelf: 'center',
      backgroundColor: theme.background_2,
      alignItems: 'center',
      flexDirection: 'row',
      paddingVertical: 5,
    },
    syncMsg: {
      color: theme.text_1,
      fontFamily: theme.font_medium,
      fontSize: 15,
      width: '90%',
    },
    cardWrap: {
      width: '90%',
      alignSelf: 'center',
      paddingBottom: 20,
      borderBottomColor: theme.border_1,
      borderBottomWidth: 1,
    },
    reportSectionWrap: {
      width: '90%',
      alignSelf: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 5,
    },
    reportTitleText: {
      color: theme.text_2,
      fontFamily: theme.font_regular,
      fontSize: width * 0.035,
    },
    reportButtonText: {
      color: theme.primary,
      fontFamily: theme.font_medium,
      fontSize: width * 0.035,
    },
    bulletin: {
      width: 5,
      height: 5,
      borderRadius: 5 / 2,
      backgroundColor: '#053B5F',
    },
    errorTitleWrap: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 2,
      paddingHorizontal: 20,
    },
    errorMessageWrap: {
      flexDirection: 'row',
      paddingHorizontal: 25,
    },
    leftColumn: {
      width: '5%',
      alignItems: 'center',
      paddingTop: 12,
    },
    rightColumn: {
      width: '95%',
      justifyContent: 'center',
      paddingLeft: 5,
    },
    errorTile: {
      fontSize: 15,
      fontFamily: theme.font_bold,
      color: theme.primary,
      marginLeft: 10,
    },
    errorMessage: {
      fontSize: 15,
      fontFamily: theme.font_regular,
      lineHeight: 25,
      paddingBottom: 5,
      color: '#053B5F',
    },
    errorWrap: {
      width: '90%',
      alignSelf: 'center',
      paddingVertical: 15,
      marginVertical: 10,
      backgroundColor: 'rgba(255, 176, 170, 0.04)',
      borderRadius: theme.border_radius,
      borderColor: 'rgba(255, 176, 170, 1)',
      borderWidth: 1,
    },
    arrowWrap: {
      position: 'absolute',
      right: 15,
      alignSelf: 'center',
    },
  });
};

export default StyleSheetFactory;

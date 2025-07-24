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
      height: height * 0.45,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.header_bg,
    },
    successTitle: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontSize: 20,
      textAlign: 'center',
      marginTop: 30,
    },
    fromWrap: {
      backgroundColor: theme.background_2,
      width: '90%',
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.border_radius,
      marginTop: height * 0.02,
      paddingHorizontal: width * 0.035,
      paddingVertical: width * 0.05,
    },
    fromSubWrap: {
      marginLeft: width * 0.03,
    },
    fromText: {
      color: theme.background_3,
      fontFamily: theme.font_regular,
      fontSize: 15,
    },
    farmerName: {
      color: theme.text_1,
      fontFamily: theme.font_medium,
      fontSize: 16,
    },
    bottomSection: {
      flexGrow: 1,
      paddingVertical: width * 0.04,
      paddingHorizontal: width * 0.04,
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
    person: {
      backgroundColor: '#F2F2F2',
      height: 50,
      width: 50,
      borderRadius: 50 / 2,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 10,
    },
  });
};

export default StyleSheetFactory;

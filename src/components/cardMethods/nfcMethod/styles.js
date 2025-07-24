import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const StyleSheetFactory = () => {
  const { height, width } = Dimensions.get('window');
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: width * 0.025,
    },
    formTitleContainer: {
      marginTop: 35,
      marginBottom: 20,
    },
    formTitle: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 16,
      textAlign: 'center',
    },
    cardReaderImageContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background_2,
    },
    noCardButton: {
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
    },
    scanning: {
      color: theme.text_1,
      fontWeight: 'normal',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 15,
      textAlign: 'center',
      marginVertical: 10,
    },
    errorMessage: {
      fontSize: 15,
      fontFamily: theme.font_regular,
      lineHeight: 28,
      paddingBottom: 10,
      textAlign: 'center',
      color: theme.icon_error,
    },
    infoWrap: {
      backgroundColor: theme.text_2,
      flexDirection: 'row',
      width: '95%',
      paddingHorizontal: width * 0.05,
      paddingVertical: width * 0.02,
      alignSelf: 'center',
      borderRadius: theme.border_radius,
      zIndex: 99,
      marginTop: 5,
    },
    policyText: {
      fontFamily: theme.font_medium,
      fontSize: 15,
      color: '#FFFFFF',
    },
    withCardBottomWrap: {
      marginTop: height * -0.12,
      paddingBottom: 15,
      paddingHorizontal: width * 0.025,
    },
    withCardBottomSubWrap: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardReadingWrap: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });
};

export default StyleSheetFactory;

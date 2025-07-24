import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#D5ECFB',
    },
    headerWrap: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: width * 0.05,
    },
    formTitleContainer: {
      margin: 30,
      marginBottom: 15,
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
    cardContainer: {
      width: '100%',
      alignSelf: 'center',
      marginVertical: 30,
      paddingHorizontal: 20,
      backgroundColor: theme.placeholder,
      borderRadius: theme.border_radius,
    },
    cardItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardLeftItem: {
      fontFamily: theme.font_regular,
      fontSize: 15,
      color: theme.text_4,
      width: '50%',
      opacity: 0.7,
    },
    cardRightItem: {
      fontFamily: theme.font_medium,
      fontSize: 15,
      color: theme.text_4,
      width: '50%',
      textAlign: 'right',
    },
    dottedLine: {
      borderStyle: 'dotted',
      borderWidth: 1,
      borderRadius: theme.border_radius,
      borderColor: theme.background_1,
      marginHorizontal: 0,
      marginTop: 5,
    },
    errorMessage: {
      fontSize: 15,
      fontFamily: theme.font_regular,
      lineHeight: 28,
      paddingBottom: 10,
      textAlign: 'center',
      color: theme.button_bg_1,
    },
    privacyInfoView: {
      backgroundColor: theme.background_3,
      flexDirection: 'row',
      width: '95%',
      padding: 10,
      alignSelf: 'center',
    },
    infoIconWrap: {
      alignItems: 'center',
      marginRight: 10,
    },
    privacyText: {
      fontFamily: theme.font_medium,
      fontSize: 15,
      color: theme.text_4,
    },
    titleWrap: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: 10,
    },
    transactionSummaryText: {
      fontFamily: theme.font_medium,
      fontSize: 16,
      color: theme.text_4,
    },
    announceWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: theme.border_radius,
      borderColor: theme.background_1,
      borderWidth: 1,
    },
    announceText: {
      fontFamily: theme.font_regular,
      fontSize: 15,
      color: theme.text_4,
      marginLeft: 5,
    },
    sectionHeading: {
      fontFamily: theme.font_medium,
      fontStyle: 'normal',
      fontSize: 15,
      color: theme.text_4,
      marginVertical: 5,
    },
    totalTitle: {
      color: theme.text_4,
      fontFamily: theme.font_bold,
      fontSize: 15,
      textTransform: 'uppercase',
      paddingTop: 5,
      width: '25%',
    },
    totalValue: {
      color: theme.text_4,
      fontFamily: theme.font_bold,
      fontSize: 17,
      width: '75%',
      textAlign: 'right',
    },
  });
};

export default StyleSheetFactory;

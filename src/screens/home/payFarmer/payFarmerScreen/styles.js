import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background_1,
      paddingHorizontal: width * 0.05,
    },
    productWrap: {
      borderColor: theme.placeholder,
      borderWidth: 1,
      borderRadius: theme.border_radius,
      marginTop: height * 0.02,
    },
    fieldTitle: {
      color: theme.text_1,
      fontFamily: theme.font_medium,
      fontSize: 16,
    },
    removeText: {
      color: theme.icon_error,
      fontFamily: theme.font_medium,
      fontSize: 15,
      paddingLeft: width * 0.01,
    },
    detailsText: {
      color: theme.placeholder,
      fontFamily: theme.font_medium,
      fontSize: 15,
      marginTop: height * 0.005,
    },
    topWrap: {
      padding: width * 0.04,
      borderRadius: theme.border_radius,
    },
    titleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    detailsWrap: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    bottomWrap: {
      paddingTop: 5,
      paddingHorizontal: width * 0.03,
    },
    addProductWarp: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderColor: '#4DCAF4',
      borderWidth: 1,
      borderRadius: theme.border_radius,
      padding: width * 0.035,
      marginVertical: height * 0.02,
    },
    addText: {
      color: '#4DCAF4',
      fontFamily: theme.font_regular,
      fontSize: 16,
      marginRight: width * 0.03,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    modalContainerSub: {
      marginTop: 'auto',
      paddingHorizontal: width * 0.05,
      backgroundColor: '#ffffff',
    },
    modalTitleSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: width * 0.05,
      paddingHorizontal: width * 0.03,
    },
    modalItemWrap: {
      padding: width * 0.035,
      marginBottom: height * 0.015,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderColor: theme.border_1,
      borderWidth: 1,
      borderRadius: theme.border_radius,
    },
    modalItem: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
    },
    modalTitle: {
      color: theme.text_1,
      fontSize: 17,
      fontFamily: theme.font_medium,
      fontWeight: '500',
      marginTop: 15,
    },
    errorMessage: {
      fontSize: 15,
      fontFamily: theme.font_regular,
      lineHeight: 28,
      paddingBottom: 10,
      textAlign: 'center',
      marginHorizontal: 30,
      color: theme.button_bg_1,
    },
    cardContainer: {
      marginVertical: 10,
      padding: 10,
      backgroundColor: theme.background_2,
    },
    cardLeftItem: {
      fontFamily: theme.font_regular,
      fontSize: 15,
      color: theme.text_1,
      opacity: 0.7,
    },
    cardRightItem: {
      fontFamily: theme.font_regular,
      fontSize: 15,
      color: theme.text_1,
      textAlign: 'right',
    },
    totalText: {
      fontFamily: theme.font_bold,
      fontStyle: 'normal',
      fontSize: 20,
      color: theme.text_1,
      opacity: 0.7,
      letterSpacing: 0.2,
    },
    totalValue: {
      fontFamily: theme.font_bold,
      fontStyle: 'normal',
      fontSize: 20,
      color: theme.text_1,
      textAlign: 'right',
    },
    dottedLine: {
      borderStyle: 'dotted',
      borderWidth: 1,
      borderRadius: theme.border_radius,
      borderColor: theme.text_2,
      marginHorizontal: 0,
      marginTop: 5,
    },
    basePriceWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    totalWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: 10,
    },
    buttonWrap: {
      justifyContent: 'flex-end',
    },
  });
};

export default StyleSheetFactory;

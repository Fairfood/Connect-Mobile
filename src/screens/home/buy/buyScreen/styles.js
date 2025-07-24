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
      marginBottom: height * 0.025,
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
      marginBottom: height * 0.025,
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
    modalItem2: {
      color: theme.text_2,
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
      lineHeight: 24,
      paddingBottom: 10,
      textAlign: 'center',
      marginHorizontal: 30,
      color: theme.button_bg_1,
    },
    sectionHeading: {
      fontFamily: theme.font_medium,
      fontStyle: 'normal',
      fontSize: 15,
      color: theme.text_1,
      marginBottom: 5,
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
      width: '50%',
    },
    cardRightItem: {
      fontFamily: theme.font_regular,
      fontSize: 15,
      color: theme.text_1,
      textAlign: 'right',
      width: '50%',
    },
    totalText: {
      fontFamily: theme.font_bold,
      fontStyle: 'normal',
      fontSize: 20,
      color: theme.text_1,
      opacity: 0.7,
      letterSpacing: 0.2,
    },
    totalTitle: {
      color: theme.text_1,
      fontFamily: theme.font_bold,
      fontSize: 15,
      textTransform: 'uppercase',
      width: '25%',
    },
    totalValue: {
      color: theme.text_1,
      fontFamily: theme.font_bold,
      fontSize: 17,
      width: '75%',
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
    premiumWrap: {
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
    resetWrap: {
      position: 'absolute',
      top: 15,
      right: 15,
      flexDirection: 'row',
      alignItems: 'center',
    },
    resetOptionWrap: {
      position: 'absolute',
      top: 15,
      right: 15,
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionPremiumWarp: {
      height: 53,
      width: '100%',
      alignSelf: 'center',
      justifyContent: 'center',
      borderRadius: theme.border_radius,
      borderColor: theme.placeholder,
      borderWidth: 1,
      marginBottom: 20,
      paddingLeft: 15,
    },
    optionPremiumText: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
    },
    optionsTitleWrap: {
      zIndex: 99,
      position: 'absolute',
      top: -10,
      left: 8,
    },
    placeholderText: {
      color: theme.placeholder,
      backgroundColor: theme.background_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
      letterSpacing: 0.4,
      paddingHorizontal: 3,
    },
  });
};

export default StyleSheetFactory;

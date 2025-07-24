import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    cardContainer: {
      width: '100%',
      alignSelf: 'center',
      marginHorizontal: 15,
      marginTop: 10,
      paddingHorizontal: 10,
      borderRadius: theme.border_radius,
      backgroundColor: theme.background_2,
    },
    cardItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 3,
      marginHorizontal: 10,
    },
    cardLeftItem: {
      fontFamily: theme.font_regular,
      fontSize: 15,
      color: theme.text_1,
      width: '50%',
      opacity: 0.7,
    },
    sectionHeading: {
      fontFamily: theme.font_regular,
      fontSize: 15,
      color: theme.text_1,
      marginLeft: 10,
      marginVertical: 5,
    },
    cardRightItem: {
      fontFamily: theme.font_regular,
      fontSize: 15,
      color: theme.text_1,
      width: '50%',
      textAlign: 'right',
    },
    detailsTextWrap: {
      marginVertical: 5,
      paddingVertical: 0,
    },
    detailsText: {
      fontSize: 15,
      fontFamily: theme.font_medium,
      opacity: 1,
      color: theme.text_1,
      letterSpacing: 0.2,
      marginVertical: 10,
      marginBottom: 0,
      marginLeft: 10,
    },
    productQuantity: {
      fontFamily: theme.font_regular,
      fontWeight: '500',
      fontStyle: 'normal',
      fontSize: 15,
      color: theme.text_1,
      opacity: 1,
      letterSpacing: 0.2,
      textTransform: 'none',
    },
    basePriceText: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 15,
      fontWeight: '500',
      opacity: 1,
      letterSpacing: 0.2,
      textTransform: 'none',
    },
    dottedLine: {
      borderStyle: 'dotted',
      borderWidth: 1,
      borderRadius: theme.border_radius,
      borderColor: theme.background_1,
      marginTop: 5,
    },
    totalTitle: {
      fontFamily: theme.font_bold,
      fontSize: 15,
      color: theme.text_1,
      textTransform: 'uppercase',
      paddingTop: 5,
      width: '25%',
    },
    titleValue: {
      fontFamily: theme.font_bold,
      fontSize: 17,
      color: theme.text_1,
      textAlign: 'right',
      width: '75%',
    },
  });
};

export default StyleSheetFactory;

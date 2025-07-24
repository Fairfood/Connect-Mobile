import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    headerWrap: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: width * 0.05,
    },
    cardContainer: {
      width: '100%',
      alignSelf: 'center',
      marginHorizontal: 15,
      marginTop: 10,
      paddingHorizontal: 20,
      borderRadius: theme.border_radius,
      backgroundColor: theme.background_3,
    },
    cardItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignContent: 'space-between',
      marginVertical: 3,
    },
    cardLeftItem: {
      fontFamily: theme.font_regular,
      fontSize: 15,
      opacity: 0.7,
      color: theme.text_4,
    },
    cardRightItem: {
      fontFamily: theme.font_regular,
      fontSize: 15,
      color: theme.text_4,
      textAlign: 'right',
    },
    quantityText: {
      fontFamily: theme.font_regular,
      letterSpacing: 0.2,
      opacity: 1,
      fontSize: 15,
      fontWeight: '500',
      textTransform: 'none',
      marginBottom: 3,
    },
    transactionSummaryText: {
      fontFamily: theme.font_regular,
      letterSpacing: 0.2,
      opacity: 1,
      fontWeight: '500',
      fontSize: 16,
      textTransform: 'none',
      marginVertical: 10,
      marginBottom: 0,
      color: theme.text_4,
    },
    dottedLine: {
      borderStyle: 'dotted',
      borderWidth: 1,
      borderRadius: theme.border_radius,
      borderColor: theme.background_1,
    },
    totalTitle: {
      fontFamily: theme.font_regular,
      fontWeight: '400',
      fontSize: 15,
      letterSpacing: 0.2,
      opacity: 1,
      textTransform: 'uppercase',
      paddingTop: 5,
      color: theme.text_4,
    },
    totalValue: {
      fontFamily: theme.font_regular,
      letterSpacing: 0.2,
      opacity: 1,
      fontWeight: '700',
      fontSize: 20,
      color: theme.text_4,
    },
  });
};

export default StyleSheetFactory;

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
      color: theme.text_4,
      width: '50%',
      opacity: 0.7,
    },
    cardRightItem: {
      fontFamily: theme.font_regular,
      fontSize: 15,
      color: theme.text_4,
      width: '50%',
      textAlign: 'right',
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
    dottedLine: {
      borderStyle: 'dotted',
      borderWidth: 1,
      borderRadius: theme.border_radius,
      borderColor: theme.background_1,
    },
    totalTitle: {
      fontFamily: theme.font_bold,
      fontSize: 15,
      textTransform: 'uppercase',
      color: '#ffffff',
      width: '25%',
    },
    totalValue: {
      fontFamily: theme.font_bold,
      letterSpacing: 0.2,
      fontSize: 17,
      color: '#ffffff',
      width: '75%',
      textAlign: 'right',
    },
  });
};

export default StyleSheetFactory;

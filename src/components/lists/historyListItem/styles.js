import { StyleSheet } from 'react-native';

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignSelf: 'center',
      justifyContent: 'space-between',
      alignContent: 'space-between',
      width: '100%',
      paddingHorizontal: 15,
      paddingTop: 15,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border_1,
    },
    title: {
      fontSize: 16,
      fontFamily: theme.font_regular,
      fontWeight: '500',
      fontStyle: 'normal',
      textTransform: 'capitalize',
    },
    subtitle: {
      color: theme.text_2,
      fontSize: 15,
      fontFamily: theme.font_regular,
      textAlign: 'left',
    },
    dateText: {
      color: theme.text_2,
      fontSize: 15,
      fontFamily: theme.font_regular,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textTransform: 'none',
      textAlign: 'right',
    },
    historyViewWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 5,
    },
  });
};

export default StyleSheetFactory;

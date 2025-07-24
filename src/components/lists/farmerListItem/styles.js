import { StyleSheet } from 'react-native';

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: theme.border_radius,
    },
    containerSub: {
      flexDirection: 'row',
      alignSelf: 'center',
      width: '100%',
      padding: 20,
      justifyContent: 'space-between',
      alignContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: '#EDEEEF',
    },
    person: {
      backgroundColor: '#F2F2F2',
      height: 50,
      width: 50,
      borderRadius: 50 / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      color: theme.text_1,
      fontSize: 16,
      fontFamily: theme.font_regular,
      fontWeight: '500',
      fontStyle: 'normal',
      paddingBottom: 5,
      marginTop: 5,
    },
    subtitle: {
      color: theme.text_2,
      fontSize: 15,
      fontFamily: theme.font_regular,
      fontWeight: 'normal',
      fontStyle: 'normal',
    },
    avatarText: {
      color: '#ffffff',
      fontSize: 16,
      fontFamily: theme.font_bold,
    },
  });
};

export default StyleSheetFactory;

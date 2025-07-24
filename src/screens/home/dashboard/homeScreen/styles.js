import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background_1,
    },
    buyText: {
      fontSize: 18,
      fontFamily: theme.font_regular,
      lineHeight: 28,
      paddingBottom: 30,
      color: theme.text_1,
      marginHorizontal: '7.5%',
      marginTop: 50,
    },
    headerContainer: {
      height: '50%',
      backgroundColor: '#92DDF6',
      justifyContent: 'space-between',
    },
    linesImage: {
      width: '100%',
      height: 40,
    },
    buttonMargin: {
      marginTop: width * 0.05,
    },
    updateWrap: {
      width: '90%',
      backgroundColor: theme.background_1,
      borderRadius: theme.border_radius,
      alignSelf: 'center',
      padding: width * 0.05,
      marginBottom: width * 0.025,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    updateWrapSub: {
      width: '90%',
      alignSelf: 'center',
    },
    updateTitle: {
      fontSize: 15,
      color: theme.text_1,
      fontFamily: theme.font_bold,
      marginBottom: 5,
    },
    updateMessage: {
      fontSize: 15,
      color: theme.text_1,
      fontFamily: theme.font_regular,
    },
  });
};

export default StyleSheetFactory;

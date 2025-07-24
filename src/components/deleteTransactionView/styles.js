import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    errorTitleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 2,
      paddingHorizontal: 25,
    },
    errorMessageWrap: {
      flexDirection: 'row',
      paddingHorizontal: 25,
    },
    leftColumn: {
      width: '5%',
      alignItems: 'center',
      paddingTop: 12,
    },
    rightColumn: {
      width: '95%',
      justifyContent: 'center',
      paddingLeft: 5,
    },
    bulletin: {
      width: 5,
      height: 5,
      borderRadius: 5 / 2,
      backgroundColor: '#053B5F',
    },
    errorTile: {
      fontSize: 17,
      fontFamily: theme.font_bold,
      lineHeight: 28,
      color: theme.button_bg_1,
      marginLeft: 10,
    },
    errorMessage: {
      fontSize: 15,
      fontFamily: theme.font_regular,
      lineHeight: 25,
      paddingBottom: 5,
      color: '#053B5F',
    },
    errorWrap: {
      width: '90%',
      alignSelf: 'center',
      paddingVertical: 15,
      marginVertical: 10,
      backgroundColor: 'rgba(255, 176, 170, 0.04)',
      borderRadius: theme.border_radius,
      borderColor: 'rgba(255, 176, 170, 1)',
      borderWidth: 1,
    },
    buttonWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 15,
    },
    button: {
      width: '50%',
      height: 35,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonText: {
      fontSize: 15,
      fontFamily: theme.font_regular,
      color: '#EA2553',
    },
  });
};

export default StyleSheetFactory;

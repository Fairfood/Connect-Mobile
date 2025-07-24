import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      width: '85%',
      alignSelf: 'center',
      borderColor: theme.placeholder,
      borderWidth: 1,
      borderRadius: theme.border_radius,
      height: 53,
      justifyContent: 'center',
      alignItems: 'center',
      paddingLeft: 15,
      fontSize: 18,
      lineHeight: 24,
      fontFamily: theme.font_regular,
    },
    showEyeWrap: {
      position: 'relative',
      alignSelf: 'flex-end',
      justifyContent: 'flex-end',
      right: width * 0.01,
      top: 10,
      width: 30,
    },
    dropdownWrap: {
      position: 'relative',
      alignSelf: 'flex-end',
      justifyContent: 'center',
      alignItems: 'center',
      right: width * 0.01,
      top: 15,
      width: 30,
    },
    subWrap: {
      left: 5,
      bottom: 48,
      height: 25,
      paddingHorizontal: 8,
      justifyContent: 'space-between',
    },
    titleWrap: {
      zIndex: 99,
      position: 'absolute',
      top: -10,
      left: 7,
    },
    placeholderText: {
      color: theme.placeholder,
      backgroundColor: theme.background_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
      letterSpacing: 0.4,
    },
    errorMessage: {
      fontSize: 15,
      fontFamily: theme.font_regular,
      marginTop: 5,
      marginBottom: 10,
      marginLeft: 5,
      color: theme.button_bg_1,
    },
  });
};

export default StyleSheetFactory;

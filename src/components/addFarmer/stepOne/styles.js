import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    formTitleContainer: {
      marginTop: 35,
      marginBottom: 25,
    },
    formTitle: {
      color: theme.text_1,
      fontWeight: 'bold',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 16,
    },
    errorMessage: {
      fontSize: 15,
      fontFamily: theme.font_regular,
      lineHeight: 28,
      paddingBottom: 10,
      textAlign: 'center',
      marginLeft: 5,
      color: theme.button_bg_1,
    },
    pageOneContainer: {
      width,
      paddingHorizontal: 30,
    },
    countryPickerWrap: {
      width: 50,
      top: 15,
      left: 20,
      position: 'absolute',
      zIndex: 1,
    },
    errorWrap: {
      flex: 1,
      justifyContent: 'flex-end',
      marginBottom: 20,
      marginTop: 50,
    },
  });
};

export default StyleSheetFactory;

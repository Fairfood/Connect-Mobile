import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background_1,
    },
    formTitleContainer: {
      marginVertical: 10,
    },
    formTitle: {
      color: theme.text_1,
      fontFamily: theme.font_medium,
      fontStyle: 'normal',
      fontSize: 16,
      marginBottom: 20,
    },
    uploadImageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignSelf: 'center',
      marginVertical: 30,
    },
    uploadImageView: {
      backgroundColor: '#C5EDFA',
      height: 100,
      width: 100,
      borderRadius: 50,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorMessage: {
      fontSize: 15,
      fontFamily: theme.font_regular,
      lineHeight: 28,
      paddingBottom: 10,
      textAlign: 'center',
      marginRight: 30,
      color: theme.button_bg_1,
    },
    addPicture: {
      height: 30,
      width: 30,
      borderRadius: 15,
      position: 'absolute',
      right: -5,
      top: 10,
      backgroundColor: theme.text_1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    errorView: {
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 40,
    },
    countryPickerWrap: {
      width: 50,
      top: 15,
      left: 20,
      position: 'absolute',
      zIndex: 1,
    },
    modalWrap: {
      flex: 1,
      backgroundColor: 'rgba(0, 58, 96, 0.2);',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};

export default StyleSheetFactory;

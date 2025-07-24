import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

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
    uploadImageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignSelf: 'center',
    },
    uploadImageView: {
      backgroundColor: '#C5EDFA',
      height: 100,
      width: 100,
      borderRadius: 100 / 2,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
    },
    uploadImageText: {
      color: theme.text_1,
      textAlign: 'left',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 15,
      marginVertical: 20,
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
    changePicWrap: {
      backgroundColor: theme.button_bg_1,
      paddingHorizontal: 10,
    },
    removePicWrap: {
      backgroundColor: theme.button_bg_1,
      marginTop: 20,
      paddingHorizontal: 10,
    },
    changeButtonText: {
      color: theme.background_1,
      textAlign: 'center',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 15,
      paddingVertical: 10,
      marginLeft: 0,
    },
    stepThreeButtonWrap: {
      flex: 1,
      justifyContent: 'flex-end',
      marginBottom: 20,
    },
  });
};

export default StyleSheetFactory;

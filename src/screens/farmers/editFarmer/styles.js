import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

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
    dialCodeWrap: {
      width: 50,
      top: 15,
      left: 20,
      position: 'absolute',
      zIndex: 1,
    },
    countryModalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 58, 96, 0.2);',
    },
    countryModalSub: {
      height: '60%',
      marginTop: 'auto',
      backgroundColor: theme.background_1,
    },
    countryFlatList: {
      flex: 1,
      marginHorizontal: 10,
      backgroundColor: theme.background_1,
    },
    flatListItemWrap: {
      flex: 1,
      height: 40,
      marginTop: 10,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.12)',
      alignContent: 'center',
      justifyContent: 'center',
    },
    flatListItemText: {
      marginLeft: 10,
      fontFamily: theme.font_regular,
      color: theme.text_2,
    },
    emptyText: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
      textAlign: 'center',
    },
    alertImage: {
      width: width * 0.33,
      height: width * 0.33,
      resizeMode: 'contain',
    },
  });
};

export default StyleSheetFactory;

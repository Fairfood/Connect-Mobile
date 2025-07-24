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
    countryItems: {
      flex: 1,
      width: '95%',
      alignSelf: 'center',
      height: 40,
      marginTop: 10,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.12)',
      borderRadius: theme.border_radius,
      alignContent: 'center',
      justifyContent: 'center',
    },
    countryItemText: {
      marginLeft: 10,
      fontFamily: theme.font_regular,
      color: theme.text_2,
    },
    stepTwoContainer: {
      flex: 1,
      width,
      paddingHorizontal: 30,
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
    alertImage: {
      width: width * 0.33,
      height: width * 0.33,
      resizeMode: 'contain',
    },
    emptyText: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
      textAlign: 'center',
    },
  });
};

export default StyleSheetFactory;

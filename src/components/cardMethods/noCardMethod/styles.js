import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      height,
      paddingHorizontal: width * 0.05,
    },
    formTitleContainer: {
      marginTop: 35,
      marginBottom: 15,
    },
    formTitle: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontSize: 16,
    },
    noCardButton: {
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
    },
    scanning: {
      color: theme.text_1,
      fontWeight: 'normal',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 15,
      textAlign: 'center',
      marginVertical: 10,
    },
    errorMessage: {
      fontSize: 15,
      fontFamily: theme.font_regular,
      lineHeight: 28,
      paddingBottom: 10,
      textAlign: 'center',
      color: theme.icon_error,
    },
    infoWrap: {
      backgroundColor: theme.text_2,
      flexDirection: 'row',
      width: '95%',
      paddingHorizontal: width * 0.05,
      paddingVertical: width * 0.02,
      alignSelf: 'center',
      borderRadius: theme.border_radius,
      zIndex: 99,
    },
    searchFarmerWrap: {
      height: '60%',
      marginTop: 'auto',
      backgroundColor: theme.background_1,
    },
    emptyList: {
      height: 100,
      width: '100%',
      justifyContent: 'center',
      alignSelf: 'center',
      alignItems: 'center',
      marginTop: 30,
      backgroundColor: theme.background_1,
    },
    flatListStyle: {
      flex: 1,
      marginHorizontal: 10,
      backgroundColor: theme.background_1,
    },
    selectedWrap: {
      width: '100%',
      alignSelf: 'center',
      marginBottom: 15,
    },
    selectFarmerWrap: {
      width: '100%',
      borderColor: theme.border_1,
      borderWidth: 1.5,
      height: 53,
      justifyContent: 'center',
      paddingLeft: 15,
      borderRadius: theme.border_radius,
      marginBottom: 10,
    },
    selectFarmerText: {
      fontSize: 15,
      fontFamily: theme.font_regular,
      color: theme.text_2,
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

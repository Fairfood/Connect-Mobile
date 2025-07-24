import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background_2,
      borderRadius: theme.border_radius,
      padding: width * 0.05,
      marginBottom: 15,
    },
    person: {
      backgroundColor: '#F2F2F2',
      height: 50,
      width: 50,
      borderRadius: 50 / 2,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    nameText: {
      color: theme.text_1,
      fontFamily: theme.font_medium,
      fontSize: 17,
    },
    countryText: {
      color: theme.text_2,
      fontFamily: theme.font_regular,
      fontSize: 15,
    },
    titleText: {
      color: theme.text_1,
      fontSize: 18,
      fontFamily: theme.font_bold,
    },
    subTitleText: {
      color: theme.text_2,
      fontSize: 16,
      fontFamily: theme.font_regular,
      marginBottom: 7,
    },
    addressText: {
      color: theme.text_2,
      fontSize: 16,
      fontFamily: theme.font_regular,
      marginTop: 7,
    },
  });
};

export default StyleSheetFactory;

import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      width: '100%',
      height: 40,
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 20,
      paddingHorizontal: '5%',
    },
    rightIcon: {
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
    },
    headerText: {
      fontFamily: theme.font_medium,
      fontSize: 20,
      color: theme.text_1,
    },
    tinyLogo: {
      width: 30,
      height: 30,
      resizeMode: 'contain',
    },
  });
};

export default StyleSheetFactory;

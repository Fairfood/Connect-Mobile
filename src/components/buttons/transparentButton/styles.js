import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      alignSelf: 'center',
      backgroundColor: theme.background_1,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.primary,
      borderRadius: theme.border_radius,
      flexDirection: 'row',
      minHeight: 30,
      height: 55,
      paddingHorizontal: 10,
    },
    buttonText: {
      color: theme.primary,
      fontFamily: theme.font_regular,
      fontSize: 15,
      textAlign: 'center',
      marginLeft: 5,
    },
  });
};

export default StyleSheetFactory;

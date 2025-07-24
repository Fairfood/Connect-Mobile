import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: theme.primary,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      shadowColor: 'rgba(37, 37, 37, 0.2)',
      shadowOpacity: 1,
      elevation: 1,
      paddingVertical: 10,
      borderRadius: theme.border_radius,
    },
    buttonText: {
      fontFamily: theme.font_medium,
      color: theme.background_1,
      fontSize: 15,
    },
  });
};

export default StyleSheetFactory;

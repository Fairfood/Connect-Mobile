import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      alignSelf: 'center',
      width: '85%',
      backgroundColor: theme.primary,
      height: 55,
      justifyContent: 'center',
      alignItems: 'center',
      borderColor: theme.primary,
      borderWidth: 1,
      borderRadius: theme.border_radius,
    },
    buttonText: {
      fontSize: 15,
      color: theme.background_1,
      fontFamily: theme.font_bold,
    },
  });
};

export default StyleSheetFactory;

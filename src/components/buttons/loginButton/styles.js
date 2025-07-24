import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      width: '100%',
      height: 55,
      backgroundColor: theme.button_bg_1,
      alignSelf: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderColor: theme.primary,
      borderWidth: 1,
      borderRadius: theme.border_radius,
      marginBottom: 15,
    },
    buttonText: {
      fontSize: 15,
      color: theme.background_1,
      fontFamily: theme.font_regular,
      marginRight: 10,
    },
  });
};

export default StyleSheetFactory;

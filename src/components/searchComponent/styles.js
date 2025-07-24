import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    componentWrap: {
      width: '90%',
      marginVertical: 20,
      borderRadius: theme.border_radius,
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: '#ffffff',
      borderColor: theme.border_1,
      borderWidth: 1,
    },
    container: {
      alignSelf: 'center',
      borderRadius: theme.border_radius,
      borderColor: 'rgba(0, 0, 0, 0.12)',
      borderWidth: 0,
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: 15,
      lineHeight: 24,
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontWeight: 'normal',
      backgroundColor: '#ffffff',
      color: theme.text_2,
    },
    iconWrap: {
      width: '15%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    rightIconWrap: {
      width: '15%',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};

export default StyleSheetFactory;

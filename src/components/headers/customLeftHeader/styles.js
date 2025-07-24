import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      width: '100%',
      paddingVertical: 20,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    leftIcon: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      marginLeft: -4,
    },
    rightTextWrap: {
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      marginRight: 20,
    },
    rightIcon: {
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      marginHorizontal: 10,
    },
    headerContainer: {
      marginLeft: 10,
      marginTop: 3,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerText: {
      fontFamily: theme.font_regular,
      fontSize: 20,
      color: theme.text_1,
      fontWeight: '500',
      marginLeft: 10,
    },
    rightText: {
      fontFamily: theme.font_regular,
      fontSize: 18,
      color: theme.text_1,
    },
    tinyLogo: {
      width: 25,
      height: 25,
      resizeMode: 'contain',
    },
  });
};

export default StyleSheetFactory;

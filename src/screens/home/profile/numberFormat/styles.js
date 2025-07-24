import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      height: '100%',
      backgroundColor: theme.background_1,
      paddingHorizontal: width * 0.05,
    },
    text_desc: {
      fontSize: 15,
      fontFamily: theme.font_regular,
      lineHeight: 20,
      paddingBottom: 30,
      color: theme.text_1,
      marginVertical: 20,
    },
    radioWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignContent: 'space-around',
      width: '100%',
      marginVertical: 15,
    },
    outerCircle: {
      width: 22,
      height: 22,
      borderRadius: 22 / 2,
      borderColor: '#2196f3',
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    innerCircle: {
      width: 16,
      height: 16,
      borderRadius: 16 / 2,
      backgroundColor: '#4DCAF4',
    },
    labelStyle: {
      fontSize: 18,
      color: theme.text_1,
      fontFamily: theme.font_regular,
    },
    labelWrapStyle: {
      justifyContent: 'flex-start',
      alignSelf: 'flex-start',
    },
  });
};

export default StyleSheetFactory;

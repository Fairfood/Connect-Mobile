import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background_1,
      paddingHorizontal: width * 0.05,
    },
    reportTitle: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontSize: 15,
    },
    reportSubTitle: {
      color: theme.text_2,
      fontFamily: theme.font_regular,
      fontSize: 15,
      marginVertical: height * 0.03,
    },
    lossTitle: {
      fontWeight: '500',
      fontStyle: 'normal',
      fontSize: 17,
      color: theme.text_1,
      fontFamily: theme.font_regular,
      marginLeft: width * 0.02,
    },
    buttonWrap: {
      width: '100%',
      alignSelf: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 15,
      backgroundColor: theme.background_1,
    },
    radioItemWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
    },
    radioOuter: {
      height: width * 0.06,
      width: width * 0.06,
      borderRadius: (width * 0.06) / 2,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
    },
    radioInner: {
      height: width * 0.04,
      width: width * 0.04,
      borderRadius: (width * 0.04) / 2,
      backgroundColor: theme.radio_2,
    },
    errorMessage: {
      fontSize: width * 0.04,
      fontFamily: theme.font_regular,
      marginTop: 10,
      textAlign: 'center',
      color: theme.button_bg_1,
    },
  });
};

export default StyleSheetFactory;

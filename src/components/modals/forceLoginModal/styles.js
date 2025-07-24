import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { height } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 58, 96, 0.2)',
    },
    modalInnerWrap: {
      marginTop: 'auto',
      backgroundColor: theme.background_1,
    },
    alreadyActiveText: {
      color: theme.text_1,
      fontSize: 20,
      fontFamily: theme.font_medium,
      margin: 25,
    },
    continueText: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
      lineHeight: 20,
      margin: 25,
      marginTop: 0,
    },
    buttonWrap: {
      width: '87%',
      alignSelf: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingBottom: 20,
    },
    bottomWrap: {
      justifyContent: 'flex-end',
      marginTop: height * 0.04,
    },
  });
};

export default StyleSheetFactory;

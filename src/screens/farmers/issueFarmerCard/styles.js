import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background_2,
    },
    headerWrap: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: width * 0.05,
      backgroundColor: theme.background_2,
    },
    tapCardInfo: {
      color: theme.background_1,
      fontWeight: 'normal',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 18,
      textAlign: 'center',
      paddingHorizontal: 40,
      paddingVertical: 10,
    },
    selectedView: {
      height: 25,
      width: 25,
      borderRadius: 13,
      backgroundColor: theme.primary,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedText: {
      color: theme.background_1,
      fontSize: 15,
    },
    horizontalLine: {
      borderTopWidth: 1,
      borderTopColor: '#BDBDBD',
      width: 100,
    },
    stepContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
    },
    stepContainerSub: {
      height: 40,
      width: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    qrHelpMessage: {
      fontFamily: theme.font_medium,
      fontSize: 15,
      color: theme.text_1,
      textAlign: 'center',
    },
    helpWrap: {
      paddingHorizontal: width * 0.1,
      alignSelf: 'center',
      alignItems: 'center',
      marginTop: 15,
    },
  });
};

export default StyleSheetFactory;

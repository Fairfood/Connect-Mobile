import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    listItem: {
      width: '100%',
      justifyContent: 'space-between',
      alignContent: 'space-between',
      flexDirection: 'row',
      paddingVertical: height * 0.01,
    },
    listItemSub: {
      width: '100%',
      justifyContent: 'space-between',
      alignContent: 'space-between',
      flexDirection: 'row',
      paddingVertical: height * 0.017,
      borderTopColor: theme.border_1,
      borderTopWidth: 0.7,
    },
    listItemLeft: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontSize: 16,
      letterSpacing: 0.15,
    },
    listSubItemLeft: {
      color: theme.text_2,
      fontFamily: theme.font_regular,
      fontSize: 15,
      letterSpacing: 0.15,
    },
    listItemRight: {
      color: theme.text_2,
      fontFamily: theme.font_bold,
      fontSize: 15,
      letterSpacing: 0.15,
    },
    listItemRightIcon: {
      flexDirection: 'row',
      alignSelf: 'center',
    },
    listMainItem: {
      flexDirection: 'row',
      alignSelf: 'center',
      paddingVertical: height * 0.01,
    },
    rightTextStyle: {
      color: theme.text_2,
      fontSize: 15,
      paddingHorizontal: 20,
      fontStyle: 'normal',
      fontFamily: theme.font_regular,
    },
    toggleOuter: {
      flexDirection: 'row',
      alignItems: 'center',
      width: width * 0.14,
      height: 28,
      borderColor: theme.border_1,
      paddingHorizontal: 1,
      borderWidth: 1,
      borderRadius: 20,
    },
    toggleInner: {
      width: width * 0.075,
      height: 24,
      borderColor: theme.border_1,
      backgroundColor: '#fff',
      borderWidth: 1,
      borderRadius: 20,
    },
  });
};

export default StyleSheetFactory;

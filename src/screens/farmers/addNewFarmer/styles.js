import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background_1,
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
      width: 70,
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
  });
};

export default StyleSheetFactory;

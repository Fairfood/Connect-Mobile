import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const StyleSheetFactory = () => {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    headerWrap: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: width * 0.05,
    },
  });
};

export default StyleSheetFactory;

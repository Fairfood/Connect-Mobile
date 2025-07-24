import { StyleSheet } from 'react-native';

const StyleSheetFactory = () => {
  return StyleSheet.create({
    container: {
      width: '90%',
      padding: 15,
      borderRadius: 10,
      borderLeftWidth: 5,
    },
    text1: {
      fontSize: 15,
      color: '#000000',
      fontFamily: 'Moderat-Bold',
    },
    text2: {
      fontSize: 15,
      color: '#000000',
      fontFamily: 'Moderat-Regular',
      marginTop: 2,
    },
  });
};

export default StyleSheetFactory;

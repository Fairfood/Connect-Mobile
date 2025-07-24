import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background_1,
    },
    invoiceImage: {
      height: '100%',
      width: '100%',
      borderWidth: 1,
      backgroundColor: '#000000',
      alignSelf: 'center',
    },
  });
};

export default StyleSheetFactory;

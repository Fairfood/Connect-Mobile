import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);
  return StyleSheet.create({
    container: {
      backgroundColor: '#F2F2F2',
      width: width * 0.135,
      height: width * 0.135,
      borderRadius: (width * 0.135) / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarNameStyleDefault: {
      color: '#ffffff',
      fontSize: 16,
      fontFamily: theme.font_bold,
    },
  });
};

export default StyleSheetFactory;

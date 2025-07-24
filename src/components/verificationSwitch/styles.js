import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    methodSwitchWrap: {
      width: width * 0.08,
      height: width * 0.08,
      borderRadius: theme.border_radius,
      backgroundColor: '#B2DFF8',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 15,
    },
  });
};

export default StyleSheetFactory;

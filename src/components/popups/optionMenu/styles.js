import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      width: width * 0.4,
      backgroundColor: theme.background_1,
      borderRadius: theme.border_radius,
      zIndex: 99,
      position: 'absolute',
      top: height * 0.07,
      right: 10,
      borderColor: theme.border_1,
      borderWidth: 2,
    },
    listItem: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      padding: width * 0.025,
      borderBottomColor: theme.border_1,
      borderBottomWidth: 1,
    },
    listItemText: {
      width: width * 0.25,
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontSize: 15,
      marginLeft: width * 0.025,
    },
  });
};

export default StyleSheetFactory;

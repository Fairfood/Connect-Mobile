import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { height } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    modalContainer: {
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 58, 96, 0.2)',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalContentWrap: {
      width: '100%',
      height: height * 0.125,
      flexDirection: 'row',
      backgroundColor: '#ffffff',
      paddingVertical: 10,
    },
    galleyText: {
      color: theme.text_1,
      textAlign: 'center',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 15,
    },
    iconWrap: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingLeft: 25,
    },
    topSection: {
      height: height * 0.875,
      width: '100%',
    },
    galleryImage: {
      height: height * 0.07,
      width: height * 0.07,
      borderRadius: theme.border_radius,
    },
    cameraImage: {
      height: height * 0.08,
      width: height * 0.08,
      borderRadius: theme.border_radius,
    },
  });
};

export default StyleSheetFactory;

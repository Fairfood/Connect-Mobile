import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background_1,
    },
    topSection: {
      width,
      height: height * 0.4,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.header_bg,
    },
    bottomSection: {
      width,
      height: height * 0.6,
      alignItems: 'center',
    },
    newFarmWrap: {
      flex: 1,
      alignItems: 'center',
      paddingHorizontal: width * 0.1,
      paddingVertical: width * 0.15,
    },
    fieldWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
    },
    detailsText: {
      color: theme.text_1,
      fontSize: 16,
      fontFamily: theme.font_medium,
      marginBottom: 10,
    },
    successTitle: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 20,
      textAlign: 'center',
      marginTop: 30,
    },
    person: {
      backgroundColor: '#F2F2F2',
      height: 70,
      width: 70,
      borderRadius: 70 / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarNameStyle: {
      color: '#ffffff',
      fontSize: 20,
      fontFamily: theme.font_bold,
    },
    title: {
      color: theme.text_1,
      fontSize: 16,
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      marginTop: 10,
      textAlign: 'center',
    },
    subtitle: {
      color: theme.placeholder,
      fontSize: 15,
      fontFamily: theme.font_regular,
      fontWeight: 'normal',
      fontStyle: 'normal',
      marginTop: 10,
      textAlign: 'center',
    },
    buttonWrap: {
      width: width * 0.85,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 'auto',
    },
    cardFieldText: {
      color: theme.placeholder,
      fontSize: 16,
      fontFamily: theme.font_regular,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      marginTop: 10,
    },
  });
};

export default StyleSheetFactory;

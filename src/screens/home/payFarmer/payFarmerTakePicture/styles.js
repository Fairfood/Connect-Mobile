import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'column',
      backgroundColor: '#4F4F4F',
      marginBottom: 10,
    },
    preview: {
      height: height * 0.7,
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    capture: {
      flex: 1,
      borderRadius: theme.border_radius,
      padding: 15,
      paddingHorizontal: 20,
      alignSelf: 'center',
      margin: 20,
      position: 'absolute',
      bottom: 20,
      left: 110,
    },
    addIcon: {
      height: 65,
      width: 65,
      borderRadius: 62,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 0.5,
      backgroundColor: 'black',
      borderColor: theme.background_1,
      bottom: 0,
    },
    detail: {
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 20,
    },
    textDetails: {
      fontSize: 15,
      color: theme.text_4,
    },
    infoHeader: {
      fontSize: 15,
      color: '#ffb74d',
      fontWeight: '600',
    },
    infoMessage: {
      fontSize: 15,
      color: theme.text_4,
      marginTop: 3,
    },
    infoMsgContainer: {
      backgroundColor: '#60605F',
      flexDirection: 'row',
      padding: width * 0.03,
      justifyContent: 'space-between',
      borderRadius: theme.border_radius,
    },
    infoCloseWrap: {
      justifyContent: 'center',
      alignSelf: 'flex-end',
      alignItems: 'center',
      width: width * 0.05,
      height: width * 0.05,
      borderRadius: (width * 0.05) / 2,
    },
    infoIconWrap: {
      alignSelf: 'flex-end',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 10,
    },
    errorMessage: {
      fontSize: 15,
      fontFamily: theme.font_regular,
      lineHeight: 28,
      paddingBottom: 10,
      textAlign: 'center',
      color: theme.button_bg_1,
    },
  });
};

export default StyleSheetFactory;

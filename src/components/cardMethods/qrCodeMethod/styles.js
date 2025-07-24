import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const StyleSheetFactory = () => {
  const { width, height } = Dimensions.get('window');
  const { theme } = useSelector((state) => state.common);

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
    noCardButton: {
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
    },
    qrCodeBox: {
      width: width * 0.6,
      height: width * 0.6,
      borderRadius: theme.border_radius,
      borderColor: '#4DCAF4',
      borderWidth: 3,
      top: height * 0.17,
      alignSelf: 'center',
      zIndex: 99,
      position: 'absolute',
    },
    qrNoCardButton: {
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    bottomButtonsWrap: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      top: height * 0.49,
      zIndex: 99,
      position: 'absolute',
    },
    flashIconWrap: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    scanning: {
      color: theme.text_1,
      fontWeight: 'normal',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 15,
      textAlign: 'center',
      marginVertical: 10,
      marginLeft: 10,
    },
    qrScanning: {
      color: '#ffffff',
      fontFamily: theme.font_regular,
      fontSize: 15,
      textAlign: 'center',
      marginVertical: 10,
    },
    qrInfoWrap: {
      backgroundColor: theme.text_2,
      flexDirection: 'row',
      width: '95%',
      paddingHorizontal: width * 0.05,
      paddingVertical: width * 0.02,
      alignSelf: 'center',
      borderRadius: theme.border_radius,
    },
    topContainerWrap: {
      top: 10,
      zIndex: 99,
      position: 'absolute',
    },
    policyText: {
      fontFamily: theme.font_medium,
      fontSize: 15,
      color: '#FFFFFF',
    },
    cardReadingWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
    },
    cardWrapper: {
      marginTop: 'auto',
      backgroundColor: theme.background_2,
      marginBottom: 10,
      paddingHorizontal: width * 0.05,
    },
    qrHelpMessage: {
      fontFamily: theme.font_medium,
      fontSize: 15,
      color: theme.text_1,
      textAlign: 'center',
    },
    qrHelpCloseText: {
      fontFamily: theme.font_medium,
      fontSize: 15,
      color: theme.text_1,
      marginTop: height * 0.05,
      textAlign: 'center',
      textDecorationLine: 'underline',
    },
    helpWrap: {
      alignSelf: 'center',
      alignItems: 'center',
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

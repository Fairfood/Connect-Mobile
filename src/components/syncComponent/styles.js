import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    containerSub: {
      marginTop: 'auto',
      paddingHorizontal: width * 0.05,
      paddingVertical: width * 0.07,
      backgroundColor: '#ffffff',
    },
    closeIconWrap: {
      alignSelf: 'flex-end',
      marginBottom: width * 0.07,
    },
    topSectionWrap: {
      padding: width * 0.05,
      backgroundColor: theme.background_2,
      marginBottom: width * 0.05,
    },
    titleText: {
      color: theme.text_1,
      fontSize: 16,
      fontFamily: theme.font_bold,
    },
    lastSyncedText: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_medium,
      lineHeight: 25,
    },
    syncWaring: {
      color: theme.text_2,
      fontSize: 15,
      fontFamily: theme.font_regular,
      fontWeight: '500',
      marginTop: 10,
      lineHeight: 20,
    },
    progressBarWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: width * 0.05,
    },
    syncingText: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_bold,
    },
    percentageText: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
    },
    syncFieldsWrap: {
      flexDirection: 'row',
      paddingVertical: width * 0.03,
      borderBottomColor: theme.border_1,
    },
    leftImageWrap: {
      width: '15%',
      justifyContent: 'center',
      paddingLeft: 5,
    },
    fieldTitle: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_medium,
    },
    fieldSubTitle: {
      color: theme.text_2,
      fontSize: 15,
      fontFamily: theme.font_regular,
      fontWeight: '500',
      lineHeight: 25,
    },
    fieldLoadingWrap: {
      width: '15%',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};

export default StyleSheetFactory;

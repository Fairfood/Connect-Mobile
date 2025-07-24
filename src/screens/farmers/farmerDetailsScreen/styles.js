import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background_1,
    },
    topSectionWrap: {
      width: '100%',
      paddingHorizontal: '5%',
      paddingBottom: '5%',
      backgroundColor: theme.background_2,
    },
    formTitleContainer: {
      marginHorizontal: 25,
      marginVertical: 7,
      width: '80%',
    },
    cardValueWrap: {
      marginTop: 5,
    },
    fieldValue: {
      fontFamily: theme.font_regular,
      letterSpacing: 0.3,
      fontSize: 15,
      marginBottom: 10,
      color: theme.text_2,
    },
    tabOneTop: {
      marginHorizontal: 25,
      marginTop: 30,
      marginBottom: 20,
      width: '90%',
    },
    formTitle: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 16,
      letterSpacing: 0.3,
    },
    cardStatusTitle: {
      fontFamily: theme.font_regular,
      letterSpacing: 0.3,
      fontSize: 15,
      marginBottom: 10,
      color: theme.text_2,
    },
    horizontalLine: {
      borderBottomWidth: 1,
      borderColor: theme.border_1,
      marginHorizontal: 18,
      marginBottom: 10,
    },
    headerWrap: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    proPic: {
      width: 70,
      height: 70,
      borderRadius: 60,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarNameStyle: {
      color: '#ffffff',
      fontSize: 22,
      fontFamily: theme.font_bold,
    },
    nameText: {
      color: theme.text_1,
      fontFamily: theme.font_medium,
      fontSize: 18,
      letterSpacing: 0.3,
      lineHeight: 24,
    },
    phoneText: {
      fontSize: 15,
      color: theme.text_1,
      marginTop: 5,
    },
    syncWarningWrap: {
      backgroundColor: theme.background_2,
      justifyContent: 'flex-start',
      alignItems: 'center',
      flexDirection: 'row',
      paddingVertical: 10,
      marginTop: 20,
      marginBottom: 0,
    },
    syncMsg: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_medium,
      fontStyle: 'normal',
      fontSize: 15,
      letterSpacing: 0.3,
      marginVertical: 5,
    },
    tabItemWrap: {
      borderBottomWidth: 4,
      width: '50%',
      height: 40,
    },
    tabItemTitle: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 15,
      letterSpacing: 0.3,
      alignSelf: 'center',
    },
    emptyWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 20,
    },
    cardView: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    flatListStyle: {
      flex: 1,
      backgroundColor: theme.background_1,
    },
  });
};

export default StyleSheetFactory;

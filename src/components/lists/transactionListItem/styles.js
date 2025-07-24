import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignSelf: 'center',
      justifyContent: 'space-between',
      alignContent: 'space-between',
      width: '100%',
      paddingHorizontal: 15,
      paddingTop: 15,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border_1,
    },
    person: {
      backgroundColor: '#F2F2F2',
      height: 50,
      width: 50,
      borderRadius: 50 / 2,
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 10,
    },
    title: {
      fontSize: 16,
      fontFamily: theme.font_regular,
      fontWeight: '500',
      fontStyle: 'normal',
      textTransform: 'capitalize',
    },
    subtitle: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
      textAlign: 'left',
      marginTop: 8,
    },
    quantityText: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      textAlign: 'left',
      fontSize: 17,
      alignSelf: 'flex-end',
    },
    dateText: {
      fontSize: 15,
      fontFamily: theme.font_regular,
      marginVertical: 8,
      color: theme.text_3,
      textAlign: 'right',
    },
    horizontal_line: {
      borderBottomWidth: 1,
      borderColor: theme.border_1,
      marginHorizontal: 30,
    },
    symbolText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontFamily: theme.font_bold,
    },
    historyViewWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 5,
    },
    syncPendingIconWrap: {
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      marginRight: 2,
      marginTop: 3,
    },
    syncErrorIconWrap: {
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      marginRight: 3,
    },
    leftSideWrap: {
      width: '55%',
    },
    rightSideWrap: {
      width: '45%',
      paddingRight: 10,
    },
    avatarNameStyle: {
      color: '#ffffff',
      fontSize: 17,
      fontFamily: theme.font_bold,
    },
    paymentWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      width,
    },
    paymentLeftSideWrap: {
      width: '50%',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
    },
    paymentRightSideWrap: {
      width: '40%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    reportSectionWrap: {
      width: '90%',
      alignSelf: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 5,
    },
    reportTitleText: {
      color: theme.text_2,
      fontFamily: theme.font_regular,
      fontSize: width * 0.035,
    },
    reportButtonText: {
      color: theme.primary,
      fontFamily: theme.font_medium,
      fontSize: width * 0.035,
    },
  });
};

export default StyleSheetFactory;

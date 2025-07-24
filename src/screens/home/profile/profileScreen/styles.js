import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      height: '100%',
      backgroundColor: theme.background_1,
    },
    subContainer: {
      flex: 1,
    },
    logoContainer: {
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      marginTop: 5,
    },
    versionText: {
      fontSize: 15,
      fontFamily: theme.font_regular,
      lineHeight: 28,
      paddingBottom: 10,
      textAlign: 'left',
      marginRight: 30,
      color: theme.text_1,
      opacity: 0.7,
    },
    firstSectionWrap: {
      backgroundColor: theme.background_2,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: height * 0.045,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    nameText: {
      color: theme.text_1,
      fontFamily: theme.font_bold,
      fontSize: width * 0.05,
      marginTop: 15,
    },
    companyWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 7,
    },
    emailWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 7,
    },
    companyText: {
      color: theme.text_2,
      fontSize: width * 0.04,
      fontFamily: theme.font_medium,
    },
    companyName: {
      color: theme.text_1,
      fontSize: width * 0.04,
      fontFamily: theme.font_medium,
    },
    emailText: {
      fontSize: width * 0.038,
      color: theme.text_2,
      fontFamily: theme.font_regular,
      marginLeft: 5,
    },
    listItem: {
      width: '100%',
      height: 40,
      justifyContent: 'space-between',
      alignContent: 'space-between',
      flexDirection: 'row',
      marginVertical: 5,
    },
    listItemLeft: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 16,
      letterSpacing: 0.15,
    },
    listItemRightIcon: {
      flexDirection: 'row',
      alignSelf: 'center',
    },
    headerContainer: {
      alignItems: 'flex-start',
      marginTop: 15,
    },
    headerContainerSub: {
      alignContent: 'space-around',
      flexDirection: 'row',
    },
    leftIconsWrap: {
      flexDirection: 'row',
      marginTop: 10,
    },
    editProfileWrap: {
      flex: 1,
      flexDirection: 'row',
      alignContent: 'flex-end',
      justifyContent: 'flex-end',
    },
    proPic: {
      width: 90,
      height: 90,
      borderRadius: 90 / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    footer: {
      marginBottom: 20,
      justifyContent: 'flex-end',
    },
    logo: {
      height: 25,
      width: width * 0.35,
      resizeMode: 'contain',
    },
    rightTextStyle: {
      color: theme.text_2,
      fontSize: 15,
      paddingHorizontal: 20,
      fontStyle: 'normal',
      fontFamily: theme.font_regular,
    },
    avatarNameStyle: {
      color: theme.text_4,
      fontSize: 24,
      fontFamily: theme.font_bold,
    },
    updateIndication: {
      backgroundColor: 'red',
      width: 7,
      height: 7,
      borderRadius: 7 / 2,
      marginTop: 5,
      marginLeft: 2,
    },
  });
};

export default StyleSheetFactory;

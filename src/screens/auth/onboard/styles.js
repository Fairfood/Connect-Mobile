import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { height, width } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#92DDF6',
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: theme.border_radius,
      marginHorizontal: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
    },
    carouselWrap: {
      height: '55%',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: '#92DDF6',
      width: '100%',
    },
    titleText: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontSize: 15,
      letterSpacing: 0.5,
      lineHeight: 24,
      marginBottom: 10,
    },
    itemTitleText: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_bold,
      fontStyle: 'normal',
      fontSize: 16,
      letterSpacing: 1.0,
      lineHeight: 24,
      textAlign: 'center',
      marginTop: 10,
    },
    itemSubTitleText: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 15,
      letterSpacing: 0,
      lineHeight: 24,
      textAlign: 'center',
    },
    itemContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    imageStyle: {
      width: width * 0.7,
      height: height * 0.3,
      borderRadius: theme.border_radius,
    },
    itemTextWrap: {
      width: width * 0.8,
    },
    secondWrap: {
      flex: 1,
      justifyContent: 'flex-end',
      marginBottom: 0,
      backgroundColor: theme.background_1,
      padding: width * 0.05,
    },
    secondSubWrap: {
      flex: 1,
      justifyContent: 'center',
      alignSelf: 'center',
    },
    ellipsis: {
      marginTop: -5,
      letterSpacing: -1,
      fontSize: 20,
    },
    retryWrap: {
      width: '100%',
      alignSelf: 'flex-end',
      marginTop: 'auto',
      padding: width * 0.05,
      backgroundColor: '#ffffff',
    },
    buttonWrap: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 15,
    },
    image: {
      width: '100%',
      height: 200,
    },
    farmerSyncWrap: {
      width: '100%',
      backgroundColor: theme.background_2,
      flexDirection: 'row',
      alignItems: 'center',
      padding: width * 0.05,
    },
    farmerSyncTitle: {
      color: theme.text_1,
      fontFamily: theme.font_medium,
      fontSize: 15,
      marginVertical: 5,
    },
    farmerSyncCount: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontSize: 15,
      marginVertical: 5,
    },
    loadingWarp: {
      width: '15%',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};

export default StyleSheetFactory;

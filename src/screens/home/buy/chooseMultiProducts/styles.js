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
    productTitle: {
      fontSize: 18,
      fontFamily: theme.font_medium,
      color: theme.text_1,
      marginVertical: height * 0.03,
      marginHorizontal: width * 0.05,
    },
    itemWrap: {
      marginBottom: height * 0.02,
      padding: width * 0.04,
      borderColor: theme.border_1,
      borderWidth: 1,
      borderRadius: 6,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    imageSection: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerContainer: {
      height: '50%',
      backgroundColor: '#92DDF6',
    },
    topSectionWrap: {
      flex: 1,
      paddingHorizontal: width * 0.05,
    },
    bottomSectionWrap: {
      flex: 1,
      paddingHorizontal: width * 0.05,
    },
    linesImage: {
      width: '100%',
      height: 40,
      bottom: -5,
    },
    itemTextWrap: {
      width: width * 0.8,
      position: 'relative',
    },
    itemTitleText: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_bold,
      fontStyle: 'normal',
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
      marginTop: 10,
    },
    itemText: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontSize: 16,
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
  });
};

export default StyleSheetFactory;

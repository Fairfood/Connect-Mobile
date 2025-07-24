import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    customBoolWrap: {
      marginBottom: 10,
    },
    radioWrap: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
    },
    radioTitle: {
      color: theme.placeholder,
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 15,
      marginBottom: 15,
    },
    radioItemSub: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    radioItemWrap: {
      width: '50%',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      marginLeft: 5,
    },
    radioOuter: {
      height: width * 0.06,
      width: width * 0.06,
      borderRadius: (width * 0.06) / 2,
      justifyContent: 'center',
      alignItems: 'center',
      borderColor: theme.placeholder,
      borderWidth: 1.5,
    },
    radioInner: {
      height: width * 0.04,
      width: width * 0.04,
      borderRadius: (width * 0.04) / 2,
      backgroundColor: theme.text_1,
    },
    countryItems: {
      flex: 1,
      width: '95%',
      alignSelf: 'center',
      height: 40,
      marginTop: 10,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.12)',
      borderRadius: theme.border_radius,
      alignContent: 'center',
      justifyContent: 'center',
    },
    countryItemText: {
      marginLeft: 10,
      fontFamily: theme.font_regular,
      color: theme.text_2,
    },
    countryModalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 58, 96, 0.2);',
    },
    countryModalSub: {
      height: '60%',
      marginTop: 'auto',
      backgroundColor: theme.background_1,
    },
    countryFlatList: {
      flex: 1,
      marginHorizontal: 10,
      backgroundColor: theme.background_1,
      marginBottom: 10,
    },
    radioText: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
      paddingLeft: 5,
    },
    emptyText: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
      textAlign: 'center',
    },
  });
};

export default StyleSheetFactory;

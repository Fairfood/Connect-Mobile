import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#92DDF6',
    },
    tnxSyncWrap: {
      width: '100%',
      backgroundColor: theme.background_2,
      flexDirection: 'row',
      alignItems: 'center',
      padding: width * 0.05,
    },
    tnxSyncErrWrap: {
      width: '100%',
      backgroundColor: '#f9a19a',
      padding: width * 0.05,
    },
    tnxSyncTitle: {
      color: theme.text_1,
      fontFamily: theme.font_medium,
      fontSize: 15,
      marginVertical: 5,
    },
    tnxSyncCount: {
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
    emptyText: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontSize: 16,
      letterSpacing: 0.3,
    },
    header: {
      backgroundColor: '#C5EDFA',
      width,
      paddingVertical: 10,
      paddingHorizontal: '7%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerText: {
      fontFamily: theme.font_medium,
      fontSize: 15,
      color: theme.text_1,
    },
    invoiceText: {
      fontFamily: theme.font_medium,
      fontSize: 15,
      color: theme.text_1,
      marginLeft: 15,
      textDecorationLine: 'underline',
    },
    emptyView: {
      height: 100,
      width: '100%',
      justifyContent: 'center',
      alignSelf: 'center',
      alignItems: 'center',
      marginTop: 30,
      backgroundColor: theme.background_1,
    },
    searchWrap: {
      width: '90%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      alignSelf: 'center',
    },
    sortIconWrap: {
      width: '15%',
      height: 48,
      marginVertical: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background_1,
      borderColor: theme.border_1,
      borderWidth: 1,
      borderRadius: theme.border_radius,
    },
    filterCountWrap: {
      width: 20,
      height: 20,
      borderRadius: theme.border_radius,
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
      top: -1,
      right: -1,
      backgroundColor: '#003A60',
    },
    tabWrap: {
      width: '100%',
      height: height * 0.075,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background_1,
    },
    tabSubWrap: {
      width: '50%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      borderBottomColor: '#003A60',
    },
    tabText: {
      fontSize: 16,
      letterSpacing: 0.3,
      fontFamily: theme.font_regular,
    },
    dropdownMenuWrap: {
      width: width * 0.3,
      position: 'absolute',
      right: '5%',
      top: 140,
      backgroundColor: theme.background_1,
      borderColor: theme.border_1,
      borderWidth: 1,
      zIndex: 99,
    },
    dropdownItemWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderColor: theme.border_1,
      borderWidth: 0.5,
    },
    dropdownItemText: {
      fontSize: 15,
      fontFamily: theme.font_regular,
      color: theme.text_1,
      paddingLeft: 10,
    },
  });
};

export default StyleSheetFactory;

import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.header_bg,
    },
    floatingIcon: {
      position: 'absolute',
      bottom: 20,
      right: -10,
    },
    emptyFarmerText: {
      color: theme.text_1,
      fontWeight: '500',
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontSize: 16,
      letterSpacing: 0.3,
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
    flatListStyle: {
      flex: 1,
      backgroundColor: theme.background_1,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    modalContainerSub: {
      marginTop: 'auto',
      paddingHorizontal: width * 0.05,
      backgroundColor: '#ffffff',
    },
    modalTitleSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: width * 0.05,
      paddingHorizontal: width * 0.03,
    },
    modalItemWrap: {
      padding: width * 0.03,
      marginBottom: width * 0.01,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalItem: {
      color: theme.text_1,
      fontSize: 15,
      fontFamily: theme.font_regular,
    },
    modalTitle: {
      color: theme.text_1,
      fontSize: 17,
      fontFamily: theme.font_medium,
      fontWeight: '500',
      marginTop: 15,
    },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 22 / 2,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioInner: {
      width: 15,
      height: 15,
      borderRadius: 15 / 2,
      backgroundColor: '#4DCAF4',
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
      backgroundColor: '#fff',
      borderColor: theme.border_1,
      borderWidth: 1,
      borderRadius: theme.border_radius,
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

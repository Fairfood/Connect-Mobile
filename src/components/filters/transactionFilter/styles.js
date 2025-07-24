import { StyleSheet, Dimensions } from 'react-native';
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

const StyleSheetFactory = () => {
  const { theme } = useSelector((state) => state.common);

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#ffffff',
    },
    containerSub: {
      flexGrow: 1,
      // marginTop: 'auto',
      padding: width * 0.06,
      backgroundColor: theme.background_1,
    },
    closeIconWrap: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignSelf: 'center',
      marginBottom: width * 0.03,
    },
    fieldTitle: {
      color: theme.text_1,
      fontFamily: theme.font_medium,
      fontSize: 16,
    },
    itemWrap: {
      paddingVertical: 15,
      borderBottomColor: '#E5EBEF',
      borderBottomWidth: 1,
    },
    tnxCheckBox: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 15,
      width: '100%',
    },
    dateItemWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 15,
      width: '100%',
      justifyContent: 'space-between',
    },
    tnxCheckBoxSub: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 40,
    },
    checkBoxOuter: {
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: theme.border_radius,
      borderWidth: 1,
    },
    checkBoxInner: {
      borderRadius: theme.border_radius,
      backgroundColor: '#4DCAF4',
    },
    checkBoxText: {
      color: theme.text_1,
      fontFamily: theme.font_regular,
      fontSize: 16,
      marginLeft: 10,
    },
    productCheckBox: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 20,
    },
    viewMore: {
      color: '#4DCAF4',
      fontFamily: theme.font_regular,
      fontSize: 16,
      marginTop: 15,
    },
    buttonWrap: {
      width: '90%',
      alignSelf: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 15,
      backgroundColor: '#ffffff',
    },
  });
};

export default StyleSheetFactory;

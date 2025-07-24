import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      width,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '5%',
    },
    online: {
      color: '#27AE60',
      fontFamily: theme.font_medium,
      fontSize: 17,
      marginLeft: 10,
    },
    onlineWrap: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconWrap: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    proPic: {
      width: 30,
      height: 30,
      borderRadius: 30 / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    linesImage: {
      width: '100%',
      height: 40,
      position: 'absolute',
      bottom: 0,
    },
    avatarNameStyle: {
      color: theme.text_4,
      fontSize: 15,
      fontFamily: theme.font_bold,
    },
  });
};

export default StyleSheetFactory;

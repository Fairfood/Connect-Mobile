import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import FastImage from 'react-native-fast-image';
import { avatarText } from '../services/commonFunctions';
import { AVATAR_AS_LETTERS } from '../services/constants';

const Avatar = ({
  image = '',
  containerStyle = styles.container,
  avatarBgColor = '#607d8b',
  avatarName,
  avatarNameStyle,
}) => {
  const { theme } = useSelector((state) => state.common);
  const styles = StyleSheetFactory(theme);

  return (
    <>
      {image && image !== '' ? (
        <FastImage
          source={{
            uri: image,
            priority: FastImage.priority.high,
          }}
          style={containerStyle}
        />
      ) : null}

      {(!image || image === '') && (
        <>
          {AVATAR_AS_LETTERS && (
            <View style={[containerStyle, { backgroundColor: avatarBgColor }]}>
              <Text style={avatarNameStyle || styles.avatarNameStyleDefault}>
                {avatarText(avatarName)}
              </Text>
            </View>
          )}

          {!AVATAR_AS_LETTERS && (
            <FastImage
              source={require('../assets/images/person.png')}
              style={containerStyle}
            />
          )}
        </>
      )}
    </>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    container: {
      backgroundColor: '#F2F2F2',
      height: 50,
      width: 50,
      borderRadius: 50 / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarNameStyleDefault: {
      color: '#ffffff',
      fontSize: 16,
      fontFamily: theme.font_bold,
    },
  });
};

export default Avatar;

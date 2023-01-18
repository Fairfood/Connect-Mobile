import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FastImage from 'react-native-fast-image';

import { avatarText } from '../services/commonFunctions';
import * as consts from '../services/constants';

const Avatar = ({
  image = '',
  containerStyle = styles.container,
  avatarBgColor = '#607d8b',
  avatarName,
  avatarNameStyle = styles.avatarNameStyle,
}) => {
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
          {consts.AVATAR_AS_LETTERS && (
            <View style={[containerStyle, { backgroundColor: avatarBgColor }]}>
              <Text style={avatarNameStyle}>{avatarText(avatarName)}</Text>
            </View>
          )}

          {!consts.AVATAR_AS_LETTERS && (
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F2F2',
    height: 50,
    width: 50,
    borderRadius: 50 / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarNameStyle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: consts.FONT_BOLD,
  },
});

export default Avatar;

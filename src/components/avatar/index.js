import React from 'react';
import { View, Text } from 'react-native';
import FastImage from 'react-native-fast-image';
import { avatarText } from '../../utils/helperFunctions';
import StyleSheetFactory from './styles';

const Avatar = ({
  image = '',
  containerStyle,
  avatarBgColor = '#607d8b',
  avatarName,
  avatarNameStyle,
}) => {
  const styles = StyleSheetFactory();

  return (
    <View testID="avatar-container">
      {image && image !== '' ? (
        <FastImage
          testID="avatar-image"
          source={{
            uri: image,
            priority: FastImage.priority.high,
          }}
          style={containerStyle || styles.container}
        />
      ) : null}

      {(!image || image === '') && (
        <View
          style={[
            containerStyle || styles.container,
            { backgroundColor: avatarBgColor },
          ]}
        >
          <Text
            testID="avatar-test"
            style={avatarNameStyle || styles.avatarNameStyleDefault}
          >
            {avatarText(avatarName)}
          </Text>
        </View>
      )}
    </View>
  );
};

export default Avatar;

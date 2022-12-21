import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import Icon from '../icons';
import * as consts from '../services/constants';

const SearchComponent = ({ ...props }) => {
  const { placeholder, leftIcon, extraStyle, ...otherProps } = props;
  return (
    <View style={[styles.componentWrap, extraStyle]}>
      <View style={styles.iconWrap}>
        <Icon
          name='search'
          size={16}
          color={consts.TEXT_PRIMARY_LIGHT_COLOR}
          style={{
            alignItems: 'flex-start',
          }}
        />
      </View>

      <TextInput
        style={styles.container}
        placeholder={placeholder}
        placeholderTextColor={consts.TEXT_PRIMARY_LIGHT_COLOR}
        {...otherProps}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  componentWrap: {
    width: '90%',
    marginVertical: 20,
    borderRadius: consts.BORDER_RADIUS,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderColor: consts.BORDER_COLOR,
    borderWidth: 1,
  },
  container: {
    alignSelf: 'center',
    width: '80%',
    borderRadius: consts.BORDER_RADIUS,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 14,
    lineHeight: 24,
    fontFamily: consts.FONT_REGULAR,
    fontStyle: 'normal',
    fontWeight: 'normal',
    backgroundColor: '#ffffff',
    color: consts.TEXT_PRIMARY_LIGHT_COLOR,
  },
  iconWrap: {
    width: '15%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchComponent;

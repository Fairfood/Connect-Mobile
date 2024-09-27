import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import Icon from '../icons';

const SearchComponent = ({ ...props }) => {
  const { placeholder, leftIcon, extraStyle, ...otherProps } = props;
  const { theme } = useSelector((state) => state.common);
  const styles = StyleSheetFactory(theme);

  return (
    <View style={[styles.componentWrap, extraStyle]}>
      <View style={styles.iconWrap}>
        <Icon
          name="search"
          size={16}
          color={theme.text_2}
          style={{
            alignItems: 'flex-start',
          }}
        />
      </View>

      <TextInput
        style={styles.container}
        placeholder={placeholder}
        placeholderTextColor={theme.text_2}
        {...otherProps}
      />
    </View>
  );
};

const StyleSheetFactory = (theme) => {
  return StyleSheet.create({
    componentWrap: {
      width: '90%',
      marginVertical: 20,
      borderRadius: theme.border_radius,
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
      backgroundColor: '#ffffff',
      borderColor: theme.border_1,
      borderWidth: 1,
    },
    container: {
      alignSelf: 'center',
      width: '80%',
      borderRadius: theme.border_radius,
      borderColor: 'rgba(0, 0, 0, 0.12)',
      borderWidth: 0,
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: 14,
      lineHeight: 24,
      fontFamily: theme.font_regular,
      fontStyle: 'normal',
      fontWeight: 'normal',
      backgroundColor: '#ffffff',
      color: theme.text_2,
    },
    iconWrap: {
      width: '15%',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};

export default SearchComponent;

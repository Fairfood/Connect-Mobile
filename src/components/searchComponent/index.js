import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { SearchCardIcon, SearchIcon } from '../../assets/svg';
import { HIT_SLOP_FIFTEEN } from '../../utils/constants';
import StyleSheetFactory from './styles';

const SearchComponent = ({ ...props }) => {
  const { placeholder, extraStyle, onPressRightIcon, ...otherProps } =
    props;
  const { theme } = useSelector((state) => state.common);
  const styles = StyleSheetFactory();

  return (
    <View style={[styles.componentWrap, extraStyle]}>
      <View style={styles.iconWrap}>
        <SearchIcon width={16} height={16} />
      </View>

      <TextInput
        style={[styles.container, { width: onPressRightIcon ? '70%' : '80%' }]}
        placeholder={placeholder}
        placeholderTextColor={theme.text_2}
        testID="search-input"
        {...otherProps}
      />

      {onPressRightIcon && (
        <TouchableOpacity
          onPress={onPressRightIcon}
          style={styles.rightIconWrap}
          hitSlop={HIT_SLOP_FIFTEEN}
          testID="search-icon"
        >
          <SearchCardIcon width={18} height={18} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SearchComponent;

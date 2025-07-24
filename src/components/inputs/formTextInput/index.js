import React from 'react';
import { View, TextInput, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { ArrowDownIcon, EyeCloseIcon, EyeOpenIcon } from '../../../assets/svg';
import StyleSheetFactory from './styles';

const FormTextInput = (props) => {
  const {
    placeholder,
    inputRef,
    secureTextEntry,
    onFocus,
    onBlur,
    mandatory,
    extraStyle = {},
    visibility = true,
    autoCapitalize = 'none',
    internalPadding,
    showPasswords,
    showEye,
    showDropdown,
    error = '',
    returnKeyType = 'next',
    testID = '',
    ...otherProps
  } = props;

  const { theme } = useSelector((state) => state.common);
  const styles = StyleSheetFactory();

  return (
    <View>
      {placeholder && visibility && (
        <View style={styles.titleWrap}>
          <Text style={styles.placeholderText}>
            {` ${placeholder}${mandatory ? '*' : ''} `}
          </Text>
        </View>
      )}

      {visibility && (
        <TextInput
          style={[
            styles.container,
            extraStyle,
            { paddingLeft: internalPadding ?? 15 },
          ]}
          ref={inputRef}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          onFocus={onFocus}
          onBlur={onBlur}
          returnKeyType={returnKeyType}
          testID={testID}
          {...otherProps}
        />
      )}

      {error && <Text style={styles.errorMessage}>{error}</Text>}

      {visibility && (
        <View style={styles.subWrap}>
          {showEye && (
            <TouchableOpacity
              onPress={showPasswords}
              style={styles.showEyeWrap}
            >
              {secureTextEntry && (
                <EyeCloseIcon fill={theme.placeholder} width={28} height={28} />
              )}

              {!secureTextEntry && (
                <EyeOpenIcon fill={theme.placeholder} width={28} height={28} />
              )}
            </TouchableOpacity>
          )}

          {showDropdown && (
            <TouchableOpacity style={styles.dropdownWrap}>
              <View style={{ opacity: 0.5 }}>
                <ArrowDownIcon width={12} height={12} fill={theme.text_1} />
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default FormTextInput;

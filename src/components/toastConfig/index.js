import React from 'react';
import { View, Text } from 'react-native';
import StyleSheetFactory from './styles';

const styles = StyleSheetFactory();
/*
  1. Create the config
*/
const ToastConfig = {
  /*
    2. Add necessary toast types
  */
  success: ({ text1 = 'Success', text2 }) => (
    <View
      style={[
        styles.container,
        { borderLeftColor: '#42d848', backgroundColor: '#dcfbdd' },
      ]}
    >
      <Text style={styles.text1}>{text1}</Text>
      <Text style={styles.text2}>{text2}</Text>
    </View>
  ),
  error: ({ text1 = 'Error', text2 }) => (
    <View
      style={[
        styles.container,
        { borderLeftColor: '#f44336', backgroundColor: '#fcdcd2' },
      ]}
    >
      <Text style={styles.text1}>{text1}</Text>
      <Text style={styles.text2}>{text2}</Text>
    </View>
  ),
  warning: ({ text1 = 'Warning', text2 }) => (
    <View
      style={[
        styles.container,
        { borderLeftColor: '#fcb900', backgroundColor: '#feedd5' },
      ]}
    >
      <Text style={styles.text1}>{text1}</Text>
      <Text style={styles.text2}>{text2}</Text>
    </View>
  ),
  info: ({ text1 = 'Info', text2 }) => (
    <View
      style={[
        styles.container,
        { borderLeftColor: '#03a9f4', backgroundColor: '#d4edfe' },
      ]}
    >
      <Text style={styles.text1}>{text1}</Text>
      <Text style={styles.text2}>{text2}</Text>
    </View>
  ),
};

export default ToastConfig;

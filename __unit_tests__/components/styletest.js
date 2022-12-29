/* eslint-disable no-console */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import CustomButton from '../../src/components/CustomButton';
import * as consts from '../../src/services/constants';

const StyleTest = () => {
  return (
    <View style={styles.body} testID='body'>
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Hello World!</Text>
      </View>

      <CustomButton
        buttonText='Enter username'
        onPress={() => console.log('CustomButton in StyleTest working')}
        testID='pressMeButton'
        accessibilityLabel='Press me'
      />
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    backgroundColor: consts.APP_BG_COLOR, // giving bg color from constants
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: consts.COLOR_PRIMARY,
  },
});

export default StyleTest;

/* eslint-disable import/no-extraneous-dependencies */
import 'react-native';
import React from 'react';
import renderer from 'react-test-renderer';
import App from '../../App';

// Note: test renderer must be required after react-native.

it('renders correctly', () => {
  renderer.create(<App />);
});

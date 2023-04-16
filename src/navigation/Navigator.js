/* eslint-disable import/no-unresolved */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { useSelector } from 'react-redux';
// screens and components
import LoginScreen from '../screens/auth/LoginScreen';
import TabNavigator from './TabNavigator';
import OnBoardingScreen from '../screens/auth/OnBoardingScreen';

const Navigator = () => {
  const { isLoggedIn, loggedInUser } = useSelector((state) => state.login);

  return (
    <NavigationContainer>
      {!isLoggedIn && loggedInUser == null && <LoginScreen />}
      {!isLoggedIn && loggedInUser != null && <OnBoardingScreen />}
      {isLoggedIn && <TabNavigator />}
    </NavigationContainer>
  );
};

export default Navigator;

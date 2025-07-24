import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Config from 'react-native-config';
import { useSelector } from 'react-redux';
// screens and components
import TabNavigator from './TabNavigator';
import AuthStack from './AuthStack';
import OnBoardingScreen from '../screens/auth/onboard';

const Navigator = () => {
  const { isLoggedIn, loggedInUser } = useSelector((state) => state.login);

  const linking = {
    prefixes: [Config.APP_LINK_REDIRECT_URI], // The deep link prefixes to listen for
  };

  return (
    <NavigationContainer linking={linking}>
      {!isLoggedIn && loggedInUser == null && <AuthStack />}
      {!isLoggedIn && loggedInUser != null && <OnBoardingScreen />}
      {isLoggedIn && <TabNavigator />}
    </NavigationContainer>
  );
};

export default Navigator;

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
// screens
import ChooseServerScreen from '../screens/auth/chooseServer';
import LoginScreen from '../screens/auth/login';

const AuthNavigator = createStackNavigator();

const AuthStack = () => {
  return (
    <AuthNavigator.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthNavigator.Screen
        name="ChooseServer"
        component={ChooseServerScreen}
        options={{ unmountOnBlur: true }}
      />
      <AuthNavigator.Screen
        name="Login"
        component={LoginScreen}
        options={{ unmountOnBlur: true }}
      />
    </AuthNavigator.Navigator>
  );
};

export default AuthStack;

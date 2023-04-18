/* eslint-disable import/no-unresolved */
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
// screens
import HomeScreen from '../screens/home/HomeScreen';
import BuyScreen from '../screens/home/BuyScreen';
import SendScreen from '../screens/home/SendScreen';
import VerificationScreen from '../screens/home/VerificationScreen';
import SendVerificationScreen from '../screens/home/SendVerificationScreen';
import TransactionCompleteScreen from '../screens/home/TransactionCompleteScreen';
import TakePicture from '../screens/home/TakePicture';
import SendTakePicture from '../screens/home/SendTakePicture';
import ProfileScreen from '../screens/home/ProfileScreen';
import TransactionDetailsScreen from '../screens/transactions/TransactionDetails';
import SendTransactionDetails from '../screens/transactions/SendTransactionDetails';
import EditProfile from '../screens/home/EditProfile';
import ChangeLanguage from '../screens/home/ChangeLanguage';
import SendTransactionCompleteScreen from '../screens/home/SendTransactionCompleteScreen';
import HelpTutorialScreen from '../screens/home/HelpTutorialScreen';
import SettingsScreen from '../screens/home/SettingsScreen';
import ChooseProducts from '../screens/home/ChooseMutliProducts';

const Home = createStackNavigator();

const HomeStack = () => {
  return (
    <Home.Navigator headerMode='none'>
      <Home.Screen name='Home' component={HomeScreen} />
      <Home.Screen name='Buy' component={BuyScreen} />
      <Home.Screen name='Verification' component={VerificationScreen} />
      <Home.Screen
        name='SendVerificationScreen'
        component={SendVerificationScreen}
      />
      <Home.Screen name='TakePicture' component={TakePicture} />
      <Home.Screen name='SendTakePicture' component={SendTakePicture} />
      <Home.Screen name='Profile' component={ProfileScreen} />
      <Home.Screen name='EditProfile' component={EditProfile} />
      <Home.Screen name='ChangeLanguage' component={ChangeLanguage} />
      <Home.Screen name='Send' component={SendScreen} />
      <Home.Screen
        name='FarmerTransactionDetails'
        component={TransactionDetailsScreen}
      />
      <Home.Screen
        name='HomeSendTransactionDetails'
        component={SendTransactionDetails}
      />
      <Home.Screen
        name='SendTransactionCompleteScreen'
        component={SendTransactionCompleteScreen}
      />
      <Home.Screen name='HelpTutorialScreen' component={HelpTutorialScreen} />
      <Home.Screen name='Settings' component={SettingsScreen} />
      <Home.Screen name='ChooseProducts' component={ChooseProducts} />
      <Home.Screen
        name='TransactionComplete'
        component={TransactionCompleteScreen}
      />
    </Home.Navigator>
  );
};

export default HomeStack;

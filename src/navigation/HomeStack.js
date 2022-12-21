import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/Home/HomeScreen';
import BuyScreen from '../screens/Home/BuyScreen';
import SendScreen from '../screens/Home/SendScreen';
import VerificationScreen from '../screens/Home/VerificationScreen';
import SendVerificationScreen from '../screens/Home/SendVerificationScreen';
import TransactionCompleteScreen from '../screens/Home/TransactionCompleteScreen';
import TakePicture from '../screens/Home/TakePicture';
import SendTakePicture from '../screens/Home/SendTakePicture';
import ProfileScreen from '../screens/Home/ProfileScreen';
import TransactionDetailsScreen from '../screens/Transactions/TransactionDetails';
import SendTransactionDetails from '../screens/Transactions/SendTransactionDetails';
import EditProfile from '../screens/Home/EditProfile';
import ChangeLanguage from '../screens/Home/ChangeLanguage';
import SendTransactionCompleteScreen from '../screens/Home/SendTransactionCompleteScreen';
import HelpTutorialScreen from '../screens/Home/HelpTutorialScreen';
import SettingsScreen from '../screens/Home/SettingsScreen';
import ChooseProducts from '../screens/Home/ChooseMutliProducts';

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

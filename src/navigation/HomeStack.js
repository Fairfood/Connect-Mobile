import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
// screens
import HomeScreen from '../screens/home/dashboard/HomeScreen';
import BuyScreen from '../screens/home/buy/BuyScreen';
import SendScreen from '../screens/home/send/SendScreen';
import VerificationScreen from '../screens/home/buy/VerificationScreen';
import SendVerificationScreen from '../screens/home/send/SendVerificationScreen';
import TransactionCompleteScreen from '../screens/home/buy/TransactionCompleteScreen';
import TakePicture from '../screens/home/buy/TakePicture';
import SendTakePicture from '../screens/home/send/SendTakePicture';
import ProfileScreen from '../screens/home/profile/ProfileScreen';
import TransactionDetailsScreen from '../screens/transactions/TransactionDetails';
import SendTransactionDetails from '../screens/transactions/SendTransactionDetails';
import EditProfile from '../screens/home/profile/EditProfile';
import ChangeLanguage from '../screens/home/profile/ChangeLanguage';
import SendTransactionCompleteScreen from '../screens/home/send/SendTransactionCompleteScreen';
import HelpTutorialScreen from '../screens/home/dashboard/HelpTutorialScreen';
import SettingsScreen from '../screens/home/profile/SettingsScreen';
import ChooseProducts from '../screens/home/buy/ChooseMutliProducts';
import ChooseMultiPremiums from '../screens/home/payfarmer/ChooseMultiPremium';
import PayFarmer from '../screens/home/payfarmer/PayFarmerScreen';
import PayFarmerVerification from '../screens/home/payfarmer/PayFarmerVerificationScreen';
import PayFarmerComplete from '../screens/home/payfarmer/PayFarmerCompleteScreen';
import PayFarmerTakePicture from '../screens/home/payfarmer/PayFarmerTakePicture';

const Home = createStackNavigator();

const HomeStack = () => {
  return (
    <Home.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Home.Screen
        name="Home"
        component={HomeScreen}
        screenOptions={{ headerShown: false }}
      />
      <Home.Screen name="Buy" component={BuyScreen} />
      <Home.Screen name="Verification" component={VerificationScreen} />
      <Home.Screen
        name="SendVerificationScreen"
        component={SendVerificationScreen}
      />
      <Home.Screen name="TakePicture" component={TakePicture} />
      <Home.Screen name="SendTakePicture" component={SendTakePicture} />
      <Home.Screen name="Profile" component={ProfileScreen} />
      <Home.Screen name="EditProfile" component={EditProfile} />
      <Home.Screen name="ChangeLanguage" component={ChangeLanguage} />
      <Home.Screen name="Send" component={SendScreen} />
      <Home.Screen
        name="FarmerTransactionDetails"
        component={TransactionDetailsScreen}
      />
      <Home.Screen
        name="HomeSendTransactionDetails"
        component={SendTransactionDetails}
      />
      <Home.Screen
        name="SendTransactionCompleteScreen"
        component={SendTransactionCompleteScreen}
      />
      <Home.Screen name="HelpTutorialScreen" component={HelpTutorialScreen} />
      <Home.Screen name="Settings" component={SettingsScreen} />
      <Home.Screen name="ChooseProducts" component={ChooseProducts} />
      <Home.Screen
        name="TransactionComplete"
        component={TransactionCompleteScreen}
      />
      <Home.Screen name="ChooseMultiPremiums" component={ChooseMultiPremiums} />
      <Home.Screen name="PayFarmer" component={PayFarmer} />
      <Home.Screen
        name="PayFarmerVerification"
        component={PayFarmerVerification}
      />
      <Home.Screen name="PayFarmerComplete" component={PayFarmerComplete} />
      <Home.Screen
        name="PayFarmerTakePicture"
        component={PayFarmerTakePicture}
      />
    </Home.Navigator>
  );
};

export default HomeStack;

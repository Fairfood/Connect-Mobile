import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
// screens
import HomeScreen from '../screens/home/dashboard/homeScreen';
import BuyScreen from '../screens/home/buy/buyScreen';
import s from '../screens/home/send/sendScreen';
import VerificationScreen from '../screens/home/buy/verificationScreen';
import SendVerificationScreen from '../screens/home/send/sendVerificationScreen';
import TransactionCompleteScreen from '../screens/home/buy/transactionCompleteScreen';
import TakePicture from '../screens/home/buy/takePicture';
import SendTakePicture from '../screens/home/send/sendTakePicture';
import ProfileScreen from '../screens/home/profile/profileScreen';
import TransactionDetailsScreen from '../screens/transactions/transactionDetails';
import EditProfile from '../screens/home/profile/editProfile';
import ChangeLanguage from '../screens/home/profile/changeLanguage';
import SendTransactionCompleteScreen from '../screens/home/send/sendTransactionCompleteScreen';
import HelpTutorialScreen from '../screens/home/dashboard/helpTutorialScreen';
import SettingsScreen from '../screens/home/profile/settingsScreen';
import ChooseProducts from '../screens/home/buy/chooseMultiProducts';
import ChooseMultiPremiums from '../screens/home/payFarmer/chooseMultiPremium';
import PayFarmer from '../screens/home/payFarmer/payFarmerScreen';
import PayFarmerVerification from '../screens/home/payFarmer/payFarmerVerificationScreen';
import PayFarmerComplete from '../screens/home/payFarmer/payFarmerCompleteScreen';
import PayFarmerTakePicture from '../screens/home/payFarmer/payFarmerTakePicture';
import ChangeNumberFormat from '../screens/home/profile/numberFormat';

const HomeNavigator = createStackNavigator();

const HomeStack = () => {
  return (
    <HomeNavigator.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <HomeNavigator.Screen
        name="HomeScreen"
        component={HomeScreen}
        screenOptions={{ headerShown: false }}
      />
      <HomeNavigator.Screen name="Buy" component={BuyScreen} />
      <HomeNavigator.Screen
        name="Verification"
        component={VerificationScreen}
      />
      <HomeNavigator.Screen
        name="SendVerificationScreen"
        component={SendVerificationScreen}
      />
      <HomeNavigator.Screen name="TakePicture" component={TakePicture} />
      <HomeNavigator.Screen
        name="SendTakePicture"
        component={SendTakePicture}
      />
      <HomeNavigator.Screen name="Profile" component={ProfileScreen} />
      <HomeNavigator.Screen name="EditProfile" component={EditProfile} />
      <HomeNavigator.Screen name="ChangeLanguage" component={ChangeLanguage} />
      <HomeNavigator.Screen
        name="ChangeNumberFormat"
        component={ChangeNumberFormat}
      />
      <HomeNavigator.Screen name="Send" component={s} />
      <HomeNavigator.Screen
        name="FarmerTransactionDetails"
        component={TransactionDetailsScreen}
      />
      <HomeNavigator.Screen
        name="SendTransactionCompleteScreen"
        component={SendTransactionCompleteScreen}
      />
      <HomeNavigator.Screen
        name="HelpTutorialScreen"
        component={HelpTutorialScreen}
      />
      <HomeNavigator.Screen name="Settings" component={SettingsScreen} />
      <HomeNavigator.Screen name="ChooseProducts" component={ChooseProducts} />
      <HomeNavigator.Screen
        name="TransactionComplete"
        component={TransactionCompleteScreen}
      />
      <HomeNavigator.Screen
        name="ChooseMultiPremiums"
        component={ChooseMultiPremiums}
      />
      <HomeNavigator.Screen name="PayFarmer" component={PayFarmer} />
      <HomeNavigator.Screen
        name="PayFarmerVerification"
        component={PayFarmerVerification}
      />
      <HomeNavigator.Screen
        name="PayFarmerComplete"
        component={PayFarmerComplete}
      />
      <HomeNavigator.Screen
        name="PayFarmerTakePicture"
        component={PayFarmerTakePicture}
      />
    </HomeNavigator.Navigator>
  );
};

export default HomeStack;

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
// screens
import Farmers from '../screens/farmers/FarmersHomeScreen';
import AddNewFarmer from '../screens/farmers/AddNewFarmer';
import IssueFarmerCard from '../screens/farmers/IssueFarmerCard';
import FarmerDetailsScreen from '../screens/farmers/FarmerDetailsScreen';
import FarmerSuccessScreen from '../screens/farmers/FarmerSuccessScreen';
import EditFarmer from '../screens/farmers/EditFarmer';
import TransactionDetailsScreen from '../screens/transactions/TransactionDetails';

const Farmer = createStackNavigator();

const FarmerStack = () => {
  return (
    <Farmer.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Farmer.Screen name="Farmers" component={Farmers} />
      <Farmer.Screen name="AddNewFarmer" component={AddNewFarmer} />
      <Farmer.Screen name="IssueFarmerCard" component={IssueFarmerCard} />
      <Farmer.Screen name="EditFarmer" component={EditFarmer} />
      <Farmer.Screen name="FarmerDetails" component={FarmerDetailsScreen} />
      <Farmer.Screen
        name="FarmerTransactionDetails"
        component={TransactionDetailsScreen}
      />
      <Farmer.Screen
        name="FarmerSuccessScreen"
        component={FarmerSuccessScreen}
      />
    </Farmer.Navigator>
  );
};

export default FarmerStack;

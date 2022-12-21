import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Farmers from '../screens/Farmers/FarmersHomeScreen';
import AddNewFarmer from '../screens/Farmers/AddNewFarmer';
import IssueFarmerCard from '../screens/Farmers/IssueFarmerCard';
import FarmerDetailsScreen from '../screens/Farmers/FarmerDetailsScreen';
import FarmerSuccessScreen from '../screens/Farmers/FarmerSuccessScreen';
import EditFarmer from '../screens/Farmers/EditFarmer';
import TransactionDetailsScreen from '../screens/Transactions/TransactionDetails';

const Farmer = createStackNavigator();

const FarmerStack = () => {
  return (
    <Farmer.Navigator headerMode='none'>
      <Farmer.Screen name='Farmers' component={Farmers} />
      <Farmer.Screen name='AddNewFarmer' component={AddNewFarmer} />
      <Farmer.Screen name='IssueFarmerCard' component={IssueFarmerCard} />
      <Farmer.Screen name='EditFarmer' component={EditFarmer} />
      <Farmer.Screen name='FarmerDetails' component={FarmerDetailsScreen} />
      <Farmer.Screen
        name='FarmerTransactionDetails'
        component={TransactionDetailsScreen}
      />
      <Farmer.Screen
        name='FarmerSuccessScreen'
        component={FarmerSuccessScreen}
      />
    </Farmer.Navigator>
  );
};

export default FarmerStack;

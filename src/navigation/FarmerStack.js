import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
// screens
import FarmersHomeScreen from '../screens/farmers/farmersHomeScreen';
import AddNewFarmer from '../screens/farmers/addNewFarmer';
import IssueFarmerCard from '../screens/farmers/issueFarmerCard';
import FarmerDetailsScreen from '../screens/farmers/farmerDetailsScreen';
import FarmerSuccessScreen from '../screens/farmers/farmerSuccessScreen';
import EditFarmer from '../screens/farmers/editFarmer';
import TransactionDetailsScreen from '../screens/transactions/transactionDetails';
import SearchCardScreen from '../screens/farmers/searchCardScreen';

const FarmerNavigator = createStackNavigator();

const FarmerStack = () => {
  return (
    <FarmerNavigator.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <FarmerNavigator.Screen
        name="FarmersHomeScreen"
        component={FarmersHomeScreen}
      />
      <FarmerNavigator.Screen name="AddNewFarmer" component={AddNewFarmer} />
      <FarmerNavigator.Screen
        name="IssueFarmerCard"
        component={IssueFarmerCard}
      />
      <FarmerNavigator.Screen name="EditFarmer" component={EditFarmer} />
      <FarmerNavigator.Screen
        name="FarmerDetails"
        component={FarmerDetailsScreen}
      />
      <FarmerNavigator.Screen
        name="FarmerTransactionDetails"
        component={TransactionDetailsScreen}
      />
      <FarmerNavigator.Screen
        name="FarmerSuccessScreen"
        component={FarmerSuccessScreen}
      />
      <FarmerNavigator.Screen name="SearchCard" component={SearchCardScreen} />
    </FarmerNavigator.Navigator>
  );
};

export default FarmerStack;

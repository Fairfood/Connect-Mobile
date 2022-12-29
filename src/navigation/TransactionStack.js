import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
// screens
import Transactions from '../screens/transactions/Transactions';
import TransactionDetails from '../screens/transactions/TransactionDetails';
import SendTransactionDetails from '../screens/transactions/SendTransactionDetails';

const Transaction = createStackNavigator();

const TransactionStack = () => {
  return (
    <Transaction.Navigator headerMode='none'>
      <Transaction.Screen name='Transactions' component={Transactions} />
      <Transaction.Screen
        name='TransactionDetails'
        component={TransactionDetails}
      />
      <Transaction.Screen
        name='SendTransactionDetails'
        component={SendTransactionDetails}
      />
    </Transaction.Navigator>
  );
};

export default TransactionStack;

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import Transactions from '../screens/Transactions/Transactions';
import TransactionDetails from '../screens/Transactions/TransactionDetails';
import SendTransactionDetails from '../screens/Transactions/SendTransactionDetails';

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

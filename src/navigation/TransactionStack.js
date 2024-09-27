import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
// screens
import Transactions from '../screens/transactions/Transactions';
import TransactionDetails from '../screens/transactions/TransactionDetails';
import SendTransactionDetails from '../screens/transactions/SendTransactionDetails';
import ReportTransaction from '../screens/transactions/ReportTransaction';
import ReportPayment from '../screens/transactions/ReportPayment';
import PaymentDetails from '../screens/transactions/PaymentDetails';

const Transaction = createStackNavigator();

const TransactionStack = () => {
  return (
    <Transaction.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Transaction.Screen name="Transactions" component={Transactions} />
      <Transaction.Screen
        name="TransactionDetails"
        component={TransactionDetails}
      />
      <Transaction.Screen
        name="SendTransactionDetails"
        component={SendTransactionDetails}
      />
      <Transaction.Screen
        name="ReportTransaction"
        component={ReportTransaction}
      />
      <Transaction.Screen name="PaymentDetails" component={PaymentDetails} />
      <Transaction.Screen name="ReportPayment" component={ReportPayment} />
    </Transaction.Navigator>
  );
};

export default TransactionStack;

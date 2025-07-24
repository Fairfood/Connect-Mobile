import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
// screens
import TransactionHomeScreen from '../screens/transactions/transactionHomeScreen';
import TransactionDetails from '../screens/transactions/transactionDetails';
import ReportTransaction from '../screens/transactions/reportTransaction';
import ReportPayment from '../screens/transactions/reportPayment';
import PaymentDetails from '../screens/transactions/paymentDetails';

const Transaction = createStackNavigator();

const TransactionStack = () => {
  return (
    <Transaction.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Transaction.Screen
        name="TransactionHomeScreen"
        component={TransactionHomeScreen}
      />
      <Transaction.Screen
        name="TransactionDetails"
        component={TransactionDetails}
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

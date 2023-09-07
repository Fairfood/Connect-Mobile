/* eslint-disable no-shadow */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import HomeStack from './HomeStack';
import FarmerStack from './FarmerStack';
import TransactionStack from './TransactionStack';

import Icon from '../icons';
import I18n from '../i18n/i18n';

const Tabs = createBottomTabNavigator();
const noTabPages = [
  'ChooseProducts',
  'Buy',
  'Verification',
  'SendVerificationScreen',
  'SendTakePicture',
  'TransactionComplete',
  'TakePicture',
  'SendTransactionCompleteScreen',
  'Send',
  'ChooseMultiPremiums',
  'PayFarmer',
  'PayFarmerVerification',
  'PayFarmerComplete',
  'PayFarmerTakePicture',
  'AddNewFarmer',
  'IssueFarmerCard',
  'FarmerSuccessScreen',
  'FarmerTransactionDetails',
  'EditFarmer',
  'Profile',
  'ReportTransaction',
];

const TabNavigator = () => {
  const { footerItems } = useSelector((state) => state.common);

  return (
    <Tabs.Navigator
      initialRouteName={footerItems?.home ?? I18n.t('home')}
      screenOptions={{
        tabBarActiveTintColor: '#314743',
        tabBarInactiveTintColor: '#5691AE',
        headerShown: false,
      }}
      backBehaviour="initialRoute"
    >
      <Tabs.Screen
        name={footerItems?.home ?? I18n.t('home')}
        component={HomeStack}
        options={({ route }) => ({
          tabBarIcon: ({ focused }) => (
            <Icon
              name="home"
              size={20}
              color={focused ? '#314743' : '#5691AE'}
            />
          ),
          tabBarStyle: ((route) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? '';

            if (noTabPages.includes(routeName)) {
              return { display: 'none' };
            }
            return { display: 'flex' };
          })(route),
        })}
      />
      <Tabs.Screen
        name={footerItems?.farmers ?? I18n.t('farmers')}
        component={FarmerStack}
        options={({ route }) => ({
          tabBarIcon: ({ focused }) => (
            <Icon
              name="farmer"
              size={20}
              color={focused ? '#314743' : '#5691AE'}
            />
          ),
          tabBarStyle: ((route) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? '';
            if (noTabPages.includes(routeName)) {
              return { display: 'none' };
            }
            return { display: 'flex' };
          })(route),
        })}
      />
      <Tabs.Screen
        name={footerItems?.transactions ?? I18n.t('transactions')}
        component={TransactionStack}
        options={({ route }) => ({
          tabBarIcon: ({ focused }) => (
            <Icon
              name="transaction"
              size={20}
              color={focused ? '#314743' : '#5691AE'}
            />
          ),
          tabBarStyle: ((route) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? '';
            if (noTabPages.includes(routeName)) {
              return { display: 'none' };
            }
            return { display: 'flex' };
          })(route),
        })}
      />
    </Tabs.Navigator>
  );
};

export default TabNavigator;

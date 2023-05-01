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

const TabNavigator = () => {
  const { footerItems } = useSelector((state) => state.common);

  return (
    <Tabs.Navigator
      initialRouteName={footerItems?.home ?? I18n.t('home')}
      tabBarOptions={{
        activeTintColor: '#003A60',
        inactiveTintColor: '#5691AE',
      }}
      backBehaviour='initialRoute'
    >
      <Tabs.Screen
        name={footerItems?.home ?? I18n.t('home')}
        component={HomeStack}
        options={({ route }) => ({
          tabBarIcon: ({ focused }) => (
            <Icon
              name='home'
              size={20}
              color={focused ? '#314743' : '#5691AE'}
            />
          ),
          tabBarVisible: ((route) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? '';

            if (
              routeName === 'ChooseProducts' ||
              routeName === 'Buy' ||
              routeName === 'Verification' ||
              routeName === 'SendVerificationScreen' ||
              routeName === 'SendTakePicture' ||
              routeName === 'TransactionComplete' ||
              routeName === 'TakePicture' ||
              routeName === 'SendTransactionCompleteScreen' ||
              routeName === 'Send' ||
              routeName === 'ChooseMultiPremiums' ||
              routeName === 'PayFarmer' ||
              routeName === 'PayFarmerVerification' ||
              routeName === 'PayFarmerComplete' ||
              routeName === 'PayFarmerTakePicture'
            ) {
              return false;
            }
            return true;
          })(route),
        })}
      />
      <Tabs.Screen
        name={footerItems?.farmers ?? I18n.t('farmers')}
        component={FarmerStack}
        options={({ route }) => ({
          tabBarIcon: ({ focused }) => (
            <Icon
              name='farmer'
              size={20}
              color={focused ? '#314743' : '#5691AE'}
            />
          ),
          tabBarVisible: ((route) => {
            const routeName = getFocusedRouteNameFromRoute(route) ?? '';
            if (
              routeName === 'AddNewFarmer' ||
              routeName === 'IssueFarmerCard' ||
              routeName === 'FarmerSuccessScreen' ||
              routeName === 'FarmerTransactionDetails' ||
              routeName === 'EditFarmer'
            ) {
              return false;
            }
            return true;
          })(route),
        })}
      />
      <Tabs.Screen
        name={footerItems?.transactions ?? I18n.t('transactions')}
        component={TransactionStack}
        options={() => ({
          tabBarIcon: ({ focused }) => (
            <Icon
              name='transaction'
              size={20}
              color={focused ? '#314743' : '#5691AE'}
            />
          ),
        })}
      />
    </Tabs.Navigator>
  );
};

export default TabNavigator;

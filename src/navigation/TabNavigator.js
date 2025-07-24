import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import {
  FooterFarmerIcon,
  FooterHomeICon,
  FooterTransactionICon,
} from '../assets/svg';
import I18n from '../translations/text/i18n';

import HomeStack from './HomeStack';
import FarmerStack from './FarmerStack';
import TransactionStack from './TransactionStack';

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
  'SearchCard',
];

const TabNavigator = () => {
  const { footerItems } = useSelector((state) => state.common);

  return (
    <Tabs.Navigator
      initialRouteName={footerItems?.home ?? I18n.t('home')}
      screenOptions={{
        tabBarActiveTintColor: '#314743',
        tabBarInactiveTintColor: '#5691AE',
        tabBarItemStyle: { paddingBottom: 5 },
        headerShown: false,
      }}
      backBehaviour="initialRoute"
    >
      <Tabs.Screen
        name={footerItems?.home ?? I18n.t('home')}
        component={HomeStack}
        options={({ route }) => ({
          tabBarTestID: 'footer-home-icon',
          tabBarIcon: ({ focused }) => (
            <FooterHomeICon
              fill={focused ? '#314743' : '#5691AE'}
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
          tabBarTestID: 'footer-farmer-icon',
          tabBarIcon: ({ focused }) => (
            <FooterFarmerIcon
              width={22}
              height={22}
              fill={focused ? '#314743' : '#5691AE'}
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
          tabBarTestID: 'footer-transaction-icon',
          tabBarIcon: ({ focused }) => (
            <FooterTransactionICon
              width={22}
              height={22}
              fill={focused ? '#314743' : '#5691AE'}
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

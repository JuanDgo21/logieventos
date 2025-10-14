import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome5 } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ContractsStack from './ContractsStack';
import EventsStack from '../navigation/EventsStack';
import ProfileScreen from '../screens/ProfileScreen';
import PersonnelDashboardScreen from '../screens/PersonnelDashboardScreen';
import PersonnelStack from './PersonnelStack';

export type AppTabsParamList = {
  Home: undefined;
  Contratos: undefined;
  Eventos: undefined;
  Personal: undefined;
  Perfil: undefined;
};

const Tab = createBottomTabNavigator<AppTabsParamList>();

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#9370DB',
        tabBarInactiveTintColor: '#ccc',
        tabBarStyle: {
          backgroundColor: '#1a0a38',
          borderTopWidth: 0,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Contratos"
        component={ContractsStack}
        options={{
          tabBarLabel: 'Contratos',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="file-contract" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Eventos"
        component={EventsStack}
        options={{
          tabBarLabel: 'Eventos',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="calendar-alt" color={color} size={size} />
          ),
        }}
      />
      {/* Cambiar "Personnel" por "Personal" para que coincida con el tipo */}
      <Tab.Screen
          name="Personal"
          component={PersonnelStack}
          options={{
            tabBarLabel: 'Personal',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="users" color={color} size={size} />
            ),
          }}
        />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Mi Perfil',
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="user-circle" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
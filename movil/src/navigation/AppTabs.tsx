import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FontAwesome5 } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ContractsStack from './ContractsStack';
import EventsStack from '../navigation/EventsStack';
import ProfileScreen from '../screens/ProfileScreen';
import PersonnelStack from './PersonnelStack';

export type AppTabsParamList = {
  Home: undefined;
  Contratos: undefined;
  Eventos: undefined;
  Personal: undefined;
  Perfil: undefined;
};

// ✅ INICIO CORRECCIÓN (S6478)
// Se mueven las funciones de renderizado de iconos fuera del componente
// para darles una identidad estable y evitar re-renders.

type TabBarIconProps = {
  color: string;
  size: number;
};

const renderHomeIcon = ({ color, size }: TabBarIconProps) => (
  <FontAwesome5 name="home" color={color} size={size} />
);

const renderContractsIcon = ({ color, size }: TabBarIconProps) => (
  <FontAwesome5 name="file-contract" color={color} size={size} />
);

const renderEventsIcon = ({ color, size }: TabBarIconProps) => (
  <FontAwesome5 name="calendar-alt" color={color} size={size} />
);

const renderPersonnelIcon = ({ color, size }: TabBarIconProps) => (
  <FontAwesome5 name="users" color={color} size={size} />
);

const renderProfileIcon = ({ color, size }: TabBarIconProps) => (
  <FontAwesome5 name="user-circle" color={color} size={size} />
);
// ✅ FIN CORRECCIÓN

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
          tabBarIcon: renderHomeIcon, // ✅ Usamos la función estable
        }}
      />
      <Tab.Screen
        name="Contratos"
        component={ContractsStack}
        options={{
          tabBarLabel: 'Contratos',
          tabBarIcon: renderContractsIcon, // ✅ Usamos la función estable
        }}
      />
      <Tab.Screen
        name="Eventos"
        component={EventsStack}
        options={{
          tabBarLabel: 'Eventos',
          tabBarIcon: renderEventsIcon, // ✅ Usamos la función estable
        }}
      />
      <Tab.Screen
          name="Personal"
          component={PersonnelStack}
          options={{
            tabBarLabel: 'Personal',
            tabBarIcon: renderPersonnelIcon, // ✅ Usamos la función estable
          }}
        />
      <Tab.Screen
        name="Perfil" // ✅ CORRECCIÓN (BUG): "Profile" cambiado a "Perfil" para coincidir con el tipo
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Mi Perfil',
          tabBarIcon: renderProfileIcon, // ✅ Usamos la función estable
        }}
      />
    </Tab.Navigator>
  );
}
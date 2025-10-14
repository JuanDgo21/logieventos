// C:\Users\Juana\OneDrive\Documentos\logieventos\movil\src\navigation\PersonnelStack.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PersonnelDashboardScreen from '../screens/PersonnelDashboardScreen';
import PersonnelListScreen from '../screens/PersonnelListScreen';
import PersonnelFormScreen from '../screens/PersonnelFormScreen';
import PersonnelTypeListScreen from '../screens/PersonnelTypeListScreen';
import PersonnelTypeFormScreen from '../screens/PersonnelTypeFormScreen';

export type PersonnelStackParamList = {
  PersonnelDashboard: undefined;
  PersonnelList: undefined;
  PersonnelForm: {
    personnelId?: string;
    handleCreatePersonnel?: (data: import('../types/personnel').NewPersonnel) => Promise<void>;
    handleEditPersonnel?: (id: string, data: import('../types/personnel').UpdatePersonnel) => Promise<void>;
  };
  PersonnelTypeList: undefined;
  PersonnelTypeForm: { typeId?: string };
};

const Stack = createStackNavigator<PersonnelStackParamList>();

const PersonnelStack: React.FC = () => {
  const { user } = require('../contexts/AuthContext').useAuth();
  // Normalize role check similar to service
  const normalize = (s?: string) => (s || '').toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const isAdmin = !!user && (normalize(user.role) === 'admin' || (Array.isArray(user.roles) && user.roles.some((r: string) => normalize(r) === 'admin')));

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a0a38',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="PersonnelDashboard" 
        component={PersonnelDashboardScreen}
        options={{ title: 'Dashboard de Personal' }}
      />
      <Stack.Screen 
        name="PersonnelList" 
        component={PersonnelListScreen}
        options={{ title: 'Gestión de Personal' }}
      />
      <Stack.Screen 
        name="PersonnelForm" 
        component={PersonnelFormScreen}
        options={{ title: 'Formulario de Personal' }}
      />
      {isAdmin && (
        <Stack.Screen 
          name="PersonnelTypeList" 
          component={PersonnelTypeListScreen}
          options={{ title: 'Categorías de Personal' }}
        />
      )}
      {isAdmin && (
        <Stack.Screen 
          name="PersonnelTypeForm" 
          component={PersonnelTypeFormScreen}
          options={{ title: 'Formulario de Categoría' }}
        />
      )}
    </Stack.Navigator>
  );
};

export default PersonnelStack;
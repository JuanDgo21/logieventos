import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ContractsScreen from '../screens/ContractsScreen'; // Asegúrate de la ruta correcta
import ContractFormScreen from '../screens/ContractFormScreen'; // Asegúrate de la ruta correcta

// Define los tipos de las rutas para un mejor control en TypeScript
export type ContractsStackParamList = {
  ContractsList: undefined;
  CreateContract: undefined;
};

const Stack = createNativeStackNavigator<ContractsStackParamList>();

const ContractsStack = () => {
  return (
    <Stack.Navigator initialRouteName="ContractsList">
      <Stack.Screen
        name="ContractsList"
        component={ContractsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ContractForm"
        component={ContractFormScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default ContractsStack;
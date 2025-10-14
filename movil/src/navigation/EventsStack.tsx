import React from 'react';
import { View, Text } from 'react-native'; // Asegúrate de tener estas importaciones básicas
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EventsScreen from '../screens/EventsScreen';
import EventFormScreen from '../screens/EventFormScreen';
import EventTypeFormScreen from '../screens/EventTypeFormScreen';

export type EventsStackParamList = {
  EventsList: undefined;
  EventForm: { eventId?: string };
  EventTypeForm: undefined;
};

const Stack = createNativeStackNavigator<EventsStackParamList>();

const EventsStack = () => {
  return (
    <Stack.Navigator initialRouteName="EventsList">
      <Stack.Screen
        name="EventsList"
        component={EventsScreen} // Aquí se usa el componente importado
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EventForm"
        component={EventFormScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EventTypeForm"
        component={EventTypeFormScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default EventsStack;
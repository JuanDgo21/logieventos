import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from '../components/AppHeader';

const PersonnelScreen = () => {
  // Obtenemos los datos del usuario para pasarlos al AppHeader
  const { user, logout } = useAuth();
  
  // Determinamos si el usuario puede crear otros usuarios (para el botón en el header)
  const canCreateUser = user?.role === 'admin';

  // Placeholder para la funcionalidad de crear usuario
  const handleCreateUser = () => {
    Alert.alert("Funcionalidad pendiente", "Navegar a la pantalla de 'Crear Usuario'");
  };

  return (
    <ScrollView style={styles.container}>
      {/* Reutilizamos el encabezado estándar de la aplicación */}
      <AppHeader
        onLogout={logout}
        canCreateUser={canCreateUser}
      />
      
      {/* Contenido principal de la pantalla */}
      <View style={styles.mainContent}>
        <Text style={styles.welcomeTitle}>Bienvenido a Personal</Text>
        <Text style={styles.welcomeMessage}>
          Aquí se mostrará la lista y gestión del personal.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0a38',
  },
  mainContent: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50, // Espacio para que no quede pegado al header
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  welcomeMessage: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default PersonnelScreen;
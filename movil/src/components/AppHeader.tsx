import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator'; // Asegúrate que la ruta sea correcta

// Define el tipo de navegación para este componente
type AppHeaderNavigationProp = StackNavigationProp<RootStackParamList, 'App'>;

interface AppHeaderProps {
  onLogout: () => void;
  // La prop onCreateUser ya no es necesaria
  canCreateUser: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onLogout, canCreateUser }) => {
  const { user } = useAuth();
  const navigation = useNavigation<AppHeaderNavigationProp>();

  /**
   * Navega a la pantalla de registro de usuarios.
   */
  const handleNavigateToCreateUser = () => {
    navigation.navigate('RegisterUser');
  };

  return (
    // Se utiliza tu estructura y estilos originales
    <View>
      <View style={styles.mainHeader}>
        <View>
          <Text style={styles.appTitle}>LogiEventos</Text>
          <Text style={styles.welcomeText}>¡Bienvenido,</Text>
          <Text style={styles.usernameText}>{user?.username}!</Text>
        </View>
        <View style={styles.headerButtons}>
          {canCreateUser && (
            <TouchableOpacity 
              style={styles.createUserButton} 
              onPress={handleNavigateToCreateUser} // Se llama a la función de navegación
            >
              <FontAwesome5 name="user-plus" size={20} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <FontAwesome5 name="sign-out-alt" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Se utilizan tus estilos originales
const styles = StyleSheet.create({
  mainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50, // Ajusta según necesites para el status bar
    paddingBottom: 10,
    backgroundColor: '#1a0a38', // Aseguramos un fondo consistente
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#9370DB',
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 16,
    color: '#ccc',
  },
  usernameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  createUserButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#9370DB',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44, // Tamaño consistente
    height: 44,
  },
  logoutButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: '#4B0082',
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
  },
});

export default AppHeader;
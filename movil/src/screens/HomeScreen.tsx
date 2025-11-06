/**
 * @file HomeScreen.tsx
 * @description Pantalla principal de la aplicación (Dashboard).
 * ...
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, ColorValue } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator'; // <--- EL ERROR ESTÁ RELACIONADO CON ESTE ARCHIVO
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';
import AppHeader from '../components/AppHeader';

// ... (El resto de tus tipos)

interface DashboardData {
  eventos: number;
  contratos: number;
  personal: number;
  usuariosActivos: number;
}

/**
 * @typedef {StackNavigationProp<RootStackParamList, 'TU_NOMBRE_DE_RUTA_AQUI'>} HomeScreenNavigationProp
 * @description Define el tipo específico para la propiedad de navegación de esta pantalla,
 * asegurando el tipado correcto para las acciones de navegación.
 */

// CORRECCIÓN (TS2344): Reemplaza 'YOUR_ROUTE_NAME_HERE' 
// con el nombre que usaste en tu AppNavigator.ts (ej. "Home", "Dashboard", etc.)
type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

type CounterItem = {
  name: string;
  value: number;
  icon: string;
  colors: readonly [ColorValue, ColorValue];
};

/**
 * @component HomeScreen
 * @description Componente principal que renderiza la pantalla del panel principal.
 */
const HomeScreen = () => {
  // --- HOOKS ---
  const { user, logout, token } = useAuth(); // Hook para obtener datos de autenticación.
  const navigation = useNavigation<HomeScreenNavigationProp>(); // Hook para la navegación.

  // --- ESTADOS DEL COMPONENTE ---
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const canCreateUser = user?.role === 'admin';

  const fetchData = useCallback(async () => {
    setLoading(true);
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const headers = { 'x-access-token': token };

      const results = await Promise.allSettled([
        api.get('/events', { headers }),
        api.get('/contracts', { headers }),
        api.get('/personnel', { headers }),
        api.get('/users', { headers }),
      ]);

      const eventosRes = results[0].status === 'fulfilled' ? results[0].value : null;
      const contratosRes = results[1].status === 'fulfilled' ? results[1].value : null;
      const personalRes = results[2].status === 'fulfilled' ? results[2].value : null;
      const usuariosRes = results[3].status === 'fulfilled' ? results[3].value : null;

      const eventosActivos = eventosRes ? eventosRes.data.data.filter((evento: any) => evento.status === 'en_progreso') : [];
      const usuariosActivos = usuariosRes ? usuariosRes.data.data.filter((usuario: any) => usuario.active === true) : [];

      const data = {
        eventos: eventosActivos.length,
        contratos: contratosRes?.data?.total ?? 0,
        personal: personalRes?.data?.data?.length ?? 0,
        usuariosActivos: usuariosActivos.length,
      };

      setDashboardData(data);

    } catch (error: any) {
      console.error("Error al obtener datos del dashboard:", error);
      Alert.alert("Error", "No se pudieron cargar los datos del dashboard.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation, fetchData]);


  const counters: CounterItem[] = [
    { name: 'Eventos Activos', value: dashboardData?.eventos ?? 0, icon: 'calendar-check', colors: ['#7E57C2', '#512DA8'] },
    { name: 'Contratos', value: dashboardData?.contratos ?? 0, icon: 'file-contract', colors: ['#FF6F61', '#E64A19'] },
    { name: 'Personal', value: dashboardData?.personal ?? 0, icon: 'users', colors: ['#FFA726', '#F57C00'] },
    { name: 'Usuarios Activos', value: dashboardData?.usuariosActivos ?? 0, icon: 'user-plus', colors: ['#9370DB', '#6A5ACD'] },
  ];

  // Renderizado principal del componente.
  return (
    <ScrollView style={styles.container}>
      {/* Componente de encabezado reutilizable */}
      <AppHeader
        onLogout={logout}
        canCreateUser={canCreateUser}
      />
      <View style={styles.mainContent}>
        <Text style={styles.sectionTitle}>Panel Principal</Text>
        
        {/* Contenedor para las tarjetas de resumen numérico */}
        <View style={styles.summaryContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#9370DB" style={{marginTop: 50, width: '100%'}} />
          ) : (
            counters.map((item) => (
              <LinearGradient
                key={item.name}
                colors={item.colors}
                style={styles.summaryCard}>
                <FontAwesome5 name={item.icon as any} size={24} color="#fff" />
                <Text style={styles.summaryNumber}>{item.value}</Text>
                <Text style={styles.summaryText}>{item.name}</Text>
              </LinearGradient>
            ))
          )}
        </View>

        {/* Contenedor para la sección de actividad reciente (con datos estáticos) */}
        <View style={styles.recentActivityContainer}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Actividad Reciente</Text>
            <TouchableOpacity onPress={() => { /* Lógica para navegar a una pantalla de actividad completa */ }}>
              <Text style={styles.viewAllText}>Ver todo &gt;</Text>
            </TouchableOpacity>
          </View>
          {/* Items de actividad estáticos como ejemplo */}
          <View style={styles.activityCard}>
            <FontAwesome5 name="calendar-plus" size={20} color="#66BB6A" style={styles.activityIcon} />
            <View>
              <Text style={styles.activityText}>Nuevo evento "Conferencia Tech" creado</Text>
              <Text style={styles.activityTime}>hace 5 min</Text>
            </View>
          </View>
          <View style={styles.activityCard}>
            <FontAwesome5 name="user-plus" size={20} color="#7E57C2" style={styles.activityIcon} />
            <View>
              <Text style={styles.activityText}>Juan Pérez ha sido añadido al equipo</Text>
              <Text style={styles.activityTime}>hace 30 min</Text>
            </View>
          </View>
          <View style={styles.activityCard}>
            <FontAwesome5 name="exclamation-triangle" size={20} color="#FFA726" style={styles.activityIcon} />
            <View>
              <Text style={styles.activityText}>Problema reportado en el Auditorio</Text>
              <Text style={styles.activityTime}>hace 2h</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

// Hoja de estilos del componente.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0a38',
  },
  mainContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48%',
    height: 120,
    borderRadius: 15,
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  summaryText: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
  recentActivityContainer: {
    backgroundColor: 'rgba(30, 10, 56, 0.8)',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllText: {
    color: '#9370DB',
    fontSize: 14,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityIcon: {
    marginRight: 15,
  },
  activityText: {
    color: '#fff',
    fontSize: 14,
    flexShrink: 1,
  },
  activityTime: {
    color: '#ccc',
    fontSize: 12,
  },
});

export default HomeScreen;
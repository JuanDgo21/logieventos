import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { PersonnelStackParamList } from '../navigation/PersonnelStack';
import usePersonnelService from '../services/personnel-service';
import { useAuth } from '../contexts/AuthContext';

type DashboardNavigationProp = StackNavigationProp<PersonnelStackParamList, 'PersonnelDashboard'>;

const PersonnelDashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNavigationProp>();
  const { user } = useAuth();
  const {
    personnelList,
    personnelTypes,
    loading,
    error,
    refreshData,
  } = usePersonnelService();

  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    onVacation: 0,
    newHires: 0,
  });

  const [departmentDistribution, setDepartmentDistribution] = useState<{
    labels: string[];
    data: number[];
    total: number;
  }>({
    labels: [],
    data: [],
    total: 0,
  });

  // Calcular estadísticas
  useEffect(() => {
    calculateStats();
    calculateDepartmentDistribution();
  }, [personnelList, personnelTypes]);

  const calculateStats = () => {
    const now = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const totalEmployees = personnelList.length;
    const activeEmployees = personnelList.filter(p => 
      p.status === 'disponible' || p.status === 'asignado'
    ).length;
    const onVacation = personnelList.filter(p => p.status === 'vacaciones').length;
    
    const newHires = personnelList.filter(p => {
      const hireDate = new Date(p.createdAt || '');
      return hireDate > lastMonth;
    }).length;

    setStats({
      totalEmployees,
      activeEmployees,
      onVacation,
      newHires,
    });
  };

  const calculateDepartmentDistribution = () => {
    if (!personnelTypes.length || !personnelList.length) {
      setDepartmentDistribution({
        labels: [],
        data: [],
        total: 0,
      });
      return;
    }

    const typeCounts: { [key: string]: number } = {};
    const total = personnelList.length;

    // Contar personal por tipo
    personnelList.forEach(person => {
      const typeId = person.personnelType;
      typeCounts[typeId] = (typeCounts[typeId] || 0) + 1;
    });

    const labels: string[] = [];
    const data: number[] = [];

    // Solo mostrar tipos que tienen personal asignado
    personnelTypes.forEach(type => {
      if (typeCounts[type._id] > 0) {
        labels.push(type.name);
        data.push(typeCounts[type._id]);
      }
    });

    setDepartmentDistribution({
      labels,
      data,
      total,
    });
  };

  const calculatePercentage = (value: number): number => {
    if (departmentDistribution.total === 0) return 0;
    return (value / departmentDistribution.total) * 100;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const quickActions = [
    {
      title: 'Agregar Empleado',
      icon: 'user-plus',
      color: '#6a11cb',
      action: () => navigation.navigate('PersonnelForm' as never),
    },
    {
      title: 'Gestionar Categorías',
      icon: 'tags',
      color: '#38ef7d',
      action: () => navigation.navigate('PersonnelTypeList'),
    },
    {
      title: 'Ver Todo el Personal',
      icon: 'users',
      color: '#f46b45',
      action: () => navigation.navigate('PersonnelList'),
    },
  ];

  // Normalizar roles para decidir visibilidad de acciones
  const normalize = (s?: string) => (s || '').toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const isAdmin = !!user && (normalize(user.role) === 'admin' || (Array.isArray(user.roles) && user.roles.some((r: string) => normalize(r) === 'admin')));
  const visibleQuickActions = quickActions.filter(q => q.title !== 'Gestionar Categorías' || isAdmin);

  const getGradient = (key: string): string => {
    const gradients: { [key: string]: string } = {
      'totalEmployees': '#6a11cb',
      'activeEmployees': '#38ef7d',
      'onVacation': '#f46b45',
      'newHires': '#f9d423',
    };
    return gradients[key] || '#6a11cb';
  };

  const getStatusLabel = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'disponible': 'Disponible',
      'asignado': 'Asignado',
      'vacaciones': 'Vacaciones',
      'inactivo': 'Inactivo',
    };
    return statusMap[status] || 'Desconocido';
  };

  const getTypeName = (personnelType: any): string => {
    if (!personnelType) return 'Sin categoría';
    if (typeof personnelType === 'object' && personnelType.name) {
      return personnelType.name;
    }
    const type = personnelTypes.find(t => t._id === personnelType);
    return type ? type.name : 'Sin categoría';
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <FontAwesome5 name="spinner" size={40} color="#9370DB" />
        <Text style={styles.loadingText}>Cargando datos del personal...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            <FontAwesome5 name="users-cog" size={24} color="#9370DB" /> Panel de Personal
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <FontAwesome5 name="sync-alt" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* User Greeting - CORREGIR con verificación segura */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>
          ¡Hola {user?.role || 'Usuario'}! <Text style={styles.emoji}>👋</Text>
        </Text>
        <Text style={styles.subtitle}>Gestión de recursos humanos en tiempo real</Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryCards}>
        <View style={[styles.summaryCard, { backgroundColor: getGradient('totalEmployees') }]}>
          <View style={styles.cardContent}>
            <View style={styles.cardIcon}>
              <FontAwesome5 name="user-tie" size={20} color="#fff" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardNumber}>{stats.totalEmployees}</Text>
              <Text style={styles.cardLabel}>Total Empleados</Text>
              <Text style={styles.cardSubtext}>+{stats.newHires} este mes</Text>
            </View>
          </View>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: getGradient('activeEmployees') }]}>
          <View style={styles.cardContent}>
            <View style={styles.cardIcon}>
              <FontAwesome5 name="user-check" size={20} color="#fff" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardNumber}>{stats.activeEmployees}</Text>
              <Text style={styles.cardLabel}>Activos</Text>
              <Text style={styles.cardSubtext}>
                {calculatePercentage(stats.activeEmployees).toFixed(0)}% del total
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: getGradient('onVacation') }]}>
          <View style={styles.cardContent}>
            <View style={styles.cardIcon}>
              <FontAwesome5 name="umbrella-beach" size={20} color="#fff" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardNumber}>{stats.onVacation}</Text>
              <Text style={styles.cardLabel}>En Vacaciones</Text>
              <Text style={styles.cardSubtext}>
                {calculatePercentage(stats.onVacation).toFixed(0)}% del total
              </Text>
            </View>
          </View>
        </View>

        {/* 🔥 Nueva tarjeta de Nuevos Contratos */}
        <View style={[styles.summaryCard, { backgroundColor: getGradient('newHires') }]}>
          <View style={styles.cardContent}>
            <View style={styles.cardIcon}>
              <FontAwesome5 name="user-plus" size={20} color="#fff" />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardNumber}>{stats.newHires}</Text>
              <Text style={styles.cardLabel}>Nuevos Contratos</Text>
              <Text style={styles.cardSubtext}>+{stats.newHires} este mes</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            <FontAwesome5 name="bolt" size={18} color="#9370DB" /> Acciones Rápidas
          </Text>
        </View>
        <View style={styles.quickActions}>
          {visibleQuickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.quickAction, { backgroundColor: action.color }]}
              onPress={() => action.action()}
            >
              <View style={styles.actionContent}>
                <FontAwesome5 name={action.icon as any} size={24} color="#fff" />
                <Text style={styles.actionText}>{action.title}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            <FontAwesome5 name="history" size={18} color="#9370DB" /> Últimos Empleados
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('PersonnelForm' as never)}>
            <FontAwesome5 name="plus" size={16} color="#9370DB" />
          </TouchableOpacity>
        </View>
        <View style={styles.activityList}>
          {personnelList.slice(0, 5).map((person, index) => (
            <View key={person._id} style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: getGradient(person.status) }]}>
                <FontAwesome5 name="user" size={16} color="#fff" />
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityName}>
                  {person.firstName} {person.lastName}
                </Text>
                <Text style={styles.activityInfo}>
                  {getTypeName(person.personnelType)} •{' '}
                  <Text style={[
                    styles.statusText,
                    person.status === 'disponible' && styles.statusAvailable,
                    person.status === 'asignado' && styles.statusAssigned,
                    person.status === 'vacaciones' && styles.statusVacation,
                    person.status === 'inactivo' && styles.statusInactive,
                  ]}>
                    {getStatusLabel(person.status)}
                  </Text>
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Department Distribution */}
      {departmentDistribution.labels.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              <FontAwesome5 name="building" size={18} color="#9370DB" /> Distribución por Departamento
            </Text>
          </View>
          <View style={styles.departmentList}>
            {departmentDistribution.labels.map((dept, index) => (
              <View key={index} style={styles.departmentItem}>
                <View style={styles.departmentInfo}>
                  <View 
                    style={[
                      styles.departmentColor,
                      { backgroundColor: getGradient(`dept-${index}`) }
                    ]} 
                  />
                  <Text style={styles.departmentName}>{dept}</Text>
                </View>
                <View style={styles.departmentStats}>
                  <Text style={styles.departmentCount}>
                    {departmentDistribution.data[index]} ({calculatePercentage(departmentDistribution.data[index]).toFixed(0)}%)
                  </Text>
                  <View style={styles.progressBarContainer}>
                    <View 
                      style={[
                        styles.progressBar,
                        { 
                          width: `${calculatePercentage(departmentDistribution.data[index])}%`,
                          backgroundColor: getGradient(`dept-${index}`)
                        }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0a38',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a0a38',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  refreshButton: {
    padding: 10,
    backgroundColor: 'rgba(106, 17, 203, 0.3)',
    borderRadius: 8,
  },
  greeting: {
    padding: 20,
    paddingTop: 0,
  },
  greetingText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emoji: {
    fontSize: 20,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  summaryCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',   // 👈 permite que bajen a la siguiente fila
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  summaryCard: {
    width: '48%',        // 👈 dos tarjetas por fila
    backgroundColor: '#4e73df',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardLabel: {
    color: '#fff',
    fontSize: 16,
    marginTop: 4,
  },
  cardSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    margin: 20,
    marginTop: 0,
    backgroundColor: 'rgba(26, 26, 46, 0.6)',
    borderRadius: 15,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  quickActions: {
    gap: 12,
  },
  quickAction: {
    borderRadius: 12,
    padding: 20,
    height: 80,
    justifyContent: 'center',
  },
  actionContent: {
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 14,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityDetails: {
    flex: 1,
  },
  activityName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  activityInfo: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  statusText: {
    fontWeight: '500',
  },
  statusAvailable: {
    color: '#38ef7d',
  },
  statusAssigned: {
    color: '#6a11cb',
  },
  statusVacation: {
    color: '#f9d423',
  },
  statusInactive: {
    color: '#6c757d',
  },
  departmentList: {
    gap: 12,
  },
  departmentItem: {
    gap: 8,
  },
  departmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  departmentColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  departmentName: {
    color: '#fff',
    fontSize: 14,
  },
  departmentStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  departmentCount: {
    minWidth: 80,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});

export default PersonnelDashboardScreen;
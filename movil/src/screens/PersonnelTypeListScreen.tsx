import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { PersonnelStackParamList } from '../navigation/PersonnelStack';
import usePersonnelService from '../services/personnel-service';
import { PersonnelType } from '../types/personnel';
import { useAuth } from '../contexts/AuthContext';
import { UpdatePersonnelType } from '../types/personnel-type';

type PersonnelTypeListNavigationProp = StackNavigationProp<PersonnelStackParamList, 'PersonnelTypeList'>;

const PersonnelTypeListScreen: React.FC = () => {
  const navigation = useNavigation<PersonnelTypeListNavigationProp>();
  const { user } = useAuth();
  const {
    personnelTypes,
    loading,
    error,
    deletePersonnelType,
    refreshData,
    updatePersonnelType,
  } = usePersonnelService();

  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filteredTypes, setFilteredTypes] = useState<PersonnelType[]>([]);

  const hasRole = (required: string) => {
    if (!user) return false;
    const normalize = (s?: string) => (s || '').toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const roleEquivalents: { [key: string]: string[] } = {
      admin: ['admin', 'administrator'],
      coordinador: ['coordinador', 'coordinator'],
      lider: ['lider', 'líder', 'leader'],
    };

    const req = normalize(required);
    const matches = (r?: string) => {
      if (!r) return false;
      const n = normalize(r);
      if (n === req) return true;
      const equivalents = roleEquivalents[req] || [req];
      return equivalents.includes(n);
    };

    if (Array.isArray(user.roles) && user.roles.length > 0) {
      return user.roles.some((r: string) => matches(r));
    }

    if (user.role) {
      return matches(user.role);
    }

    return false;
  };

  // Solo el admin puede acceder y ver este módulo
  const isAdmin = hasRole('admin');
  const canCreate = () => isAdmin;
  const canEdit = () => isAdmin;
  const canDelete = () => isAdmin;
  const canShowActions = () => isAdmin;

  useEffect(() => {
    filterData();
  }, [personnelTypes, searchTerm, statusFilter]);

  const filterData = () => {
    const filtered = personnelTypes.filter(type => {
      const matchesSearch = type.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && type.isActive) || 
                          (statusFilter === 'inactive' && !type.isActive);
      
      return matchesSearch && matchesStatus;
    });
    setFilteredTypes(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de eliminar esta categoría?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePersonnelType(id);
              // Actualizamos estado local automáticamente
              setFilteredTypes(prev => prev.filter(type => type._id !== id));
              Alert.alert('Éxito', 'Categoría eliminada correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la categoría');
            }
          }
        },
      ]
    );
  };

  const handleToggleStatus = async (type: PersonnelType) => {
    try {
      const updateData: UpdatePersonnelType = {
        _id: type._id,
        isActive: !type.isActive
      };
      
      await updatePersonnelType(type._id, updateData);

      // Actualizamos estado local automáticamente
      setFilteredTypes(prev =>
        prev.map(t =>
          t._id === type._id ? { ...t, isActive: !t.isActive } : t
        )
      );

      Alert.alert('Éxito', `Categoría ${!type.isActive ? 'activada' : 'desactivada'} correctamente`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar el estado de la categoría');
    }
  };

  // const canCreate = (): boolean => {
  //   return user?.roles?.includes('admin') || user?.roles?.includes('coordinador') || false;
  // };

  // const canDelete = (): boolean => {
  //   return user?.roles?.includes('admin') || false;
  // };

  // Si no es admin, no muestra nada
  if (!isAdmin) {
    return (
      <View style={styles.loadingContainer}>
        <FontAwesome5 name="exclamation-triangle" size={40} color="#ff416c" />
        <Text style={styles.loadingText}>Acceso restringido: solo el administrador puede ver este módulo.</Text>
      </View>
    );
  }
  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <FontAwesome5 name="spinner" size={40} color="#9370DB" />
        <Text style={styles.loadingText}>Cargando categorías...</Text>
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
            <FontAwesome5 name="tags" size={24} color="#9370DB" /> Categorías de Personal
          </Text>
          {canCreate() && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('PersonnelTypeForm' as never)}
            >
              <FontAwesome5 name="plus" size={16} color="#fff" />
              <Text style={styles.addButtonText}>Nueva</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchCard}>
          <View style={styles.searchInputContainer}>
            <FontAwesome5 name="search" size={16} color="rgba(255,255,255,0.7)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar categorías..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
          >
            <FontAwesome5 name="undo" size={16} color="#9370DB" />
            <Text style={styles.clearButtonText}>Limpiar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterCards}>
          <View style={styles.filterCard}>
            <Text style={styles.filterLabel}>
              <FontAwesome5 name="power-off" size={14} color="#9370DB" /> Estado
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    statusFilter === 'all' && styles.filterOptionActive
                  ]}
                  onPress={() => setStatusFilter('all')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    statusFilter === 'all' && styles.filterOptionTextActive
                  ]}>Todos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    statusFilter === 'active' && styles.filterOptionActive
                  ]}
                  onPress={() => setStatusFilter('active')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    statusFilter === 'active' && styles.filterOptionTextActive
                  ]}>Activos</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    statusFilter === 'inactive' && styles.filterOptionActive
                  ]}
                  onPress={() => setStatusFilter('inactive')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    statusFilter === 'inactive' && styles.filterOptionTextActive
                  ]}>Inactivos</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Types List */}
      <View style={styles.listSection}>
        {filteredTypes.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="tag" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyTitle}>No se encontraron categorías</Text>
            <Text style={styles.emptyText}>Intenta ajustar tus filtros de búsqueda</Text>
          </View>
        ) : (
          <View style={styles.typesList}>
            {filteredTypes.map(type => (
              <View key={type._id} style={styles.typeCard}>
                <View style={styles.typeHeader}>
                  <View style={styles.typeIcon}>
                    <FontAwesome5 name="tag" size={16} color="#9370DB" />
                  </View>
                  <View style={styles.typeInfo}>
                    <Text style={styles.typeName}>{type.name}</Text>
                    <Text style={styles.typeDescription}>
                      {type.description || 'Sin descripción'}
                    </Text>
                  </View>
                </View>

                <View style={styles.typeMeta}>
                  <View style={[
                    styles.statusBadge,
                    type.isActive ? styles.statusActive : styles.statusInactive
                  ]}>
                    <FontAwesome5 
                      name={type.isActive ? 'check-circle' : 'times-circle'} 
                      size={12} 
                      color="#fff" 
                    />
                    <Text style={styles.statusText}>
                      {type.isActive ? 'Activo' : 'Inactivo'}
                    </Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('PersonnelTypeForm', { typeId: type._id })}
                  >
                    <FontAwesome5 name="edit" size={14} color="#9370DB" />
                  </TouchableOpacity>
                  {canDelete() && (
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleDelete(type._id)}
                    >
                      <FontAwesome5 name="trash-alt" size={14} color="#ff416c" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleToggleStatus(type)}
                  >
                    <FontAwesome5 
                      name={type.isActive ? 'toggle-on' : 'toggle-off'} 
                      size={14} 
                      color="#38ef7d" 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#9370DB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  searchSection: {
    padding: 20,
    gap: 16,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  clearButtonText: {
    color: '#9370DB',
    fontSize: 14,
  },
  filterCards: {
    gap: 12,
  },
  filterCard: {
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    padding: 12,
    borderRadius: 8,
  },
  filterLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
  },
  filterOptionActive: {
    backgroundColor: '#9370DB',
  },
  filterOptionText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  filterOptionTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  listSection: {
    padding: 20,
    paddingTop: 0,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginTop: 4,
  },
  typesList: {
    gap: 16,
  },
  typeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(147, 112, 219, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  typeDescription: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginTop: 2,
  },
  typeMeta: {
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusActive: {
    backgroundColor: 'rgba(56, 239, 125, 0.2)',
  },
  statusInactive: {
    backgroundColor: 'rgba(255, 65, 108, 0.2)',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PersonnelTypeListScreen;
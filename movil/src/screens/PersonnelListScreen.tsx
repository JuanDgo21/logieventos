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
import { useAuth } from '../contexts/AuthContext';
import { Personnel, UpdatePersonnel } from '../types/personnel';

type PersonnelListNavigationProp = StackNavigationProp<PersonnelStackParamList, 'PersonnelList'>;

const PersonnelListScreen: React.FC = () => {
  const navigation = useNavigation<PersonnelListNavigationProp>();
  const { user } = useAuth();
  const {
    personnelList,
    personnelTypes,
    loading,
    error,
    deletePersonnel,
    refreshData,
    updatePersonnel,
    createPersonnel,
  } = usePersonnelService();

  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [filteredList, setFilteredList] = useState<Personnel[]>([]);

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
      return user.roles.some(r => matches(r));
    }

    if (user.role) {
      return matches(user.role);
    }

    return false;
  };

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'disponible', label: 'Disponible' },
    { value: 'asignado', label: 'Asignado' },
    { value: 'vacaciones', label: 'Vacaciones' },
    { value: 'inactivo', label: 'Inactivo' },
  ];

  useEffect(() => {
    filterData();
  }, [personnelList, searchTerm, statusFilter, typeFilter]);

  const filterData = () => {
    const filtered = personnelList.filter(personnel => {
      const fullName = `${personnel.firstName} ${personnel.lastName}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || 
                          personnel.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                          personnel.status === statusFilter;
      const matchesType = typeFilter === 'all' || 
                         personnel.personnelType === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
    setFilteredList(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de eliminar este miembro del personal?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePersonnel(id);
              setFilteredList(prev => prev.filter(p => p._id !== id));
              Alert.alert('Éxito', 'Personal eliminado correctamente');
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'No se pudo eliminar el personal');
            }
          }
        },
      ]
    );
  };

  const handleToggleStatus = async (personnel: Personnel) => {
    try {
      // Solo el admin puede cambiar el estado
      if (!hasRole('admin')) {
        Alert.alert('Permiso denegado', 'Solo el administrador puede activar/desactivar personal');
        return;
      }
      const newStatus = personnel.status === 'disponible' ? 'inactivo' : 'disponible';
      const updateData: UpdatePersonnel = {
        _id: personnel._id,
        status: newStatus
      };
      await updatePersonnel(personnel._id, updateData);
      setFilteredList(prev =>
        prev.map(p =>
          p._id === personnel._id ? { ...p, status: newStatus } : p
        )
      );
      Alert.alert('Éxito', `Estado cambiado a ${newStatus} correctamente`);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo cambiar el estado del personal');
    }
  };

  const getStatusLabel = (status: string): string => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.label : 'Desconocido';
  };

  const getTypeName = (personnelType: any): string => {
    if (!personnelType) return 'Sin categoría';
    if (typeof personnelType === 'object' && personnelType.name) {
      return personnelType.name;
    }
    const type = personnelTypes.find(t => t._id === personnelType);
    return type ? type.name : 'Sin categoría';
  };


  const getStatusIcon = (status: string): string => {
    const icons: { [key: string]: string } = {
      'disponible': 'check-circle',
      'asignado': 'user-clock',
      'vacaciones': 'umbrella-beach',
      'inactivo': 'user-slash',
    };
    return icons[status] || 'user';
  };

  const getStatusColor = (status: string): string => {
    const colors: { [key: string]: string } = {
      'disponible': '#38ef7d',
      'asignado': '#6a11cb',
      'vacaciones': '#f9d423',
      'inactivo': '#ff416c',
    };
    return colors[status] || '#6c757d';
  };

  // admin: todo, coordinador: solo crear/editar, líder: solo visualiza
  const canCreate = () => hasRole('admin') || hasRole('coordinador');
  const canEdit = () => hasRole('admin') || hasRole('coordinador');
  const canDelete = () => hasRole('admin');
  const canToggleStatus = () => hasRole('admin');
  // Solo muestra acciones si el usuario puede al menos una acción
  const canShowActions = () => canEdit() || canDelete() || canToggleStatus();

  // Manejo de creación y edición para actualización instantánea
  const handleCreatePersonnel = async (newPersonnel: import('../types/personnel').NewPersonnel) => {
    try {
      const created = await createPersonnel(newPersonnel);
      setFilteredList(prev => [...prev, created]);
      Alert.alert('Éxito', 'Personal creado correctamente');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo crear el personal');
    }
  };

  const handleEditPersonnel = async (id: string, updateData: import('../types/personnel').UpdatePersonnel) => {
    try {
      const updated = await updatePersonnel(id, updateData);
      setFilteredList(prev => prev.map(p => p._id === id ? updated : p));
      Alert.alert('Éxito', 'Personal actualizado correctamente');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo actualizar el personal');
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <FontAwesome5 name="spinner" size={40} color="#9370DB" />
        <Text style={styles.loadingText}>Cargando personal...</Text>
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
            <FontAwesome5 name="users-cog" size={24} color="#9370DB" /> Gestión de Personal
          </Text>
          {canCreate() && (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('PersonnelForm', {
                handleCreatePersonnel,
                handleEditPersonnel
              })}
            >
              <FontAwesome5 name="user-plus" size={16} color="#fff" />
              <Text style={styles.addButtonText}>Nuevo</Text>
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
              placeholder="Buscar personal..."
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
              setTypeFilter('all');
            }}
          >
            <FontAwesome5 name="filter-circle-xmark" size={16} color="#9370DB" />
            <Text style={styles.clearButtonText}>Limpiar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterCards}>
          <View style={styles.filterCard}>
            <Text style={styles.filterLabel}>
              <FontAwesome5 name="user-tag" size={14} color="#9370DB" /> Categoría
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    typeFilter === 'all' && styles.filterOptionActive
                  ]}
                  onPress={() => setTypeFilter('all')}
                >
                  <Text style={[
                    styles.filterOptionText,
                    typeFilter === 'all' && styles.filterOptionTextActive
                  ]}>Todas</Text>
                </TouchableOpacity>
                {personnelTypes.map(type => (
                  <TouchableOpacity
                    key={type._id}
                    style={[
                      styles.filterOption,
                      typeFilter === type._id && styles.filterOptionActive
                    ]}
                    onPress={() => setTypeFilter(type._id)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      typeFilter === type._id && styles.filterOptionTextActive
                    ]}>{type.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterCard}>
            <Text style={styles.filterLabel}>
              <FontAwesome5 name="power-off" size={14} color="#9370DB" /> Estado
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterOptions}>
                {statusOptions.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterOption,
                      statusFilter === option.value && styles.filterOptionActive
                    ]}
                    onPress={() => setStatusFilter(option.value)}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      statusFilter === option.value && styles.filterOptionTextActive
                    ]}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Personnel List */}
      <View style={styles.listSection}>
        {filteredList.length === 0 ? (
          <View style={styles.emptyState}>
            <FontAwesome5 name="user-slash" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyTitle}>No se encontró personal</Text>
            <Text style={styles.emptyText}>Intenta ajustar tus filtros de búsqueda</Text>
          </View>
        ) : (
          <View style={styles.personnelList}>
            {filteredList.map(personnel => (
              <View key={personnel._id} style={styles.personnelCard}>
                <View style={styles.personnelHeader}>
                  <View style={styles.personnelAvatar}>
                    <FontAwesome5 name="user" size={20} color="#9370DB" />
                  </View>
                  <View style={styles.personnelInfo}>
                    <Text style={styles.personnelName}>
                      {personnel.firstName} {personnel.lastName}
                    </Text>
                    <Text style={styles.personnelId}>ID: {personnel._id.slice(0, 8)}...</Text>
                  </View>
                </View>

                <View style={styles.personnelDetails}>
                  <View style={styles.detailRow}>
                    <FontAwesome5 name="envelope" size={12} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.detailText}>{personnel.email}</Text>
                  </View>
                  {personnel.phone && (
                    <View style={styles.detailRow}>
                      <FontAwesome5 name="phone" size={12} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.detailText}>{personnel.phone}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.personnelMeta}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(personnel.status) }]}>
                    <FontAwesome5 
                      name={getStatusIcon(personnel.status)} 
                      size={12} 
                      color="#fff" 
                    />
                    <Text style={styles.statusText}>{getStatusLabel(personnel.status)}</Text>
                  </View>
                  <View style={styles.typeBadge}>
                    <FontAwesome5 name="tag" size={10} color="#9370DB" />
                    <Text style={styles.typeText}>{getTypeName(personnel.personnelType)}</Text>
                  </View>
                </View>

                {personnel.skills && personnel.skills.length > 0 && (
                  <View style={styles.skillsContainer}>
                    {personnel.skills.slice(0, 2).map((skill, index) => (
                      <View key={index} style={styles.skillBadge}>
                        <Text style={styles.skillText}>{skill}</Text>
                      </View>
                    ))}
                    {personnel.skills.length > 2 && (
                      <Text style={styles.skillMore}>
                        +{personnel.skills.length - 2} más
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.actions}>
                  {/* Solo muestra acciones si el usuario tiene permisos (admin: todo, coordinador: solo editar, líder: nada) */}
                  {canShowActions() && (
                    <>
                      {canEdit() && (
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => navigation.navigate('PersonnelForm', { personnelId: personnel._id })}
                        >
                          <FontAwesome5 name="pen" size={16} color="#9370DB" />
                        </TouchableOpacity>
                      )}
                      {canDelete() && (
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleDelete(personnel._id)}
                        >
                          <FontAwesome5 name="trash" size={16} color="#ff416c" />
                        </TouchableOpacity>
                      )}
                      {canToggleStatus() && (
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleToggleStatus(personnel)}
                        >
                          <FontAwesome5 
                            name={personnel.status === 'disponible' ? 'toggle-on' : 'toggle-off'} 
                            size={16} 
                            color={personnel.status === 'disponible' ? '#38ef7d' : '#ff416c'} 
                          />
                        </TouchableOpacity>
                      )}
                    </>
                  )}
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
  personnelList: {
    gap: 16,
  },
  personnelCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
  },
  personnelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  personnelAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(147, 112, 219, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  personnelInfo: {
    flex: 1,
  },
  personnelName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  personnelId: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  personnelDetails: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  personnelMeta: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(106, 17, 203, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeText: {
    color: '#9370DB',
    fontSize: 12,
    fontWeight: '500',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  skillBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillText: {
    color: '#fff',
    fontSize: 10,
  },
  skillMore: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    alignSelf: 'center',
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

export default PersonnelListScreen;
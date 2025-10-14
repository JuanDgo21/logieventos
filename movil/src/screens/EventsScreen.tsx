/**
 * @file EventsScreen.tsx
 * @description Pantalla para la gestión de Eventos.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, TextInput, Keyboard, Modal, ScrollView, SafeAreaView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../services/api';
import { FontAwesome5 } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';

// --- Tipos de Datos ---
type EventType = { _id: string, name: string };
type EventStatus = 'planificado' | 'en_progreso' | 'completado' | 'cancelado';
type Event = {
  _id: string;
  name: string;
  location: string;
  status: EventStatus;
  startDate: string;
  endDate: string;
  eventType: { _id: string, name: string };
  responsable: { _id: string, username: string, fullname: string };
  contract: { _id: string, name: string };
};
type StatusCounts = Record<EventStatus, number>;


// ========================================================================
// --- Componente del Modal para Filtrar por Tipo de Evento ---
// ========================================================================
interface EventTypeFilterModalProps {
  visible: boolean;
  onClose: () => void;
  eventTypes: EventType[];
  activeFilter: string | null;
  onSelectFilter: (typeId: string | null) => void;
}

const EventTypeFilterModal = ({ visible, onClose, eventTypes, activeFilter, onSelectFilter }: EventTypeFilterModalProps) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContentContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtrar por Tipo de Evento</Text>
            <TouchableOpacity onPress={onClose}>
              <FontAwesome5 name="times" size={22} color="#ccc" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={[{ _id: null, name: 'Ver Todos' }, ...eventTypes]}
            keyExtractor={(item) => item._id || 'all'}
            renderItem={({ item }) => {
              const isSelected = activeFilter === item._id;
              return (
                <TouchableOpacity style={styles.modalOption} onPress={() => onSelectFilter(item._id)}>
                  <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextActive]}>
                    {item.name}
                  </Text>
                  {isSelected && <FontAwesome5 name="check" size={16} color="#9370DB" />}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};


// ========================================================================
// --- COMPONENTE DEL ENCABEZADO: EventsHeader ---
// ========================================================================
interface EventsHeaderProps {
  onLogout: () => void;
  onCreateUser: () => void;
  canCreateUser: boolean;
  onSearchSubmit: (query: string) => void;
  onSearchReset: () => void;
  searchQuery: string;
  statusCounts: StatusCounts;
  navigation: NavigationProp<any>;
  activeStatusFilter: EventStatus | null;
  onStatusFilterChange: (status: EventStatus) => void;
  onOpenEventTypeFilter: () => void;
  activeEventTypeFilterName: string;
  canCreateEvent: boolean;
}

const EventsHeader = React.memo(({ 
  onLogout, onCreateUser, canCreateUser, onSearchSubmit, onSearchReset, searchQuery, statusCounts, navigation, 
  activeStatusFilter, onStatusFilterChange, onOpenEventTypeFilter, activeEventTypeFilterName, canCreateEvent
}: EventsHeaderProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => { if (searchQuery === '') setSearchInput(''); }, [searchQuery]);
  const handleSearchPress = () => onSearchSubmit(searchInput);

  return (
    <View>
      <AppHeader onLogout={onLogout} onCreateUser={onCreateUser} canCreateUser={canCreateUser} />
      <View style={styles.mainContent}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Eventos</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={() => setIsSearching(s => !s)}><FontAwesome5 name="search" size={20} color="#fff" /></TouchableOpacity>
            {canCreateEvent && (
              <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate("EventForm" as never)}>
                <FontAwesome5 name="plus" size={16} color="#fff" /><Text style={styles.createButtonText}>NUEVO EVENTO</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {isSearching && (
          <View style={styles.searchBarContainer}>
            <TextInput style={styles.searchInput} placeholder="Buscar por nombre..." placeholderTextColor="#999" value={searchInput} onChangeText={setSearchInput} returnKeyType="search" onSubmitEditing={handleSearchPress} />
            {searchQuery === '' && (<TouchableOpacity style={styles.searchSubmitButton} onPress={handleSearchPress}><FontAwesome5 name="chevron-right" size={20} color="#ffffffff" /></TouchableOpacity>)}
            {searchQuery !== '' && (<TouchableOpacity style={styles.resetButton} onPress={onSearchReset}><FontAwesome5 name="times" size={20} color="#fff" /></TouchableOpacity>)}
          </View>
        )}
        
        <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filtrar por Tipo:</Text>
            {/* Botón para crear nuevos tipos de evento (visible para roles con permiso) */}
            {canCreateEvent && (
                <TouchableOpacity 
                    style={styles.addTypeButton} 
                    onPress={() => navigation.navigate("EventTypeForm" as never)}
                >
                    <FontAwesome5 name="plus" size={14} color="#fff" />
                    <Text style={styles.addTypeButtonText}>NUEVO TIPO DE EVENTO</Text>
                </TouchableOpacity>
            )}
        </View>
        <TouchableOpacity style={styles.eventTypeButton} onPress={onOpenEventTypeFilter}>
            <Text style={styles.eventTypeButtonText}>{activeEventTypeFilterName}</Text>
            <FontAwesome5 name="chevron-down" size={14} color="#ccc" />
        </TouchableOpacity>
        
        <Text style={[styles.filterTitle, { marginTop: 20 }]}>Filtrar por Estado:</Text>
        <View style={styles.statusCounters}>
          {(Object.keys(statusCounts) as EventStatus[]).map(status => (
            <TouchableOpacity 
              key={status}
              style={[ styles.counterCard, styles[status], activeStatusFilter === status && styles.counterCardActive ]} 
              onPress={() => onStatusFilterChange(status)}
            >
              <Text style={styles.counterText}>{status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
});

// ========================================================================
// --- PANTALLA PRINCIPAL DE EVENTOS ---
// ========================================================================
const PAGE_SIZE = 5;

const EventsScreen = () => {
  const { user, logout, token } = useAuth();
  const navigation = useNavigation();

  // Estados
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [paginatedEvents, setPaginatedEvents] = useState<Event[]>([]);
  const [availableEventTypes, setAvailableEventTypes] = useState<EventType[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({ planificado: 0, en_progreso: 0, completado: 0, cancelado: 0 });
  const [loading, setLoading] = useState(true);
  
  // Estados de filtros y modales
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EventStatus | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<string | null>(null);
  const [isEventTypeModalVisible, setIsEventTypeModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  // Permisos
  const isAdmin = user?.role === 'admin';
  const canEdit = user?.role === 'admin' || user?.role === 'coordinador';
  const canCreate = user?.role === 'admin' || user?.role === 'coordinador';

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { 'x-access-token': token };
      const [eventsRes, eventTypesRes] = await Promise.all([
        api.get('/events?limit=1000&populate=eventType,responsable,contract', { headers }),
        api.get('/event-types', { headers })
      ]);
      setAllEvents(eventsRes.data.data);
      setAvailableEventTypes(eventTypesRes.data.data);
      calculateStats(eventsRes.data.data);
    } catch (error) {
      console.error("Error al cargar datos de eventos:", error);
      Alert.alert("Error", "No se pudieron cargar los datos de eventos.");
    } finally {
      setLoading(false);
    }
  }, [token]);
  
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadInitialData();
      setPage(1);
    });
    return unsubscribe;
  }, [navigation, loadInitialData]);

  useEffect(() => { applyFiltersAndPagination() }, [allEvents, searchQuery, page, statusFilter, eventTypeFilter]);
  useEffect(() => { setPage(1) }, [searchQuery, statusFilter, eventTypeFilter]);

  const calculateStats = (events: Event[]) => {
    const counts = events.reduce((acc, event) => {
      acc[event.status] = (acc[event.status] || 0) + 1;
      return acc;
    }, { planificado: 0, en_progreso: 0, completado: 0, cancelado: 0 } as StatusCounts);
    setStatusCounts(counts);
  };
  const applyFiltersAndPagination = () => {
    let filteredData = allEvents;
    if (statusFilter) { filteredData = filteredData.filter(e => e.status === statusFilter); }
    if (eventTypeFilter) { filteredData = filteredData.filter(e => e.eventType?._id === eventTypeFilter); }
    if (searchQuery) { filteredData = filteredData.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase())); }
    const totalPagesCalculated = Math.ceil(filteredData.length / PAGE_SIZE);
    const paginated = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    setPaginatedEvents(paginated);
    setTotalPages(totalPagesCalculated);
  };
  
  const handleStatusFilterChange = (status: EventStatus) => { setStatusFilter(prev => (prev === status ? null : status)); };
  const handleEventTypeFilterChange = (typeId: string | null) => { setEventTypeFilter(typeId); setIsEventTypeModalVisible(false); };
  const getActiveEventTypeFilterName = () => {
    if (!eventTypeFilter) return "Todos los tipos";
    const foundType = availableEventTypes.find(type => type._id === eventTypeFilter);
    return foundType?.name || "Todos los tipos";
  };
  const openDeleteConfirmation = (eventId: string) => { setEventToDelete(eventId); setIsDeleteModalVisible(true); };
  const closeDeleteConfirmation = () => { setEventToDelete(null); setIsDeleteModalVisible(false); };
  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      await api.delete(`/events/${eventToDelete}`, { headers: { 'x-access-token': token } });
      Alert.alert("Éxito", "El evento ha sido eliminado.");
      closeDeleteConfirmation();
      loadInitialData();
    } catch (error) {
      console.error("Error al eliminar evento:", error);
      Alert.alert("Error", "No se pudo eliminar el evento.");
    }
  };
  const handleCreateUser = () => Alert.alert("Funcionalidad pendiente", "Navegar a la pantalla de 'Crear Usuario'");
  const renderDeleteConfirmationModal = () => (
    <Modal animationType="fade" transparent={true} visible={isDeleteModalVisible} onRequestClose={closeDeleteConfirmation}>
      <SafeAreaView style={styles.modalSafeArea}><View style={styles.confirmModalContainer}><Text style={styles.modalTitle}>¿Estás seguro?</Text><Text style={styles.confirmModalText}>Esta acción eliminará el evento permanentemente.</Text><View style={styles.confirmModalActions}><TouchableOpacity style={[styles.confirmButton, styles.cancelButton]} onPress={closeDeleteConfirmation}><Text style={styles.confirmButtonText}>Cancelar</Text></TouchableOpacity><TouchableOpacity style={[styles.confirmButton, styles.deleteButton]} onPress={handleDeleteEvent}><Text style={styles.confirmButtonText}>Eliminar</Text></TouchableOpacity></View></View></SafeAreaView>
    </Modal>
  );

  return (
    <View style={styles.fullScreenContainer}>
      {loading ? ( <ActivityIndicator size="large" color="#9370DB" style={styles.loadingCenter} /> ) : (
        <>
        <FlatList
            ListHeaderComponent={ 
              <EventsHeader 
                canCreateUser={isAdmin} 
                onCreateUser={handleCreateUser} 
                onLogout={logout} 
                onSearchSubmit={(query) => setSearchQuery(query)} 
                onSearchReset={() => setSearchQuery('')} 
                searchQuery={searchQuery} 
                statusCounts={statusCounts} 
                navigation={navigation}
                activeStatusFilter={statusFilter} 
                onStatusFilterChange={handleStatusFilterChange}
                onOpenEventTypeFilter={() => setIsEventTypeModalVisible(true)}
                activeEventTypeFilterName={getActiveEventTypeFilterName()}
                canCreateEvent={canCreate}
              /> 
            }
            data={paginatedEvents}
            renderItem={({ item }) => (
                <View style={styles.eventCard}>
                    <View style={styles.eventCardHeader}><Text style={styles.eventName}>{item.name}</Text><Text style={[styles.statusBadge, styles[item.status]]}>{item.status.replace('_', ' ')}</Text></View>
                    <View style={styles.eventCardBody}>
                        <View style={styles.eventDetailRow}><FontAwesome5 name="map-marker-alt" size={14} color="#9370DB" /><Text style={styles.eventDetailText}>{item.location}</Text></View>
                        <View style={styles.eventDetailRow}><FontAwesome5 name="calendar-alt" size={14} color="#9370DB" /><Text style={styles.eventDetailText}>{new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}</Text></View>
                        <View style={styles.eventDetailRow}><FontAwesome5 name="user-tie" size={14} color="#9370DB" /><Text style={styles.eventDetailText}>Responsable: {item.responsable?.fullname || 'No asignado'}</Text></View>
                        <View style={styles.eventDetailRow}><FontAwesome5 name="tag" size={14} color="#9370DB" /><Text style={styles.eventDetailText}>{item.eventType?.name || 'N/A'}</Text></View>
                        <View style={styles.eventDetailRow}><FontAwesome5 name="file-contract" size={14} color="#9370DB" /><Text style={styles.eventDetailText}>Contrato: {item.contract?.name || 'No asignado'}</Text></View>
                    </View>
                    <View style={styles.eventCardFooter}>
                        {canEdit && (<TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('EventForm' as never, { eventId: item._id })}><FontAwesome5 name="edit" size={16} color="#FFA726" /></TouchableOpacity>)}
                        {isAdmin && (<TouchableOpacity style={styles.actionButton} onPress={() => openDeleteConfirmation(item._id)}><FontAwesome5 name="trash-alt" size={16} color="#dc3545" /></TouchableOpacity>)}
                    </View>
                </View>
            )}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContentContainer}
        />
        <EventTypeFilterModal visible={isEventTypeModalVisible} onClose={() => setIsEventTypeModalVisible(false)} eventTypes={availableEventTypes} activeFilter={eventTypeFilter} onSelectFilter={handleEventTypeFilterChange} />
        {renderDeleteConfirmationModal()}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    fullScreenContainer: { flex: 1, backgroundColor: '#1a0a38' },
    loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    mainContent: { paddingHorizontal: 20, paddingTop: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    actionButtons: { flexDirection: 'row', alignItems: 'center' },
    createButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#9370DB', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginLeft: 10 },
    createButtonText: { color: '#fff', marginLeft: 8, fontWeight: 'bold' },
    searchBarContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    searchInput: { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#fff', padding: 10, borderRadius: 8, fontSize: 16, flex: 1, marginRight: 10 },
    searchSubmitButton: { padding: 10, borderRadius: 8, backgroundColor: '#9370DB' },
    resetButton: { padding: 10, borderRadius: 8, backgroundColor: '#dc3545' },
    filterTitle: { color: '#ccc', fontSize: 16, fontWeight: '600' },
    statusCounters: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
    counterCard: { flex: 1, borderRadius: 8, paddingVertical: 10, marginHorizontal: 4, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
    counterCardActive: { borderColor: '#FFFFFF', transform: [{ scale: 1.05 }] },
    counterText: { color: '#fff', fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },
    listContentContainer: { paddingHorizontal: 20, paddingBottom: 20 },
    eventCard: { backgroundColor: 'rgba(30, 10, 56, 0.9)', borderRadius: 15, padding: 20, marginBottom: 15, },
    eventCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    eventName: { fontSize: 18, fontWeight: 'bold', color: '#fff', flex: 1 },
    statusBadge: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 12, color: '#fff', fontWeight: 'bold', fontSize: 12, textTransform: 'capitalize' },
    eventCardBody: { marginBottom: 15 },
    eventDetailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    eventDetailText: { color: '#ccc', fontSize: 14, marginLeft: 10 },
    eventCardFooter: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.1)', paddingTop: 15 },
    actionButton: { marginLeft: 20 },
    planificado: { backgroundColor: '#6c757d' },
    en_progreso: { backgroundColor: '#388E3C' },
    completado: { backgroundColor: '#17a2b8' },
    cancelado: { backgroundColor: '#dc3545' },
    filtersContainer: { flexDirection: 'row', marginBottom: 15 },
    filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    eventTypeButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 12, borderRadius: 8, },
    eventTypeButtonText: { color: '#fff', fontSize: 16 },
    addTypeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#9370DB',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    addTypeButtonText: {
        color: '#fff',
        marginLeft: 8,
        fontWeight: 'bold',
        fontSize: 14,
    },
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
    modalContentContainer: { backgroundColor: '#1e0a38', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '50%', },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#4B0082', paddingBottom: 15, marginBottom: 15, },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    modalOption: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, },
    modalOptionText: { color: '#ccc', fontSize: 18 },
    modalOptionTextActive: { color: '#9370DB', fontWeight: 'bold' },
    modalSafeArea: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.8)', paddingHorizontal: 20, },
    confirmModalContainer: { width: '100%', backgroundColor: '#1e0a38', borderRadius: 20, padding: 25, borderWidth: 1, borderColor: '#9370DB' },
    confirmModalText: { color: '#ccc', fontSize: 16, textAlign: 'center', marginVertical: 20, },
    confirmModalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, },
    confirmButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', },
    cancelButton: { backgroundColor: '#6c757d', marginRight: 10, },
    deleteButton: { backgroundColor: '#dc3545', marginLeft: 10, },
    confirmButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, },
});

export default EventsScreen;
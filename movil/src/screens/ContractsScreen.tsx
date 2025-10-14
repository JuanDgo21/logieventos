/**
 * @file ContractsScreen.tsx
 * @description Pantalla principal para visualizar, buscar, filtrar y gestionar contratos.
 * Permite a los usuarios ver una lista paginada de contratos, realizar búsquedas por texto,
 * filtrar por estado, y realizar acciones como ver detalles, editar o eliminar según su rol.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, TextInput, Keyboard, Modal, ScrollView, SafeAreaView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import api from '../services/api';
import { FontAwesome5 } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';

// --- Definición de Tipos ---

// Tipos para los datos anidados dentro de un contrato
type Resource = { resource: { name: string }, quantity: number };
type Provider = { provider: { name: string }, serviceDescription: string, cost: number };
type Personnel = { person: { firstName: string, lastName: string }, role: string, hours: number };
type ContractStatus = 'borrador' | 'activo' | 'completado' | 'cancelado';

// Tipo principal para un objeto de Contrato
type Contract = {
  _id: string;
  name: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  status: ContractStatus;
  budget: number;
  startDate: string;
  endDate: string;
  terms?: string;
  resources?: Resource[];
  providers?: Provider[];
  personnel?: Personnel[];
};

// Tipo para el objeto que cuenta los contratos por estado
type StatusCounts = Record<ContractStatus, number>;


// ========================================================================
// --- Componente de Encabezado: ContractsHeader ---
// ========================================================================

/**
 * @interface ContractsHeaderProps
 * @description Define las propiedades que recibe el componente de encabezado.
 */
interface ContractsHeaderProps {
  onLogout: () => void;
  onCreateUser: () => void;
  canCreateUser: boolean;
  onSearchSubmit: (query: string) => void;
  onSearchReset: () => void;
  searchQuery: string;
  statusCounts: StatusCounts;
  navigation: NavigationProp<any>;
  activeStatusFilter: ContractStatus | null;
  onStatusFilterChange: (status: ContractStatus) => void;
}

/**
 * @description Componente memoizado que renderiza toda la parte superior de la pantalla,
 * incluyendo el saludo, la barra de búsqueda y los filtros de estado.
 * @param {ContractsHeaderProps} props - Propiedades para configurar el encabezado.
 */
const ContractsHeader = React.memo(({ 
  onLogout, onCreateUser, canCreateUser, onSearchSubmit, onSearchReset, searchQuery, statusCounts, navigation, activeStatusFilter, onStatusFilterChange
}: ContractsHeaderProps) => {
  // Estado local para la barra de búsqueda
  const [isSearching, setIsSearching] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  // Sincroniza el input si la búsqueda se resetea desde el componente padre
  useEffect(() => { if (searchQuery === '') setSearchInput(''); }, [searchQuery]);

  /** @description Maneja el envío de la búsqueda. */
  const handleSearchPress = () => onSearchSubmit(searchInput);

  return (
    <View>
      <AppHeader onLogout={onLogout} canCreateUser={canCreateUser} />
      <View style={styles.mainContent}>
        {/* Título y botones de acción principales */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Contratos</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity onPress={() => setIsSearching(s => !s)}><FontAwesome5 name="search" size={20} color="#fff" /></TouchableOpacity>
            {canCreateUser && (
              <TouchableOpacity style={styles.createButton} onPress={() => navigation.navigate("ContractForm" as never)}>
                <FontAwesome5 name="plus" size={16} color="#fff" />
                <Text style={styles.createButtonText}>NUEVO CONTRATO</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Barra de búsqueda condicional */}
        {isSearching && (
          <View style={styles.searchBarContainer}>
            <TextInput style={styles.searchInput} placeholder="Buscar por nombre..." placeholderTextColor="#999" value={searchInput} onChangeText={setSearchInput} returnKeyType="search" onSubmitEditing={handleSearchPress} />
            {searchQuery === '' && (<TouchableOpacity style={styles.searchSubmitButton} onPress={handleSearchPress}><FontAwesome5 name="chevron-right" size={20} color="#ffffffff" /></TouchableOpacity>)}
            {searchQuery !== '' && (<TouchableOpacity style={styles.resetButton} onPress={onSearchReset}><FontAwesome5 name="times" size={20} color="#fff" /></TouchableOpacity>)}
          </View>
        )}

        {/* Contadores y filtros por estado */}
        <View style={styles.statusCounters}>
          {(Object.keys(statusCounts) as ContractStatus[]).map(status => (
            <TouchableOpacity 
              key={status}
              style={[ styles.counterCard, styles[status], activeStatusFilter === status && styles.counterCardActive ]} 
              onPress={() => onStatusFilterChange(status)}
            >
              <Text style={styles.counterValue}>{statusCounts[status]}</Text>
              <Text style={styles.counterText}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
});

// ========================================================================
// --- Pantalla Principal: ContractsScreen ---
// ========================================================================

const PAGE_SIZE = 2; // Define cuántos contratos se muestran por página

const ContractsScreen = () => {
  // --- Hooks de Contexto y Navegación ---
  const { user, logout, token } = useAuth();
  const navigation = useNavigation();

  // --- Estados de la Pantalla ---
  // Estado para los datos y la paginación
  const [allContratos, setAllContratos] = useState<Contract[]>([]);
  const [contratosPaginados, setContratosPaginados] = useState<Contract[]>([]);
  const [totalContratos, setTotalContratos] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Estados para los filtros y búsqueda
  const [statusFilter, setStatusFilter] = useState<ContractStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Estados para los modales
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<string | null>(null);

  // Estado de carga y estadísticas
  const [loading, setLoading] = useState(true);
  const [loadingList, setLoadingList] = useState(false);
  const [totalContractsByStatus, setTotalContractsByStatus] = useState<StatusCounts>({ borrador: 0, activo: 0, completado: 0, cancelado: 0 });

  // --- Variables de Permisos ---
  const isAdmin = user?.role === 'admin';
  const canEdit = user?.role === 'admin' || user?.role === 'coordinador';
  const canCreate = user?.role === 'admin' || user?.role === 'coordinador';

  // --- Efectos (useEffect) ---

  /** @description Efecto que se ejecuta cada vez que la pantalla entra en foco para recargar los datos. */
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchAllContracts();
      setPage(1);
    });
    return unsubscribe;
  }, [navigation]);

  /** @description Efecto que aplica filtros y paginación cada vez que los datos o los filtros cambian. */
  useEffect(() => { applyFiltersAndPagination() }, [allContratos, searchQuery, page, statusFilter]);
  
  /** @description Efecto que resetea la página a 1 cuando se aplica un nuevo filtro. */
  useEffect(() => { setPage(1) }, [searchQuery, statusFilter]);

  // --- Funciones de Lógica y Datos ---

  /** @description Obtiene la lista completa de contratos desde la API. */
  const fetchAllContracts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/contracts?limit=1000&populate=resources.resource,providers.provider,personnel.person', { headers: { 'x-access-token': token } });
      setAllContratos(response.data.data);
      calculateStats(response.data.data);
    } catch (error) { console.error("Error al cargar contratos:", error); } 
    finally { setLoading(false); }
  };

  /** @description Calcula el número de contratos por cada estado y actualiza el estado. */
  const calculateStats = (contracts: Contract[]) => {
    const counts = contracts.reduce((acc, contract) => {
      acc[contract.status] = (acc[contract.status] || 0) + 1;
      return acc;
    }, { borrador: 0, activo: 0, completado: 0, cancelado: 0 } as StatusCounts);
    setTotalContractsByStatus(counts);
  };

  /** @description Aplica los filtros de estado y texto, y luego pagina los resultados. */
  const applyFiltersAndPagination = () => {
    setLoadingList(true);
    let filteredData = allContratos;
    if (statusFilter) { filteredData = filteredData.filter(c => c.status === statusFilter); }
    if (searchQuery) { filteredData = filteredData.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.clientName.toLowerCase().includes(searchQuery.toLowerCase())); }
    
    const totalPagesCalculated = Math.ceil(filteredData.length / PAGE_SIZE);
    const paginated = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    setContratosPaginados(paginated);
    setTotalContratos(filteredData.length);
    setTotalPages(totalPagesCalculated);
    setLoadingList(false);
  };

  // --- Funciones Manejadoras de Eventos (Handlers) ---

  /** @description Activa o desactiva un filtro de estado. Si se toca el mismo filtro, se limpia. */
  const handleStatusFilterChange = (status: ContractStatus) => {
    setStatusFilter(prevStatus => (prevStatus === status ? null : status));
  };
  
  /** @description Abre el modal con los detalles de un contrato específico. */
  const handleShowDetails = (contract: Contract) => {
    setSelectedContract(contract);
    setIsModalVisible(true);
  };

  /** @description Abre el modal de confirmación para eliminar un contrato. */
  const openDeleteConfirmation = (contractId: string) => {
    setContractToDelete(contractId);
    setIsDeleteModalVisible(true);
  };

  /** @description Cierra el modal de confirmación de borrado. */
  const closeDeleteConfirmation = () => {
    setContractToDelete(null);
    setIsDeleteModalVisible(false);
  };

  /** @description Ejecuta la llamada a la API para eliminar el contrato seleccionado. */
  const handleDeleteContract = async () => {
    if (!contractToDelete) return;
    try {
      await api.delete(`/contracts/${contractToDelete}`, { headers: { 'x-access-token': token } });
      Alert.alert("Éxito", "El contrato ha sido eliminado.");
      closeDeleteConfirmation();
      fetchAllContracts();
    } catch (error) {
      console.error("Error al eliminar contrato:", error);
      Alert.alert("Error", "No se pudo eliminar el contrato.");
    }
  };

  /** @description Placeholder para la funcionalidad de crear usuario. */
  const handleCreateUser = () => Alert.alert("Funcionalidad pendiente", "Navegar a la pantalla de 'Crear Usuario'");
  
  // --- Funciones Auxiliares (Helpers) ---
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formatCurrency = (value: number) => `$${value?.toLocaleString('es-CO') || '0'}`;

  // --- Componentes de Renderizado ---

  /** @description Renderiza los botones de paginación. */
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    return (
      <View style={styles.paginationContainer}><TouchableOpacity style={styles.paginationButton} onPress={() => setPage(p => p - 1)} disabled={page === 1}><Text style={styles.paginationButtonText}>Anterior</Text></TouchableOpacity>{pages.map(pageNum => (<TouchableOpacity key={pageNum} style={[styles.paginationNumber, pageNum === page && styles.paginationActive]} onPress={() => setPage(pageNum)}><Text style={[styles.paginationText, pageNum === page && styles.paginationTextActive]}>{pageNum}</Text></TouchableOpacity>))}<TouchableOpacity style={styles.paginationButton} onPress={() => setPage(p => p + 1)} disabled={page === totalPages}><Text style={styles.paginationButtonText}>Siguiente</Text></TouchableOpacity></View>
    );
  };
  
  /** @description Renderiza el pie de la lista, mostrando información de paginación. */
  const renderFooterComponent = () => {
    if (loadingList && page > 1) return <ActivityIndicator size="small" color="#9370DB" style={{ marginVertical: 20 }} />;
    if (!loading && totalContratos === 0) return null;
    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(page * PAGE_SIZE, totalContratos);
    return (
      <View style={styles.paginationFooter}><Text style={styles.paginationInfo}>Mostrando {start} - {end} de {totalContratos} contratos</Text>{renderPagination()}</View>
    );
  };
  
  /** @description Renderiza el modal que muestra los detalles completos de un contrato. */
  const renderDetailsModal = () => (
    <Modal animationType="slide" transparent={true} visible={isModalVisible} onRequestClose={() => setIsModalVisible(false)}>
      <SafeAreaView style={styles.modalSafeArea}><View style={styles.modalContainer}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Detalles del Contrato</Text><TouchableOpacity onPress={() => setIsModalVisible(false)}><FontAwesome5 name="times" size={24} color="#ccc" /></TouchableOpacity></View><ScrollView contentContainerStyle={styles.modalContent}><View style={styles.detailRow}><Text style={styles.detailLabel}>Nombre:</Text><Text style={styles.detailValue}>{selectedContract?.name}</Text></View><View style={styles.detailRow}><Text style={styles.detailLabel}>Cliente:</Text><Text style={styles.detailValue}>{selectedContract?.clientName} ({selectedContract?.clientEmail} - {selectedContract?.clientPhone})</Text></View><View style={styles.detailRow}><Text style={styles.detailLabel}>Fechas:</Text><Text style={styles.detailValue}>{formatDate(selectedContract?.startDate || '')} a {formatDate(selectedContract?.endDate || '')}</Text></View><View style={styles.detailRow}><Text style={styles.detailLabel}>Presupuesto:</Text><Text style={styles.detailValue}>{formatCurrency(selectedContract?.budget || 0)}</Text></View><View style={styles.detailRow}><Text style={styles.detailLabel}>Estado:</Text><View style={[styles.statusBadge, styles[`status_${selectedContract?.status}`]]}><Text style={styles.statusBadgeText}>{selectedContract?.status}</Text></View></View><View style={styles.detailRow}><Text style={styles.detailLabel}>Términos:</Text><Text style={styles.detailValue}>{selectedContract?.terms || 'No especificados'}</Text></View>
            {selectedContract?.resources?.length > 0 && (<View style={styles.tableContainer}><Text style={styles.tableTitle}>Recursos</Text><View style={styles.tableHeader}><Text style={styles.tableHeaderText}>Recurso</Text><Text style={styles.tableHeaderText}>Cantidad</Text></View>{selectedContract.resources.map((item, index) => (<View key={index} style={styles.tableRow}><Text style={styles.tableCell}>{item.resource?.name}</Text><Text style={styles.tableCell}>{item.quantity}</Text></View>))}</View>)}
            {selectedContract?.providers?.length > 0 && (<View style={styles.tableContainer}><Text style={styles.tableTitle}>Proveedores</Text><View style={styles.tableHeader}><Text style={styles.tableHeaderText}>Proveedor</Text><Text style={styles.tableHeaderText}>Servicio</Text><Text style={styles.tableHeaderText}>Costo</Text></View>{selectedContract.providers.map((item, index) => (<View key={index} style={styles.tableRow}><Text style={styles.tableCell}>{item.provider?.name}</Text><Text style={styles.tableCell}>{item.serviceDescription || 'N/A'}</Text><Text style={styles.tableCell}>{formatCurrency(item.cost)}</Text></View>))}</View>)}
            {selectedContract?.personnel?.length > 0 && (<View style={styles.tableContainer}><Text style={styles.tableTitle}>Personal</Text><View style={styles.tableHeader}><Text style={styles.tableHeaderText}>Nombre</Text><Text style={styles.tableHeaderText}>Rol</Text><Text style={styles.tableHeaderText}>Horas</Text></View>{selectedContract.personnel.map((item, index) => (<View key={index} style={styles.tableRow}><Text style={styles.tableCell}>{`${item.person?.firstName} ${item.person?.lastName}`}</Text><Text style={styles.tableCell}>{item.role || 'N/A'}</Text><Text style={styles.tableCell}>{item.hours}</Text></View>))}</View>)}
          </ScrollView></View></SafeAreaView>
    </Modal>
  );

  /** @description Renderiza el modal de confirmación antes de eliminar un contrato. */
  const renderDeleteConfirmationModal = () => (
    <Modal animationType="fade" transparent={true} visible={isDeleteModalVisible} onRequestClose={closeDeleteConfirmation}>
      <SafeAreaView style={styles.modalSafeArea}><View style={styles.modalContainer}><Text style={styles.modalTitle}>¿Estás seguro?</Text><Text style={styles.confirmModalText}>Esta acción eliminará el contrato permanentemente y no se puede deshacer.</Text><View style={styles.confirmModalActions}><TouchableOpacity style={[styles.confirmButton, styles.cancelButton]} onPress={closeDeleteConfirmation}><Text style={styles.confirmButtonText}>Cancelar</Text></TouchableOpacity><TouchableOpacity style={[styles.confirmButton, styles.deleteButton]} onPress={handleDeleteContract}><Text style={styles.confirmButtonText}>Eliminar</Text></TouchableOpacity></View></View></SafeAreaView>
    </Modal>
  );

  // --- Renderizado Principal del Componente ---
  return (
    <View style={styles.fullScreenContainer}>
      {loading ? (<ActivityIndicator size="large" color="#9370DB" style={styles.loading} />) : (
        <>
        <FlatList
            ListHeaderComponent={ 
              <ContractsHeader 
                canCreateUser={canCreate}
                onCreateUser={handleCreateUser} 
                onLogout={logout} 
                onSearchSubmit={(query) => setSearchQuery(query)} 
                onSearchReset={() => setSearchQuery('')} 
                searchQuery={searchQuery} 
                statusCounts={totalContractsByStatus} 
                navigation={navigation}
                activeStatusFilter={statusFilter} 
                onStatusFilterChange={handleStatusFilterChange}
              /> 
            }
            data={contratosPaginados}
            renderItem={({ item }) => (
              <View style={styles.contractCard}><View style={styles.mainInfoColumn}><Text style={styles.contractName}>{item.name}</Text><Text style={styles.clientInfo}>{item.clientName}</Text><Text style={styles.clientContact}>{item.clientEmail}</Text><Text style={styles.clientContact}>{item.clientPhone}</Text></View><View style={styles.detailsColumn}><Text style={styles.dates}>{formatDate(item.startDate)}</Text><Text style={styles.datesLabel}>hasta</Text><Text style={styles.dates}>{formatDate(item.endDate)}</Text><Text style={styles.budget}>{formatCurrency(item.budget)}</Text></View><View style={styles.actionsColumn}><Text style={[styles.statusBadgeList, styles[`status_${item.status}`]]}>{item.status}</Text><View style={styles.actionIconsRow}><TouchableOpacity style={styles.actionIcon} onPress={() => handleShowDetails(item)}><FontAwesome5 name="eye" size={18} color="#9370DB" /></TouchableOpacity>{canEdit && (<TouchableOpacity style={styles.actionIcon} onPress={() => navigation.navigate('ContractForm' as never, { contractId: item._id })}><FontAwesome5 name="edit" size={18} color="#FFA726" /></TouchableOpacity>)}{isAdmin && (<TouchableOpacity style={styles.actionIcon} onPress={() => openDeleteConfirmation(item._id)}><FontAwesome5 name="trash-alt" size={18} color="#dc3545" /></TouchableOpacity>)}</View></View></View>
            )}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.listContentContainer}
            ListFooterComponent={renderFooterComponent}
            ListEmptyComponent={!loadingList && <Text style={styles.noResultsText}>{searchQuery || statusFilter ? "No se encontraron contratos con esos filtros." : "No hay contratos."}</Text>}
            onRefresh={fetchAllContracts}
            refreshing={loadingList}
            keyboardShouldPersistTaps="handled"
        />
        {renderDetailsModal()}
        {renderDeleteConfirmationModal()}
        </>
      )}
    </View>
  );
};

// ========================================================================
// --- Hoja de Estilos (StyleSheet) ---
// ========================================================================
const styles = StyleSheet.create({
    // --- Estilos de la Pantalla y Encabezado ---
    fullScreenContainer: { flex: 1, backgroundColor: '#1a0a38' },
    loading: { flex: 1, justifyContent: 'center' },
    mainContent: { paddingHorizontal: 20, paddingTop: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    actionButtons: { flexDirection: 'row', alignItems: 'center' },
    createButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#9370DB', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginLeft: 10 },
    createButtonText: { color: '#fff', marginLeft: 8, fontWeight: 'bold' },
    searchBarContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    searchInput: { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#fff', padding: 10, borderRadius: 8, fontSize: 16, flex: 1, marginRight: 10 },
    searchSubmitButton: { padding: 10, borderRadius: 8, backgroundColor: '#9370DB' },
    resetButton: { padding: 10, borderRadius: 8, backgroundColor: '#dc3545' },

    // --- Estilos para los Contadores-Filtro ---
    statusCounters: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
    counterCard: { 
      width: '48%', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 10,
      marginBottom: 10, alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
      elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.22, shadowRadius: 2.22,
    },
    counterCardActive: {
      borderColor: '#FFFFFF', elevation: 8, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30, shadowRadius: 4.65, transform: [{ scale: 1.05 }],
    },
    counterValue: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
    counterText: { color: '#fff', fontSize: 14, marginTop: 5, fontWeight: '600' },
    borrador: { backgroundColor: '#6c757d' },
    activo: { backgroundColor: '#388E3C' },
    completado: { backgroundColor: '#17a2b8' },
    cancelado: { backgroundColor: '#dc3545' },

    // --- Estilos para las Tarjetas de la Lista ---
    contractCard: { backgroundColor: 'rgba(30, 10, 56, 0.8)', borderRadius: 10, padding: 15, marginBottom: 15, flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20 },
    mainInfoColumn: { flex: 3, justifyContent: 'center' },
    detailsColumn: { flex: 2, alignItems: 'center', justifyContent: 'center' },
    actionsColumn: { flex: 1.5, alignItems: 'flex-end', justifyContent: 'space-between' },
    contractName: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
    clientInfo: { fontSize: 13, color: '#fff', fontWeight: '500' },
    clientContact: { fontSize: 11, color: '#ccc' },
    dates: { fontSize: 12, color: '#fff' },
    datesLabel: { fontSize: 10, color: '#ccc' },
    budget: { fontSize: 14, fontWeight: 'bold', color: '#66BB6A', marginTop: 8 },
    actionIconsRow: { flexDirection: 'row', justifyContent: 'flex-end', width: '100%' },
    actionIcon: { marginLeft: 15 },
    
    // --- Estilos para los Badges de Estado ---
    statusBadgeList: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10, color: '#fff', fontWeight: 'bold', fontSize: 11, textTransform: 'capitalize', textAlign: 'center' },
    statusBadge: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 15, alignSelf: 'flex-start' },
    statusBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 14, textTransform: 'capitalize' },
    status_borrador: { backgroundColor: '#6c757d' },
    status_activo: { backgroundColor: '#388E3C' },
    status_completado: { backgroundColor: '#17a2b8' },
    status_cancelado: { backgroundColor: '#dc3545' },

    // --- Estilos para los Modales ---
    modalSafeArea: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.8)', paddingHorizontal: 20, },
    modalContainer: { width: '100%', backgroundColor: '#1e0a38', borderRadius: 20, padding: 25, borderWidth: 1, borderColor: '#9370DB', maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center', flex: 1 },
    modalContent: { paddingBottom: 20 },
    detailRow: { marginBottom: 15 },
    detailLabel: { fontSize: 14, color: '#ccc', marginBottom: 4 },
    detailValue: { fontSize: 16, color: '#fff', fontWeight: '500' },
    tableContainer: { marginTop: 20, borderWidth: 1, borderColor: '#4B0082', borderRadius: 8 },
    tableTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 10, paddingHorizontal: 10, paddingTop: 10 },
    tableHeader: { flexDirection: 'row', backgroundColor: '#4B0082', padding: 10, borderBottomWidth: 1, borderColor: '#4B0082' },
    tableHeaderText: { color: '#fff', fontWeight: 'bold', flex: 1, textAlign: 'center' },
    tableRow: { flexDirection: 'row', padding: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(75, 0, 130, 0.5)' },
    tableCell: { color: '#ccc', flex: 1, textAlign: 'center' },
    
    // --- Estilos del Modal de Confirmación ---
    confirmModalText: { color: '#ccc', fontSize: 16, textAlign: 'center', marginVertical: 20 },
    confirmModalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    confirmButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: '#6c757d', marginRight: 10 },
    deleteButton: { backgroundColor: '#dc3545', marginLeft: 10 },
    confirmButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    // --- Estilos de Paginación y Pie de Lista ---
    listContentContainer: { paddingBottom: 20 },
    paginationFooter: { paddingHorizontal: 20, paddingVertical: 20, borderTopColor: '#4B0082', borderTopWidth: 1 },
    paginationContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    paginationButton: { paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#4B0082', marginHorizontal: 5 },
    paginationButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    paginationNumber: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center', borderRadius: 15, marginHorizontal: 3, backgroundColor: 'rgba(30, 10, 56, 0.8)' },
    paginationActive: { backgroundColor: '#9370DB' },
    paginationText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    paginationTextActive: { color: '#fff' },
    paginationInfo: { color: '#ccc', textAlign: 'center', marginBottom: 10, fontSize: 12 },
    noResultsText: { color: '#ccc', textAlign: 'center', marginTop: 50, fontSize: 16 },
  });

export default ContractsScreen;
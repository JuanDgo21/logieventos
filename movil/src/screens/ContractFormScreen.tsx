/**
 * @file ContractFormScreen.tsx
 * @description Pantalla de formulario para crear y editar contratos.
 * Esta pantalla es reutilizable. Si se navega a ella con un `contractId` en los parámetros,
 * carga los datos del contrato existente y funciona en "modo edición". Si no, funciona en "modo creación".
 * Incluye secciones plegables y animadas para gestionar las relaciones del contrato.
 * @requires react
 * @requires react-native
 * @requires @expo/vector-icons
 * @requires ../contexts/AuthContext - Para obtener el token y datos del usuario.
 * @requires ../services/api - Para realizar las peticiones al backend.
 * @requires @react-native-community/datetimepicker - Para los selectores de fecha.
 * @requires @react-navigation/native - Para obtener parámetros de la ruta.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Keyboard,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRoute } from '@react-navigation/native';

// Habilita LayoutAnimation en Android para transiciones suaves.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ========================================================================
// --- DEFINICIÓN DE TIPOS ---
// ========================================================================

/** @typedef {object} Resource - Define la estructura de un recurso disponible. */
type Resource = { _id: string; name: string; description: string; quantity: number };

/** @typedef {object} Provider - Define la estructura de un proveedor disponible. */
type Provider = { _id: string; name: string; contactPerson: string };

/** @typedef {object} Personnel - Define la estructura de una persona de personal disponible. */
type Personnel = { _id: string; firstName: string; lastName: string; email: string };

/** @typedef {object} SelectedResource - Define la estructura de un recurso seleccionado para el contrato. */
type SelectedResource = { resource: string; quantity: number };

/** @typedef {object} SelectedProvider - Define la estructura de un proveedor seleccionado para el contrato. */
type SelectedProvider = { provider: string; serviceDescription: string; cost: number };

/** @typedef {object} SelectedPersonnel - Define la estructura de personal seleccionado para el contrato. */
type SelectedPersonnel = { person: string; role: string; hours: number };

/**
 * @component ContractFormScreen
 * @description Componente principal de la pantalla del formulario de contratos.
 * @param {any} navigation - Propiedad de navegación de React Navigation.
 */
const ContractFormScreen = ({ navigation }: any) => {
  // --- HOOKS ---
  const { user, token } = useAuth(); // Hook para obtener datos de autenticación.
  const route = useRoute(); // Hook para acceder a los parámetros de la ruta.
  const { contractId } = (route.params as { contractId?: string }) || {}; // Extrae `contractId` si se está editando.

  // --- ESTADOS DEL FORMULARIO PRINCIPAL ---
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [budget, setBudget] = useState('');
  const [terms, setTerms] = useState('');
  const [status, setStatus] = useState('borrador');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  
  // --- ESTADOS DE UI Y CONTROL ---
  const [showStartDatePicker, setShowStartDatePicker] = useState(false); // Controla la visibilidad del selector de fecha de inicio.
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);   // Controla la visibilidad del selector de fecha de fin.
  const [loading, setLoading] = useState(true);                        // Estado de carga inicial de datos.
  const [isSubmitting, setIsSubmitting] = useState(false);               // Estado de carga al enviar el formulario.
  /** @description Estado para controlar la visibilidad (plegado/desplegado) de las secciones. */
  const [collapsedSections, setCollapsedSections] = useState({
    resources: true,
    providers: true,
    personnel: true,
  });

  // --- ESTADOS DE DATOS ---
  const [availableResources, setAvailableResources] = useState<Resource[]>([]);     // Lista de todos los recursos disponibles.
  const [availableProviders, setAvailableProviders] = useState<Provider[]>([]);     // Lista de todos los proveedores disponibles.
  const [availablePersonnel, setAvailablePersonnel] = useState<Personnel[]>([]);     // Lista de todo el personal disponible.
  const [selectedResources, setSelectedResources] = useState<SelectedResource[]>([]); // Recursos seleccionados para este contrato.
  const [selectedProviders, setSelectedProviders] = useState<SelectedProvider[]>([]); // Proveedores seleccionados para este contrato.
  const [selectedPersonnel, setSelectedPersonnel] = useState<SelectedPersonnel[]>([]); // Personal seleccionado para este contrato.

  /** @description Variable booleana que determina si el usuario actual puede editar el estado del contrato. */
  const canEditStatus = user?.role === 'admin' || user?.role === 'coordinador';

  /**
   * @function useEffect
   * @description Carga los datos necesarios al montar el componente.
   * Si `contractId` existe, carga los datos del contrato para edición.
   */
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const headers = { 'x-access-token': token };
        // Carga todas las listas de disponibles en paralelo para mayor eficiencia.
        const [resourcesRes, providersRes, personnelRes] = await Promise.all([
          api.get('/resources?limit=100', { headers }),
          api.get('/providers?limit=100', { headers }),
          api.get('/personnel?limit=100', { headers }),
        ]);
        setAvailableResources(resourcesRes.data.data);
        setAvailableProviders(providersRes.data.data);
        setAvailablePersonnel(personnelRes.data.data);

        // Si `contractId` está presente, estamos en modo "Edición".
        if (contractId) {
          const { data } = await api.get(`/contracts/${contractId}`, { headers });
          const contract = data.data;

          // Rellena los estados del formulario con los datos del contrato existente.
          setName(contract.name);
          setClientName(contract.clientName);
          setClientPhone(contract.clientPhone);
          setClientEmail(contract.clientEmail);
          setBudget(contract.budget?.toString() || '');
          setTerms(contract.terms);
          setStatus(contract.status);
          setStartDate(new Date(contract.startDate));
          setEndDate(new Date(contract.endDate));
          
          // Mapea los datos anidados para que coincidan con la estructura esperada por el estado.
          setSelectedResources(contract.resources.map((r: any) => ({ resource: r.resource._id, quantity: r.quantity })));
          setSelectedProviders(contract.providers.map((p: any) => ({ provider: p.provider._id, serviceDescription: p.serviceDescription, cost: p.cost })));
          setSelectedPersonnel(contract.personnel.map((p: any) => ({ person: p.person._id, role: p.role, hours: p.hours })));
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        Alert.alert("Error", "No se pudo cargar la información necesaria.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [contractId, token]);
  
  /**
   * @function handleSubmit
   * @description Maneja el envío del formulario para crear o actualizar un contrato.
   */
  const handleSubmit = async () => {
    // Validación de campos obligatorios.
    if (!name || !clientName || !clientEmail || !startDate || !endDate) {
      Alert.alert("Error", "Por favor, completa los campos obligatorios.");
      return;
    }
    setIsSubmitting(true);
    Keyboard.dismiss(); // Oculta el teclado al enviar.

    // Construye el objeto de datos del contrato a enviar.
    const contractData = {
        name, clientName, clientPhone, clientEmail, startDate, endDate,
        budget: parseFloat(budget) || 0,
        terms, status, resources: selectedResources, providers: selectedProviders, personnel: selectedPersonnel,
    };
    try {
      if (contractId) {
        // Modo Edición: Actualiza el contrato existente.
        await api.put(`/contracts/${contractId}`, contractData, { headers: { 'x-access-token': token } });
        Alert.alert("Éxito", "Contrato actualizado correctamente.");
      } else {
        // Modo Creación: Crea un nuevo contrato.
        await api.post('/contracts', contractData, { headers: { 'x-access-token': token } });
        Alert.alert("Éxito", "Contrato creado correctamente.");
      }
      navigation.goBack(); // Regresa a la pantalla anterior tras el éxito.
    } catch (error: any) {
      console.error("Error al guardar contrato:", error.response?.data || error);
      // Muestra errores de validación específicos del backend si están disponibles.
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).map((err: any) => err.message).join('\n');
        Alert.alert("Error de Validación", errorMessages);
      } else {
        Alert.alert("Error", `No se pudo ${contractId ? 'actualizar' : 'crear'} el contrato.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * @function toggleSection
   * @description Expande o colapsa una sección del formulario con una animación suave.
   * @param {'resources' | 'providers' | 'personnel'} section - El nombre de la sección a alternar.
   */
  const toggleSection = (section: 'resources' | 'providers' | 'personnel') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  /**
   * @function toggleSelection
   * @description Añade o remueve un ítem (recurso, proveedor, o personal) de la lista de seleccionados.
   */
  const toggleSelection = (id: string, type: 'resource' | 'provider' | 'personnel') => {
    // Lógica para añadir/quitar de la lista de recursos seleccionados.
    if (type === 'resource') {
      setSelectedResources(prev => prev.some(item => item.resource === id) ? prev.filter(item => item.resource !== id) : [...prev, { resource: id, quantity: 1 }]);
    } 
    // Lógica para añadir/quitar de la lista de proveedores seleccionados.
    else if (type === 'provider') {
      setSelectedProviders(prev => prev.some(item => item.provider === id) ? prev.filter(item => item.provider !== id) : [...prev, { provider: id, serviceDescription: '', cost: 0 }]);
    } 
    // Lógica para añadir/quitar de la lista de personal seleccionado.
    else if (type === 'personnel') {
      setSelectedPersonnel(prev => prev.some(item => item.person === id) ? prev.filter(item => item.person !== id) : [...prev, { person: id, role: '', hours: 0 }]);
    }
  };

  // --- Funciones para manejar cambios en los campos de los ítems seleccionados ---
  /**
   * @function handleResourceChange
   * @description Actualiza la cantidad de un recurso seleccionado.
   */
  const handleResourceChange = (resourceId: string, value: string) => setSelectedResources(prev => prev.map(res => res.resource === resourceId ? { ...res, quantity: parseInt(value, 10) || 0 } : res));
  
  /**
   * @function handleProviderChange
   * @description Actualiza un campo (descripción o costo) de un proveedor seleccionado.
   */
  const handleProviderChange = (providerId: string, field: 'serviceDescription' | 'cost', value: string | number) => setSelectedProviders(prev => prev.map(prov => prov.provider === providerId ? { ...prov, [field]: value } : prov));
  
  /**
   * @function handlePersonnelChange
   * @description Actualiza un campo (rol u horas) de una persona seleccionada.
   */
  const handlePersonnelChange = (personId: string, field: 'role' | 'hours', value: string | number) => setSelectedPersonnel(prev => prev.map(pers => pers.person === personId ? { ...pers, [field]: value } : pers));
  
  /**
   * @function handleDateChange
   * @description Manejador para el evento de cambio de fecha de los DateTimePicker.
   */
  const handleDateChange = (event: any, selectedDate: Date | undefined, type: 'start' | 'end') => {
    setShowStartDatePicker(type === 'start' ? false : showStartDatePicker);
    setShowEndDatePicker(type === 'end' ? false : showEndDatePicker);
    if (selectedDate) {
      if (type === 'start') setStartDate(selectedDate);
      else setEndDate(selectedDate);
    }
  };

  // Muestra un indicador de carga mientras los datos iniciales se están obteniendo.
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9370DB" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }
  
  // Renderizado principal del formulario.
  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        {/* El título de la pantalla cambia dinámicamente si es "Crear" o "Editar". */}
        <Text style={styles.screenTitle}>{contractId ? 'Editar Contrato' : 'Nuevo Contrato'}</Text>
      </View>

      {/* Sección principal del formulario con los campos de texto */}
      <View style={styles.formSection}>
        <Text style={styles.label}>Nombre del contrato</Text><TextInput style={styles.input} placeholder="Nombre del evento" placeholderTextColor="#999" value={name} onChangeText={setName} />
        <Text style={styles.label}>Nombre del Cliente</Text><TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor="#999" value={clientName} onChangeText={setClientName} />
        <Text style={styles.label}>Teléfono</Text><TextInput style={styles.input} placeholder="Ej. +57 300 1234567" placeholderTextColor="#999" value={clientPhone} onChangeText={setClientPhone} keyboardType="phone-pad" />
        <Text style={styles.label}>Correo</Text><TextInput style={styles.input} placeholder="cliente@ejemplo.com" placeholderTextColor="#999" value={clientEmail} onChangeText={setClientEmail} keyboardType="email-address" />
        <Text style={styles.label}>Presupuesto</Text><TextInput style={styles.input} placeholder="0" placeholderTextColor="#999" value={budget} onChangeText={setBudget} keyboardType="numeric" />
        <Text style={styles.label}>Términos</Text><TextInput style={[styles.input, styles.textArea]} placeholder="Términos y condiciones del contrato" placeholderTextColor="#999" value={terms} onChangeText={setTerms} multiline />
        <View style={styles.datePickerRow}><View style={styles.datePickerContainer}><Text style={styles.label}>Fecha Inicio</Text><TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.dateInput}><Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text><FontAwesome5 name="calendar-alt" size={20} color="#999" /></TouchableOpacity>{showStartDatePicker && (<DateTimePicker value={startDate} mode="date" display="default" onChange={(e,d) => handleDateChange(e,d,'start')} />)}</View><View style={styles.datePickerContainer}><Text style={styles.label}>Fecha Fin</Text><TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.dateInput}><Text style={styles.dateText}>{endDate.toLocaleDateString()}</Text><FontAwesome5 name="calendar-alt" size={20} color="#999" /></TouchableOpacity>{showEndDatePicker && (<DateTimePicker value={endDate} mode="date" display="default" onChange={(e,d) => handleDateChange(e,d,'end')} />)}</View></View>
        {canEditStatus && (<View><Text style={styles.label}>Estado del contrato</Text><View style={styles.statusPicker}>{['borrador', 'activo', 'completado', 'cancelado'].map(s => (<TouchableOpacity key={s} style={[styles.statusOption, status === s && styles.statusOptionActive]} onPress={() => setStatus(s)}><Text style={[styles.statusText, status === s && styles.statusTextActive]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text></TouchableOpacity>))}</View></View>)}
      </View>
      
      {/* Sección Plegable de Recursos */}
      <View style={styles.collapsibleSection}>
        <TouchableOpacity style={styles.listSectionHeader} onPress={() => toggleSection('resources')}>
          <Text style={styles.listSectionTitle}>Recursos</Text>
          <FontAwesome5 name={collapsedSections.resources ? 'chevron-down' : 'chevron-up'} size={16} color="#ccc" />
        </TouchableOpacity>
        {!collapsedSections.resources && (
          <View style={styles.listContent}>
            {availableResources.map(res => {
              const isSelected = selectedResources.some(item => item.resource === res._id);
              return ( <View key={res._id} style={styles.listItemContainer}><TouchableOpacity style={styles.listItem} onPress={() => toggleSelection(res._id, 'resource')}><FontAwesome5 name={isSelected ? 'check-square' : 'square'} size={20} color="#9370DB" /><View style={styles.listItemContent}><Text style={styles.listItemText}>{res.name}</Text><Text style={styles.listItemDescription}>{res.description}</Text></View></TouchableOpacity>{isSelected && (<View style={styles.detailsInputContainer}><Text style={styles.detailsLabel}>Cantidad:</Text><TextInput style={styles.detailsInput} keyboardType="numeric" placeholder="1" placeholderTextColor="#999" value={selectedResources.find(r => r.resource === res._id)?.quantity.toString() || '1'} onChangeText={(text) => handleResourceChange(res._id, text)} /></View>)}</View> );
            })}
          </View>
        )}
      </View>

      {/* Sección Plegable de Proveedores */}
      <View style={styles.collapsibleSection}>
        <TouchableOpacity style={styles.listSectionHeader} onPress={() => toggleSection('providers')}>
          <Text style={styles.listSectionTitle}>Proveedores</Text>
          <FontAwesome5 name={collapsedSections.providers ? 'chevron-down' : 'chevron-up'} size={16} color="#ccc" />
        </TouchableOpacity>
        {!collapsedSections.providers && (
           <View style={styles.listContent}>
            {availableProviders.map(prov => {
              const isSelected = selectedProviders.some(item => item.provider === prov._id);
              const currentProvider = selectedProviders.find(p => p.provider === prov._id);
              return ( <View key={prov._id} style={styles.listItemContainer}><TouchableOpacity style={styles.listItem} onPress={() => toggleSelection(prov._id, 'provider')}><FontAwesome5 name={isSelected ? 'check-square' : 'square'} size={20} color="#9370DB" /><View style={styles.listItemContent}><Text style={styles.listItemText}>{prov.name}</Text><Text style={styles.listItemDescription}>{prov.contactPerson}</Text></View></TouchableOpacity>{isSelected && (<View style={styles.detailsInputContainer_Grid}><TextInput style={[styles.detailsInput, {flex: 2, marginRight: 10}]} placeholder="Descripción del Servicio" placeholderTextColor="#999" value={currentProvider?.serviceDescription} onChangeText={(text) => handleProviderChange(prov._id, 'serviceDescription', text)} /><TextInput style={[styles.detailsInput, {flex: 1}]} placeholder="Costo" placeholderTextColor="#999" value={currentProvider?.cost > 0 ? currentProvider.cost.toString() : ''} onChangeText={(text) => handleProviderChange(prov._id, 'cost', parseInt(text) || 0)} keyboardType="numeric" /></View>)}</View> );
            })}
          </View>
        )}
      </View>
      
      {/* Sección Plegable de Personal */}
      <View style={styles.collapsibleSection}>
        <TouchableOpacity style={styles.listSectionHeader} onPress={() => toggleSection('personnel')}>
          <Text style={styles.listSectionTitle}>Personal</Text>
          <FontAwesome5 name={collapsedSections.personnel ? 'chevron-down' : 'chevron-up'} size={16} color="#ccc" />
        </TouchableOpacity>
        {!collapsedSections.personnel && (
           <View style={styles.listContent}>
            {availablePersonnel.map(pers => {
              const isSelected = selectedPersonnel.some(item => item.person === pers._id);
              const currentPersonnel = selectedPersonnel.find(p => p.person === pers._id);
              return ( <View key={pers._id} style={styles.listItemContainer}><TouchableOpacity style={styles.listItem} onPress={() => toggleSelection(pers._id, 'personnel')}><FontAwesome5 name={isSelected ? 'check-square' : 'square'} size={20} color="#9370DB" /><View style={styles.listItemContent}><Text style={styles.listItemText}>{pers.firstName} {pers.lastName}</Text><Text style={styles.listItemDescription}>{pers.email}</Text></View></TouchableOpacity>{isSelected && (<View style={styles.detailsInputContainer_Grid}><TextInput style={[styles.detailsInput, {flex: 2, marginRight: 10}]} placeholder="Rol" placeholderTextColor="#999" value={currentPersonnel?.role} onChangeText={(text) => handlePersonnelChange(pers._id, 'role', text)} /><TextInput style={[styles.detailsInput, {flex: 1}]} placeholder="Horas" placeholderTextColor="#999" value={currentPersonnel?.hours > 0 ? currentPersonnel.hours.toString() : ''} onChangeText={(text) => handlePersonnelChange(pers._id, 'hours', parseInt(text) || 0)} keyboardType="numeric" /></View>)}</View> );
            })}
          </View>
        )}
      </View>

      {/* Botones de acción finales del formulario */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}><Text style={styles.buttonText}>CANCELAR</Text></TouchableOpacity>
        <TouchableOpacity style={styles.createButton} onPress={handleSubmit} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.buttonText}>{contractId ? 'GUARDAR CAMBIOS' : 'CREAR CONTRATO'}</Text>}</TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Hoja de estilos del componente.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a38' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a0a38' },
  loadingText: { color: '#9370DB', marginTop: 10, fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50 },
  backButton: { marginRight: 20 },
  screenTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  formSection: { paddingHorizontal: 20, marginBottom: 20, paddingTop: 10 },
  label: { color: '#ccc', fontSize: 14, marginBottom: 5 },
  input: { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  datePickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  datePickerContainer: { width: '48%' },
  dateInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 15, borderRadius: 8 },
  dateText: { color: '#fff', fontSize: 16 },
  statusPicker: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
  statusOption: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.3)', marginRight: 10, marginBottom: 10 },
  statusOptionActive: { backgroundColor: '#9370DB', borderColor: '#9370DB' },
  statusText: { color: '#ccc' },
  statusTextActive: { color: '#fff', fontWeight: 'bold' },
  collapsibleSection: {
    backgroundColor: 'rgba(30, 10, 56, 0.8)',
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  listSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listSectionTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#fff',
  },
  listContent: {
    paddingTop: 15,
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  listItemContainer: { 
    backgroundColor: 'transparent', 
    borderRadius: 8, 
    marginBottom: 10, 
    paddingVertical: 5 
  },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  listItemContent: { marginLeft: 15, flex: 1 },
  listItemText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  listItemDescription: { color: '#ccc', fontSize: 12 },
  detailsInputContainer: { paddingTop: 5, paddingBottom: 10 },
  detailsInputContainer_Grid: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 5, paddingBottom: 10 },
  detailsLabel: { color: '#ccc', fontSize: 12, marginBottom: 5, marginLeft: 5 },
  detailsInput: { backgroundColor: 'rgba(0, 0, 0, 0.3)', color: '#fff', padding: 10, borderRadius: 6, fontSize: 14 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 10 },
  cancelButton: { backgroundColor: '#6c757d', padding: 15, borderRadius: 8, alignItems: 'center', flex: 1, marginRight: 10 },
  createButton: { backgroundColor: '#9370DB', padding: 15, borderRadius: 8, alignItems: 'center', flex: 1, marginLeft: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

export default ContractFormScreen;
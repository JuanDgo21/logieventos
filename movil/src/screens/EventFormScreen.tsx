import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Keyboard } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';
import { useRoute, useNavigation } from '@react-navigation/native';

type SelectOption = { label: string; value: string };

const EventFormScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId } = (route.params as { eventId?: string }) || {};
  const { token } = useAuth();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [status, setStatus] = useState('planificado');
  
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [selectedResponsable, setSelectedResponsable] = useState<string | null>(null);

  const [availableEventTypes, setAvailableEventTypes] = useState<SelectOption[]>([]);
  const [availableContracts, setAvailableContracts] = useState<SelectOption[]>([]);
  const [availableUsers, setAvailableUsers] = useState<SelectOption[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  const statusOptions = [
    { label: 'Planificado', value: 'planificado' },
    { label: 'En Progreso', value: 'en_progreso' },
    { label: 'Completado', value: 'completado' },
    { label: 'Cancelado', value: 'cancelado' },
  ];

  useEffect(() => {
    const loadFormData = async () => {
      setLoading(true);
      try {
        const headers = { 'x-access-token': token };
        const [typesRes, contractsRes, usersRes] = await Promise.all([
          api.get('/event-types', { headers }),
          api.get('/contracts', { headers }),
          api.get('/users', { headers }),
        ]);

        setAvailableEventTypes(typesRes.data.data.map((type: any) => ({ label: type.name, value: type._id })));
        setAvailableContracts(contractsRes.data.data.map((contract: any) => ({ label: contract.name, value: contract._id })));
        setAvailableUsers(usersRes.data.data.map((user: any) => ({ label: user.fullname, value: user._id }))); // Usar fullname para la lista

        if (eventId) {
          const { data } = await api.get(`/events/${eventId}?populate=eventType,contract,responsable`, { headers });
          const event = data.data;
          
          setName(event.name);
          setDescription(event.description);
          setLocation(event.location);
          setStartDate(new Date(event.startDate));
          setEndDate(new Date(event.endDate));
          setStatus(event.status);

          // --- CORRECCIÓN AQUÍ ---
          setSelectedEventType(event.eventType?._id);
          setSelectedContract(event.contract?._id);
          setSelectedResponsable(event.responsable?._id);
        }
      } catch (error) {
        console.error("Error cargando datos para el formulario:", error);
        Alert.alert("Error", "No se pudieron cargar los datos necesarios.");
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, [eventId, token]);

  const handleSubmit = async () => { /* ... (sin cambios) */
    if (!name || !description || !location || !selectedEventType || !selectedContract || !selectedResponsable) {
      Alert.alert("Error", "Por favor, completa todos los campos obligatorios.");
      return;
    }
    if (endDate < startDate) {
      Alert.alert("Error", "La fecha de fin no puede ser anterior a la de inicio.");
      return;
    }
    setIsSubmitting(true);
    Keyboard.dismiss();
    const eventData = {
      name, description, location, startDate, endDate, status,
      eventType: selectedEventType,
      contract: selectedContract,
      responsable: selectedResponsable,
    };
    try {
      if (eventId) {
        await api.put(`/events/${eventId}`, eventData, { headers: { 'x-access-token': token } });
        Alert.alert("Éxito", "Evento actualizado correctamente.");
      } else {
        await api.post('/events', eventData, { headers: { 'x-access-token': token } });
        Alert.alert("Éxito", "Evento creado correctamente.");
      }
      navigation.goBack();
    } catch (error: any) {
      console.error("Error al guardar el evento:", error.response?.data || error);
      Alert.alert("Error", error.response?.data?.message || `No se pudo guardar el evento.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9370DB" />
        <Text style={styles.loadingText}>Cargando formulario...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><FontAwesome5 name="arrow-left" size={24} color="#fff" /></TouchableOpacity>
            <Text style={styles.screenTitle}>{eventId ? 'Editar Evento' : 'Nuevo Evento'}</Text>
        </View>
        <View style={styles.formSection}>
            <Text style={styles.label}>Nombre del Evento</Text><TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ej. Conferencia Anual de Tecnología" placeholderTextColor="#999" />
            <Text style={styles.label}>Descripción</Text><TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Detalles del evento..." placeholderTextColor="#999" multiline />
            <Text style={styles.label}>Ubicación</Text><TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Ej. Centro de Convenciones Corferias" placeholderTextColor="#999" />
            <View style={styles.pickerContainer}><Text style={styles.label}>Tipo de Evento</Text><RNPickerSelect onValueChange={setSelectedEventType} items={availableEventTypes} value={selectedEventType} style={pickerSelectStyles} placeholder={{ label: 'Selecciona un tipo...', value: null }} /></View>
            <View style={styles.pickerContainer}><Text style={styles.label}>Contrato Asociado</Text><RNPickerSelect onValueChange={setSelectedContract} items={availableContracts} value={selectedContract} style={pickerSelectStyles} placeholder={{ label: 'Selecciona un contrato...', value: null }} /></View>
            <View style={styles.pickerContainer}><Text style={styles.label}>Responsable</Text><RNPickerSelect onValueChange={setSelectedResponsable} items={availableUsers} value={selectedResponsable} style={pickerSelectStyles} placeholder={{ label: 'Selecciona un responsable...', value: null }} /></View>
            <View style={styles.datePickerRow}><View style={styles.datePickerContainer}><Text style={styles.label}>Fecha Inicio</Text><TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.dateInput}><Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text></TouchableOpacity>{showStartDatePicker && <DateTimePicker value={startDate} mode="date" display="default" onChange={(e,d) => { setShowStartDatePicker(false); if(d) setStartDate(d); }} />}</View><View style={styles.datePickerContainer}><Text style={styles.label}>Fecha Fin</Text><TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.dateInput}><Text style={styles.dateText}>{endDate.toLocaleDateString()}</Text></TouchableOpacity>{showEndDatePicker && <DateTimePicker value={endDate} mode="date" display="default" onChange={(e,d) => { setShowEndDatePicker(false); if(d) setEndDate(d); }} />}</View></View>
            <View style={styles.pickerContainer}><Text style={styles.label}>Estado del Evento</Text><RNPickerSelect onValueChange={setStatus} items={statusOptions} value={status} style={pickerSelectStyles} /></View>
        </View>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>{eventId ? 'GUARDAR CAMBIOS' : 'CREAR EVENTO'}</Text>}</TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a38' }, loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a0a38' }, loadingText: { color: '#9370DB', marginTop: 10, fontSize: 16 }, header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50 }, backButton: { marginRight: 20 }, screenTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' }, formSection: { paddingHorizontal: 20, marginBottom: 20 }, label: { color: '#ccc', fontSize: 14, marginBottom: 8, marginTop: 10 }, input: { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#fff', padding: 12, borderRadius: 8, fontSize: 16 }, textArea: { height: 100, textAlignVertical: 'top' }, datePickerRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }, datePickerContainer: { width: '48%' }, dateInput: { backgroundColor: 'rgba(255, 255, 255, 0.1)', padding: 12, borderRadius: 8, height: 48, justifyContent: 'center' }, dateText: { color: '#fff', fontSize: 16 }, pickerContainer: { marginTop: 10 }, submitButton: { backgroundColor: '#9370DB', padding: 15, borderRadius: 8, alignItems: 'center', margin: 20 }, submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
const pickerSelectStyles = StyleSheet.create({
  inputIOS: { fontSize: 16, padding: 12, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 8, color: 'white' },
  inputAndroid: { fontSize: 16, padding: 12, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 8, color: 'white' },
  placeholder: { color: '#999' },
});
export default EventFormScreen;
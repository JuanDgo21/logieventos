import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import RNPickerSelect from 'react-native-picker-select';
import { useNavigation } from '@react-navigation/native';

type SelectOption = { label: string; value: string };

const EventTypeFormScreen = () => {
  const navigation = useNavigation();
  const { token } = useAuth();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [requiredPersonnelType, setRequiredPersonnelType] = useState<string | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [active, setActive] = useState(true);
  const [personnelTypes, setPersonnelTypes] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryOptions = [
    { label: 'Corporativo', value: 'corporativo' }, { label: 'Social', value: 'social' },
    { label: 'Cultural', value: 'cultural' }, { label: 'Deportivo', value: 'deportivo' },
    { label: 'Académico', value: 'academico' },
  ];

  useEffect(() => {
    const loadSelectOptions = async () => {
      try {
        const response = await api.get('/personnel-types', { headers: { 'x-access-token': token } });
        setPersonnelTypes(response.data.data.map((pt: any) => ({ label: pt.name, value: pt._id })));
      } catch (error) {
        console.error("Error cargando los tipos de personal:", error);
        Alert.alert("Error", "No se pudo cargar la lista de tipos de personal.");
      } finally {
        setLoading(false);
      }
    };
    loadSelectOptions();
  }, [token]);

  const handleSubmit = async () => {
    if (!name || !category || !requiredPersonnelType) {
      Alert.alert("Error", "Nombre, Categoría y Tipo de Personal son obligatorios.");
      return;
    }
    setIsSubmitting(true);
    try {
      const eventTypeData = {
        name, description, category, requiredPersonnelType,
        estimatedDuration: Number(estimatedDuration) || undefined,
        active,
      };
      await api.post('/event-types', eventTypeData, { headers: { 'x-access-token': token } });
      Alert.alert("Éxito", "Tipo de evento creado correctamente.");
      navigation.goBack();
    } catch (error: any) {
      console.error("Error al crear tipo de evento:", error.response?.data || error);
      Alert.alert("Error", error.response?.data?.message || "No se pudo crear el tipo de evento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#9370DB" style={styles.loadingContainer} />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Nuevo Tipo de Evento</Text>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Nombre del Tipo de Evento</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Ej. Boda, Conferencia, etc." placeholderTextColor="#999" />
        
        <Text style={styles.label}>Descripción</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Describe este tipo de evento" placeholderTextColor="#999" multiline />
        
        <View style={styles.pickerContainer}>
            <Text style={styles.label}>Categoría</Text>
            <RNPickerSelect onValueChange={setCategory} items={categoryOptions} value={category} style={pickerSelectStyles} placeholder={{ label: 'Selecciona una categoría...', value: null }} />
        </View>

        <View style={styles.pickerContainer}>
            <Text style={styles.label}>Tipo de Personal Requerido</Text>
            <RNPickerSelect onValueChange={setRequiredPersonnelType} items={personnelTypes} value={requiredPersonnelType} style={pickerSelectStyles} placeholder={{ label: 'Selecciona un tipo de personal...', value: null }} />
        </View>

        <Text style={styles.label}>Duración Estimada (horas)</Text>
        <TextInput style={styles.input} value={estimatedDuration} onChangeText={setEstimatedDuration} placeholder="Ej. 8" placeholderTextColor="#999" keyboardType="numeric" />

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Activo</Text>
          <Switch trackColor={{ false: "#767577", true: "#81b0ff" }} thumbColor={active ? "#9370DB" : "#f4f3f4"} onValueChange={setActive} value={active} />
        </View>
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>CREAR TIPO DE EVENTO</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

// --- ESTILOS UNIFICADOS (COMO EN EVENTFORM) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0a38' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a0a38' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50 },
  backButton: { marginRight: 20 },
  screenTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  formSection: { paddingHorizontal: 20, marginBottom: 20 },
  label: { color: '#ccc', fontSize: 14, marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#fff', padding: 12, borderRadius: 8, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  pickerContainer: { marginTop: 10 },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  submitButton: { backgroundColor: '#9370DB', padding: 15, borderRadius: 8, alignItems: 'center', marginHorizontal: 20, marginBottom: 40 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: { fontSize: 16, padding: 12, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 8, color: 'white' },
  inputAndroid: { fontSize: 16, padding: 12, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 8, color: 'white' },
  placeholder: { color: '#999' },
});

export default EventTypeFormScreen;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { PersonnelStackParamList } from '../navigation/PersonnelStack';
import usePersonnelService from '../services/personnel-service';
import { PersonnelType, NewPersonnelType, UpdatePersonnelType } from '../types/personnel';

type PersonnelTypeFormNavigationProp = StackNavigationProp<PersonnelStackParamList, 'PersonnelTypeForm'>;
type PersonnelTypeFormRouteProp = RouteProp<PersonnelStackParamList, 'PersonnelTypeForm'>;

const PersonnelTypeFormScreen: React.FC = () => {
  const navigation = useNavigation<PersonnelTypeFormNavigationProp>();
  const route = useRoute<PersonnelTypeFormRouteProp>();
  const { typeId } = route.params || {};

  const {
    personnelTypes,
    getPersonnelTypeById,
    createPersonnelType,
    updatePersonnelType,
    refreshData,   // 👈 agrega esto
  } = usePersonnelService();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (typeId) {
      loadTypeData();
    }
  }, [typeId]);

  const loadTypeData = async () => {
    try {
      setIsLoading(true);
      const type = await getPersonnelTypeById(typeId!);
      setFormData({
        name: type.name,
        description: type.description || '',
        isActive: type.isActive,
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar los datos de la categoría');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Máximo 50 caracteres';
    }

    if (formData.description.length > 200) {
      newErrors.description = 'Máximo 200 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (typeId) {
        const updateData: UpdatePersonnelType = {
          _id: typeId,
          ...formData,
        };
        await updatePersonnelType(typeId, updateData);
        Alert.alert('Éxito', 'Categoría actualizada correctamente');
      } else {
        const newType: NewPersonnelType = {
          ...formData,
          createdBy: 'current-user-id',
        };
        await createPersonnelType(newType);
        Alert.alert('Éxito', 'Categoría creada correctamente');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo guardar la categoría');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && typeId) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9370DB" />
        <Text style={styles.loadingText}>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <View style={styles.titleIcon}>
              <FontAwesome5 name="tag" size={20} color="#fff" />
            </View>
            <Text style={styles.headerTitle}>
              {typeId ? 'Editar Categoría' : 'Nueva Categoría'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <FontAwesome5 name="times" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.formGrid}>
          {/* Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              <FontAwesome5 name="tag" size={14} color="#9370DB" /> Nombre*
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  errors.name && styles.inputError
                ]}
                placeholder="Nombre de la categoría"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                maxLength={50}
              />
            </View>
            {errors.name && (
              <Text style={styles.errorText}>
                <FontAwesome5 name="exclamation-circle" size={12} color="#ff416c" /> {errors.name}
              </Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              <FontAwesome5 name="align-left" size={14} color="#9370DB" /> Descripción
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.textArea,
                  errors.description && styles.inputError
                ]}
                placeholder="Descripción opcional (máx. 200 caracteres)"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                multiline
                numberOfLines={3}
                maxLength={200}
              />
            </View>
            {errors.description && (
              <Text style={styles.errorText}>
                <FontAwesome5 name="exclamation-circle" size={12} color="#ff416c" /> {errors.description}
              </Text>
            )}
          </View>

          {/* Status */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              <FontAwesome5 name="power-off" size={14} color="#9370DB" /> Estado
            </Text>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>
                {formData.isActive ? 'Activo' : 'Inactivo'}
              </Text>
              <Switch
                value={formData.isActive}
                onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value }))}
                trackColor={{ false: '#767577', true: '#9370DB' }}
                thumbColor={formData.isActive ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>

        {/* Form Actions */}
        <View style={styles.formActions}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <FontAwesome5 name="times" size={16} color="#fff" />
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.saveButton,
              isLoading && styles.saveButtonDisabled
            ]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <FontAwesome5 name="save" size={16} color="#fff" />
            )}
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Guardando...' : typeId ? 'Actualizar' : 'Guardar'}
            </Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: 'rgba(106, 17, 203, 0.8)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  form: {
    padding: 20,
  },
  formGrid: {
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    paddingLeft: 40,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    paddingLeft: 40,
    color: '#fff',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#ff416c',
  },
  errorText: {
    color: '#ff416c',
    fontSize: 12,
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
  },
  switchLabel: {
    color: '#fff',
    fontSize: 16,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#9370DB',
    borderRadius: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default PersonnelTypeFormScreen;
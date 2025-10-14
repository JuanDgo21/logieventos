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
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { PersonnelStackParamList } from '../navigation/PersonnelStack';
import usePersonnelService from '../services/personnel-service';
import { Personnel, NewPersonnel, UpdatePersonnel } from '../types/personnel';

type PersonnelFormNavigationProp = StackNavigationProp<PersonnelStackParamList, 'PersonnelForm'>;
type PersonnelFormRouteProp = RouteProp<PersonnelStackParamList, 'PersonnelForm'>;

const PersonnelFormScreen: React.FC = () => {
  const navigation = useNavigation<PersonnelFormNavigationProp>();
  const route = useRoute<PersonnelFormRouteProp>();
  const { personnelId, handleCreatePersonnel, handleEditPersonnel } = route.params || {};

  const {
    personnelList,
    personnelTypes,
    getPersonnelById,
    createPersonnel,
    updatePersonnel,
    refreshData,
  } = usePersonnelService();

  const { user } = require('../contexts/AuthContext').useAuth();
  const normalize = (s?: string) => (s || '').toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const roleEquivalents: { [key: string]: string[] } = {
    admin: ['admin', 'administrator'],
    coordinador: ['coordinador', 'coordinator'],
    lider: ['lider', 'líder', 'leader'],
  };
  const hasRole = (required: string) => {
    if (!user) return false;
    const req = normalize(required);
    const matches = (r?: string) => {
      if (!r) return false;
      const n = normalize(r);
      if (n === req) return true;
      const equivalents = roleEquivalents[req] || [req];
      return equivalents.includes(n);
    };
  if (Array.isArray(user.roles)) return user.roles.some((r: string) => matches(r));
    return matches(user.role);
  };

  const isAdmin = hasRole('admin');
  const isCoordinator = hasRole('coordinador');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    personnelType: '',
    status: 'disponible' as 'disponible' | 'asignado' | 'vacaciones' | 'inactivo',
    skills: [] as string[],
  });
  const [newSkill, setNewSkill] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const statusOptions = [
    { value: 'disponible', label: 'Disponible' },
    { value: 'asignado', label: 'Asignado' },
    { value: 'vacaciones', label: 'Vacaciones' },
    { value: 'inactivo', label: 'Inactivo' },
  ];

  useEffect(() => {
    if (personnelId) {
      loadPersonnelData();
    }
  }, [personnelId]);

  const loadPersonnelData = async () => {
    try {
      setIsLoading(true);
      const personnel = await getPersonnelById(personnelId!);
      setFormData({
        firstName: personnel.firstName,
        lastName: personnel.lastName,
        email: personnel.email,
        phone: personnel.phone || '',
        personnelType: personnel.personnelType,
        status: personnel.status,
        skills: personnel.skills || [],
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar los datos del personal');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El formato del email es inválido';
    }
    if (formData.phone && !/^[0-9]{10,15}$/.test(formData.phone)) {
      newErrors.phone = 'Formato de teléfono inválido (10-15 dígitos)';
    }
    if (!formData.personnelType) {
      newErrors.personnelType = 'La categoría es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (personnelId) {
        const updateData: UpdatePersonnel = {
          _id: personnelId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          personnelType: formData.personnelType,
          status: formData.status,
          skills: formData.skills,
        };
        // Actualización instantánea en la lista
        if (typeof handleEditPersonnel === 'function') {
          await handleEditPersonnel(personnelId, updateData);
        } else {
          await updatePersonnel(personnelId, updateData);
        }
        Alert.alert('Éxito', 'Personal actualizado correctamente');
      } else {
        const newPersonnel: NewPersonnel = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          personnelType: formData.personnelType,
          status: formData.status,
          skills: formData.skills,
        };
        // Actualización instantánea en la lista
        if (typeof handleCreatePersonnel === 'function') {
          await handleCreatePersonnel(newPersonnel);
        } else {
          await createPersonnel(newPersonnel);
        }
        Alert.alert('Éxito', 'Personal creado correctamente');
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'No se pudo guardar el personal');
    } finally {
      setIsLoading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill),
    }));
  };

  const getTypeName = (type: any): string => {
    if (!type) return 'Sin categoría';
    if (typeof type === 'object' && type.name) return type.name; // si ya viene como objeto
    const found = personnelTypes.find(t => t._id === type);
    return found ? found.name : 'Sin categoría';
  };

  if (isLoading && personnelId) {
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
              <FontAwesome5 name="user-edit" size={20} color="#fff" />
            </View>
            <Text style={styles.headerTitle}>
              {personnelId ? 'Editar Personal' : 'Nuevo Personal'}
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
          {/* First Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              <FontAwesome5 name="user" size={14} color="#9370DB" /> Nombre*
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  errors.firstName && styles.inputError
                ]}
                placeholder="Ingrese el nombre"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={formData.firstName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
              />
            </View>
            {errors.firstName && (
              <Text style={styles.errorText}>
                <FontAwesome5 name="exclamation-circle" size={12} color="#ff416c" /> {errors.firstName}
              </Text>
            )}
          </View>

          {/* Last Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              <FontAwesome5 name="user" size={14} color="#9370DB" /> Apellido*
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  errors.lastName && styles.inputError
                ]}
                placeholder="Ingrese el apellido"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={formData.lastName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
              />
            </View>
            {errors.lastName && (
              <Text style={styles.errorText}>
                <FontAwesome5 name="exclamation-circle" size={12} color="#ff416c" /> {errors.lastName}
              </Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              <FontAwesome5 name="envelope" size={14} color="#9370DB" /> Email*
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  errors.email && styles.inputError
                ]}
                placeholder="Ingrese el email"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>
                <FontAwesome5 name="exclamation-circle" size={12} color="#ff416c" /> {errors.email}
              </Text>
            )}
          </View>

          {/* Phone */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              <FontAwesome5 name="phone" size={14} color="#9370DB" /> Teléfono
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.input,
                  errors.phone && styles.inputError
                ]}
                placeholder="Ingrese el teléfono"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
              />
            </View>
            {errors.phone && (
              <Text style={styles.errorText}>
                <FontAwesome5 name="exclamation-circle" size={12} color="#ff416c" /> {errors.phone}
              </Text>
            )}
          </View>

          {/* Category */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              <FontAwesome5 name="user-tag" size={14} color="#9370DB" /> Categoría*
            </Text>
            {personnelId && formData.personnelType && (
              <View style={styles.currentType}>
                <FontAwesome5 name="info-circle" size={12} color="#9370DB" />
                <Text style={styles.currentTypeText}>
                  Categoría actual: <Text style={styles.currentTypeName}>{getTypeName(formData.personnelType)}</Text>
                </Text>
              </View>
            )}
            <View style={styles.inputContainer}>
              <View style={[
                styles.selectContainer,
                errors.personnelType && styles.inputError
              ]}>
                <Text style={styles.selectPlaceholder}>
                  {formData.personnelType ? getTypeName(formData.personnelType) : 'Seleccione una categoría'}
                </Text>
              </View>
            </View>
            {errors.personnelType && (
              <Text style={styles.errorText}>
                <FontAwesome5 name="exclamation-circle" size={12} color="#ff416c" /> {errors.personnelType}
              </Text>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryOptions}>
              {personnelTypes.map(type => (
                <TouchableOpacity
                  key={type._id}
                  style={[
                    styles.categoryOption,
                    formData.personnelType === type._id && styles.categoryOptionActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, personnelType: type._id }))}
                >
                  <Text style={[
                    styles.categoryOptionText,
                    formData.personnelType === type._id && styles.categoryOptionTextActive
                  ]}>
                    {type.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Status */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              <FontAwesome5 name="power-off" size={14} color="#9370DB" /> Estado*
            </Text>
            <View style={styles.inputContainer}>
              <View style={styles.selectContainer}>
                <Text style={styles.selectValue}>
                  {statusOptions.find(opt => opt.value === formData.status)?.label}
                </Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusOptions}>
              {statusOptions.map(option => {
                const disabled = !isAdmin; // only admin can change status
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.statusOption,
                      formData.status === option.value && styles.statusOptionActive,
                      disabled && styles.statusOptionDisabled
                    ]}
                    onPress={() => {
                      if (disabled) return;
                      setFormData(prev => ({ ...prev, status: option.value as 'disponible' | 'asignado' | 'vacaciones' | 'inactivo' }));
                    }}
                    disabled={disabled}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      formData.status === option.value && styles.statusOptionTextActive,
                      disabled && styles.statusOptionTextDisabled
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {!isAdmin && (
              <Text style={styles.infoText}>Solo el administrador puede cambiar el estado del personal</Text>
            )}
          </View>

          {/* Skills */}
          <View style={[styles.formGroup, styles.fullWidth]}>
            <Text style={styles.label}>
              <FontAwesome5 name="tools" size={14} color="#9370DB" /> Habilidades
            </Text>
            <View style={styles.skillsInputContainer}>
              <View style={styles.skillsInput}>
                <TextInput
                  style={styles.skillsTextInput}
                  placeholder="Añadir nueva habilidad"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={newSkill}
                  onChangeText={setNewSkill}
                  onSubmitEditing={addSkill}
                />
                <TouchableOpacity style={styles.addSkillButton} onPress={addSkill}>
                  <FontAwesome5 name="plus" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
              
              {formData.skills.length > 0 && (
                <View style={styles.skillsList}>
                  {formData.skills.map((skill, index) => (
                    <View key={index} style={styles.skillTag}>
                      <Text style={styles.skillText}>{skill}</Text>
                      <TouchableOpacity 
                        style={styles.removeSkill}
                        onPress={() => removeSkill(skill)}
                      >
                        <FontAwesome5 name="times" size={10} color="#9370DB" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
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
              {isLoading ? 'Procesando...' : personnelId ? 'Actualizar' : 'Guardar'}
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
  fullWidth: {
    width: '100%',
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
  inputError: {
    borderColor: '#ff416c',
  },
  errorText: {
    color: '#ff416c',
    fontSize: 12,
    marginTop: 4,
  },
  currentType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    backgroundColor: 'rgba(106, 17, 203, 0.1)',
    borderRadius: 6,
  },
  currentTypeText: {
    color: '#9370DB',
    fontSize: 12,
  },
  currentTypeName: {
    fontWeight: '600',
  },
  selectContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    paddingLeft: 40,
  },
  selectPlaceholder: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
  },
  selectValue: {
    color: '#fff',
    fontSize: 16,
  },
  categoryOptions: {
    marginTop: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    marginRight: 8,
  },
  categoryOptionActive: {
    backgroundColor: '#9370DB',
  },
  categoryOptionText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  categoryOptionTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  statusOptions: {
    marginTop: 8,
  },
  statusOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    marginRight: 8,
  },
  statusOptionActive: {
    backgroundColor: '#9370DB',
  },
  statusOptionDisabled: {
    opacity: 0.45,
  },
  statusOptionText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  statusOptionTextDisabled: {
    color: 'rgba(255, 255, 255, 0.4)'
  },
  infoText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 8,
  },
  statusOptionTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  skillsInputContainer: {
    gap: 12,
  },
  skillsInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    paddingLeft: 40,
  },
  skillsTextInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  addSkillButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#9370DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(106, 17, 203, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    color: '#9370DB',
    fontSize: 12,
  },
  removeSkill: {
    padding: 2,
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

export default PersonnelFormScreen;
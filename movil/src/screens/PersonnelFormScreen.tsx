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
import { NewPersonnel, UpdatePersonnel } from '../types/personnel';

type PersonnelFormNavigationProp = StackNavigationProp<PersonnelStackParamList, 'PersonnelForm'>;
type PersonnelFormRouteProp = RouteProp<PersonnelStackParamList, 'PersonnelForm'>;

// ========================================================================
// --- COMPONENTES AUXILIARES PARA REDUCIR COMPLEJIDAD ---
// ========================================================================

/**
 * @description Componente reutilizable para los campos de texto del formulario.
 */
const RenderTextInput = React.memo(({ label, icon, value, onChangeText, placeholder, error, ...props }: any) => (
  <View style={styles.formGroup}>
    <Text style={styles.label}>
      <FontAwesome5 name={icon} size={14} color="#9370DB" /> {label}
    </Text>
    <View style={styles.inputContainer}>
      <TextInput
        style={[
          styles.input,
          error && styles.inputError
        ]}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.5)"
        value={value}
        onChangeText={onChangeText}
        {...props}
      />
    </View>
    {error ? (
      <Text style={styles.errorText}>
        <FontAwesome5 name="exclamation-circle" size={12} color="#ff416c" /> {error}
      </Text>
    ) : null}
  </View>
));

/**
 * @description Componente para la sección de selección de Categoría.
 */
const RenderCategorySelect = React.memo(({ personnelId, personnelType, personnelTypes, getTypeName, setFormData, error }: any) => (
  <View style={styles.formGroup}>
    <Text style={styles.label}>
      <FontAwesome5 name="user-tag" size={14} color="#9370DB" /> Categoría*
    </Text>
    {personnelId && personnelType ? (
      <View style={styles.currentType}>
        <FontAwesome5 name="info-circle" size={12} color="#9370DB" />
        <Text style={styles.currentTypeText}>
          Categoría actual: <Text style={styles.currentTypeName}>{getTypeName(personnelType)}</Text>
        </Text>
      </View>
    ) : null}
    <View style={styles.inputContainer}>
      <View style={[
        styles.selectContainer,
        error && styles.inputError
      ]}>
        <Text style={styles.selectPlaceholder}>
          {personnelType ? getTypeName(personnelType) : 'Seleccione una categoría'}
        </Text>
      </View>
    </View>
    {error ? (
      <Text style={styles.errorText}>
        <FontAwesome5 name="exclamation-circle" size={12} color="#ff416c" /> {error}
      </Text>
    ) : null}
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryOptions}>
      {personnelTypes.map((type: any) => (
        <TouchableOpacity
          key={type._id}
          style={[
            styles.categoryOption,
            personnelType === type._id && styles.categoryOptionActive
          ]}
          onPress={() => setFormData((prev: any) => ({ ...prev, personnelType: type._id }))}
        >
          <Text style={[
            styles.categoryOptionText,
            personnelType === type._id && styles.categoryOptionTextActive
          ]}>
            {type.name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
));

/**
 * @description Componente para la sección de selección de Estado.
 */
const RenderStatusSelect = React.memo(({ status, statusOptions, isAdmin, setFormData }: any) => (
  <View style={styles.formGroup}>
    <Text style={styles.label}>
      <FontAwesome5 name="power-off" size={14} color="#9370DB" /> Estado*
    </Text>
    <View style={styles.inputContainer}>
      <View style={styles.selectContainer}>
        <Text style={styles.selectValue}>
          {statusOptions.find((opt: any) => opt.value === status)?.label}
        </Text>
      </View>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusOptions}>
      {statusOptions.map((option: any) => {
        const disabled = !isAdmin;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.statusOption,
              status === option.value && styles.statusOptionActive,
              disabled && styles.statusOptionDisabled
            ]}
            onPress={() => {
              if (disabled) return;
              setFormData((prev: any) => ({ ...prev, status: option.value as 'disponible' | 'asignado' | 'vacaciones' | 'inactivo' }));
            }}
            disabled={disabled}
          >
            <Text style={[
              styles.statusOptionText,
              status === option.value && styles.statusOptionTextActive,
              disabled && styles.statusOptionTextDisabled
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
    {isAdmin ? null : (
      <Text style={styles.infoText}>Solo el administrador puede cambiar el estado del personal</Text>
    )}
  </View>
));

/**
 * @description Componente para la sección de Habilidades (Skills).
 */
const RenderSkills = React.memo(({ skills, newSkill, setNewSkill, addSkill, removeSkill }: any) => (
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
      
      {skills.length > 0 ? (
        <View style={styles.skillsList}>
          {skills.map((skill: string) => (
            <View key={skill} style={styles.skillTag}>
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
      ) : null}
    </View>
  </View>
));


// ========================================================================
// --- COMPONENTE PRINCIPAL: PersonnelFormScreen ---
// ========================================================================

const PersonnelFormScreen: React.FC = () => {
  const navigation = useNavigation<PersonnelFormNavigationProp>();
  const route = useRoute<PersonnelFormRouteProp>();
  const { personnelId, handleCreatePersonnel, handleEditPersonnel } = route.params || {};

  const {
    personnelTypes,
    getPersonnelById,
    createPersonnel,
    updatePersonnel,
  } = usePersonnelService();

  const { user } = require('../contexts/AuthContext').useAuth();
  const normalize = (s?: string) => (s || '').toString().toLowerCase().normalize('NFD').replaceAll(/\p{Diacritic}/gu, '');
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
    return Array.isArray(user.roles) ? user.roles.some((r: string) => matches(r)) : matches(user.role);
  };

  const isAdmin = hasRole('admin');

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
      console.error("Error al cargar datos del personal:", error);
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
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El formato del email es inválido';
    }
    if (formData.phone && !/^[\d\s().+-]{7,25}$/.test(formData.phone)) {
      newErrors.phone = 'Formato de teléfono inválido (10-15 dígitos)';
    }
    if (!formData.personnelType) {
      newErrors.personnelType = 'La categoría es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    // CORRECCIÓN: (S7735) Invertida la condición para ser positiva
    if (validateForm()) {
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

  // CORRECCIÓN: (S3358) Extraído el ternario anidado a una función/if-else
  const getSaveButtonText = () => {
    if (isLoading) {
      return 'Procesando...';
    }
    if (personnelId) {
      return 'Actualizar';
    }
    return 'Guardar';
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
          
          <RenderTextInput
            label="Nombre*"
            icon="user"
            value={formData.firstName}
            onChangeText={(text: string) => setFormData(prev => ({ ...prev, firstName: text }))}
            placeholder="Ingrese el nombre"
            error={errors.firstName}
          />
          
          <RenderTextInput
            label="Apellido*"
            icon="user"
            value={formData.lastName}
            onChangeText={(text: string) => setFormData(prev => ({ ...prev, lastName: text }))}
            placeholder="Ingrese el apellido"
            error={errors.lastName}
          />

          <RenderTextInput
            label="Email*"
            icon="envelope"
            value={formData.email}
            onChangeText={(text: string) => setFormData(prev => ({ ...prev, email: text }))}
            placeholder="Ingrese el email"
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <RenderTextInput
            label="Teléfono"
            icon="phone"
            value={formData.phone}
            onChangeText={(text: string) => setFormData(prev => ({ ...prev, phone: text }))}
            placeholder="Ingrese el teléfono"
            error={errors.phone}
            keyboardType="phone-pad"
          />

          <RenderCategorySelect
            personnelId={personnelId}
            personnelType={formData.personnelType}
            personnelTypes={personnelTypes}
            getTypeName={getTypeName}
            setFormData={setFormData}
            error={errors.personnelType}
          />

          <RenderStatusSelect
            status={formData.status}
            statusOptions={statusOptions}
            isAdmin={isAdmin}
            setFormData={setFormData}
          />

          <RenderSkills
            skills={formData.skills}
            newSkill={newSkill}
            setNewSkill={setNewSkill}
            addSkill={addSkill}
            removeSkill={removeSkill}
          />
          
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
              {getSaveButtonText()} {/* Usando la función helper */}
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
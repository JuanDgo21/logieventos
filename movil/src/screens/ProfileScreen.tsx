/**
 * @file ProfileScreen.tsx
 * @description Pantalla de perfil de usuario. Permite al usuario ver y editar su información personal,
 * así como cambiar su contraseña. El formulario de cambio de contraseña aparece con una animación.
 * @requires react
 * @requires react-native
 * @requires @expo/vector-icons
 * @requires ../contexts/AuthContext - Para obtener datos de usuario y token.
 * @requires ../components/AppHeader - Para el encabezado de la aplicación.
 * @requires ../services/api - Instancia de Axios para la comunicación con el backend.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import AppHeader from '../components/AppHeader';
import api from '../services/api';

// Habilita LayoutAnimation en Android para transiciones suaves.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { height: windowHeight } = Dimensions.get('window');
/** @constant {boolean} IS_SHORT_SCREEN - Booleano para aplicar estilos compactos en pantallas pequeñas. */
const IS_SHORT_SCREEN = windowHeight < 720;

/**
 * @function validateEmail
 * @description Función de utilidad para validar el formato de un correo electrónico.
 * @param {string} email - El correo electrónico a validar.
 * @returns {boolean} - `true` si el formato es válido, `false` en caso contrario.
 */
const validateEmail = (email) => {
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(String(email).toLowerCase());
};

/**
 * @component PasswordInput
 * @description Componente reutilizable para campos de contraseña con un ícono para alternar la visibilidad.
 * @param {object} props - Propiedades del componente.
 */
const PasswordInput = ({ label, value, onChangeText, secureTextEntry, onToggleSecureEntry }) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputContainer}>
      <TextInput style={styles.textInput} value={value} onChangeText={onChangeText} secureTextEntry={secureTextEntry} placeholderTextColor="#8A8A8A" autoCapitalize="none" />
      <TouchableOpacity onPress={onToggleSecureEntry} style={styles.eyeIcon}><FontAwesome5 name={secureTextEntry ? 'eye-slash' : 'eye'} size={18} color="#8A8A8A" /></TouchableOpacity>
    </View>
  </View>
);

/**
 * @component LabeledInput
 * @description Componente reutilizable para campos de texto estándar con una etiqueta.
 * @param {object} props - Propiedades del componente.
 */
const LabeledInput = ({ label, ...props }) => (
  <View style={styles.inputWrapper}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputContainer}><TextInput style={styles.textInput} placeholderTextColor="#8A8A8A" {...props} /></View>
  </View>
);

/**
 * @component ProfileScreen
 * @description Componente principal de la pantalla de Perfil.
 */
const ProfileScreen = () => {
  // --- HOOKS Y ESTADOS ---
  const { user, logout, token, refreshUserData } = useAuth();
  
  /** @description Controla el estado de carga para las peticiones a la API. */
  const [isLoading, setIsLoading] = useState(false);
  /** @description Controla si el formulario de perfil está en modo edición. */
  const [isEditing, setIsEditing] = useState(false);
  /** @description Controla la visibilidad del formulario de cambio de contraseña. */
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  /** @description Almacena los datos del formulario de perfil. */
  const [formData, setFormData] = useState({});
  /** @description Almacena los datos del formulario de cambio de contraseña. */
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  /** @description Controla la visibilidad (secureTextEntry) de cada campo de contraseña. */
  const [isCurrentPasswordSecure, setIsCurrentPasswordSecure] = useState(true);
  const [isNewPasswordSecure, setIsNewPasswordSecure] = useState(true);
  const [isConfirmPasswordSecure, setIsConfirmPasswordSecure] = useState(true);

  /**
   * @function initializeFormData
   * @description Rellena el estado del formulario con los datos del usuario actual del contexto.
   */
  const initializeFormData = () => setFormData({ document: user?.document || '', fullname: user?.fullname || '', username: user?.username || '', email: user?.email || '' });

  /**
   * @function useEffect
   * @description Hook que se ejecuta cuando el objeto `user` cambia para inicializar el formulario.
   */
  useEffect(() => { if (user) initializeFormData(); }, [user]);

  /**
   * @function handleInputChange
   * @description Actualiza el estado del formulario de perfil a medida que el usuario escribe.
   */
  const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  /**
   * @function handlePasswordInputChange
   * @description Actualiza el estado del formulario de contraseña a medida que el usuario escribe.
   */
  const handlePasswordInputChange = (field, value) => setPasswordData(prev => ({ ...prev, [field]: value }));
  
  /**
   * @function handleSaveChanges
   * @description Valida y envía los datos del perfil actualizados al backend.
   */
  const handleSaveChanges = async () => {
    if (isLoading) return;
    const { fullname, username, email, document } = formData;
    if (!fullname || !username || !email || !document) return Alert.alert("Error", "Todos los campos son obligatorios.");
    
    if (!validateEmail(email)) {
      return Alert.alert("Error", "El formato del correo electrónico no es válido.");
    }
    
    setIsLoading(true);
    const dataToSend = { ...formData, document: Number(document) };
    if (isNaN(dataToSend.document)) {
        setIsLoading(false);
        return Alert.alert("Error", "El número de documento no es válido.");
    }
    try {
      const userId = user?._id;
      if (!userId) throw new Error("ID de usuario no encontrado.");
      const response = await api.put(`/users/${userId}`, dataToSend, { headers: { 'x-access-token': token } });
      Alert.alert("Éxito", response.data.message || "Tu perfil ha sido actualizado.");
      if (refreshUserData) await refreshUserData();
      setIsEditing(false);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Ocurrió un error.";
      Alert.alert("Error al actualizar", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * @function handleUpdatePassword
   * @description Valida la fortaleza de la nueva contraseña y la envía al backend para su actualización.
   */
  const handleUpdatePassword = async () => {
    if (isLoading) return;
    const { currentPassword, newPassword, confirmPassword } = passwordData;
    if (!currentPassword || !newPassword || !confirmPassword) return Alert.alert("Error", "Por favor, completa todos los campos de contraseña.");
    if (newPassword !== confirmPassword) return Alert.alert("Error", "Las nuevas contraseñas no coinciden.");
    
    // Valida la fortaleza de la nueva contraseña
    const passwordErrors = [];
    if (newPassword.length < 8) passwordErrors.push("• Mínimo 8 caracteres.");
    if (!/[A-Z]/.test(newPassword)) passwordErrors.push("• Debe contener al menos una letra mayúscula (A-Z).");
    if (!/[a-z]/.test(newPassword)) passwordErrors.push("• Debe contener al menos una letra minúscula (a-z).");
    if (!/\d/.test(newPassword)) passwordErrors.push("• Debe contener al menos un número (0-9).");
    if (passwordErrors.length > 0) {
        Alert.alert("La nueva contraseña no es segura", "Debe cumplir con lo siguiente:\n\n" + passwordErrors.join('\n'));
        return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/change-password', { currentPassword, newPassword }, { headers: { 'x-access-token': token } });
      Alert.alert("Éxito", response.data.message || "¡Contraseña actualizada correctamente!");
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "No se pudo cambiar la contraseña.";
      Alert.alert("Error al cambiar contraseña", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * @function toggleChangePasswordView
   * @description Activa una animación y luego alterna la visibilidad del formulario de cambio de contraseña.
   */
  const toggleChangePasswordView = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    setIsChangingPassword(prev => !prev);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBackground} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
        <AppHeader onLogout={logout} canCreateUser={user?.role === 'admin'} transparent />
        <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.profileHeader}><View style={styles.avatar}><Text style={styles.avatarLetter}>{formData.fullname?.[0]?.toUpperCase()}</Text></View><Text style={styles.profileTitle}>{formData.fullname}</Text><Text style={styles.profileSubtitle}>{user?.role}</Text></View>
            <View style={styles.card}><LabeledInput label="Número de documento" value={String(formData.document)} onChangeText={(v) => handleInputChange('document', v)} editable={isEditing} keyboardType="numeric" /><LabeledInput label="Nombre completo" value={formData.fullname} onChangeText={(v) => handleInputChange('fullname', v)} editable={isEditing} /><LabeledInput label="Nombre de usuario" value={formData.username} onChangeText={(v) => handleInputChange('username', v)} editable={isEditing} autoCapitalize="none" /><LabeledInput label="Correo electrónico" value={formData.email} onChangeText={(v) => handleInputChange('email', v)} editable={isEditing} keyboardType="email-address" autoCapitalize="none"/></View>
            <View style={styles.actionsContainer}>{isEditing ? (<><TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSaveChanges} disabled={isLoading}>{isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Guardar</Text>}</TouchableOpacity><TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => { initializeFormData(); setIsEditing(false); }} disabled={isLoading}><Text style={styles.buttonText}>Cancelar</Text></TouchableOpacity></>) : (<><TouchableOpacity style={styles.button} onPress={() => { setIsEditing(true); setIsChangingPassword(false); }}><Text style={styles.buttonText}>Editar Perfil</Text></TouchableOpacity><TouchableOpacity style={[styles.button, styles.changePasswordButton]} onPress={toggleChangePasswordView}><Text style={styles.buttonText}>Cambiar Contraseña</Text></TouchableOpacity></>)}</View>
            {isChangingPassword && (
              <View style={styles.passwordForm}>
                <PasswordInput label="Contraseña Actual" value={passwordData.currentPassword} onChangeText={(v) => handlePasswordInputChange('currentPassword', v)} secureTextEntry={isCurrentPasswordSecure} onToggleSecureEntry={() => setIsCurrentPasswordSecure(prev => !prev)} />
                <PasswordInput label="Nueva Contraseña" value={passwordData.newPassword} onChangeText={(v) => handlePasswordInputChange('newPassword', v)} secureTextEntry={isNewPasswordSecure} onToggleSecureEntry={() => setIsNewPasswordSecure(prev => !prev)} />
                <PasswordInput label="Confirmar Contraseña" value={passwordData.confirmPassword} onChangeText={(v) => handlePasswordInputChange('confirmPassword', v)} secureTextEntry={isConfirmPasswordSecure} onToggleSecureEntry={() => setIsConfirmPasswordSecure(prev => !prev)} />
                <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleUpdatePassword} disabled={isLoading}>{isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Actualizar</Text>}</TouchableOpacity>
              </View>
            )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// Hoja de estilos del componente.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12082A' },
  headerBackground: { backgroundColor: '#2A1261', height: 250, width: '100%', position: 'absolute', top: 0, left: 0, },
  contentContainer: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  profileHeader: { alignItems: 'center', marginVertical: IS_SHORT_SCREEN ? 10 : 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: 'rgba(190, 174, 226, 0.5)'},
  avatarLetter: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  profileTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  profileSubtitle: { fontSize: 15, color: '#BEAEE2', marginTop: 4 },
  card: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 15, padding: IS_SHORT_SCREEN ? 15 : 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  inputWrapper: { marginBottom: 15 },
  inputLabel: { color: '#BEAEE2', fontSize: 14, marginBottom: 6, fontWeight: '500' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)'},
  textInput: { flex: 1, color: '#fff', height: 48, fontSize: 16, paddingHorizontal: 15 },
  eyeIcon: { padding: 10, },
  actionsContainer: { flexDirection: 'row', justifyContent: 'space-around', gap: 15 },
  button: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center', backgroundColor: '#7E3FF2', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  saveButton: { backgroundColor: '#4CAF50' },
  cancelButton: { backgroundColor: '#F44336' },
  changePasswordButton: { backgroundColor: 'rgba(190, 174, 226, 0.2)', borderWidth: 1, borderColor: 'rgba(190, 174, 226, 0.5)'},
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  passwordForm: { marginTop: 20, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 15, padding: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
});

export default ProfileScreen;
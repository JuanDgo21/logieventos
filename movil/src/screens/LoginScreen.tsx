/**
 * @file LoginScreen.tsx
 * @description Pantalla de inicio de sesión de usuario y punto de entrada para el flujo de recuperación de contraseña.
 * @requires react
 * @requires react-native
 * @requires @expo/vector-icons - Para los iconos en la interfaz.
 * @requires expo-linear-gradient - Para los gradientes en los botones.
 * @requires ../services/api - Instancia de Axios para la comunicación con el backend.
 * @requires ../contexts/AuthContext - Contexto para manejar la autenticación del usuario.
 * @requires @react-navigation/stack - Para la tipificación de las propiedades de navegación.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  SafeAreaView,
} from "react-native";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

/**
 * @typedef {StackScreenProps<RootStackParamList, "Login">} LoginScreenProps
 * @description Define los tipos para las propiedades de navegación de la pantalla de Login.
 */
type LoginScreenProps = StackScreenProps<RootStackParamList, "Login">;

// ========================================================================
// ---           MODAL DE RECUPERACIÓN (VERSIÓN FINAL)                ---
// ========================================================================

/**
 * @component ForgotPasswordModal
 * @description Un modal autocontenido que maneja el flujo completo de recuperación de contraseña en varios pasos.
 * @param {object} props
 * @param {boolean} props.isVisible - Controla si el modal está visible.
 * @param {() => void} props.onClose - Función para cerrar el modal.
 */
const ForgotPasswordModal = ({ isVisible, onClose }) => {
  // --- ESTADOS DEL MODAL ---
  /** @description Controla el paso actual del flujo (1: Pedir email, 2: Resetear, 3: Éxito). */
  const [step, setStep] = useState(1);
  /** @description Almacena el email ingresado por el usuario. */
  const [email, setEmail] = useState('');
  /** @description Almacena el token de reseteo recibido del backend. */
  const [resetToken, setResetToken] = useState('');
  /** @description Almacena la nueva contraseña ingresada por el usuario. */
  const [newPassword, setNewPassword] = useState('');
  /** @description Almacena la confirmación de la nueva contraseña. */
  const [confirmPassword, setConfirmPassword] = useState('');
  /** @description Controla el estado de carga para las peticiones a la API. */
  const [loading, setLoading] = useState(false);
  /** @description Almacena los mensajes de error para mostrarlos en la UI. */
  const [error, setError] = useState('');
  /** @description Controla la visibilidad de la nueva contraseña. */
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  /** @description Controla la visibilidad de la confirmación de contraseña. */
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  /**
   * @function handleClose
   * @description Cierra el modal y reinicia todos sus estados internos después de un breve retardo.
   */
  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1); setEmail(''); setResetToken(''); setNewPassword('');
      setConfirmPassword(''); setError('');
    }, 500);
  };
  
  /**
   * @function handleGoBack
   * @description Permite al usuario regresar del paso 2 (nueva contraseña) al paso 1 (ingresar email).
   */
  const handleGoBack = () => {
    setError('');
    setStep(1);
  };

  /**
   * @function handleRequestToken
   * @description Paso 1 del flujo. Envía el email del usuario al backend para solicitar un token de reseteo.
   * Si tiene éxito y recibe un token, avanza al paso 2.
   */
  const handleRequestToken = async () => {
    if (!email) {
      setError('El correo electrónico es requerido.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/forgot-password', { email });
      if (response.data && response.data.token) {
        setResetToken(response.data.token);
        setStep(2);
      } else {
        Alert.alert("Verifica tu Correo", response.data.message || "Si tu correo está registrado, hemos iniciado el proceso.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error de conexión.");
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * @function handleResetPassword
   * @description Paso 2 del flujo. Envía el token de reseteo y la nueva contraseña al backend.
   * Si tiene éxito, avanza al paso 3 (confirmación).
   */
  const handleResetPassword = async () => {
    setError('');
    if (!resetToken) {
      setError("Primero debes verificar tu email.");
      return;
    }
    if (newPassword.length < 8) {
        setError("La nueva contraseña debe tener al menos 8 caracteres.");
        return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: resetToken, newPassword });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo actualizar. El token puede ser inválido o haber expirado.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * @function renderStepIndicator
   * @description Renderiza el componente visual que muestra el progreso del flujo (Paso 1, Paso 2).
   * @returns {JSX.Element} El indicador de pasos.
   */
  const renderStepIndicator = () => (
    <View style={styles.stepperContainer}>
      <View style={styles.step}><View style={[styles.stepCircle, step >= 1 && styles.stepCircleActive]}><Text style={[styles.stepText, step >= 1 && styles.stepTextActive]}>1</Text></View><Text style={[styles.stepLabel, step >= 1 && styles.stepLabelActive]}>VERIFICAR EMAIL</Text></View>
      <View style={styles.stepperLine} />
      <View style={styles.step}><View style={[styles.stepCircle, step >= 2 && styles.stepCircleActive]}><Text style={[styles.stepText, step >= 2 && styles.stepTextActive]}>2</Text></View><Text style={[styles.stepLabel, step >= 2 && styles.stepLabelActive]}>NUEVA CONTRASEÑA</Text></View>
    </View>
  );

  return (
    <Modal animationType="fade" transparent={true} visible={isVisible} onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalCard}>
          <LinearGradient colors={['#8A2BE2', '#4B0082']} style={styles.modalTopIconContainer}><FontAwesome5 name="lock" size={24} color="#fff" /></LinearGradient>
          <Text style={styles.modalTitle}>Recuperar <Text style={styles.modalTitleHighlight}>Contraseña</Text></Text>
          {step !== 3 && renderStepIndicator()}
          {step === 1 && (<View style={styles.formStep}><Text style={styles.modalInstruction}>Ingresa tu email para restablecer tu contraseña</Text><View style={styles.inputContainer}><FontAwesome5 name="envelope" size={18} color="#9370DB" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Email registrado" placeholderTextColor="#999" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /></View></View>)}
          {step === 2 && (<View style={styles.formStep}><Text style={styles.modalInstruction}>Crea tu nueva contraseña.</Text><View style={styles.inputContainer}><FontAwesome5 name="lock" size={18} color="#9370DB" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Nueva contraseña" placeholderTextColor="#999" value={newPassword} onChangeText={setNewPassword} secureTextEntry={!isNewPasswordVisible} /><TouchableOpacity style={styles.eyeIcon} onPress={() => setIsNewPasswordVisible(p => !p)}><FontAwesome5 name={isNewPasswordVisible ? "eye" : "eye-slash"} size={18} color="#9370DB" /></TouchableOpacity></View><View style={styles.inputContainer}><FontAwesome5 name="lock" size={18} color="#9370DB" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Confirmar contraseña" placeholderTextColor="#999" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!isConfirmPasswordVisible} /><TouchableOpacity style={styles.eyeIcon} onPress={() => setIsConfirmPasswordVisible(p => !p)}><FontAwesome5 name={isConfirmPasswordVisible ? "eye" : "eye-slash"} size={18} color="#9370DB" /></TouchableOpacity></View></View>)}
          {step === 3 && (<View style={styles.formStepSuccess}><FontAwesome5 name="check-circle" size={48} color="#4CAF50" /><Text style={[styles.modalInstruction, {marginTop: 20}]}>¡Contraseña actualizada con éxito!</Text></View>)}
          {error ? <Text style={styles.errorTextModal}>{error}</Text> : null}

          {step !== 3 ? (<TouchableOpacity onPress={step === 1 ? handleRequestToken : handleResetPassword} disabled={loading} style={styles.button}>{loading ? <ActivityIndicator color="#fff" /> : <LinearGradient colors={["#8A2BE2", "#4B0082"]} style={styles.gradientButton}><Text style={styles.buttonText}>{step === 1 ? 'CONTINUAR' : 'RESTABLECER'}</Text></LinearGradient>}</TouchableOpacity>) : (<TouchableOpacity onPress={handleClose} style={styles.button}><LinearGradient colors={["#6c757d", "#343a40"]} style={styles.gradientButton}><Text style={styles.buttonText}>VOLVER</Text></LinearGradient></TouchableOpacity>)}

          {/* El enlace inferior es dinámico: o vuelve al paso anterior o cierra el modal. */}
          {step === 2 ? (
            <TouchableOpacity onPress={handleGoBack}>
              <Text style={styles.backToLoginText}><FontAwesome5 name="arrow-left" size={14} color="#ADD8E6" />  Corregir email</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.backToLoginText}><FontAwesome5 name="arrow-left" size={14} color="#ADD8E6" />  Volver al inicio de sesión</Text>
            </TouchableOpacity>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ========================================================================
// ---                         PANTALLA DE LOGIN                      ---
// ========================================================================
/**
 * @component LoginScreen
 * @description Pantalla principal de autenticación.
 * @param {LoginScreenProps} props - Propiedades de navegación.
 */
const LoginScreen = ({ navigation }: LoginScreenProps) => {
  // --- HOOKS Y ESTADOS DE LOGIN ---
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  /** @description Controla la visibilidad del modal de recuperación de contraseña. */
  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);

  /**
   * @function handleLogin
   * @description Maneja el proceso de inicio de sesión. Valida los campos y llama al contexto de autenticación.
   */
  const handleLogin = async () => {
    setEmailError(""); setPasswordError("");
    let hasError = false;
    if (!email) { setEmailError("El email es requerido"); hasError = true; }
    if (!password) { setPasswordError("La contraseña es requerida"); hasError = true; }
    if (hasError) return;
    setLoading(true);
    try {
      const res = await api.post("/auth/signin", { email: email.trim(), password: password.trim() });
      if (res.data?.token) {
        const { token, user: userData } = res.data;
        login(token, userData); // Llama a la función login del AuthContext
        Alert.alert("Éxito", "Inicio de sesión correcto ✅");
      } else {
        Alert.alert("Error", res.data.message || "Credenciales incorrectas");
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.fullScreenContainer} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={styles.backgroundCircle1} /><View style={styles.backgroundCircle2} />
      <View style={styles.card}>
        <FontAwesome5 name="calendar-alt" size={48} color="#9370DB" style={styles.logoIcon} />
        <Text style={styles.logoTitle}>LogiEventos</Text><Text style={styles.logoSubtitle}>Gestión profesional de eventos</Text>
        <View style={styles.inputContainer}><FontAwesome5 name="envelope" size={18} color="#888" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Correo electrónico" placeholderTextColor="#999" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" /></View>
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        <View style={styles.inputContainer}><FontAwesome5 name="lock" size={18} color="#888" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#999" value={password} onChangeText={setPassword} secureTextEntry={!passwordVisible} /><TouchableOpacity style={styles.eyeIcon} onPress={() => setPasswordVisible(!passwordVisible)}><FontAwesome5 name={passwordVisible ? "eye" : "eye-slash"} size={18} color="#9370DB" /></TouchableOpacity></View>
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        <View style={styles.forgotPasswordContainer}><TouchableOpacity onPress={() => setIsForgotModalVisible(true)}><Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text></TouchableOpacity></View>
        <TouchableOpacity onPress={handleLogin} disabled={loading} style={styles.button}>{loading ? <ActivityIndicator color="#fff" /> : (<LinearGradient colors={["#8A2BE2", "#4B0082"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradientButton}><Text style={styles.buttonText}>INICIAR SESIÓN</Text></LinearGradient>)}</TouchableOpacity>
      </View>
      <ForgotPasswordModal isVisible={isForgotModalVisible} onClose={() => setIsForgotModalVisible(false)} />
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

// Hoja de estilos del componente.
const styles = StyleSheet.create({
  fullScreenContainer: { flex: 1, backgroundColor: "#1a0a38", justifyContent: "center", alignItems: "center" },
  backgroundCircle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(147, 112, 219, 0.2)', top: -50, left: -50, },
  backgroundCircle2: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(75, 0, 130, 0.3)', bottom: -30, right: -30, },
  card: { width: "90%", maxWidth: 380, backgroundColor: "rgba(30, 10, 56, 0.8)", borderRadius: 20, padding: 25, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', },
  logoIcon: { marginBottom: 10, },
  logoTitle: { fontSize: 32, fontWeight: "bold", color: "#fff", marginBottom: 5, },
  logoSubtitle: { fontSize: 16, color: "#ccc", marginBottom: 30, textAlign: "center", },
  inputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#5a3b8d", borderRadius: 10, paddingHorizontal: 15, marginBottom: 5, backgroundColor: "rgba(0, 0, 0, 0.3)", width: "100%", height: 50, },
  inputIcon: { marginRight: 10, color: "#9370DB", },
  input: { flex: 1, color: "#fff", fontSize: 16, },
  eyeIcon: { padding: 5, },
  errorText: { color: "#dc3545", fontSize: 12, marginBottom: 15, alignSelf: 'flex-start', paddingLeft: 5, },
  forgotPasswordContainer: { width: "100%", alignItems: "flex-end", marginBottom: 20, },
  forgotPasswordText: { color: "#ADD8E6", fontSize: 14, },
  button: { width: "100%", borderRadius: 10, overflow: "hidden", marginTop: 10, },
  gradientButton: { paddingVertical: 15, alignItems: "center", justifyContent: "center", },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold", },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 20, },
  modalCard: { width: '100%', maxWidth: 400, backgroundColor: '#1e0a38', borderRadius: 20, paddingVertical: 45, paddingHorizontal: 25, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(147, 112, 219, 0.5)', },
  modalTopIconContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 20, marginTop: -75, borderWidth: 4, borderColor: '#1e0a38', },
  modalTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 10, textAlign: 'center' },
  modalTitleHighlight: { color: '#9370DB', },
  modalInstruction: { color: '#ccc', fontSize: 16, textAlign: 'center', marginBottom: 25, },
  stepperContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '90%', marginBottom: 30, },
  step: { alignItems: 'center', flex: 1, },
  stepCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: '#555', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent', },
  stepCircleActive: { backgroundColor: '#9370DB', borderColor: '#9370DB', },
  stepText: { color: '#888', fontWeight: 'bold', },
  stepTextActive: { color: '#fff', },
  stepLabel: { color: '#888', fontSize: 12, marginTop: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  stepLabelActive: { color: '#fff', },
  stepperLine: { height: 2, backgroundColor: '#555', flex: 1, marginHorizontal: -20, marginBottom: 25, },
  backToLoginText: { color: '#ADD8E6', fontSize: 14, marginTop: 25, },
  errorTextModal: { color: '#dc3545', fontSize: 14, textAlign: 'center', position: 'absolute', bottom: 155, },
  formStep: { width: '100%', alignItems: 'center' },
  formStepSuccess: { width: '100%', alignItems: 'center', paddingVertical: 20 },
});
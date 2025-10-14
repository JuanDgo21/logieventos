/**
 * @file RegisterUserScreen.tsx
 * @description Pantalla de formulario para que un administrador o coordinador registre nuevos usuarios en el sistema.
 * Incluye validaciones de campos y un selector de roles personalizado y accesible.
 * @requires react
 * @requires react-native
 * @requires @expo/vector-icons
 * @requires ../contexts/AuthContext - Para obtener el token de autenticación necesario para la creación.
 * @requires ../services/api - Para realizar la petición de registro al backend.
 * @requires react-native-picker-select - Para el menú desplegable de selección de roles.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import RNPickerSelect from 'react-native-picker-select';

/**
 * @component RegisterUserScreen
 * @description Componente principal que renderiza la pantalla de registro de usuarios.
 */
const RegisterUserScreen = () => {
    // --- HOOKS ---
    const navigation = useNavigation(); // Hook para manejar la navegación.
    const { token } = useAuth(); // Hook para obtener el token del usuario autenticado.
    
    // --- ESTADOS PARA LOS CAMPOS DEL FORMULARIO ---
    const [documentId, setDocumentId] = useState('');
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<string | null>(null);

    // --- ESTADOS PARA LA UI (INTERFAZ DE USUARIO) ---
    /** @description Controla la visibilidad del campo de contraseña. */
    const [showPassword, setShowPassword] = useState(false);
    /** @description Controla la visibilidad del campo de confirmación de contraseña. */
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    /** @description Controla el estado de carga al enviar el formulario. */
    const [loading, setLoading] = useState(false);

    /** @description Referencia para controlar programáticamente el selector de roles. */
    const pickerRef = useRef(null);

    /** @description Opciones disponibles para el selector de roles. */
    const roleOptions = [
        { label: 'Administrador', value: 'admin' },
        { label: 'Coordinador', value: 'coordinador' },
        { label: 'Líder', value: 'lider' },
    ];

    /**
     * @function handleRegister
     * @description Maneja el proceso de registro de un nuevo usuario.
     * Realiza validaciones en el frontend y luego envía los datos al backend.
     */
    const handleRegister = async () => {
        // Valida que todos los campos estén completos.
        if (!documentId || !fullName || !username || !email || !password || !confirmPassword || !role) {
            Alert.alert('Error', 'Por favor, completa todos los campos.');
            return;
        }
        // Valida que las contraseñas coincidan.
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);
        try {
            // Realiza la petición POST al endpoint de creación de usuarios.
            const response = await api.post('/users', { 
                document: documentId,
                fullname: fullName,
                username,
                email,
                password,
                role,
            }, {
                headers: { 'x-access-token': token }
            });

            if (response.status === 201) {
                Alert.alert('Éxito', 'Usuario registrado correctamente.');
                navigation.goBack(); // Regresa a la pantalla anterior.
            } else {
                Alert.alert('Error', response.data.message || 'Error al registrar usuario.');
            }
        } catch (error: any) {
            console.error('Error al registrar usuario:', error.response?.data || error.message);
            Alert.alert('Error', error.response?.data?.message || 'Hubo un problema al registrar el usuario.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* El componente RNPickerSelect está oculto aquí pero se mantiene funcional,
                siendo controlado a través de la referencia `pickerRef`. */}
            <RNPickerSelect
                ref={pickerRef}
                onValueChange={(value) => setRole(value)}
                items={roleOptions}
                style={{ viewContainer: styles.hiddenPickerContainer }}
                placeholder={{}}
            />

            <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <FontAwesome5 name="arrow-left" size={24} color="#fff" />
                </TouchableOpacity>
                
                <View style={styles.iconContainer}>
                    <FontAwesome5 name="user-plus" size={50} color="#9370DB" />
                </View>
                <Text style={styles.title}>Registro de Usuario</Text>
                <Text style={styles.subtitle}>Completa los datos para crear una nueva cuenta</Text>

                {/* --- Campos de entrada del formulario --- */}
                <View style={styles.inputContainer}><FontAwesome5 name="id-card" size={18} color="#ccc" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Documento de identidad" placeholderTextColor="#ccc" value={documentId} onChangeText={setDocumentId} keyboardType="numeric" /></View>
                <View style={styles.inputContainer}><FontAwesome5 name="user" size={18} color="#ccc" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor="#ccc" value={fullName} onChangeText={setFullName} autoCapitalize="words" /></View>
                <View style={styles.inputContainer}><FontAwesome5 name="at" size={18} color="#ccc" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Nombre de usuario" placeholderTextColor="#ccc" value={username} onChangeText={setUsername} autoCapitalize="none" /></View>
                <View style={styles.inputContainer}><FontAwesome5 name="envelope" size={18} color="#ccc" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Correo electrónico" placeholderTextColor="#ccc" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /></View>
                <View style={styles.inputContainer}><FontAwesome5 name="lock" size={18} color="#ccc" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#ccc" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} /><TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.togglePassword}><FontAwesome5 name={showPassword ? "eye" : "eye-slash"} size={18} color="#ccc" /></TouchableOpacity></View>
                <View style={styles.inputContainer}><FontAwesome5 name="lock" size={18} color="#ccc" style={styles.inputIcon} /><TextInput style={styles.input} placeholder="Confirmar Contraseña" placeholderTextColor="#ccc" secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} /><TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.togglePassword}><FontAwesome5 name={showConfirmPassword ? "eye" : "eye-slash"} size={18} color="#ccc" /></TouchableOpacity></View>
                
                {/* Componente táctil personalizado que abre el selector de roles. */}
                <TouchableOpacity 
                    style={styles.inputContainer} 
                    onPress={() => pickerRef.current?.togglePicker(true)}
                >
                    <FontAwesome5 name="user-tag" size={18} color="#ccc" style={styles.inputIcon} />
                    <Text style={role ? styles.pickerText : styles.pickerPlaceholder}>
                        {role ? roleOptions.find(o => o.value === role)?.label : 'Selecciona un rol'}
                    </Text>
                    <FontAwesome5 name="chevron-down" size={16} color="#ccc" style={styles.pickerIcon} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>{loading ? ( <ActivityIndicator color="#fff" /> ) : ( <Text style={styles.registerButtonText}>REGISTRAR USUARIO</Text> )}</TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

// Hoja de estilos del componente.
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1a0a38' },
    contentContainer: { alignItems: 'center', padding: 20 },
    backButton: { alignSelf: 'flex-start', marginBottom: 10, padding: 5 },
    iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(147, 112, 219, 0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#ccc', textAlign: 'center', marginBottom: 25 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 10, marginBottom: 12, width: '100%', height: 50 },
    inputIcon: { marginLeft: 15, marginRight: 10 },
    input: { flex: 1, color: '#fff', fontSize: 16, height: '100%' },
    togglePassword: { padding: 15 },
    pickerText: { flex: 1, color: '#fff', fontSize: 16, textAlignVertical: 'center' },
    pickerPlaceholder: { flex: 1, color: '#ccc', fontSize: 16, textAlignVertical: 'center' },
    pickerIcon: { marginRight: 15 },
    registerButton: { backgroundColor: '#9370DB', paddingVertical: 15, borderRadius: 10, width: '100%', alignItems: 'center', marginTop: 15 },
    registerButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    hiddenPickerContainer: {
        position: 'absolute',
        width: 0,
        height: 0,
        opacity: 0,
    },
});

export default RegisterUserScreen;
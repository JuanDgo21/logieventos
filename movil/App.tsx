// 📱 COMPONENTE PRINCIPAL DE LA APLICACIÓN (APP.TSX)
// Este es el punto de entrada principal de toda la aplicación React Native

// 📚 IMPORTACIONES PRINCIPALES
import 'react-native-gesture-handler';  // Habilitador de gestos (debe ir primero)
import React from 'react';
import { StatusBar } from 'expo-status-bar';                          // Barra de estado de Expo
import { SafeAreaProvider } from 'react-native-safe-area-context';    // Proveedor de área segura

// 📚 IMPORTACIONES DE LA APLICACIÓN
import { AuthProvider } from './src/contexts/AuthContext';             // Proveedor de contexto de autenticación
import AppNavigator from './src/navigation/AppNavigator';              // Navegador principal

// 🚀 COMPONENTE PRINCIPAL DE LA APLICACIÓN
export default function App() {
  return (
    // 📱 PROVEEDOR DE ÁREA SEGURA
    // Maneja las áreas seguras (notch, barra de estado, etc.)
    <SafeAreaProvider>
      {/* 🔐 PROVEEDOR DE CONTEXTO DE AUTENTICACIÓN */}
      {/* Envuelve toda la app para proporcionar estado de autenticación */}
      <AuthProvider>
        {/* 🧭 NAVEGADOR PRINCIPAL */}
        {/* Maneja toda la navegación de la aplicación */}
        <AppNavigator />
        
        {/* 📊 BARRA DE ESTADO */}
        {/* Configura la apariencia de la barra de estado del dispositivo */}
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
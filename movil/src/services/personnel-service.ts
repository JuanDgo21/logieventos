import React, { useState, useEffect, useCallback } from 'react';
import api from './api';
import { apiRouters } from './apiRouters';
import { 
  Personnel, 
  NewPersonnel, 
  UpdatePersonnel, 
  PersonnelApiResponse,
  PersonnelType,
  NewPersonnelType,
  UpdatePersonnelType,
  PersonnelTypeApiResponse
} from '../types/personnel';
import { useAuth } from '../contexts/AuthContext';

export const usePersonnelService = () => {
  // Estados para el personal y tipos de personal
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [personnelTypes, setPersonnelTypes] = useState<PersonnelType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener el token del contexto de autenticación
  const { token, user } = useAuth();

  // ============ VALIDACIÓN DE ROLES ============
  // Normaliza cadenas para comparar roles de forma insensible a mayúsculas,
  // con y sin acentos, y acepta variantes en inglés/español comunes.
  const normalize = (s?: string) =>
    (s || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');

  const roleEquivalents: { [key: string]: string[] } = {
    admin: ['admin', 'administrator'],
    coordinador: ['coordinador', 'coordinator'],
    lider: ['lider', 'lider', 'líder', 'leader'],
  };

  const hasRole = (required: string) => {
    if (!user) return false;
    const req = normalize(required);

    const matchesEquivalent = (r?: string) => {
      if (!r) return false;
      const n = normalize(r);
      if (n === req) return true;
      const equivalents = roleEquivalents[req] || [req];
      return equivalents.includes(n) || equivalents.includes(n.replace(/s$/, ''));
    };

    if (user.role && matchesEquivalent(user.role)) return true;
    if (Array.isArray(user.roles)) {
      return user.roles.some(r => matchesEquivalent(r));
    }
    return false;
  };

  // Permisos compuestos
  // admin: todo
  // coordinador: solo crear/editar
  // líder: solo visualiza
  const canCreate = () => hasRole('admin') || hasRole('coordinador');
  const canEdit = () => hasRole('admin') || hasRole('coordinador');
  const canDelete = () => hasRole('admin');
  const canToggleStatus = () => hasRole('admin');
  const canManageTypes = () => hasRole('admin');

  // ============ MÉTODOS UTILITARIOS ACTUALIZADOS ============
  const handleArrayResponse = <T>(response: PersonnelApiResponse | PersonnelTypeApiResponse): T[] => {
    if (!response.success) {
      throw new Error(response.message || 'Operación fallida');
    }

    if (!response.data) {
      throw new Error('Datos no disponibles');
    }

    return Array.isArray(response.data) ? response.data as T[] : [response.data as T];
  };

  const handleSingleResponse = <T>(response: PersonnelApiResponse | PersonnelTypeApiResponse): T => {
    if (!response.success) {
      throw new Error(response.message || 'Operación fallida');
    }

    if (!response.data) {
      throw new Error('Datos no disponibles');
    }

    if (Array.isArray(response.data)) {
      if (response.data.length === 0) {
        throw new Error('No se encontraron resultados');
      }
      return response.data[0] as T;
    }

    return response.data as T;
  };

  const handleError = (context: string, error: any): never => {
    console.error(`[PersonnelService] ${context}`, error);
    const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
    throw new Error(errorMessage);
  };

  // ============ FUNCIÓN PARA HACER PETICIONES CON TOKEN ============
  const makeAuthenticatedRequest = async (method: 'get' | 'post' | 'put' | 'delete', url: string, data?: any) => {
    if (!token) {
      throw new Error('Token no disponible. Por favor, inicie sesión nuevamente.');
    }

    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    switch (method) {
      case 'get':
        return await api.get(url, config);
      case 'post':
        return await api.post(url, data, config);
      case 'put':
        return await api.put(url, data, config);
      case 'delete':
        return await api.delete(url, config);
      default:
        throw new Error(`Método HTTP no soportado: ${method}`);
    }
  };

  // ============ CARGA INICIAL DE DATOS ACTUALIZADA ============
  const loadInitialData = useCallback(async () => {
    console.log('🔍 Iniciando carga de datos...');
    setLoading(true);
    setError(null);

    try {
      // Cargar tipos primero
      const typesResponse = await makeAuthenticatedRequest('get', apiRouters.TYPES.PERSONNEL.BASE);
      const types = handleArrayResponse<PersonnelType>(typesResponse.data as PersonnelTypeApiResponse);
      setPersonnelTypes(types);
      console.log('✅ Categorías cargadas:', types.length);
      
      // Luego cargar personal
      const personnelResponse = await makeAuthenticatedRequest('get', apiRouters.PERSONNEL.BASE);
      const personnel = handleArrayResponse<Personnel>(personnelResponse.data as PersonnelApiResponse);
      
      // Enriquecer el personal con nombres de categoría
      const enrichedPersonnel = personnel.map(person => {
        let typeName = 'Sin categoría';

        if (typeof person.personnelType === 'object' && person.personnelType !== null) {
          typeName = (person.personnelType as PersonnelType).name;
        } else {
          const type = types.find(t => t._id === person.personnelType);
          if (type) typeName = type.name;
        }

        return {
          ...person,
          typeName
        };
      });
      
      setPersonnelList(enrichedPersonnel);
      console.log('✅ Personal cargado y enriquecido:', enrichedPersonnel.length);
    } catch (err) {
      console.error('❌ Error cargando datos iniciales:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Cargar datos iniciales al montar el hook
  useEffect(() => {
    if (token) {
      loadInitialData();
    } else {
      setError('No autenticado. Por favor, inicie sesión.');
      setLoading(false);
    }
  }, [loadInitialData, token]);

  // ============ OPERACIONES DE PERSONAL ACTUALIZADAS ============
  const getAllPersonnel = async (): Promise<Personnel[]> => {
    try {
      const response = await makeAuthenticatedRequest('get', apiRouters.PERSONNEL.BASE);
      const personnel = handleArrayResponse<Personnel>(response.data as PersonnelApiResponse);
      
      // Asegurar que siempre tengamos las categorías cargadas
      if (personnelTypes.length === 0) {
        await getAllPersonnelTypes();
      }
      
      // Enriquecer el personal con nombres de categoría
      const enrichedPersonnel = personnel.map(person => {
        const type = personnelTypes.find(t => t._id === person.personnelType);
        return {
          ...person,
          typeName: type ? type.name : 'Sin categoría'
        };
      });
      
      setPersonnelList(enrichedPersonnel as Personnel[]);
      return enrichedPersonnel as Personnel[];
    } catch (error) {
      return handleError('Error obteniendo personal', error);
    }
  };

  const getPersonnelById = async (id: string): Promise<Personnel> => {
    try {
      const response = await makeAuthenticatedRequest('get', apiRouters.PERSONNEL.BY_ID(id));
      return handleSingleResponse<Personnel>(response.data as PersonnelApiResponse);
    } catch (error) {
      return handleError(`Error obteniendo personal ${id}`, error);
    }
  };

  const createPersonnel = async (personnelData: NewPersonnel): Promise<Personnel> => {
    if (!canCreate()) {
      throw new Error('No tienes permisos para crear personal');
    }
    try {
      const response = await makeAuthenticatedRequest('post', apiRouters.PERSONNEL.BASE, personnelData);
      const newPersonnel = handleSingleResponse<Personnel>(response.data as PersonnelApiResponse);
      // Enriquecer con nombre de tipo si es posible
      const type = personnelTypes.find(t => t._id === (newPersonnel as any).personnelType);
      const enriched = { ...newPersonnel, typeName: type ? type.name : ((newPersonnel as any).typeName || 'Sin categoría') };
      // Actualiza la lista local inmediatamente sin re-fetch para reflejar el cambio instantáneamente
      setPersonnelList(prev => [...prev, enriched]);
      return enriched as Personnel;
    } catch (error) {
      return handleError('Error creando personal', error);
    }
  };

  const updatePersonnel = async (id: string, personnelData: UpdatePersonnel): Promise<Personnel> => {
    if (!canEdit()) {
      throw new Error('No tienes permisos para editar personal');
    }
    // Si el usuario es coordinador, no debe enviar el campo status
    let dataToSend = { ...personnelData };
    if (hasRole('coordinador') && !hasRole('admin')) {
      // Eliminar el campo status si existe
      if ('status' in dataToSend) {
        delete dataToSend.status;
      }
    }
    try {
      const response = await makeAuthenticatedRequest('put', apiRouters.PERSONNEL.BY_ID(id), dataToSend);
      const updatedPersonnel = handleSingleResponse<Personnel>(response.data as PersonnelApiResponse);
      // Enriquecer con nombre de tipo si es posible
      const type = personnelTypes.find(t => t._id === (updatedPersonnel as any).personnelType);
      const enriched = { ...updatedPersonnel, typeName: type ? type.name : ((updatedPersonnel as any).typeName || 'Sin categoría') };
      // Actualiza la lista local inmediatamente sin re-fetch para reflejar el cambio instantáneamente
      setPersonnelList(prev => prev.map(item => item._id === id ? enriched : item));
      return enriched as Personnel;
    } catch (error) {
      return handleError(`Error actualizando personal ${id}`, error);
    }
  };

  const deletePersonnel = async (id: string): Promise<void> => {
    if (!canDelete()) {
      throw new Error('No tienes permisos para eliminar personal');
    }
    try {
      await makeAuthenticatedRequest('delete', apiRouters.PERSONNEL.BY_ID(id));
      setPersonnelList(prev => prev.filter(item => item._id !== id));
    } catch (error) {
      handleError(`Error eliminando personal ${id}`, error);
    }
  };

  // ============ OPERACIONES DE TIPOS DE PERSONAL ACTUALIZADAS ============
  const getAllPersonnelTypes = async (): Promise<PersonnelType[]> => {
    try {
      const response = await makeAuthenticatedRequest('get', apiRouters.TYPES.PERSONNEL.BASE);
      const types = handleArrayResponse<PersonnelType>(response.data as PersonnelTypeApiResponse);
      setPersonnelTypes(types);
      return types;
    } catch (error) {
      return handleError('Error obteniendo tipos de personal', error);
    }
  };

  const getPersonnelTypeById = async (id: string): Promise<PersonnelType> => {
    try {
      const response = await makeAuthenticatedRequest('get', apiRouters.TYPES.PERSONNEL.BY_ID(id));
      return handleSingleResponse<PersonnelType>(response.data as PersonnelTypeApiResponse);
    } catch (error) {
      return handleError(`Error obteniendo tipo de personal ${id}`, error);
    }
  };

  const createPersonnelType = async (typeData: NewPersonnelType): Promise<PersonnelType> => {
    if (!canManageTypes()) {
      throw new Error('No tienes permisos para crear categorías de personal');
    }
    try {
      // Incluir el usuario actual en los datos
      const dataWithUser = {
        ...typeData,
        createdBy: user?.id || 'current-user',
      };
      const response = await makeAuthenticatedRequest('post', apiRouters.TYPES.PERSONNEL.BASE, dataWithUser);
      const newType = handleSingleResponse<PersonnelType>(response.data as PersonnelTypeApiResponse);
      setPersonnelTypes(prev => [...prev, newType]);
      return newType;
    } catch (error) {
      return handleError('Error creando tipo de personal', error);
    }
  };

  const updatePersonnelType = async (id: string, typeData: UpdatePersonnelType): Promise<PersonnelType> => {
    if (!canManageTypes()) {
      throw new Error('No tienes permisos para editar categorías de personal');
    }
    try {
      // Incluir el usuario actual en los datos de actualización
      const dataWithUser = {
        ...typeData,
        updatedBy: user?.id || 'current-user',
      };
      const response = await makeAuthenticatedRequest('put', apiRouters.TYPES.PERSONNEL.BY_ID(id), dataWithUser);
      const updatedType = handleSingleResponse<PersonnelType>(response.data as PersonnelTypeApiResponse);
      setPersonnelTypes(prev => 
        prev.map(item => item._id === id ? updatedType : item)
      );
      return updatedType;
    } catch (error) {
      return handleError(`Error actualizando tipo de personal ${id}`, error);
    }
  };

  const deletePersonnelType = async (id: string): Promise<void> => {
    if (!canManageTypes()) {
      throw new Error('No tienes permisos para eliminar categorías de personal');
    }
    try {
      await makeAuthenticatedRequest('delete', apiRouters.TYPES.PERSONNEL.BY_ID(id));
      setPersonnelTypes(prev => prev.filter(item => item._id !== id));
    } catch (error) {
      handleError(`Error eliminando tipo de personal ${id}`, error);
    }
  };

  // ============ MÉTODOS ADICIONALES ACTUALIZADOS ============
  const getPersonnelByType = (typeId: string): Personnel[] => {
    return personnelList.filter(p => p.personnelType === typeId);
  };

  const searchPersonnel = async (query: string): Promise<Personnel[]> => {
    try {
      const response = await makeAuthenticatedRequest('get', `${apiRouters.PERSONNEL.SEARCH}?q=${query}`);
      return handleArrayResponse<Personnel>(response.data as PersonnelApiResponse);
    } catch (error) {
      return handleError('Error buscando personal', error);
    }
  };

  const searchPersonnelTypes = async (query: string): Promise<PersonnelType[]> => {
    try {
      const response = await makeAuthenticatedRequest('get', `${apiRouters.TYPES.PERSONNEL.SEARCH}?q=${query}`);
      return handleArrayResponse<PersonnelType>(response.data as PersonnelTypeApiResponse);
    } catch (error) {
      return handleError('Error buscando tipos de personal', error);
    }
  };

  // ============ REFRESCAR DATOS ============
  const refreshData = async (): Promise<void> => {
    if (token) {
      await loadInitialData();
    } else {
      setError('No se puede refrescar: token no disponible');
    }
  };

  return {
    // Estados
    personnelList,
    personnelTypes,
    loading,
    error,
    
    // Operaciones de Personal
    getAllPersonnel,
    getPersonnelById,
    createPersonnel,
    updatePersonnel,
    deletePersonnel,
    
    // Operaciones de Tipos de Personal
    getAllPersonnelTypes,
    getPersonnelTypeById,
    createPersonnelType,
    updatePersonnelType,
    deletePersonnelType,
    
    // Métodos adicionales
    getPersonnelByType,
    searchPersonnel,
    searchPersonnelTypes,
    
    // Utilidades
    refreshData,
    clearError: () => setError(null),
    hasToken: !!token // Método adicional para verificar si hay token
  };
};

export default usePersonnelService;
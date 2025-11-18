import { TestBed } from '@angular/core/testing';
import { of, throwError, EMPTY } from 'rxjs'; // Importamos EMPTY para pruebas de error

// Lo que vamos a probar
import { PersonnelService } from './personnel';
import { ApiService } from './api';
import { apiRouters } from '../constants/apiRouters';

// ===================================================================
// IMPORTANTE: Rutas de interfaces (ajusta si es necesario)
// ===================================================================
import { 
  Personnel, 
  NewPersonnel, 
  UpdatePersonnel, 
  PersonnelApiResponse 
} from '../../shared/interfaces/personnel';
import { 
  PersonnelType, 
  NewPersonnelType, 
  UpdatePersonnelType, 
  PersonnelTypeApiResponse 
} from '../../shared/interfaces/personnel-type';


// --- INICIO DEL BLOQUE DE PRUEBAS ---
// Suite de pruebas para el PersonnelService
// Este servicio maneja las operaciones CRUD para personal y tipos de personal
describe('PersonnelService', () => {
  let service: PersonnelService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  // ==========================================
  // DATOS DE PRUEBA (MOCKS)
  // ==========================================
  
  // CORREGIDO: Basado en tu 'personnel-type.ts'
  // Mock de Tipo de Personal: simula una categoría de personal (ej: chef, mesero, etc.)
  const mockPersonnelType: PersonnelType = {
    _id: 'type1',
    name: 'Tipo A',
    description: 'Descripción A',
    isActive: true,
    createdBy: 'testUser',
    createdAt: new Date().toISOString(), // Es string
    updatedAt_: new Date().toISOString() // Es string
  };
  const mockPersonnelTypeArray: PersonnelType[] = [mockPersonnelType];

  // CORREGIDO: Basado en tu 'personnel.ts' (interfaz)
  // Mock de Personal: simula una persona del equipo (ej: Juan Pérez - chef)
  const mockPersonnel: Personnel = {
    _id: 'p1',
    firstName: 'Juan',
    lastName: 'Perez',
    email: 'juan@test.com',
    phone: '123456',
    personnelType: 'type1', // Referencia al tipo de personal
    status: 'disponible',
    skills: [],
    createdAt: new Date(), // Es Date
    updatedAt: new Date()  // Es Date
  };
  const mockPersonnelArray: Personnel[] = [
    mockPersonnel,
    { ...mockPersonnel, _id: 'p2', personnelType: 'type2', firstName: 'Ana' }
  ];

  // Helpers para simular respuestas de API exitosas
  const mockApiResponse = (data: any) => ({
    success: true,
    data: data
  });
  
  // Helper para simular respuestas de error de API
  const mockApiErrorResponse = (message: string) => ({
    success: false,
    message: message
  });

  // ==========================================
  // CONFIGURACIÓN ANTES DE CADA PRUEBA (beforeEach)
  // ==========================================
  // Este beforeEach es para el "camino feliz" (todas las llamadas exitosas)
  beforeEach(() => {
    // Creamos un spy del ApiService con los métodos que vamos a usar
    mockApiService = jasmine.createSpyObj('ApiService', ['getOb', 'postOb', 'putOb', 'deleteOb']);

    // Configuramos las llamadas iniciales del constructor para que sean exitosas
    mockApiService.getOb.withArgs(apiRouters.PERSONNEL.BASE).and.returnValue(of(mockApiResponse([])));
    mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BASE).and.returnValue(of(mockApiResponse([])));

    // Configuramos el módulo de testing
    TestBed.configureTestingModule({
      providers: [
        PersonnelService,
        { provide: ApiService, useValue: mockApiService } // Usamos el mock en lugar del servicio real
      ]
    });

    // Obtenemos la instancia del servicio
    service = TestBed.inject(PersonnelService);
  });

  // ==========================================
  // PRUEBAS BÁSICAS DE CREACIÓN
  // ==========================================

  // Prueba que verifica que el servicio se crea correctamente
  // y que el constructor hace las 2 llamadas iniciales para cargar datos
  it('should be created and call loadInitialData on constructor', () => {
    expect(service).toBeTruthy();
    // Verificamos que se llamó a los endpoints correctos
    expect(mockApiService.getOb).toHaveBeenCalledWith(apiRouters.PERSONNEL.BASE);
    expect(mockApiService.getOb).toHaveBeenCalledWith(apiRouters.TYPES.PERSONNEL.BASE);
    expect(mockApiService.getOb).toHaveBeenCalledTimes(2); // 2 llamadas en el constructor
  });
  
  // =======================================================
  // PRUEBAS CORREGIDAS (Cubren las 3 Ramas Faltantes)
  // Manejo de errores en el constructor
  // =======================================================
  describe('Constructor Error Handling', () => {
    
    let handleErrorSpy: jasmine.Spy;

    // Función helper para reconfigurar el TestBed para pruebas de error
    const setupErrorTest = (personnelError: boolean, typeError: boolean) => {
      // Creamos un nuevo spy del ApiService
      mockApiService = jasmine.createSpyObj('ApiService', ['getOb']);
      
      // Configuramos las llamadas para que fallen según los parámetros
      mockApiService.getOb.withArgs(apiRouters.PERSONNEL.BASE).and.returnValue(
        personnelError ? throwError(() => new Error('Fallo 1')) : of(mockApiResponse([]))
      );
      mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BASE).and.returnValue(
        typeError ? throwError(() => new Error('Fallo 2')) : of(mockApiResponse([]))
      );

      // CORRECCIÓN: Reseteamos el TestBed ANTES de espiar el prototipo
      // Esto es necesario para limpiar cualquier configuración anterior
      TestBed.resetTestingModule();

      // CORRECCIÓN: Espiamos handleError ANTES de la inyección
      // Le decimos que devuelva EMPTY para que no falle el .subscribe() en loadInitialData
      handleErrorSpy = spyOn(PersonnelService.prototype as any, 'handleError').and.returnValue(EMPTY);

      // Configuramos el módulo de testing con el ApiService mock que puede fallar
      TestBed.configureTestingModule({
        providers: [
          PersonnelService,
          { provide: ApiService, useValue: mockApiService }
        ]
      });
      
      // Obtenemos la instancia del servicio (esto dispara el constructor)
      service = TestBed.inject(PersonnelService);
    };

    // Prueba: Error al cargar personal en el constructor
    it('should call handleError if getAllPersonnel fails on init', () => {
      setupErrorTest(true, false); // Fallar solo la primera llamada (personal)
      expect(service).toBeTruthy();
      // Verificamos que la rama catchError llamó a handleError con el mensaje correcto
      expect(handleErrorSpy).toHaveBeenCalledWith('Error obteniendo personal', jasmine.any(Error));
    });

    // Prueba: Error al cargar tipos de personal en el constructor
    it('should call handleError if getAllPersonnelTypes fails on init', () => {
      setupErrorTest(false, true); // Fallar solo la segunda llamada (tipos)
      expect(service).toBeTruthy();
      // Verificamos que la rama catchError llamó a handleError con el mensaje correcto
      expect(handleErrorSpy).toHaveBeenCalledWith('Error obteniendo tipos de personal', jasmine.any(Error));
    });
  });

  // ==========================================
  // PRUEBAS DE MANEJO DE RESPUESTAS (BRANCH COVERAGE)
  // ==========================================

  describe('private#handleArrayResponse (Branch Coverage)', () => {
    // Prueba: respuesta con array de datos (caso normal)
    it('should return array data if data is already an array', () => {
      const response = mockApiResponse(mockPersonnelArray);
      const result = (service as any).handleArrayResponse(response);
      expect(result).toEqual(mockPersonnelArray);
    });

    // Prueba: respuesta con objeto único (debe convertirse a array)
    it('should wrap single object in an array', () => {
      const response = mockApiResponse(mockPersonnel);
      const result = (service as any).handleArrayResponse(response);
      expect(result).toEqual([mockPersonnel]);
    });
    
    // Prueba: respuesta con error del servidor
    it('should throw error if response.success is false', () => {
      const errorResponse = mockApiErrorResponse('Operación fallida');
      expect(() => (service as any).handleArrayResponse(errorResponse))
        .toThrowError('Operación fallida');
    });

    // Prueba: respuesta exitosa pero sin datos
    it('should throw error if response.data is null', () => {
      const errorResponse = { success: true, data: null };
      expect(() => (service as any).handleArrayResponse(errorResponse))
        .toThrowError('Datos no disponibles');
    });
  });

  describe('private#handleSingleResponse (Branch Coverage)', () => {
    // Prueba: respuesta con objeto único (caso normal)
    it('should return object data if data is already an object', () => {
      const response = mockApiResponse(mockPersonnel);
      const result = (service as any).handleSingleResponse(response);
      expect(result).toEqual(mockPersonnel);
    });
    
    // Prueba: respuesta con array (toma el primer elemento)
    it('should return first item if response.data is an array', () => {
      const response = mockApiResponse(mockPersonnelArray);
      const result = (service as any).handleSingleResponse(response);
      expect(result).toEqual(mockPersonnel);
    });
    
    // Prueba: array vacío (no hay resultados)
    it('should throw error if response.data is an empty array', () => {
      const response = mockApiResponse([]);
      expect(() => (service as any).handleSingleResponse(response))
        .toThrowError('No se encontraron resultados');
    });

    // Prueba: diferentes tipos de errores
    it('should throw error if response.success is false or data is null', () => {
      const errorResponse = mockApiErrorResponse('Operación fallida');
      expect(() => (service as any).handleSingleResponse(errorResponse))
        .toThrowError('Operación fallida');
        
      const errorResponseNull = { success: true, data: null };
      expect(() => (service as any).handleSingleResponse(errorResponseNull))
        .toThrowError('Datos no disponibles');
    });
  });

  describe('private#handleError (Branch Coverage)', () => {
    // Estas pruebas prueban la implementación real (no el espía del constructor)
    
    // Prueba: error con mensaje específico del API
    it('should use error.error.message if available', (done) => {
      (service as any).handleError('test', { error: { message: 'Error API' } }).subscribe({
        error: (err: Error) => { expect(err.message).toBe('Error API'); done(); }
      });
    });

    // Prueba: error con mensaje general
    it('should use error.message if error.error.message is missing', (done) => {
      (service as any).handleError('test', { message: 'Error Cliente' }).subscribe({
        error: (err: Error) => { expect(err.message).toBe('Error Cliente'); done(); }
      });
    });

    // Prueba: error sin mensaje específico (usa mensaje por defecto)
    it('should use fallback message if no message is found', (done) => {
      (service as any).handleError('test', {}).subscribe({
        error: (err: Error) => { expect(err.message).toBe('Error desconocido'); done(); }
      });
    });
  });

  // ==========================================
  // OPERACIONES CRUD PARA PERSONAL
  // ==========================================

  describe('Personnel CRUD', () => {
    // Prueba: Obtener todo el personal exitosamente
    it('getAllPersonnel() should fetch and update subject', (done) => {
      mockApiService.getOb.withArgs(apiRouters.PERSONNEL.BASE).and.returnValue(of(mockApiResponse(mockPersonnelArray)));
      service.getAllPersonnel().subscribe(data => {
        expect(data).toEqual(mockPersonnelArray);
        // Verificamos que se actualizó el subject interno
        expect(service.personnelListSubject.value).toEqual(mockPersonnelArray);
        done();
      });
    });
    
    // Prueba: Manejo de errores al obtener personal
    it('getAllPersonnel() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.PERSONNEL.BASE).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getAllPersonnel().subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    // Prueba: Obtener una persona específica por ID
    it('getPersonnelById() should fetch one item', (done) => {
      mockApiService.getOb.withArgs(apiRouters.PERSONNEL.BY_ID('p1')).and.returnValue(of(mockApiResponse(mockPersonnel)));
      service.getPersonnelById('p1').subscribe(data => {
        expect(data).toEqual(mockPersonnel);
        done();
      });
    });
    
    // Prueba: Manejo de errores al obtener persona por ID
    it('getPersonnelById() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.PERSONNEL.BY_ID('p1')).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getPersonnelById('p1').subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    // Prueba: Crear nueva persona
    it('createPersonnel() should post and update subject', (done) => {
      // CORREGIDO: Asumimos que NewPersonnel omite _id, createdAt, updatedAt
      const newPersonnel: NewPersonnel = { ...mockPersonnel };
      delete (newPersonnel as any)._id;
      delete (newPersonnel as any).createdAt;
      delete (newPersonnel as any).updatedAt;
      
      const createdPersonnel: Personnel = mockPersonnel;
      
      mockApiService.postOb.and.returnValue(of(mockApiResponse(createdPersonnel)));
      service.createPersonnel(newPersonnel).subscribe(data => {
        expect(data).toEqual(createdPersonnel);
        // Verificamos que se actualizó el subject
        expect(service.personnelListSubject.value).toEqual([createdPersonnel]);
        done();
      });
    });
    
    // Prueba: Manejo de errores al crear persona
    it('createPersonnel() should handle errors', (done) => {
      const newPersonnel: NewPersonnel = { ...mockPersonnel };
      delete (newPersonnel as any)._id;
      delete (newPersonnel as any).createdAt;
      delete (newPersonnel as any).updatedAt;

      mockApiService.postOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.createPersonnel(newPersonnel).subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    // Prueba: Actualizar persona existente
    it('updatePersonnel() should put and update subject', (done) => {
      // Pre-cargamos datos en el subject
      service.personnelListSubject.next(mockPersonnelArray); 
      const updatePayload: UpdatePersonnel = { _id: 'p1', firstName: 'Juanito' };
      const updatedPersonnel: Personnel = { ...mockPersonnel, firstName: 'Juanito' };
      
      mockApiService.putOb.and.returnValue(of(mockApiResponse(updatedPersonnel)));
      service.updatePersonnel('p1', updatePayload).subscribe(data => {
        expect(data).toEqual(updatedPersonnel);
        // Verificamos que se actualizó el registro en el subject
        expect(service.personnelListSubject.value[0].firstName).toBe('Juanito');
        done();
      });
    });
    
    // Prueba: Manejo de errores al actualizar persona
    it('updatePersonnel() should handle errors', (done) => {
      mockApiService.putOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.updatePersonnel('p1', { _id: 'p1' }).subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    // Prueba: Eliminar persona
    it('deletePersonnel() should delete and update subject', (done) => {
      // Pre-cargamos datos en el subject
      service.personnelListSubject.next(mockPersonnelArray);
      mockApiService.deleteOb.and.returnValue(of(mockApiResponse({}))); 
      service.deletePersonnel('p1').subscribe(() => {
        // Verificamos que se eliminó del subject
        expect(service.personnelListSubject.value.length).toBe(1);
        expect(service.personnelListSubject.value[0]._id).toBe('p2');
        done();
      });
    });

    // Prueba: Manejo de errores al eliminar persona
    it('deletePersonnel() should handle errors', (done) => {
      mockApiService.deleteOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.deletePersonnel('p1').subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });
  });

  // ==========================================
  // OPERACIONES CRUD PARA TIPOS DE PERSONAL
  // ==========================================
  
  describe('PersonnelType CRUD', () => {
    // Prueba: Obtener todos los tipos de personal
    it('getAllPersonnelTypes() should fetch and update subject', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BASE).and.returnValue(of(mockApiResponse(mockPersonnelTypeArray)));
      service.getAllPersonnelTypes().subscribe(data => {
        expect(data).toEqual(mockPersonnelTypeArray);
        // Verificamos que se actualizó el subject
        expect(service.personnelTypesSubject.value).toEqual(mockPersonnelTypeArray);
        done();
      });
    });
    
    // Prueba: Manejo de errores al obtener tipos de personal
    it('getAllPersonnelTypes() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BASE).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getAllPersonnelTypes().subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    // Prueba: Obtener un tipo de personal específico por ID
    it('getPersonnelTypeById() should fetch one item', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BY_ID('type1')).and.returnValue(of(mockApiResponse(mockPersonnelType)));
      service.getPersonnelTypeById('type1').subscribe(data => {
        expect(data).toEqual(mockPersonnelType);
        done();
      });
    });
    
    // Prueba: Manejo de errores al obtener tipo de personal por ID
    it('getPersonnelTypeById() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BY_ID('type1')).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getPersonnelTypeById('type1').subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    // Prueba: Crear nuevo tipo de personal
    it('createPersonnelType() should post and update subject', (done) => {
      // CORREGIDO: Asumimos NewPersonnelType omite _id, createdAt, updatedAt_
      const newType: NewPersonnelType = { ...mockPersonnelType };
      delete (newType as any)._id;
      delete (newType as any).createdAt;
      delete (newType as any).updatedAt_;

      const createdType: PersonnelType = mockPersonnelType;
      
      mockApiService.postOb.and.returnValue(of(mockApiResponse(createdType)));
      service.createPersonnelType(newType).subscribe(data => {
        expect(data).toEqual(createdType);
        // Verificamos que se actualizó el subject
        expect(service.personnelTypesSubject.value).toEqual([createdType]);
        done();
      });
    });
    
    // Prueba: Manejo de errores al crear tipo de personal
    it('createPersonnelType() should handle errors', (done) => {
      const newType: NewPersonnelType = { ...mockPersonnelType };
      delete (newType as any)._id;
      delete (newType as any).createdAt;
      delete (newType as any).updatedAt_;

      mockApiService.postOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.createPersonnelType(newType).subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    // Prueba: Actualizar tipo de personal existente
    it('updatePersonnelType() should put and update subject', (done) => {
      // Pre-cargamos datos en el subject
      service.personnelTypesSubject.next(mockPersonnelTypeArray);
      const updatePayload: UpdatePersonnelType = { _id: 'type1', name: 'Tipo B' };
      const updatedType: PersonnelType = { ...mockPersonnelType, name: 'Tipo B' };
      
      mockApiService.putOb.and.returnValue(of(mockApiResponse(updatedType)));
      service.updatePersonnelType('type1', updatePayload).subscribe(data => {
        expect(data).toEqual(updatedType);
        // Verificamos que se actualizó el registro en el subject
        expect(service.personnelTypesSubject.value[0].name).toBe('Tipo B');
        done();
      });
    });
    
    // Prueba: Manejo de errores al actualizar tipo de personal
    it('updatePersonnelType() should handle errors', (done) => {
      mockApiService.putOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.updatePersonnelType('type1', { _id: 'type1' }).subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    // Prueba: Eliminar tipo de personal
    it('deletePersonnelType() should delete and update subject', (done) => {
      // Pre-cargamos datos en el subject
      service.personnelTypesSubject.next(mockPersonnelTypeArray);
      mockApiService.deleteOb.and.returnValue(of(mockApiResponse({})));
      service.deletePersonnelType('type1').subscribe(() => {
        // Verificamos que se eliminó del subject
        expect(service.personnelTypesSubject.value.length).toBe(0);
        done();
      });
    });

    // Prueba: Manejo de errores al eliminar tipo de personal
    it('deletePersonnelType() should handle errors', (done) => {
      mockApiService.deleteOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.deletePersonnelType('type1').subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });
  });

  // ==========================================
  // MÉTODOS ADICIONALES (FILTROS Y BÚSQUEDAS)
  // ==========================================

  describe('Additional Methods', () => {
    // Prueba: Filtrar personal por tipo existente
    it('getPersonnelByType() should filter by an existing type', (done) => {
      service.personnelListSubject.next(mockPersonnelArray);
      service.getPersonnelByType('type2').subscribe(data => {
        expect(data.length).toBe(1); // Solo Ana tiene type2
        expect(data[0]._id).toBe('p2');
        done();
      });
    });
    
    // Prueba: Tipo de personal inexistente devuelve array vacío
    it('getPersonnelByType() should return empty array for non-existent type', (done) => {
      service.personnelListSubject.next(mockPersonnelArray);
      service.getPersonnelByType('type-nonexistent').subscribe(data => {
        expect(data.length).toBe(0); // No hay personal con este tipo
        done();
      });
    });

    // Prueba: Búsqueda de personal por query
    it('searchPersonnel() should call search API', (done) => {
      const query = 'Ana';
      const searchUrl = `${apiRouters.PERSONNEL.BASE}/search?q=${query}`;
      mockApiService.getOb.withArgs(searchUrl).and.returnValue(of(mockApiResponse([mockPersonnelArray[1]])));
      service.searchPersonnel(query).subscribe(data => {
        expect(data.length).toBe(1);
        expect(data[0].firstName).toBe('Ana'); // Encuentra a Ana
        done();
      });
    });
    
    // Prueba: Manejo de errores en búsqueda de personal
    it('searchPersonnel() should handle errors', (done) => {
      const query = 'Ana';
      const searchUrl = `${apiRouters.PERSONNEL.BASE}/search?q=${query}`;
      mockApiService.getOb.withArgs(searchUrl).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.searchPersonnel(query).subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    // Prueba: Búsqueda de tipos de personal por query
    it('searchPersonnelTypes() should call search API', (done) => {
      const query = 'Tipo';
      const searchUrl = `${apiRouters.TYPES.PERSONNEL.BASE}/search?q=${query}`;
      mockApiService.getOb.withArgs(searchUrl).and.returnValue(of(mockApiResponse(mockPersonnelTypeArray)));
      service.searchPersonnelTypes(query).subscribe(data => {
        expect(data.length).toBe(1);
        expect(data[0].name).toBe('Tipo A'); // Encuentra "Tipo A"
        done();
      });
    });

    // Prueba: Manejo de errores en búsqueda de tipos de personal
    it('searchPersonnelTypes() should handle errors', (done) => {
      const query = 'Tipo';
      const searchUrl = `${apiRouters.TYPES.PERSONNEL.BASE}/search?q=${query}`;
      mockApiService.getOb.withArgs(searchUrl).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.searchPersonnelTypes(query).subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });
  });

});
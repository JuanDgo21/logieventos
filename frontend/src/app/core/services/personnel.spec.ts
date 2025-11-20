// Importamos las herramientas necesarias para testing en Angular y RxJS
import { TestBed } from '@angular/core/testing';
import { of, throwError, EMPTY } from 'rxjs';  // 'of' para observables exitosos, 'throwError' para errores, 'EMPTY' para observable vacío
import { PersonnelService } from './personnel';
import { ApiService } from './api';
import { apiRouters } from '../constants/apiRouters';

// Importamos las interfaces que usa el servicio
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

// La función 'describe' agrupa todas las pruebas relacionadas con el PersonnelService
describe('PersonnelService', () => {
  let service: PersonnelService;  // Instancia del servicio que vamos a probar
  let mockApiService: jasmine.SpyObj<ApiService>;  // Spy (objeto simulado) del ApiService

  // ==========================================
  // DATOS DE PRUEBA (MOCKS)
  // ==========================================
  
  // Mock de un tipo de personal para usar en las pruebas
  const mockPersonnelType: PersonnelType = {
    _id: 'type1',
    name: 'Tipo A',
    description: 'Descripción A',
    isActive: true,
    createdBy: 'testUser',
    createdAt: new Date().toISOString(),
    updatedAt_: new Date().toISOString()
  };
  
  // [COVERAGE FIX] Necesitamos un segundo tipo para probar que NO se actualiza
  // Esto es importante para cubrir todas las ramas del código
  const mockPersonnelType2: PersonnelType = {
    ...mockPersonnelType,  // Copiamos las propiedades del primer tipo
    _id: 'type2',          // Cambiamos el ID
    name: 'Tipo Intacto'   // Cambiamos el nombre
  };
  
  // Array con los tipos de personal mock
  const mockPersonnelTypeArray: PersonnelType[] = [mockPersonnelType];

  // Mock de un empleado individual
  const mockPersonnel: Personnel = {
    _id: 'p1',
    firstName: 'Juan',
    lastName: 'Perez',
    email: 'juan@test.com',
    phone: '123456',
    personnelType: 'type1',
    status: 'disponible',
    skills: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Array con múltiples empleados mock
  const mockPersonnelArray: Personnel[] = [
    mockPersonnel,
    { ...mockPersonnel, _id: 'p2', personnelType: 'type2', firstName: 'Ana' }  // Segundo empleado
  ];

  // Función helper para crear respuestas API exitosas
  const mockApiResponse = (data: any) => ({
    success: true,
    data: data
  });
  
  // Función helper para crear respuestas API con error
  const mockApiErrorResponse = (message: string) => ({
    success: false,
    message: message
  });

  // 'beforeEach' se ejecuta ANTES de cada prueba individual
  beforeEach(() => {
    // Creamos un objeto spy para el ApiService con todos los métodos que el PersonnelService usa
    mockApiService = jasmine.createSpyObj('ApiService', ['getOb', 'postOb', 'putOb', 'deleteOb']);

    // Configuramos respuestas por defecto para las llamadas iniciales del constructor
    mockApiService.getOb.withArgs(apiRouters.PERSONNEL.BASE).and.returnValue(of(mockApiResponse([])));
    mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BASE).and.returnValue(of(mockApiResponse([])));

    // Configuramos el módulo de testing de Angular
    TestBed.configureTestingModule({
      providers: [
        PersonnelService,  // El servicio real que vamos a probar
        { provide: ApiService, useValue: mockApiService }  // Inyectamos el mock en lugar del servicio real
      ]
    });

    // Obtenemos la instancia del servicio del TestBed
    service = TestBed.inject(PersonnelService);
  });

  // ==========================================
  // PRUEBAS BÁSICAS
  // ==========================================

  // Prueba básica: verifica que el servicio se crea correctamente
  it('should be created and call loadInitialData on constructor', () => {
    expect(service).toBeTruthy();  // Verifica que el servicio existe
    // Verifica que el constructor llamó a los endpoints correctos
    expect(mockApiService.getOb).toHaveBeenCalledWith(apiRouters.PERSONNEL.BASE);
    expect(mockApiService.getOb).toHaveBeenCalledWith(apiRouters.TYPES.PERSONNEL.BASE);
  });
  
  // Grupo de pruebas para el manejo de errores en el constructor
  describe('Constructor Error Handling', () => {
    let handleErrorSpy: jasmine.Spy;  // Spy para el método privado handleError

    // Función helper para configurar pruebas de error
    const setupErrorTest = (personnelError: boolean, typeError: boolean) => {
      // Creamos un nuevo spy para cada test
      mockApiService = jasmine.createSpyObj('ApiService', ['getOb']);
      
      // Configuramos si cada endpoint debe fallar o tener éxito
      mockApiService.getOb.withArgs(apiRouters.PERSONNEL.BASE).and.returnValue(
        personnelError ? throwError(() => new Error('Fallo 1')) : of(mockApiResponse([]))
      );
      mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BASE).and.returnValue(
        typeError ? throwError(() => new Error('Fallo 2')) : of(mockApiResponse([]))
      );

      // Reseteamos el módulo de testing para una configuración limpia
      TestBed.resetTestingModule();

      // Espiamos el método privado handleError para verificar que se llama
      handleErrorSpy = spyOn(PersonnelService.prototype as any, 'handleError').and.returnValue(EMPTY);

      // Reconfiguramos el módulo de testing con los nuevos mocks
      TestBed.configureTestingModule({
        providers: [
          PersonnelService,
          { provide: ApiService, useValue: mockApiService }
        ]
      });
      
      // Obtenemos una nueva instancia del servicio
      service = TestBed.inject(PersonnelService);
    };

    // Prueba: error al cargar personal en el constructor
    it('should call handleError if getAllPersonnel fails on init', () => {
      setupErrorTest(true, false);  // Error en personal, éxito en tipos
      expect(service).toBeTruthy();
      // Verifica que se llamó a handleError con el mensaje correcto
      expect(handleErrorSpy).toHaveBeenCalledWith('Error obteniendo personal', jasmine.any(Error));
    });

    // Prueba: error al cargar tipos en el constructor
    it('should call handleError if getAllPersonnelTypes fails on init', () => {
      setupErrorTest(false, true);  // Éxito en personal, error en tipos
      expect(service).toBeTruthy();
      expect(handleErrorSpy).toHaveBeenCalledWith('Error obteniendo tipos de personal', jasmine.any(Error));
    });
  });

  // ==========================================
  // PRUEBAS DE BRANCH COVERAGE (MÉTODOS PRIVADOS)
  // ==========================================

  // Grupo de pruebas para el método privado handleArrayResponse
  describe('private#handleArrayResponse (Branch Coverage)', () => {
    // Prueba: respuesta con array (caso normal)
    it('should return array data if data is already an array', () => {
      const response = mockApiResponse(mockPersonnelArray);
      // Llamamos al método privado usando 'any' para bypassear la protección
      const result = (service as any).handleArrayResponse(response);
      expect(result).toEqual(mockPersonnelArray);
    });

    // Prueba: respuesta con objeto único (debe convertirse a array)
    it('should wrap single object in an array', () => {
      const response = mockApiResponse(mockPersonnel);
      const result = (service as any).handleArrayResponse(response);
      expect(result).toEqual([mockPersonnel]);  // Debe envolver el objeto en un array
    });
    
    // Prueba: respuesta con error explícito
    it('should throw error with message if response.success is false', () => {
      const errorResponse = mockApiErrorResponse('Error explícito');
      // Verifica que se lanza una excepción con el mensaje correcto
      expect(() => (service as any).handleArrayResponse(errorResponse))
        .toThrowError('Error explícito');
    });

    // [COVERAGE FIX] Probamos el caso donde message es undefined para forzar el "|| 'Operación fallida'"
    it('should throw default error "Operación fallida" if response.message is missing', () => {
      const errorResponse = { success: false }; // Sin propiedad message
      expect(() => (service as any).handleArrayResponse(errorResponse))
        .toThrowError('Operación fallida');  // Debe usar el mensaje por defecto
    });

    // Prueba: respuesta exitosa pero data es null
    it('should throw error if response.data is null', () => {
      const errorResponse = { success: true, data: null };
      expect(() => (service as any).handleArrayResponse(errorResponse))
        .toThrowError('Datos no disponibles');
    });
  });

  // Grupo de pruebas para el método privado handleSingleResponse
  describe('private#handleSingleResponse (Branch Coverage)', () => {
    // Prueba: respuesta con objeto único (caso normal)
    it('should return object data if data is already an object', () => {
      const response = mockApiResponse(mockPersonnel);
      const result = (service as any).handleSingleResponse(response);
      expect(result).toEqual(mockPersonnel);
    });
    
    // Prueba: respuesta con array (debe tomar el primer elemento)
    it('should return first item if response.data is an array', () => {
      const response = mockApiResponse(mockPersonnelArray);
      const result = (service as any).handleSingleResponse(response);
      expect(result).toEqual(mockPersonnel);  // Debe devolver el primer elemento del array
    });
    
    // Prueba: respuesta con array vacío
    it('should throw error if response.data is an empty array', () => {
      const response = mockApiResponse([]);
      expect(() => (service as any).handleSingleResponse(response))
        .toThrowError('No se encontraron resultados');
    });

    // [COVERAGE FIX] Probamos el fallback del mensaje de error también aquí
    it('should throw default error "Operación fallida" if response.message is missing', () => {
      const errorResponse = { success: false };
      expect(() => (service as any).handleSingleResponse(errorResponse))
        .toThrowError('Operación fallida');
    });

    // Prueba: respuesta exitosa pero data es null
    it('should throw error if response.data is null', () => {
      const errorResponseNull = { success: true, data: null };
      expect(() => (service as any).handleSingleResponse(errorResponseNull))
        .toThrowError('Datos no disponibles');
    });
  });

  // Grupo de pruebas para el método privado handleError
  describe('private#handleError (Branch Coverage)', () => {
    // Prueba: error con mensaje anidado (error.error.message)
    it('should use error.error.message if available', (done) => {
      (service as any).handleError('test', { error: { message: 'Error API' } }).subscribe({
        error: (err: Error) => { 
          expect(err.message).toBe('Error API');  // Debe usar el mensaje anidado
          done();  // Marcamos la prueba como completada
        }
      });
    });

    // Prueba: error con mensaje directo (error.message)
    it('should use error.message if error.error.message is missing', (done) => {
      (service as any).handleError('test', { message: 'Error Cliente' }).subscribe({
        error: (err: Error) => { 
          expect(err.message).toBe('Error Cliente'); 
          done();
        }
      });
    });

    // Prueba: error sin mensaje (debe usar mensaje por defecto)
    it('should use fallback message if no message is found', (done) => {
      (service as any).handleError('test', {}).subscribe({
        error: (err: Error) => { 
          expect(err.message).toBe('Error desconocido');  // Mensaje por defecto
          done();
        }
      });
    });
  });

  // ==========================================
  // OPERACIONES CRUD PARA PERSONAL
  // ==========================================

  describe('Personnel CRUD', () => {
    // Prueba: obtener todo el personal exitosamente
    it('getAllPersonnel() should fetch and update subject', (done) => {
      mockApiService.getOb.withArgs(apiRouters.PERSONNEL.BASE).and.returnValue(of(mockApiResponse(mockPersonnelArray)));
      service.getAllPersonnel().subscribe(data => {
        expect(data).toEqual(mockPersonnelArray);  // Verifica los datos devueltos
        expect(service.personnelListSubject.value).toEqual(mockPersonnelArray);  // Verifica que se actualizó el Subject
        done();  // Marcamos la prueba como completada
      });
    });
    
    // Prueba: error al obtener personal
    it('getAllPersonnel() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.PERSONNEL.BASE).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getAllPersonnel().subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error'); 
          done();
        }
      });
    });

    // Prueba: obtener un empleado por ID
    it('getPersonnelById() should fetch one item', (done) => {
      mockApiService.getOb.withArgs(apiRouters.PERSONNEL.BY_ID('p1')).and.returnValue(of(mockApiResponse(mockPersonnel)));
      service.getPersonnelById('p1').subscribe(data => {
        expect(data).toEqual(mockPersonnel);
        done();
      });
    });
    
    // Prueba: error al obtener empleado por ID
    it('getPersonnelById() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.PERSONNEL.BY_ID('p1')).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getPersonnelById('p1').subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error'); 
          done();
        }
      });
    });

    // Prueba: crear nuevo empleado
    it('createPersonnel() should post and update subject', (done) => {
      // Preparamos los datos para crear (sin propiedades de sistema)
      const newPersonnel: NewPersonnel = { ...mockPersonnel };
      delete (newPersonnel as any)._id;
      delete (newPersonnel as any).createdAt;
      delete (newPersonnel as any).updatedAt;
      
      const createdPersonnel: Personnel = mockPersonnel;
      
      mockApiService.postOb.and.returnValue(of(mockApiResponse(createdPersonnel)));
      service.createPersonnel(newPersonnel).subscribe(data => {
        expect(data).toEqual(createdPersonnel);  // Verifica el empleado creado
        expect(service.personnelListSubject.value).toEqual([createdPersonnel]);  // Verifica que se actualizó el Subject
        done();
      });
    });
    
    // Prueba: error al crear empleado
    it('createPersonnel() should handle errors', (done) => {
      const newPersonnel: NewPersonnel = { ...mockPersonnel };
      delete (newPersonnel as any)._id;
      delete (newPersonnel as any).createdAt;
      delete (newPersonnel as any).updatedAt;

      mockApiService.postOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.createPersonnel(newPersonnel).subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error'); 
          done();
        }
      });
    });

    // [COVERAGE FIX] Actualización con lista múltiple para probar el map correctamente
    it('updatePersonnel() should put and update subject preserving other items', (done) => {
      // Precargamos 2 elementos en el Subject
      const initialList = [mockPersonnelArray[0], mockPersonnelArray[1]];
      service.personnelListSubject.next(initialList);
      
      const updatePayload: UpdatePersonnel = { _id: 'p1', firstName: 'Juanito' };
      const updatedPersonnel: Personnel = { ...mockPersonnelArray[0], firstName: 'Juanito' };
      
      mockApiService.putOb.and.returnValue(of(mockApiResponse(updatedPersonnel)));
      
      service.updatePersonnel('p1', updatePayload).subscribe(data => {
        expect(data).toEqual(updatedPersonnel);  // Verifica el empleado actualizado
        const currentList = service.personnelListSubject.value;
        
        // Verificamos que el p1 cambió
        expect(currentList[0].firstName).toBe('Juanito');
        // Verificamos que p2 NO cambió (cubriendo el 'else' del map)
        expect(currentList[1].firstName).toBe('Ana'); 
        done();
      });
    });
    
    // Prueba: error al actualizar empleado
    it('updatePersonnel() should handle errors', (done) => {
      mockApiService.putOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.updatePersonnel('p1', { _id: 'p1' }).subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error'); 
          done();
        }
      });
    });

    // Prueba: eliminar empleado
    it('deletePersonnel() should delete and update subject', (done) => {
      // Precargamos datos en el Subject
      service.personnelListSubject.next(mockPersonnelArray);
      mockApiService.deleteOb.and.returnValue(of(mockApiResponse({}))); 
      service.deletePersonnel('p1').subscribe(() => {
        // Verificamos que se eliminó el elemento correcto
        expect(service.personnelListSubject.value.length).toBe(1);
        expect(service.personnelListSubject.value[0]._id).toBe('p2');
        done();
      });
    });

    // Prueba: error al eliminar empleado
    it('deletePersonnel() should handle errors', (done) => {
      mockApiService.deleteOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.deletePersonnel('p1').subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error'); 
          done();
        }
      });
    });
  });

  // ==========================================
  // OPERACIONES CRUD PARA TIPOS DE PERSONAL
  // ==========================================
  
  describe('PersonnelType CRUD', () => {
    // Prueba: obtener todos los tipos de personal
    it('getAllPersonnelTypes() should fetch and update subject', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BASE).and.returnValue(of(mockApiResponse(mockPersonnelTypeArray)));
      service.getAllPersonnelTypes().subscribe(data => {
        expect(data).toEqual(mockPersonnelTypeArray);
        expect(service.personnelTypesSubject.value).toEqual(mockPersonnelTypeArray);
        done();
      });
    });
    
    // Prueba: error al obtener tipos
    it('getAllPersonnelTypes() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BASE).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getAllPersonnelTypes().subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error'); 
          done();
        }
      });
    });

    // Prueba: obtener tipo por ID
    it('getPersonnelTypeById() should fetch one item', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BY_ID('type1')).and.returnValue(of(mockApiResponse(mockPersonnelType)));
      service.getPersonnelTypeById('type1').subscribe(data => {
        expect(data).toEqual(mockPersonnelType);
        done();
      });
    });
    
    // Prueba: error al obtener tipo por ID
    it('getPersonnelTypeById() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BY_ID('type1')).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getPersonnelTypeById('type1').subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error'); 
          done();
        }
      });
    });

    // Prueba: crear nuevo tipo
    it('createPersonnelType() should post and update subject', (done) => {
      const newType: NewPersonnelType = { ...mockPersonnelType };
      delete (newType as any)._id;
      delete (newType as any).createdAt;
      delete (newType as any).updatedAt_;

      const createdType: PersonnelType = mockPersonnelType;
      
      mockApiService.postOb.and.returnValue(of(mockApiResponse(createdType)));
      service.createPersonnelType(newType).subscribe(data => {
        expect(data).toEqual(createdType);
        expect(service.personnelTypesSubject.value).toEqual([createdType]);
        done();
      });
    });
    
    // Prueba: error al crear tipo
    it('createPersonnelType() should handle errors', (done) => {
      const newType: NewPersonnelType = { ...mockPersonnelType };
      delete (newType as any)._id;
      delete (newType as any).createdAt;
      delete (newType as any).updatedAt_;

      mockApiService.postOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.createPersonnelType(newType).subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error'); 
          done();
        }
      });
    });

    // [COVERAGE FIX] Este test ahora cubre el branch "else" del map (Línea amarilla original)
    it('updatePersonnelType() should update specific item and leave others unchanged', (done) => {
      // Precargamos con DOS items
      const initialList = [mockPersonnelType, mockPersonnelType2];
      service.personnelTypesSubject.next(initialList);

      const updatePayload: UpdatePersonnelType = { _id: 'type1', name: 'Tipo Modificado' };
      const updatedType: PersonnelType = { ...mockPersonnelType, name: 'Tipo Modificado' };
      
      mockApiService.putOb.and.returnValue(of(mockApiResponse(updatedType)));
      
      service.updatePersonnelType('type1', updatePayload).subscribe(data => {
        expect(data).toEqual(updatedType);
        const currentList = service.personnelTypesSubject.value;
        
        // 1. Verificamos que type1 cambió
        const item1 = currentList.find(i => i._id === 'type1');
        expect(item1?.name).toBe('Tipo Modificado');

        // 2. Verificamos que type2 NO cambió (Esto cubre el branch : item del ternario)
        const item2 = currentList.find(i => i._id === 'type2');
        expect(item2).toEqual(mockPersonnelType2); // Debe ser idéntico al original
        done();
      });
    });
    
    // Prueba: error al actualizar tipo
    it('updatePersonnelType() should handle errors', (done) => {
      mockApiService.putOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.updatePersonnelType('type1', { _id: 'type1' }).subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error'); 
          done();
        }
      });
    });

    // Prueba: eliminar tipo
    it('deletePersonnelType() should delete and update subject', (done) => {
      service.personnelTypesSubject.next(mockPersonnelTypeArray);
      mockApiService.deleteOb.and.returnValue(of(mockApiResponse({})));
      service.deletePersonnelType('type1').subscribe(() => {
        expect(service.personnelTypesSubject.value.length).toBe(0);
        done();
      });
    });

    // Prueba: error al eliminar tipo
    it('deletePersonnelType() should handle errors', (done) => {
      mockApiService.deleteOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.deletePersonnelType('type1').subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error'); 
          done();
        }
      });
    });
  });

  // ==========================================
  // MÉTODOS ADICIONALES
  // ==========================================

  describe('Additional Methods', () => {
    // Prueba: filtrar personal por tipo existente
    it('getPersonnelByType() should filter by an existing type', (done) => {
      service.personnelListSubject.next(mockPersonnelArray);
      service.getPersonnelByType('type2').subscribe(data => {
        expect(data.length).toBe(1);  // Solo debe encontrar un empleado
        expect(data[0]._id).toBe('p2');
        done();
      });
    });
    
    // Prueba: filtrar por tipo inexistente
    it('getPersonnelByType() should return empty array for non-existent type', (done) => {
      service.personnelListSubject.next(mockPersonnelArray);
      service.getPersonnelByType('type-nonexistent').subscribe(data => {
        expect(data.length).toBe(0);  // No debe encontrar empleados
        done();
      });
    });

    // Prueba: búsqueda de personal
    it('searchPersonnel() should call search API', (done) => {
      const query = 'Ana';
      const searchUrl = `${apiRouters.PERSONNEL.BASE}/search?q=${query}`;
      mockApiService.getOb.withArgs(searchUrl).and.returnValue(of(mockApiResponse([mockPersonnelArray[1]])));
      service.searchPersonnel(query).subscribe(data => {
        expect(data.length).toBe(1);
        expect(data[0].firstName).toBe('Ana');  // Verifica que encontró a Ana
        done();
      });
    });
    
    // Prueba: error en búsqueda de personal
    it('searchPersonnel() should handle errors', (done) => {
      const query = 'Ana';
      const searchUrl = `${apiRouters.PERSONNEL.BASE}/search?q=${query}`;
      mockApiService.getOb.withArgs(searchUrl).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.searchPersonnel(query).subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error'); 
          done();
        }
      });
    });

    // Prueba: búsqueda de tipos de personal
    it('searchPersonnelTypes() should call search API', (done) => {
      const query = 'Tipo';
      const searchUrl = `${apiRouters.TYPES.PERSONNEL.BASE}/search?q=${query}`;
      mockApiService.getOb.withArgs(searchUrl).and.returnValue(of(mockApiResponse(mockPersonnelTypeArray)));
      service.searchPersonnelTypes(query).subscribe(data => {
        expect(data.length).toBe(1);
        expect(data[0].name).toBe('Tipo A');  // Verifica que encontró el tipo correcto
        done();
      });
    });

    // Prueba: error en búsqueda de tipos
    it('searchPersonnelTypes() should handle errors', (done) => {
      const query = 'Tipo';
      const searchUrl = `${apiRouters.TYPES.PERSONNEL.BASE}/search?q=${query}`;
      mockApiService.getOb.withArgs(searchUrl).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.searchPersonnelTypes(query).subscribe({ 
        error: (err) => { 
          expect(err.message).toBe('Error'); 
          done();
        }
      });
    });
  });
});
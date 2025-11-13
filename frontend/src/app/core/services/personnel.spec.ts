import { TestBed } from '@angular/core/testing';
import { of, throwError, EMPTY } from 'rxjs'; // Importamos EMPTY

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
describe('PersonnelService', () => {
  let service: PersonnelService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  // --- DATOS DE PRUEBA (MOCKS) ---
  
  // CORREGIDO: Basado en tu 'personnel-type.ts'
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
  const mockPersonnel: Personnel = {
    _id: 'p1',
    firstName: 'Juan',
    lastName: 'Perez',
    email: 'juan@test.com',
    phone: '123456',
    personnelType: 'type1',
    status: 'disponible',
    skills: [],
    createdAt: new Date(), // Es Date
    updatedAt: new Date()  // Es Date
  };
  const mockPersonnelArray: Personnel[] = [
    mockPersonnel,
    { ...mockPersonnel, _id: 'p2', personnelType: 'type2', firstName: 'Ana' }
  ];

  // Helpers para simular respuestas de API
  const mockApiResponse = (data: any) => ({
    success: true,
    data: data
  });
  
  const mockApiErrorResponse = (message: string) => ({
    success: false,
    message: message
  });

  // --- CONFIGURACIÓN ANTES DE CADA PRUEBA (beforeEach) ---
  // Este beforeEach es para el "camino feliz"
  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['getOb', 'postOb', 'putOb', 'deleteOb']);

    mockApiService.getOb.withArgs(apiRouters.PERSONNEL.BASE).and.returnValue(of(mockApiResponse([])));
    mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BASE).and.returnValue(of(mockApiResponse([])));

    TestBed.configureTestingModule({
      providers: [
        PersonnelService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(PersonnelService);
  });

  // --- INICIO DE LOS CASOS DE PRUEBA ---

  it('should be created and call loadInitialData on constructor', () => {
    expect(service).toBeTruthy();
    expect(mockApiService.getOb).toHaveBeenCalledWith(apiRouters.PERSONNEL.BASE);
    expect(mockApiService.getOb).toHaveBeenCalledWith(apiRouters.TYPES.PERSONNEL.BASE);
    expect(mockApiService.getOb).toHaveBeenCalledTimes(2);
  });
  
  // =======================================================
  // PRUEBAS CORREGIDAS (Cubren las 3 Ramas Faltantes)
  // =======================================================
  describe('Constructor Error Handling', () => {
    
    let handleErrorSpy: jasmine.Spy;

    // Función helper para reconfigurar el TestBed para pruebas de error
    const setupErrorTest = (personnelError: boolean, typeError: boolean) => {
      mockApiService = jasmine.createSpyObj('ApiService', ['getOb']);
      
      mockApiService.getOb.withArgs(apiRouters.PERSONNEL.BASE).and.returnValue(
        personnelError ? throwError(() => new Error('Fallo 1')) : of(mockApiResponse([]))
      );
      mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BASE).and.returnValue(
        typeError ? throwError(() => new Error('Fallo 2')) : of(mockApiResponse([]))
      );

      // CORRECCIÓN: Reseteamos el TestBed ANTES de espiar el prototipo
      TestBed.resetTestingModule();

      // CORRECCIÓN: Espiamos handleError ANTES de la inyección
      // Le decimos que devuelva EMPTY para que no falle el .subscribe() en loadInitialData
      handleErrorSpy = spyOn(PersonnelService.prototype as any, 'handleError').and.returnValue(EMPTY);

      TestBed.configureTestingModule({
        providers: [
          PersonnelService,
          { provide: ApiService, useValue: mockApiService }
        ]
      });
      
      service = TestBed.inject(PersonnelService);
    };

    it('should call handleError if getAllPersonnel fails on init', () => {
      setupErrorTest(true, false); // Fallar solo la primera llamada
      expect(service).toBeTruthy();
      // Verificamos que la rama catchError llamó a handleError
      expect(handleErrorSpy).toHaveBeenCalledWith('Error obteniendo personal', jasmine.any(Error));
    });

    it('should call handleError if getAllPersonnelTypes fails on init', () => {
      setupErrorTest(false, true); // Fallar solo la segunda llamada
      expect(service).toBeTruthy();
      // Verificamos que la rama catchError llamó a handleError
      expect(handleErrorSpy).toHaveBeenCalledWith('Error obteniendo tipos de personal', jasmine.any(Error));
    });
  });


  // ============ PRUEBAS DE COBERTURA DE RAMAS (BRANCHES) ============

  describe('private#handleArrayResponse (Branch Coverage)', () => {
    it('should return array data if data is already an array', () => {
      const response = mockApiResponse(mockPersonnelArray);
      const result = (service as any).handleArrayResponse(response);
      expect(result).toEqual(mockPersonnelArray);
    });

    it('should wrap single object in an array', () => {
      const response = mockApiResponse(mockPersonnel);
      const result = (service as any).handleArrayResponse(response);
      expect(result).toEqual([mockPersonnel]);
    });
    
    it('should throw error if response.success is false', () => {
      const errorResponse = mockApiErrorResponse('Operación fallida');
      expect(() => (service as any).handleArrayResponse(errorResponse))
        .toThrowError('Operación fallida');
    });

    it('should throw error if response.data is null', () => {
      const errorResponse = { success: true, data: null };
      expect(() => (service as any).handleArrayResponse(errorResponse))
        .toThrowError('Datos no disponibles');
    });
  });

  describe('private#handleSingleResponse (Branch Coverage)', () => {
    it('should return object data if data is already an object', () => {
      const response = mockApiResponse(mockPersonnel);
      const result = (service as any).handleSingleResponse(response);
      expect(result).toEqual(mockPersonnel);
    });
    
    it('should return first item if response.data is an array', () => {
      const response = mockApiResponse(mockPersonnelArray);
      const result = (service as any).handleSingleResponse(response);
      expect(result).toEqual(mockPersonnel);
    });
    
    it('should throw error if response.data is an empty array', () => {
      const response = mockApiResponse([]);
      expect(() => (service as any).handleSingleResponse(response))
        .toThrowError('No se encontraron resultados');
    });

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
    it('should use error.error.message if available', (done) => {
      (service as any).handleError('test', { error: { message: 'Error API' } }).subscribe({
        error: (err: Error) => { expect(err.message).toBe('Error API'); done(); }
      });
    });

    it('should use error.message if error.error.message is missing', (done) => {
      (service as any).handleError('test', { message: 'Error Cliente' }).subscribe({
        error: (err: Error) => { expect(err.message).toBe('Error Cliente'); done(); }
      });
    });

    it('should use fallback message if no message is found', (done) => {
      (service as any).handleError('test', {}).subscribe({
        error: (err: Error) => { expect(err.message).toBe('Error desconocido'); done(); }
      });
    });
  });

  // ============ OPERACIONES CRUD PARA PERSONNEL ============

  describe('Personnel CRUD', () => {
    it('getAllPersonnel() should fetch and update subject', (done) => {
      mockApiService.getOb.withArgs(apiRouters.PERSONNEL.BASE).and.returnValue(of(mockApiResponse(mockPersonnelArray)));
      service.getAllPersonnel().subscribe(data => {
        expect(data).toEqual(mockPersonnelArray);
        expect(service.personnelListSubject.value).toEqual(mockPersonnelArray);
        done();
      });
    });
    
    it('getAllPersonnel() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.PERSONNEL.BASE).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getAllPersonnel().subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    it('getPersonnelById() should fetch one item', (done) => {
      mockApiService.getOb.withArgs(apiRouters.PERSONNEL.BY_ID('p1')).and.returnValue(of(mockApiResponse(mockPersonnel)));
      service.getPersonnelById('p1').subscribe(data => {
        expect(data).toEqual(mockPersonnel);
        done();
      });
    });
    
    it('getPersonnelById() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.PERSONNEL.BY_ID('p1')).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getPersonnelById('p1').subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

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
        expect(service.personnelListSubject.value).toEqual([createdPersonnel]);
        done();
      });
    });
    
    it('createPersonnel() should handle errors', (done) => {
      const newPersonnel: NewPersonnel = { ...mockPersonnel };
      delete (newPersonnel as any)._id;
      delete (newPersonnel as any).createdAt;
      delete (newPersonnel as any).updatedAt;

      mockApiService.postOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.createPersonnel(newPersonnel).subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    it('updatePersonnel() should put and update subject', (done) => {
      service.personnelListSubject.next(mockPersonnelArray); 
      const updatePayload: UpdatePersonnel = { _id: 'p1', firstName: 'Juanito' };
      const updatedPersonnel: Personnel = { ...mockPersonnel, firstName: 'Juanito' };
      
      mockApiService.putOb.and.returnValue(of(mockApiResponse(updatedPersonnel)));
      service.updatePersonnel('p1', updatePayload).subscribe(data => {
        expect(data).toEqual(updatedPersonnel);
        expect(service.personnelListSubject.value[0].firstName).toBe('Juanito');
        done();
      });
    });
    
    it('updatePersonnel() should handle errors', (done) => {
      mockApiService.putOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.updatePersonnel('p1', { _id: 'p1' }).subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    it('deletePersonnel() should delete and update subject', (done) => {
      service.personnelListSubject.next(mockPersonnelArray);
      mockApiService.deleteOb.and.returnValue(of(mockApiResponse({}))); 
      service.deletePersonnel('p1').subscribe(() => {
        expect(service.personnelListSubject.value.length).toBe(1);
        expect(service.personnelListSubject.value[0]._id).toBe('p2');
        done();
      });
    });

    it('deletePersonnel() should handle errors', (done) => {
      mockApiService.deleteOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.deletePersonnel('p1').subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });
  });

  // ============ OPERACIONES CRUD PARA PERSONNEL TYPES ============
  
  describe('PersonnelType CRUD', () => {
    it('getAllPersonnelTypes() should fetch and update subject', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BASE).and.returnValue(of(mockApiResponse(mockPersonnelTypeArray)));
      service.getAllPersonnelTypes().subscribe(data => {
        expect(data).toEqual(mockPersonnelTypeArray);
        expect(service.personnelTypesSubject.value).toEqual(mockPersonnelTypeArray);
        done();
      });
    });
    
    it('getAllPersonnelTypes() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BASE).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getAllPersonnelTypes().subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    it('getPersonnelTypeById() should fetch one item', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BY_ID('type1')).and.returnValue(of(mockApiResponse(mockPersonnelType)));
      service.getPersonnelTypeById('type1').subscribe(data => {
        expect(data).toEqual(mockPersonnelType);
        done();
      });
    });
    
    it('getPersonnelTypeById() should handle errors', (done) => {
      mockApiService.getOb.withArgs(apiRouters.TYPES.PERSONNEL.BY_ID('type1')).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.getPersonnelTypeById('type1').subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

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
        expect(service.personnelTypesSubject.value).toEqual([createdType]);
        done();
      });
    });
    
    it('createPersonnelType() should handle errors', (done) => {
      const newType: NewPersonnelType = { ...mockPersonnelType };
      delete (newType as any)._id;
      delete (newType as any).createdAt;
      delete (newType as any).updatedAt_;

      mockApiService.postOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.createPersonnelType(newType).subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    it('updatePersonnelType() should put and update subject', (done) => {
      service.personnelTypesSubject.next(mockPersonnelTypeArray);
      const updatePayload: UpdatePersonnelType = { _id: 'type1', name: 'Tipo B' };
      const updatedType: PersonnelType = { ...mockPersonnelType, name: 'Tipo B' };
      
      mockApiService.putOb.and.returnValue(of(mockApiResponse(updatedType)));
      service.updatePersonnelType('type1', updatePayload).subscribe(data => {
        expect(data).toEqual(updatedType);
        expect(service.personnelTypesSubject.value[0].name).toBe('Tipo B');
        done();
      });
    });
    
    it('updatePersonnelType() should handle errors', (done) => {
      mockApiService.putOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.updatePersonnelType('type1', { _id: 'type1' }).subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    it('deletePersonnelType() should delete and update subject', (done) => {
      service.personnelTypesSubject.next(mockPersonnelTypeArray);
      mockApiService.deleteOb.and.returnValue(of(mockApiResponse({})));
      service.deletePersonnelType('type1').subscribe(() => {
        expect(service.personnelTypesSubject.value.length).toBe(0);
        done();
      });
    });

    it('deletePersonnelType() should handle errors', (done) => {
      mockApiService.deleteOb.and.returnValue(throwError(() => ({ message: 'Error' })));
      service.deletePersonnelType('type1').subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });
  });

  // ============ MÉTODOS ADICIONALES ============

  describe('Additional Methods', () => {
    it('getPersonnelByType() should filter by an existing type', (done) => {
      service.personnelListSubject.next(mockPersonnelArray);
      service.getPersonnelByType('type2').subscribe(data => {
        expect(data.length).toBe(1);
        expect(data[0]._id).toBe('p2');
        done();
      });
    });
    
    it('getPersonnelByType() should return empty array for non-existent type', (done) => {
      service.personnelListSubject.next(mockPersonnelArray);
      service.getPersonnelByType('type-nonexistent').subscribe(data => {
        expect(data.length).toBe(0);
        done();
      });
    });

    it('searchPersonnel() should call search API', (done) => {
      const query = 'Ana';
      const searchUrl = `${apiRouters.PERSONNEL.BASE}/search?q=${query}`;
      mockApiService.getOb.withArgs(searchUrl).and.returnValue(of(mockApiResponse([mockPersonnelArray[1]])));
      service.searchPersonnel(query).subscribe(data => {
        expect(data.length).toBe(1);
        expect(data[0].firstName).toBe('Ana');
        done();
      });
    });
    
    it('searchPersonnel() should handle errors', (done) => {
      const query = 'Ana';
      const searchUrl = `${apiRouters.PERSONNEL.BASE}/search?q=${query}`;
      mockApiService.getOb.withArgs(searchUrl).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.searchPersonnel(query).subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });

    it('searchPersonnelTypes() should call search API', (done) => {
      const query = 'Tipo';
      const searchUrl = `${apiRouters.TYPES.PERSONNEL.BASE}/search?q=${query}`;
      mockApiService.getOb.withArgs(searchUrl).and.returnValue(of(mockApiResponse(mockPersonnelTypeArray)));
      service.searchPersonnelTypes(query).subscribe(data => {
        expect(data.length).toBe(1);
        expect(data[0].name).toBe('Tipo A');
        done();
      });
    });

    it('searchPersonnelTypes() should handle errors', (done) => {
      const query = 'Tipo';
      const searchUrl = `${apiRouters.TYPES.PERSONNEL.BASE}/search?q=${query}`;
      mockApiService.getOb.withArgs(searchUrl).and.returnValue(throwError(() => ({ message: 'Error' })));
      service.searchPersonnelTypes(query).subscribe({ error: (err) => { expect(err.message).toBe('Error'); done(); }});
    });
  });

});
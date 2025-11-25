// Importamos las herramientas necesarias para testing en Angular
import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';  // Módulo especial para probar HTTP sin servidor real
import { HttpErrorResponse } from '@angular/common/http';  // Para simular errores HTTP

import { ContractService, Contract } from './contract';  // Servicio e interfaz que vamos a probar
import { environment } from '../../../environments/environment';  // Variables de entorno

// Suite de pruebas para el ContractService
describe('ContractService', () => {
  let service: ContractService;  // Instancia del servicio que vamos a probar
  let httpMock: HttpTestingController;  // Controlador para simular y verificar requests HTTP

  // URLs base para las APIs que vamos a testear
  const apiUrl = `${environment.API_URL}/api/contracts`;  // Endpoint principal de contratos
  const resourceUrl = `${environment.API_URL}/api/resources`;  // Endpoint de recursos
  const providerUrl = `${environment.API_URL}/api/providers`;  // Endpoint de proveedores
  const personnelUrl = `${environment.API_URL}/api/personnel`;  // Endpoint de personal

  // CONTRATO MOCK: Creamos datos de prueba que simulan un contrato real
  // CORREGIDO: Basado en tu 'contract.ts' (startDate/endDate son string | Date)
  const mockContract: Contract = {
    _id: 'contract1',
    name: 'Test Contract',
    clientName: 'Test Client',
    clientPhone: '123456789',
    clientEmail: 'client@test.com',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
    status: 'activo',
    resources: [],
    providers: [],
    personnel: [],
  };

  // ARRAY DE CONTRATOS MOCK: Para pruebas que necesitan múltiples contratos
  const mockContractArray: Contract[] = [
    mockContract,
    { ...mockContract, _id: 'contract2', name: 'Test Contract 2' },  // Segundo contrato con ID diferente
  ];

  // Configuración que se ejecuta ANTES de cada prueba individual
  beforeEach(() => {
    // Configuramos el módulo de testing de Angular
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule], // Módulo especial para probar HTTP sin hacer requests reales
      providers: [ContractService],       // El servicio que vamos a probar
    });

    // Obtenemos las instancias del servicio y del controlador HTTP
    service = TestBed.inject(ContractService);
    httpMock = TestBed.inject(HttpTestingController);

    // MOCK DE LOCALSTORAGE: Simulamos el almacenamiento local para pruebas
    let store: { [key: string]: string } = {};  // Objeto que simula el localStorage
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      return store[key] || null;  // Devuelve el valor almacenado o null
    });
    spyOn(localStorage, 'setItem').and.callFake(
      (key: string, value: string) => {
        return (store[key] = value + '');  // Almacena el valor como string
      }
    );
    spyOn(localStorage, 'clear').and.callFake(() => {
      store = {};  // Limpia todo el almacenamiento
    });

    // Establecemos un token de prueba en localStorage
    // Esto simula que un usuario está loggeado en la aplicación
    localStorage.setItem('token', 'test-token');
  });

  // Limpieza que se ejecuta DESPUÉS de cada prueba
  afterEach(() => {
    httpMock.verify(); // Verificamos que no hayan requests HTTP pendientes sin procesar
    localStorage.clear(); // Limpiamos el localStorage mock para aislar las pruebas
  });

  // PRUEBA BÁSICA: Verificar que el servicio se crea correctamente
  it('should be created', () => {
    expect(service).toBeTruthy();  // Verifica que el servicio se instanció sin errores
  });

  // ==========================================
  // PRUEBAS DE MÉTODOS PRIVADOS
  // ==========================================
  describe('private#getHeaders', () => {
    // Prueba: Los headers deben incluir Authorization con el token
    it('should return headers with Authorization', () => {
      const headers = service['getHeaders'](); // Accedemos al método privado usando notación de array
      expect(headers.has('Authorization')).toBeTrue();  // Verifica que el header Authorization existe
    });

    // Prueba: Debe lanzar error si no hay token en localStorage
    it('should throw error if no token is found', () => {
      localStorage.clear(); // Limpiamos el token para simular usuario no autenticado
      expect(() => service['getHeaders']()).toThrowError(
        'No token found in localStorage'  // Verifica que lanza el error esperado
      );
    });
  });

  // ==========================================
  // PRUEBAS DE MÉTODOS CRUD (Create, Read, Update, Delete)
  // ==========================================

  // PRUEBA: Obtener todos los contratos
  it('getContracts() should fetch contracts and map the response', (done) => {
    const mockResponse = { success: true, data: mockContractArray };
    
    // Suscribimos al método y verificamos el resultado
    service.getContracts().subscribe((contracts) => {
      expect(contracts).toEqual(mockContractArray);  // Verifica que recibimos los contratos mock
      done(); // Indicamos que la prueba async finalizó
    });
    
    // Verificamos que se hizo un request GET a la URL correcta
    const req = httpMock.expectOne(apiUrl);
    // Simulamos una respuesta exitosa del servidor con los datos mock
    req.flush(mockResponse);
  });

  // PRUEBA: Obtener un contrato específico por ID
  it('getContract(id) should fetch a single contract', (done) => {
    const contractId = 'contract1';
    
    service.getContract(contractId).subscribe((contract) => {
      expect(contract).toEqual(mockContract);  // Verifica que recibimos el contrato específico
      done();
    });
    
    // Verificamos que se llamó a la URL específica del contrato
    const req = httpMock.expectOne(`${apiUrl}/${contractId}`);
    req.flush(mockContract);  // Simulamos respuesta con el contrato mock
  });

  // PRUEBA: Manejo de errores al obtener un contrato
  it('getContract(id) should handle errors', (done) => {
    const contractId = 'contract1';
    const mockError = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
    
    service.getContract(contractId).subscribe({
      error: (error: Error) => {
        expect(error.message).toContain('Error en ContractService');  // Verifica el mensaje de error
        done();
      },
    });
    
    const req = httpMock.expectOne(`${apiUrl}/${contractId}`);
    // Simulamos un error del servidor (404 Not Found)
    req.flush(null, mockError);
  });

  // PRUEBA: Buscar contratos por nombre
  it('searchContractsByName(name) should fetch contracts and map response', (done) => {
    const name = 'Test';
    const mockResponse = { success: true, data: mockContractArray };
    
    service.searchContractsByName(name).subscribe((contracts) => {
      expect(contracts).toEqual(mockContractArray);  // Verifica que recibimos los contratos filtrados
      done();
    });
    
    // Verificamos que se llamó a la URL de búsqueda con parámetros
    const req = httpMock.expectOne(
      `${apiUrl}/search?name=${encodeURIComponent(name)}`  // URL con parámetro de búsqueda codificado
    );
    req.flush(mockResponse);
  });

  // PRUEBA: Crear un nuevo contrato
  it('createContract(contract) should POST a new contract', (done) => {
    service.createContract(mockContract).subscribe((contract) => {
      expect(contract).toEqual(mockContract);  // Verifica que recibimos el contrato creado
      done();
    });
    
    const req = httpMock.expectOne(apiUrl);
    // Verificamos que sea un método POST (para crear recursos)
    expect(req.request.method).toBe('POST');
    req.flush(mockContract);  // Simulamos respuesta exitosa
  });

  // PRUEBA: Manejo de errores al crear contrato
  it('createContract(contract) should handle errors using its specific catchError', (done) => {
    const mockErrorStatus = { status: 500, statusText: 'Server Error' };
    const consoleErrorSpy = spyOn(console, 'error');  // Espiamos console.error
    
    service.createContract(mockContract).subscribe({
      error: (err: HttpErrorResponse) => { 
        // Verificamos que se registró el error en consola
        expect(consoleErrorSpy).toHaveBeenCalledWith('ContractService error:', err);
        done();
      },
    });
    
    const req = httpMock.expectOne(apiUrl);
    req.flush(null, mockErrorStatus);  // Simulamos error del servidor
  });

  // PRUEBA: Actualizar un contrato existente
  it('updateContract(id, contract) should PUT and map the response', (done) => {
    const contractId = 'contract1';
    const updatedContract = { ...mockContract, name: 'Updated Name' };  // Contrato con cambios
    const mockResponse = { success: true, data: updatedContract };
    
    service.updateContract(contractId, updatedContract).subscribe((contract) => {
      expect(contract).toEqual(updatedContract);  // Verifica que recibimos el contrato actualizado
      done();
    });
    
    const req = httpMock.expectOne(`${apiUrl}/${contractId}`);
    // Verificamos que sea un método PUT (para actualizar recursos)
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  // PRUEBA: Manejo de errores al actualizar contrato
  it('updateContract(id, contract) should handle errors', (done) => {
    const contractId = 'contract1';
    const mockError = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
    
    service.updateContract(contractId, mockContract).subscribe({
      error: (error: Error) => {
        expect(error.message).toContain('Error en ContractService');  // Verifica mensaje de error
        done();
      },
    });
    
    const req = httpMock.expectOne(`${apiUrl}/${contractId}`);
    req.flush(null, mockError);  // Simulamos error del servidor
  });

  // PRUEBA: Eliminar un contrato
  it('deleteContract(id) should DELETE a contract', (done) => {
    const contractId = 'contract1';
    
    service.deleteContract(contractId).subscribe((response) => {
      expect(response).toBeNull(); // DELETE exitoso normalmente no retorna contenido (204 No Content)
      done();
    });
    
    const req = httpMock.expectOne(`${apiUrl}/${contractId}`);
    // Verificamos que sea un método DELETE
    expect(req.request.method).toBe('DELETE');
    // Simulamos respuesta 204 No Content (eliminación exitosa sin cuerpo)
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  // PRUEBA: Manejo de errores al eliminar contrato
  it('deleteContract(id) should handle errors', (done) => {
    const contractId = 'contract1';
    const mockError = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
    
    service.deleteContract(contractId).subscribe({
      error: (error: Error) => {
        expect(error.message).toContain('Error en ContractService');
        done();
      },
    });
    
    const req = httpMock.expectOne(`${apiUrl}/${contractId}`);
    req.flush(null, mockError);
  });

  // ==========================================
  // PRUEBAS DE MÉTODOS ADICIONALES
  // ==========================================

  // PRUEBA: Obtener el último contrato
  it('getLastContract() should fetch the last contract', (done) => {
    service.getLastContract().subscribe((contract) => {
      expect(contract).toEqual(mockContract);  // Verifica que recibimos el último contrato
      done();
    });
    
    const req = httpMock.expectOne(`${apiUrl}/last`);  // Endpoint específico para último contrato
    req.flush(mockContract);
  });

  // PRUEBAS: Contar contratos por estado
  describe('getCountByStatus()', () => {
    // Prueba: Valores por defecto cuando faltan propiedades
    it('should use defaults (|| 0) if properties are missing', (done) => {
      const mockApiData = { borrador: 5, activo: 10 };  // Faltan 'completado' y 'cancelado'
      const mockResponse = { success: true, data: mockApiData };
      // Esperamos que los estados faltantes tengan valor 0 (por defecto)
      const expectedData = { borrador: 5, activo: 10, completado: 0, cancelado: 0 };
      
      service.getCountByStatus().subscribe((counts) => {
        expect(counts).toEqual(expectedData);
        done();
      });
      
      const req = httpMock.expectOne(`${apiUrl}/count-by-status`);
      req.flush(mockResponse);
    });

    // Prueba: Todos los valores por defecto cuando no hay datos
    it('should use defaults (|| 0) if all properties are missing', (done) => {
      const mockApiData = {};  // Objeto vacío - ningún estado tiene conteo
      const mockResponse = { success: true, data: mockApiData };
      const expectedData = { borrador: 0, activo: 0, completado: 0, cancelado: 0 };
      
      service.getCountByStatus().subscribe((counts) => {
        expect(counts).toEqual(expectedData);
        done();
      });
      
      const req = httpMock.expectOne(`${apiUrl}/count-by-status`);
      req.flush(mockResponse);
    });

    // Prueba: Datos completos cuando el backend devuelve todos los estados
    it('should fetch counts and map response (with all properties)', (done) => {
      const mockApiData = { borrador: 5, activo: 10, completado: 2, cancelado: 1 };
      const mockResponse = { success: true, data: mockApiData };
      const expectedData = { borrador: 5, activo: 10, completado: 2, cancelado: 1 };
      
      service.getCountByStatus().subscribe((counts) => {
        expect(counts).toEqual(expectedData);
        done();
      });
      
      const req = httpMock.expectOne(`${apiUrl}/count-by-status`);
      req.flush(mockResponse);
    });
  });

  // PRUEBA: Obtener contratos paginados con parámetros explícitos
  it('getContractsPaginated() should fetch paginated data with explicit params', (done) => {
    const mockPaginatedResponse = { data: mockContractArray, total: 2, page: 1, pages: 1 };
    
    service.getContractsPaginated(1, 2).subscribe((response) => {
      expect(response).toEqual(mockPaginatedResponse);  // Verifica respuesta paginada completa
      done();
    });
    
    // Verifica que se usan los parámetros explícitos 1 y 2 (página 1, límite 2)
    const req = httpMock.expectOne(`${apiUrl}?page=1&limit=2`);
    req.flush(mockPaginatedResponse);
  });

  // =======================================================
  // PRUEBA AÑADIDA (Cubre las 2 Ramas Faltantes)
  // =======================================================
  it('getContractsPaginated() should fetch paginated data with default params', (done) => {
    const mockPaginatedResponse = { data: mockContractArray, total: 2, page: 1, pages: 1 };
    
    // Llamamos sin parámetros para probar los valores por defecto
    service.getContractsPaginated().subscribe((response) => {
      expect(response).toEqual(mockPaginatedResponse);
      done();
    });
    
    // Verifica que se usan los parámetros por DEFECTO (page=1, limit=2)
    const req = httpMock.expectOne(`${apiUrl}?page=1&limit=2`);
    req.flush(mockPaginatedResponse);
  });

  // PRUEBA: Generar reporte de contrato
  it('generateReport(id) should fetch a report', (done) => {
    const mockReport = { html: '<h1>Reporte</h1>' };  // Reporte HTML mock
    const contractId = 'contract1';
    
    service.generateReport(contractId).subscribe((report) => {
      expect(report).toEqual(mockReport);  // Verifica que recibimos el reporte
      done();
    });
    
    const req = httpMock.expectOne(`${apiUrl}/${contractId}/report`);  // Endpoint de reporte
    req.flush(mockReport);
  });

  // ==========================================
  // PRUEBAS DE MÉTODOS DE SUB-RECURSOS (con filtro)
  // ==========================================

  // PRUEBAS: Recursos filtrados por estado
  it('getResourcesByStatus() should filter by default status "disponible"', (done) => {
    const mockResources = [{ _id: 'r1', status: 'disponible' }, { _id: 'r2', status: 'en uso' }];
    const mockResponse = { success: true, data: mockResources };
    // Esperamos solo los recursos con estado "disponible" (filtro por defecto)
    const expectedFiltered = [{ _id: 'r1', status: 'disponible' }];
    
    service.getResourcesByStatus().subscribe((resources) => {
      expect(resources).toEqual(expectedFiltered);
      done();
    });
    
    const req = httpMock.expectOne(resourceUrl);
    req.flush(mockResponse);
  });

  it('getResourcesByStatus() should filter by a non-default status', (done) => {
    const mockResources = [{ _id: 'r1', status: 'disponible' }, { _id: 'r2', status: 'en uso' }];
    const mockResponse = { success: true, data: mockResources };
    // Filtramos por estado "en uso" específicamente
    const expectedFiltered = [{ _id: 'r2', status: 'en uso' }];
    
    service.getResourcesByStatus('en uso').subscribe((resources) => {
      expect(resources).toEqual(expectedFiltered);
      done();
    });
    
    const req = httpMock.expectOne(resourceUrl);
    req.flush(mockResponse);
  });

  // PRUEBAS: Proveedores filtrados por estado
  it('getProvidersByStatus() should filter by default status "activo"', (done) => {
    const mockProviders = [{ _id: 'p1', status: 'activo' }, { _id: 'p2', status: 'inactivo' }];
    const mockResponse = { success: true, data: mockProviders };
    const expectedFiltered = [{ _id: 'p1', status: 'activo' }];  // Solo proveedores activos
    
    service.getProvidersByStatus().subscribe((providers) => {
      expect(providers).toEqual(expectedFiltered);
      done();
    });
    
    const req = httpMock.expectOne(providerUrl);
    req.flush(mockResponse);
  });

  it('getProvidersByStatus() should filter by a non-default status', (done) => {
    const mockProviders = [{ _id: 'p1', status: 'activo' }, { _id: 'p2', status: 'inactivo' }];
    const mockResponse = { success: true, data: mockProviders };
    const expectedFiltered = [{ _id: 'p2', status: 'inactivo' }];  // Solo proveedores inactivos
    
    service.getProvidersByStatus('inactivo').subscribe((providers) => {
      expect(providers).toEqual(expectedFiltered);
      done();
    });
    
    const req = httpMock.expectOne(providerUrl);
    req.flush(mockResponse);
  });

  // PRUEBAS: Personal filtrado por estado
  it('getPersonnelByStatus() should filter by default status "disponible"', (done) => {
    const mockPersonnel = [{ _id: 'ps1', status: 'disponible' }, { _id: 'ps2', status: 'asignado' }];
    const mockResponse = { success: true, data: mockPersonnel };
    const expectedFiltered = [{ _id: 'ps1', status: 'disponible' }];  // Solo personal disponible
    
    service.getPersonnelByStatus().subscribe((personnel) => {
      expect(personnel).toEqual(expectedFiltered);
      done();
    });
    
    const req = httpMock.expectOne(personnelUrl);
    req.flush(mockResponse);
  });

  it('getPersonnelByStatus() should filter by a non-default status', (done) => {
    const mockPersonnel = [{ _id: 'ps1', status: 'disponible' }, { _id: 'ps2', status: 'asignado' }];
    const mockResponse = { success: true, data: mockPersonnel };
    const expectedFiltered = [{ _id: 'ps2', status: 'asignado' }];  // Solo personal asignado
    
    service.getPersonnelByStatus('asignado').subscribe((personnel) => {
      expect(personnel).toEqual(expectedFiltered);
      done();
    });
    
    const req = httpMock.expectOne(personnelUrl);
    req.flush(mockResponse);
  });

  // ==========================================
  // PRUEBAS DE MANEJO DE ERRORES (handleError)
  // ==========================================
  describe('private#handleError', () => {
    // Prueba: Usar mensaje específico del backend si está disponible
    it('should use error.error.message if available', (done) => {
      const mockErrorMessage = 'Error de servidor específico';
      const mockError = new HttpErrorResponse({ 
        status: 500, 
        error: { message: mockErrorMessage }  // Error con mensaje específico
      });
      
      service.getContracts().subscribe({
        error: (error: Error) => {
          expect(error.message).toBe(mockErrorMessage);  // Debe usar el mensaje específico
          done();
        },
      });
      
      const req = httpMock.expectOne(apiUrl);
      req.flush({ message: mockErrorMessage }, mockError);
    });

    // Prueba: Usar mensaje por defecto si error.error.message no existe
    it('should use fallback message if error.error.message is missing', (done) => {
      const fallbackMessage = 'Error en ContractService; inténtalo más tarde.';
      const mockError = new HttpErrorResponse({ 
        status: 500, 
        error: { details: 'Otro' }  // Error sin propiedad 'message'
      });
      
      service.getContracts().subscribe({
        error: (error: Error) => {
          expect(error.message).toBe(fallbackMessage);  // Debe usar mensaje por defecto
          done();
        },
      });
      
      const req = httpMock.expectOne(apiUrl);
      req.flush({ details: 'Otro' }, mockError);
    });

    // Prueba: Usar mensaje por defecto si error.error no existe
    it('should use fallback message if error.error is missing', (done) => {
      const fallbackMessage = 'Error en ContractService; inténtalo más tarde.';
      const mockError = new HttpErrorResponse({ status: 404 });  // Error sin cuerpo
      
      service.getContracts().subscribe({
        error: (error: Error) => {
          expect(error.message).toBe(fallbackMessage);  // Debe usar mensaje por defecto
          done();
        },
      });
      
      const req = httpMock.expectOne(apiUrl);
      req.flush(null, mockError);  // Error sin cuerpo de respuesta
    });
  });
});
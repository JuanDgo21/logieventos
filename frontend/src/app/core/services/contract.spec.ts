import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';

import { ContractService, Contract } from './contract';
import { environment } from '../../../environments/environment';

describe('ContractService', () => {
  let service: ContractService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.API_URL}/api/contracts`;
  const resourceUrl = `${environment.API_URL}/api/resources`;
  const providerUrl = `${environment.API_URL}/api/providers`;
  const personnelUrl = `${environment.API_URL}/api/personnel`;

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

  const mockContractArray: Contract[] = [
    mockContract,
    { ...mockContract, _id: 'contract2', name: 'Test Contract 2' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ContractService],
    });

    service = TestBed.inject(ContractService);
    httpMock = TestBed.inject(HttpTestingController);

    let store: { [key: string]: string } = {};
    spyOn(localStorage, 'getItem').and.callFake((key: string) => {
      return store[key] || null;
    });
    spyOn(localStorage, 'setItem').and.callFake(
      (key: string, value: string) => {
        return (store[key] = value + '');
      }
    );
    spyOn(localStorage, 'clear').and.callFake(() => {
      store = {};
    });

    localStorage.setItem('token', 'test-token');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- Pruebas de Métodos Privados ---

  describe('private#getHeaders', () => {
    it('should return headers with Authorization', () => {
      const headers = service['getHeaders']();
      expect(headers.has('Authorization')).toBeTrue();
    });

    it('should throw error if no token is found', () => {
      localStorage.clear();
      expect(() => service['getHeaders']()).toThrowError(
        'No token found in localStorage'
      );
    });
  });

  // --- Pruebas de Métodos CRUD ---

  it('getContracts() should fetch contracts and map the response', (done) => {
    const mockResponse = { success: true, data: mockContractArray };
    service.getContracts().subscribe((contracts) => {
      expect(contracts).toEqual(mockContractArray);
      done();
    });
    const req = httpMock.expectOne(apiUrl);
    req.flush(mockResponse);
  });

  it('getContract(id) should fetch a single contract', (done) => {
    const contractId = 'contract1';
    service.getContract(contractId).subscribe((contract) => {
      expect(contract).toEqual(mockContract);
      done();
    });
    const req = httpMock.expectOne(`${apiUrl}/${contractId}`);
    req.flush(mockContract);
  });

  it('getContract(id) should handle errors', (done) => {
    const contractId = 'contract1';
    const mockError = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
    service.getContract(contractId).subscribe({
      error: (error: Error) => {
        expect(error.message).toContain('Error en ContractService');
        done();
      },
    });
    const req = httpMock.expectOne(`${apiUrl}/${contractId}`);
    req.flush(null, mockError);
  });

  it('searchContractsByName(name) should fetch contracts and map response', (done) => {
    const name = 'Test';
    const mockResponse = { success: true, data: mockContractArray };
    service.searchContractsByName(name).subscribe((contracts) => {
      expect(contracts).toEqual(mockContractArray);
      done();
    });
    const req = httpMock.expectOne(
      `${apiUrl}/search?name=${encodeURIComponent(name)}`
    );
    req.flush(mockResponse);
  });

  it('createContract(contract) should POST a new contract', (done) => {
    service.createContract(mockContract).subscribe((contract) => {
      expect(contract).toEqual(mockContract);
      done();
    });
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush(mockContract);
  });

  it('createContract(contract) should handle errors using its specific catchError', (done) => {
    const mockErrorStatus = { status: 500, statusText: 'Server Error' };
    const consoleErrorSpy = spyOn(console, 'error');
    service.createContract(mockContract).subscribe({
      error: (err: HttpErrorResponse) => { 
        expect(consoleErrorSpy).toHaveBeenCalledWith('ContractService error:', err);
        done();
      },
    });
    const req = httpMock.expectOne(apiUrl);
    req.flush(null, mockErrorStatus);
  });


  it('updateContract(id, contract) should PUT and map the response', (done) => {
    const contractId = 'contract1';
    const updatedContract = { ...mockContract, name: 'Updated Name' };
    const mockResponse = { success: true, data: updatedContract };
    service.updateContract(contractId, updatedContract).subscribe((contract) => {
      expect(contract).toEqual(updatedContract);
      done();
    });
    const req = httpMock.expectOne(`${apiUrl}/${contractId}`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockResponse);
  });

  it('updateContract(id, contract) should handle errors', (done) => {
    const contractId = 'contract1';
    const mockError = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
    service.updateContract(contractId, mockContract).subscribe({
      error: (error: Error) => {
        expect(error.message).toContain('Error en ContractService');
        done();
      },
    });
    const req = httpMock.expectOne(`${apiUrl}/${contractId}`);
    req.flush(null, mockError);
  });

  it('deleteContract(id) should DELETE a contract', (done) => {
    const contractId = 'contract1';
    service.deleteContract(contractId).subscribe((response) => {
      expect(response).toBeNull();
      done();
    });
    const req = httpMock.expectOne(`${apiUrl}/${contractId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

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


  // --- Pruebas de Métodos Adicionales ---

  it('getLastContract() should fetch the last contract', (done) => {
    service.getLastContract().subscribe((contract) => {
      expect(contract).toEqual(mockContract);
      done();
    });
    const req = httpMock.expectOne(`${apiUrl}/last`);
    req.flush(mockContract);
  });

  describe('getCountByStatus()', () => {
    it('should use defaults (|| 0) if properties are missing', (done) => {
      const mockApiData = { borrador: 5, activo: 10 };
      const mockResponse = { success: true, data: mockApiData };
      const expectedData = { borrador: 5, activo: 10, completado: 0, cancelado: 0 };
      service.getCountByStatus().subscribe((counts) => {
        expect(counts).toEqual(expectedData);
        done();
      });
      const req = httpMock.expectOne(`${apiUrl}/count-by-status`);
      req.flush(mockResponse);
    });

    it('should use defaults (|| 0) if all properties are missing', (done) => {
      const mockApiData = {};
      const mockResponse = { success: true, data: mockApiData };
      const expectedData = { borrador: 0, activo: 0, completado: 0, cancelado: 0 };
      service.getCountByStatus().subscribe((counts) => {
        expect(counts).toEqual(expectedData);
        done();
      });
      const req = httpMock.expectOne(`${apiUrl}/count-by-status`);
      req.flush(mockResponse);
    });

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

  it('getContractsPaginated() should fetch paginated data with explicit params', (done) => {
    const mockPaginatedResponse = { data: mockContractArray, total: 2, page: 1, pages: 1 };
    service.getContractsPaginated(1, 2).subscribe((response) => {
      expect(response).toEqual(mockPaginatedResponse);
      done();
    });
    // Verifica que se usan los parámetros 1 y 2
    const req = httpMock.expectOne(`${apiUrl}?page=1&limit=2`);
    req.flush(mockPaginatedResponse);
  });

  // =======================================================
  // PRUEBA AÑADIDA (Cubre las 2 Ramas Faltantes)
  // =======================================================
  it('getContractsPaginated() should fetch paginated data with default params', (done) => {
    const mockPaginatedResponse = { data: mockContractArray, total: 2, page: 1, pages: 1 };
    
    // Llamamos sin parámetros
    service.getContractsPaginated().subscribe((response) => {
      expect(response).toEqual(mockPaginatedResponse);
      done();
    });
    
    // Verifica que se usan los parámetros por DEFECTO (page=1, limit=2)
    const req = httpMock.expectOne(`${apiUrl}?page=1&limit=2`);
    req.flush(mockPaginatedResponse);
  });

  it('generateReport(id) should fetch a report', (done) => {
    const mockReport = { html: '<h1>Reporte</h1>' };
    const contractId = 'contract1';
    service.generateReport(contractId).subscribe((report) => {
      expect(report).toEqual(mockReport);
      done();
    });
    const req = httpMock.expectOne(`${apiUrl}/${contractId}/report`);
    req.flush(mockReport);
  });

  // --- Pruebas de Métodos de Sub-recursos (con filtro) ---

  it('getResourcesByStatus() should filter by default status "disponible"', (done) => {
    const mockResources = [{ _id: 'r1', status: 'disponible' }, { _id: 'r2', status: 'en uso' }];
    const mockResponse = { success: true, data: mockResources };
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
    const expectedFiltered = [{ _id: 'r2', status: 'en uso' }];
    service.getResourcesByStatus('en uso').subscribe((resources) => {
      expect(resources).toEqual(expectedFiltered);
      done();
    });
    const req = httpMock.expectOne(resourceUrl);
    req.flush(mockResponse);
  });

  it('getProvidersByStatus() should filter by default status "activo"', (done) => {
    const mockProviders = [{ _id: 'p1', status: 'activo' }, { _id: 'p2', status: 'inactivo' }];
    const mockResponse = { success: true, data: mockProviders };
    const expectedFiltered = [{ _id: 'p1', status: 'activo' }];
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
    const expectedFiltered = [{ _id: 'p2', status: 'inactivo' }];
    service.getProvidersByStatus('inactivo').subscribe((providers) => {
      expect(providers).toEqual(expectedFiltered);
      done();
    });
    const req = httpMock.expectOne(providerUrl);
    req.flush(mockResponse);
  });

  it('getPersonnelByStatus() should filter by default status "disponible"', (done) => {
    const mockPersonnel = [{ _id: 'ps1', status: 'disponible' }, { _id: 'ps2', status: 'asignado' }];
    const mockResponse = { success: true, data: mockPersonnel };
    const expectedFiltered = [{ _id: 'ps1', status: 'disponible' }];
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
    const expectedFiltered = [{ _id: 'ps2', status: 'asignado' }];
    service.getPersonnelByStatus('asignado').subscribe((personnel) => {
      expect(personnel).toEqual(expectedFiltered);
      done();
    });
    const req = httpMock.expectOne(personnelUrl);
    req.flush(mockResponse);
  });

  // --- Prueba de Manejo de Errores (handleError) ---

  describe('private#handleError', () => {
    it('should use error.error.message if available', (done) => {
      const mockErrorMessage = 'Error de servidor específico';
      const mockError = new HttpErrorResponse({ status: 500, error: { message: mockErrorMessage } });
      service.getContracts().subscribe({
        error: (error: Error) => {
          expect(error.message).toBe(mockErrorMessage);
          done();
        },
      });
      const req = httpMock.expectOne(apiUrl);
      req.flush({ message: mockErrorMessage }, mockError);
    });

    it('should use fallback message if error.error.message is missing', (done) => {
      const fallbackMessage = 'Error en ContractService; inténtalo más tarde.';
      const mockError = new HttpErrorResponse({ status: 500, error: { details: 'Otro' } });
      service.getContracts().subscribe({
        error: (error: Error) => {
          expect(error.message).toBe(fallbackMessage);
          done();
        },
      });
      const req = httpMock.expectOne(apiUrl);
      req.flush({ details: 'Otro' }, mockError);
    });

    it('should use fallback message if error.error is missing', (done) => {
      const fallbackMessage = 'Error en ContractService; inténtalo más tarde.';
      const mockError = new HttpErrorResponse({ status: 404 });
      service.getContracts().subscribe({
        error: (error: Error) => {
          expect(error.message).toBe(fallbackMessage);
          done();
        },
      });
      const req = httpMock.expectOne(apiUrl);
      req.flush(null, mockError);
    });
  });
});
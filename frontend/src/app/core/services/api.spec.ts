import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';

import { ApiService } from './api';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  // Configuración inicial antes de cada prueba
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('debería crearse el servicio', () => {
    expect(service).toBeTruthy();
  });

  it('debería tener la URL base correcta', () => {
    expect(service.urlBase).toBe(environment.API_URL);
  });

  it('debería inyectar HttpClient correctamente en el constructor', () => {
    expect(service['http']).toBeTruthy();
  });

  describe('getHeaders()', () => {
    it('debería generar headers con token cuando existe en localStorage', () => {
      const mockToken = 'mock-jwt-token';
      localStorage.setItem('token', mockToken);

      const headers = service['getHeaders']();

      expect(headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('debería generar headers sin token cuando no existe en localStorage', () => {
      localStorage.removeItem('token');

      const headers = service['getHeaders']();

      expect(headers.get('Authorization')).toBe('Bearer null');
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    it('debería generar headers con token vacío cuando localStorage.getItem retorna null', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);

      const headers = service['getHeaders']();

      expect(headers.get('Authorization')).toBe('Bearer null');
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('getPr()', () => {
    it('debería hacer una solicitud GET y retornar una Promise con datos exitosos', async () => {
      const mockRoute = '/test';
      const mockResponse = { data: 'test data' };

      const promise = service.getPr(mockRoute);

      const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(mockResponse);
    });

    it('debería rechazar la Promise cuando hay error HTTP en GET', async () => {
      const mockRoute = '/test';
      const mockError = { status: 404, statusText: 'Not Found' };

      try {
        const promise = service.getPr(mockRoute);
        
        const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
        req.flush('Error', mockError);
        
        await promise;
        fail('Debería haber lanzado un error');
      } catch (error: unknown) {
        // Verificación segura del tipo unknown
        if (error instanceof HttpErrorResponse) {
          expect(error.status).toBe(404);
        } else {
          // Si no es HttpErrorResponse, igualmente debería ser truthy
          expect(error).toBeTruthy();
        }
      }
    });

    it('debería rechazar la Promise cuando hay error de red en GET', async () => {
      const mockRoute = '/test';

      try {
        const promise = service.getPr(mockRoute);
        
        const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
        req.error(new ErrorEvent('Network error'));
        
        await promise;
        fail('Debería haber lanzado un error');
      } catch (error: unknown) {
        // Verificación segura del tipo unknown
        expect(error).toBeTruthy();
        if (error instanceof HttpErrorResponse) {
          expect(error.error).toBeInstanceOf(ErrorEvent);
        }
      }
    });
  });

  describe('getOb()', () => {
    it('debería hacer una solicitud GET y retornar un Observable exitoso', () => {
      const mockRoute = '/test';
      const mockResponse = { data: 'test data' };

      service.getOb(mockRoute).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('debería manejar errores en GET con Observable', () => {
      const mockRoute = '/test';

      service.getOb(mockRoute).subscribe({
        next: () => fail('Debería haber fallado'),
        error: (error: unknown) => {
          // Verificación segura del tipo unknown
          expect(error).toBeTruthy();
          if (error instanceof HttpErrorResponse) {
            expect(error.status).toBe(500);
          }
        }
      });

      const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('postPr()', () => {
    it('debería hacer una solicitud POST y retornar una Promise exitosa', async () => {
      const mockRoute = '/test';
      const mockData = { name: 'test' };
      const mockResponse = { id: 1, name: 'test' };

      const promise = service.postPr(mockRoute, mockData);

      const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockData);
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(mockResponse);
    });

    it('debería rechazar la Promise cuando hay error en POST', async () => {
      const mockRoute = '/test';
      const mockData = { name: 'test' };

      try {
        const promise = service.postPr(mockRoute, mockData);
        
        const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
        req.flush('Error', { status: 400, statusText: 'Bad Request' });
        
        await promise;
        fail('Debería haber lanzado un error');
      } catch (error: unknown) {
        // Verificación segura del tipo unknown
        expect(error).toBeTruthy();
      }
    });
  });

  describe('postOb()', () => {
    it('debería hacer una solicitud POST y retornar un Observable exitoso', () => {
      const mockRoute = '/test';
      const mockData = { name: 'test' };
      const mockResponse = { id: 1, name: 'test' };

      service.postOb(mockRoute, mockData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('debería manejar errores en POST con Observable', () => {
      const mockRoute = '/test';
      const mockData = { name: 'test' };

      service.postOb(mockRoute, mockData).subscribe({
        next: () => fail('Debería haber fallado'),
        error: (error: unknown) => {
          // Verificación segura del tipo unknown
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
      req.flush('Error', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('putPr()', () => {
    it('debería hacer una solicitud PUT y retornar una Promise exitosa', async () => {
      const mockRoute = '/test/1';
      const mockData = { name: 'updated' };
      const mockResponse = { id: 1, name: 'updated' };

      const promise = service.putPr(mockRoute, mockData);

      const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockData);
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(mockResponse);
    });

    it('debería rechazar la Promise cuando hay error en PUT', async () => {
      const mockRoute = '/test/1';
      const mockData = { name: 'updated' };

      try {
        const promise = service.putPr(mockRoute, mockData);
        
        const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
        req.flush('Error', { status: 404, statusText: 'Not Found' });
        
        await promise;
        fail('Debería haber lanzado un error');
      } catch (error: unknown) {
        // Verificación segura del tipo unknown
        expect(error).toBeTruthy();
      }
    });
  });

  describe('putOb()', () => {
    it('debería hacer una solicitud PUT y retornar un Observable exitoso', () => {
      const mockRoute = '/test/1';
      const mockData = { name: 'updated' };
      const mockResponse = { id: 1, name: 'updated' };

      service.putOb(mockRoute, mockData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });

  describe('deletePr()', () => {
    it('debería hacer una solicitud DELETE y retornar una Promise exitosa', async () => {
      const mockRoute = '/test/1';
      const mockResponse = { message: 'deleted' };

      const promise = service.deletePr(mockRoute);

      const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(mockResponse);
    });

    it('debería rechazar la Promise cuando hay error en DELETE', async () => {
      const mockRoute = '/test/1';

      try {
        const promise = service.deletePr(mockRoute);
        
        const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
        req.flush('Error', { status: 500, statusText: 'Server Error' });
        
        await promise;
        fail('Debería haber lanzado un error');
      } catch (error: unknown) {
        // Verificación segura del tipo unknown
        expect(error).toBeTruthy();
      }
    });
  });

  describe('deleteOb()', () => {
    it('debería hacer una solicitud DELETE y retornar un Observable exitoso', () => {
      const mockRoute = '/test/1';
      const mockResponse = { message: 'deleted' };

      service.deleteOb(mockRoute).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });

  describe('patchPr()', () => {
    it('debería hacer una solicitud PATCH y retornar una Promise exitosa', async () => {
      const mockRoute = '/test/1';
      const mockData = { name: 'patched' };
      const mockResponse = { id: 1, name: 'patched' };

      const promise = service.patchPr(mockRoute, mockData);

      const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(mockData);
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(mockResponse);
    });

    it('debería rechazar la Promise cuando hay error en PATCH', async () => {
      const mockRoute = '/test/1';
      const mockData = { name: 'patched' };

      try {
        const promise = service.patchPr(mockRoute, mockData);
        
        const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
        req.flush('Error', { status: 400, statusText: 'Bad Request' });
        
        await promise;
        fail('Debería haber lanzado un error');
      } catch (error: unknown) {
        // Verificación segura del tipo unknown
        expect(error).toBeTruthy();
      }
    });
  });

  describe('patchOb()', () => {
    it('debería hacer una solicitud PATCH y retornar un Observable exitoso', () => {
      const mockRoute = '/test/1';
      const mockData = { name: 'patched' };
      const mockResponse = { id: 1, name: 'patched' };

      service.patchOb(mockRoute, mockData).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
      expect(req.request.method).toBe('PATCH');
      req.flush(mockResponse);
    });

    it('debería manejar errores en PATCH con Observable', () => {
      const mockRoute = '/test/1';
      const mockData = { name: 'patched' };

      service.patchOb(mockRoute, mockData).subscribe({
        next: () => fail('Debería haber fallado'),
        error: (error: unknown) => {
          // Verificación segura del tipo unknown
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
      req.flush('Error', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('Construcción de URLs', () => {
    it('debería construir URLs correctamente concatenando urlBase y ruta', () => {
      const testCases = [
        { route: '/users', expected: `${environment.API_URL}/users` },
        { route: '/events/1', expected: `${environment.API_URL}/events/1` },
        { route: '', expected: `${environment.API_URL}` }
      ];

      testCases.forEach(testCase => {
        service.getOb(testCase.route).subscribe();
        const req = httpMock.expectOne(testCase.expected);
        expect(req.request.url).toBe(testCase.expected);
        req.flush({});
      });
    });
  });
});
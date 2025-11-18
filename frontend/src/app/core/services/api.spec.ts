import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';

import { ApiService } from './api';
import { environment } from '../../../environments/environment';

// Suite de pruebas para el servicio ApiService
// Este servicio maneja todas las llamadas HTTP a la API
describe('ApiService', () => {
  let service: ApiService; // Instancia del servicio que vamos a probar
  let httpMock: HttpTestingController; // Controlador para simular y verificar peticiones HTTP
  let httpClient: HttpClient; // Cliente HTTP real (aunque usamos el mock para pruebas)

  // Configuración inicial antes de cada prueba
  // beforeEach se ejecuta antes de cada test para tener un entorno limpio
  beforeEach(() => {
    // Configuramos el módulo de testing de Angular
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule], // Importamos el módulo que simula HTTP
      providers: [ApiService] // Proveemos el servicio real que queremos probar
    });

    // Obtenemos las instancias de los servicios
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController); // Para controlar las peticiones HTTP simuladas
    httpClient = TestBed.inject(HttpClient); // Cliente HTTP (aunque no se usa directamente en las pruebas)
  });

  // afterEach se ejecuta DESPUÉS de cada prueba
  // Sirve para limpiar y verificar que no hay peticiones HTTP pendientes
  afterEach(() => {
    httpMock.verify(); // Verifica que no hay peticiones HTTP pendientes sin responder
    localStorage.clear(); // Limpia el localStorage para evitar interferencias entre pruebas
  });

  // PRUEBA BÁSICA: Verificar que el servicio se crea correctamente
  it('debería crearse el servicio', () => {
    expect(service).toBeTruthy();
  });

  // Prueba para verificar que la URL base es correcta
  it('debería tener la URL base correcta', () => {
    expect(service.urlBase).toBe(environment.API_URL);
  });

  // Prueba para verificar que HttpClient se inyectó correctamente
  it('debería inyectar HttpClient correctamente en el constructor', () => {
    // Accedemos a la propiedad privada 'http' usando ['http']
    // Esto es un "truco" de TypeScript para acceder a propiedades privadas en pruebas
    expect(service['http']).toBeTruthy();
  });

  // =========================================================
  // PRUEBAS PARA EL MÉTODO PRIVADO getHeaders()
  // =========================================================
  describe('getHeaders()', () => {
    // Prueba: Headers con token cuando existe en localStorage
    it('debería generar headers con token cuando existe en localStorage', () => {
      const mockToken = 'mock-jwt-token'; // Token de ejemplo
      localStorage.setItem('token', mockToken); // Guardamos el token en localStorage

      // Llamamos al método privado getHeaders
      const headers = service['getHeaders']();

      // VERIFICACIONES:
      expect(headers.get('Authorization')).toBe(`Bearer ${mockToken}`); // Token en header Authorization
      expect(headers.get('Content-Type')).toBe('application/json'); // Content-Type correcto
    });

    // Prueba: Headers sin token cuando no existe en localStorage
    it('debería generar headers sin token cuando no existe en localStorage', () => {
      localStorage.removeItem('token'); // Aseguramos que no hay token

      const headers = service['getHeaders']();

      expect(headers.get('Authorization')).toBe('Bearer null'); // Token null cuando no existe
      expect(headers.get('Content-Type')).toBe('application/json');
    });

    // Prueba: Headers cuando localStorage devuelve null
    it('debería generar headers con token vacío cuando localStorage.getItem retorna null', () => {
      // Usamos un espía para simular que localStorage.getItem devuelve null
      spyOn(localStorage, 'getItem').and.returnValue(null);

      const headers = service['getHeaders']();

      expect(headers.get('Authorization')).toBe('Bearer null');
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });

  // =========================================================
  // PRUEBAS PARA MÉTODO getPr() (GET con Promise)
  // =========================================================
  describe('getPr()', () => {
    // Prueba: Solicitud GET exitosa con Promise
    it('debería hacer una solicitud GET y retornar una Promise con datos exitosos', async () => {
      const mockRoute = '/test'; // Ruta de ejemplo
      const mockResponse = { data: 'test data' }; // Respuesta simulada

      // Ejecutamos el método que devuelve una Promise
      const promise = service.getPr(mockRoute);

      // httpMock.expectOne() espera una petición a la URL específica
      // y devuelve una "request" simulada que podemos manipular
      const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
      expect(req.request.method).toBe('GET'); // Verificamos que sea método GET
      req.flush(mockResponse); // Simulamos una respuesta exitosa con los datos mock

      // Esperamos a que la Promise se resuelva y verificamos el resultado
      const result = await promise;
      expect(result).toEqual(mockResponse);
    });

    // Prueba: Error HTTP en GET con Promise
    it('debería rechazar la Promise cuando hay error HTTP en GET', async () => {
      const mockRoute = '/test';
      const mockError = { status: 404, statusText: 'Not Found' }; // Error simulado

      try {
        const promise = service.getPr(mockRoute);
        
        const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
        req.flush('Error', mockError); // Simulamos una respuesta de error
        
        await promise; // Esto debería lanzar un error
        fail('Debería haber lanzado un error'); // Si llega aquí, la prueba falla
      } catch (error: unknown) {
        // Verificación segura del tipo unknown (TypeScript)
        if (error instanceof HttpErrorResponse) {
          expect(error.status).toBe(404); // Verificamos el código de error
        } else {
          // Si no es HttpErrorResponse, igualmente debería ser truthy
          expect(error).toBeTruthy();
        }
      }
    });

    // Prueba: Error de red en GET con Promise
    it('debería rechazar la Promise cuando hay error de red en GET', async () => {
      const mockRoute = '/test';

      try {
        const promise = service.getPr(mockRoute);
        
        const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
        // Simulamos un error de red (diferente a error HTTP)
        req.error(new ErrorEvent('Network error'));
        
        await promise;
        fail('Debería haber lanzado un error');
      } catch (error: unknown) {
        expect(error).toBeTruthy();
        if (error instanceof HttpErrorResponse) {
          expect(error.error).toBeInstanceOf(ErrorEvent); // Verificamos que es error de red
        }
      }
    });
  });

  // =========================================================
  // PRUEBAS PARA MÉTODO getOb() (GET con Observable)
  // =========================================================
  describe('getOb()', () => {
    // Prueba: Solicitud GET exitosa con Observable
    it('debería hacer una solicitud GET y retornar un Observable exitoso', () => {
      const mockRoute = '/test';
      const mockResponse = { data: 'test data' };

      // Suscribimos al Observable para recibir la respuesta
      service.getOb(mockRoute).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse); // Disparamos la respuesta simulada
    });

    // Prueba: Error en GET con Observable
    it('debería manejar errores en GET con Observable', () => {
      const mockRoute = '/test';

      // Probamos el manejo de errores del Observable
      service.getOb(mockRoute).subscribe({
        next: () => fail('Debería haber fallado'), // Si se llama a next, la prueba falla
        error: (error: unknown) => {
          expect(error).toBeTruthy();
          if (error instanceof HttpErrorResponse) {
            expect(error.status).toBe(500); // Verificamos el código de error
          }
        }
      });

      const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
      req.flush('Error', { status: 500, statusText: 'Server Error' }); // Error simulado
    });
  });

  // =========================================================
  // PRUEBAS PARA MÉTODO postPr() (POST con Promise)
  // =========================================================
  describe('postPr()', () => {
    // Prueba: Solicitud POST exitosa con Promise
    it('debería hacer una solicitud POST y retornar una Promise exitosa', async () => {
      const mockRoute = '/test';
      const mockData = { name: 'test' }; // Datos a enviar
      const mockResponse = { id: 1, name: 'test' }; // Respuesta simulada

      const promise = service.postPr(mockRoute, mockData);

      const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockData); // Verificamos los datos enviados
      req.flush(mockResponse);

      const result = await promise;
      expect(result).toEqual(mockResponse);
    });

    // Prueba: Error en POST con Promise
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
        expect(error).toBeTruthy();
      }
    });
  });

  // =========================================================
  // PRUEBAS PARA MÉTODO postOb() (POST con Observable)
  // =========================================================
  describe('postOb()', () => {
    // Prueba: Solicitud POST exitosa con Observable
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

    // Prueba: Error en POST con Observable
    it('debería manejar errores en POST con Observable', () => {
      const mockRoute = '/test';
      const mockData = { name: 'test' };

      service.postOb(mockRoute, mockData).subscribe({
        next: () => fail('Debería haber fallado'),
        error: (error: unknown) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
      req.flush('Error', { status: 400, statusText: 'Bad Request' });
    });
  });

  // =========================================================
  // PRUEBAS PARA MÉTODO putPr() (PUT con Promise)
  // =========================================================
  describe('putPr()', () => {
    // Prueba: Solicitud PUT exitosa con Promise
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

    // Prueba: Error en PUT con Promise
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
        expect(error).toBeTruthy();
      }
    });
  });

  // =========================================================
  // PRUEBAS PARA MÉTODO putOb() (PUT con Observable)
  // =========================================================
  describe('putOb()', () => {
    // Prueba: Solicitud PUT exitosa con Observable
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

  // =========================================================
  // PRUEBAS PARA MÉTODO deletePr() (DELETE con Promise)
  // =========================================================
  describe('deletePr()', () => {
    // Prueba: Solicitud DELETE exitosa con Promise
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

    // Prueba: Error en DELETE con Promise
    it('debería rechazar la Promise cuando hay error en DELETE', async () => {
      const mockRoute = '/test/1';

      try {
        const promise = service.deletePr(mockRoute);
        
        const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
        req.flush('Error', { status: 500, statusText: 'Server Error' });
        
        await promise;
        fail('Debería haber lanzado un error');
      } catch (error: unknown) {
        expect(error).toBeTruthy();
      }
    });
  });

  // =========================================================
  // PRUEBAS PARA MÉTODO deleteOb() (DELETE con Observable)
  // =========================================================
  describe('deleteOb()', () => {
    // Prueba: Solicitud DELETE exitosa con Observable
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

  // =========================================================
  // PRUEBAS PARA MÉTODO patchPr() (PATCH con Promise)
  // =========================================================
  describe('patchPr()', () => {
    // Prueba: Solicitud PATCH exitosa con Promise
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

    // Prueba: Error en PATCH con Promise
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
        expect(error).toBeTruthy();
      }
    });
  });

  // =========================================================
  // PRUEBAS PARA MÉTODO patchOb() (PATCH con Observable)
  // =========================================================
  describe('patchOb()', () => {
    // Prueba: Solicitud PATCH exitosa con Observable
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

    // Prueba: Error en PATCH con Observable
    it('debería manejar errores en PATCH con Observable', () => {
      const mockRoute = '/test/1';
      const mockData = { name: 'patched' };

      service.patchOb(mockRoute, mockData).subscribe({
        next: () => fail('Debería haber fallado'),
        error: (error: unknown) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${environment.API_URL}${mockRoute}`);
      req.flush('Error', { status: 400, statusText: 'Bad Request' });
    });
  });

  // =========================================================
  // PRUEBAS PARA CONSTRUCCIÓN DE URLs
  // =========================================================
  describe('Construcción de URLs', () => {
    // Prueba: Verificar que las URLs se construyen correctamente
    it('debería construir URLs correctamente concatenando urlBase y ruta', () => {
      // Definimos varios casos de prueba con diferentes rutas
      const testCases = [
        { route: '/users', expected: `${environment.API_URL}/users` },
        { route: '/events/1', expected: `${environment.API_URL}/events/1` },
        { route: '', expected: `${environment.API_URL}` } // Caso con ruta vacía
      ];

      // Probamos cada caso individualmente
      testCases.forEach(testCase => {
        service.getOb(testCase.route).subscribe(); // Hacemos una petición GET

        const req = httpMock.expectOne(testCase.expected); // Esperamos la petición a la URL esperada
        expect(req.request.url).toBe(testCase.expected); // Verificamos que la URL es correcta
        req.flush({}); // Respondemos con un objeto vacío para completar la petición
      });
    });
  });
});
// Importamos las herramientas necesarias para testing en Angular
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

// Importamos el servicio que vamos a probar
import { ResourcesServices } from './resources';
// Importamos la configuración del entorno para obtener las URLs de la API
import { environment } from '../../../environments/environment';

// Suite de pruebas para el ResourcesServices
describe('ResourcesServices', () => {
  let service: ResourcesServices;
  let httpMock: HttpTestingController;

  const apiUrl = environment.API_URL;

  const mockResource = {
    id: 1,
    name: 'Mesa',
    description: 'Mesa grande',
    quantity: 5,
    status: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ResourcesServices],
    });

    service = TestBed.inject(ResourcesServices);
    httpMock = TestBed.inject(HttpTestingController);

    localStorage.setItem('token', 'mock-token');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ==========================================
  // PRUEBAS PARA getResources()
  // ==========================================
  describe('getResources()', () => {
    it('should GET all resources', () => {
      service.getResources().subscribe((res) => {
        expect(res).toEqual([mockResource]);
      });

      const req = httpMock.expectOne(`${apiUrl}/api/resources`);
      expect(req.request.method).toBe('GET');
      req.flush([mockResource]);
    });

    it('should handle GET resources error', () => {
      service.getResources().subscribe({
        next: () => fail('Should fail'),
        error: (err: unknown) => {
          expect(err).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/api/resources`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  // ==========================================
  // PRUEBAS PARA getResource(id)
  // ==========================================
  describe('getResource(id)', () => {
    it('should GET one resource by id', () => {
      service.getResource('1').subscribe((res) => {
        expect(res).toEqual(mockResource);
      });

      const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResource);
    });

    it('should handle GET one resource error', () => {
      service.getResource('1').subscribe({
        next: () => fail('Should fail'),
        error: (err) => {
          expect(err).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
      req.flush('Error', { status: 404, statusText: 'Not Found' });
    });
  });

  // ==========================================
  // PRUEBAS PARA createResource()
  // ==========================================
  describe('createResource()', () => {
    it('should POST a new resource', () => {
      service.createResource(mockResource).subscribe((res) => {
        expect(res).toEqual(mockResource);
      });

      const req = httpMock.expectOne(`${apiUrl}/api/resources`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockResource);
      req.flush(mockResource);
    });

    it('should handle POST error', () => {
      service.createResource(mockResource).subscribe({
        next: () => fail('Should fail'),
        error: (err) => {
          expect(err).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/api/resources`);
      req.flush('Error', { status: 400, statusText: 'Bad Request' });
    });
  });

  // ==========================================
  // PRUEBAS PARA updateResource()
  // ==========================================
  describe('updateResource()', () => {
    it('should PUT update a resource', () => {
      service.updateResource('1', mockResource).subscribe((res) => {
        expect(res).toEqual(mockResource);
      });

      const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockResource);
      req.flush(mockResource);
    });

    it('should handle PUT error', () => {
      service.updateResource('1', mockResource).subscribe({
        next: () => fail('Should fail'),
        error: (err) => {
          expect(err).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  // ==========================================
  // PRUEBAS PARA deleteResource()
  // ==========================================
  describe('deleteResource()', () => {
    // Prueba CORREGIDA: Esperamos null en lugar de undefined
    it('should DELETE a resource', () => {
      service.deleteResource('1').subscribe((res) => {
        // CORRECCIÓN AQUÍ: Como hacemos req.flush(null), esperamos toBeNull()
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
      
      expect(req.request.method).toBe('DELETE');
      
      // Simulamos una respuesta exitosa sin contenido (null)
      req.flush(null);
    });

    it('should handle DELETE error', () => {
      service.deleteResource('1').subscribe({
        next: () => fail('Should fail'),
        error: (err) => {
          expect(err).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

});
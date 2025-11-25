// Importamos las herramientas necesarias para testing en Angular
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

// Importamos el servicio que vamos a probar
import { ResourcesServices } from './resources';
// Importamos la configuración del entorno para obtener las URLs de la API
import { environment } from '../../../environments/environment';

// Suite de pruebas para el ResourcesServices
// 'describe' agrupa todas las pruebas relacionadas con este servicio
describe('ResourcesServices', () => {
  let service: ResourcesServices;  // Instancia del servicio que vamos a probar
  let httpMock: HttpTestingController;  // Controlador para simular y verificar requests HTTP

  // URL base de la API obtenida desde las variables de entorno
  const apiUrl = environment.API_URL;

  // MOCK DATA: Creamos datos de prueba que simulan un recurso real
  const mockResource = {
    id: 1,
    name: 'Mesa',
    description: 'Mesa grande',
    quantity: 5,
    status: true
  };

  // 'beforeEach' se ejecuta ANTES de cada prueba individual
  beforeEach(() => {
    // Configuramos el módulo de testing de Angular
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],  // Módulo especial para probar HTTP sin servidor real
      providers: [ResourcesServices],      // El servicio real que vamos a probar
    });

    // Obtenemos las instancias del servicio y del controlador HTTP
    service = TestBed.inject(ResourcesServices);
    httpMock = TestBed.inject(HttpTestingController);

    // Configuramos un token en localStorage para simular un usuario autenticado
    // Esto es necesario si el servicio requiere autenticación
    localStorage.setItem('token', 'mock-token');
  });

  // 'afterEach' se ejecuta DESPUÉS de cada prueba individual
  afterEach(() => {
    // Verificamos que no hayan requests HTTP pendientes sin procesar
    // Esto asegura que no hayan llamadas HTTP no esperadas en nuestras pruebas
    httpMock.verify();
    
    // Limpiamos el localStorage para aislar las pruebas
    localStorage.clear();
  });

  // PRUEBA BÁSICA: Verificar que el servicio se crea correctamente
  it('should be created', () => {
    expect(service).toBeTruthy();  // Verifica que el servicio existe y no es null/undefined
  });

  // ==========================================
  // PRUEBAS PARA getResources()
  // ==========================================
  describe('getResources()', () => {
    // Prueba: Obtener todos los recursos exitosamente
    it('should GET all resources', () => {
      // Nos suscribimos al método que queremos probar
      service.getResources().subscribe((res) => {
        // Verificamos que recibimos el array con el recurso mock
        expect(res).toEqual([mockResource]);
      });

      // Verificamos que se hizo un request GET a la URL correcta
      const req = httpMock.expectOne(`${apiUrl}/api/resources`);
      
      // Verificamos que el método HTTP sea GET
      expect(req.request.method).toBe('GET');
      
      // Simulamos una respuesta exitosa del servidor con nuestros datos mock
      req.flush([mockResource]);
    });

    // Prueba: Manejo de errores al obtener recursos
    it('should handle GET resources error', () => {
      // Nos suscribimos y esperamos que falle (por eso usamos 'fail' en next)
      service.getResources().subscribe({
        next: () => fail('Should fail'),  // Si llega aquí, la prueba falla
        error: (err: unknown) => {
          // Verificamos que recibimos un error (no importa el tipo, solo que existe)
          expect(err).toBeTruthy();
        }
      });

      // Esperamos el request HTTP
      const req = httpMock.expectOne(`${apiUrl}/api/resources`);
      
      // Simulamos un error del servidor (status 500)
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  // ==========================================
  // PRUEBAS PARA getResource(id)
  // ==========================================
  describe('getResource(id)', () => {
    // Prueba: Obtener un recurso específico por ID
    it('should GET one resource by id', () => {
      service.getResource('1').subscribe((res) => {
        // Verificamos que recibimos el recurso mock específico
        expect(res).toEqual(mockResource);
      });

      // Verificamos que se llamó a la URL específica del recurso con ID 1
      const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResource);
    });

    // Prueba: Manejo de errores al obtener un recurso específico
    it('should handle GET one resource error', () => {
      service.getResource('1').subscribe({
        next: () => fail('Should fail'),  // No debería tener éxito
        error: (err) => {
          expect(err).toBeTruthy();  // Debe recibir un error
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
      // Simulamos un error 404 (recurso no encontrado)
      req.flush('Error', { status: 404, statusText: 'Not Found' });
    });
  });

  // ==========================================
  // PRUEBAS PARA createResource()
  // ==========================================
  describe('createResource()', () => {
    // Prueba: Crear un nuevo recurso
    it('should POST a new resource', () => {
      service.createResource(mockResource).subscribe((res) => {
        // Verificamos que recibimos el recurso creado
        expect(res).toEqual(mockResource);
      });

      const req = httpMock.expectOne(`${apiUrl}/api/resources`);
      
      // Verificamos que sea un método POST (para crear recursos)
      expect(req.request.method).toBe('POST');
      
      // Verificamos que el cuerpo del request contiene los datos del recurso
      expect(req.request.body).toEqual(mockResource);
      
      // Simulamos respuesta exitosa
      req.flush(mockResource);
    });

    // Prueba: Manejo de errores al crear recurso
    it('should handle POST error', () => {
      service.createResource(mockResource).subscribe({
        next: () => fail('Should fail'),  // No debería tener éxito
        error: (err) => {
          expect(err).toBeTruthy();  // Debe recibir un error
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/api/resources`);
      // Simulamos un error 400 (bad request - datos inválidos)
      req.flush('Error', { status: 400, statusText: 'Bad Request' });
    });
  });

  // ==========================================
  // PRUEBAS PARA updateResource()
  // ==========================================
  describe('updateResource()', () => {
    // Prueba: Actualizar un recurso existente
    it('should PUT update a resource', () => {
      service.updateResource('1', mockResource).subscribe((res) => {
        // Verificamos que recibimos el recurso actualizado
        expect(res).toEqual(mockResource);
      });

      const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
      
      // Verificamos que sea un método PUT (para actualizar recursos)
      expect(req.request.method).toBe('PUT');
      
      // Verificamos que el cuerpo del request contiene los datos actualizados
      expect(req.request.body).toEqual(mockResource);
      
      req.flush(mockResource);
    });

    // Prueba: Manejo de errores al actualizar recurso
    it('should handle PUT error', () => {
      service.updateResource('1', mockResource).subscribe({
        next: () => fail('Should fail'),  // No debería tener éxito
        error: (err) => {
          expect(err).toBeTruthy();  // Debe recibir un error
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
      // Simulamos un error 500 (error interno del servidor)
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
        // Las operaciones DELETE exitosas a menudo no retornan contenido (null)
        expect(res).toBeNull();
      });

      const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
      
      // Verificamos que sea un método DELETE
      expect(req.request.method).toBe('DELETE');
      
      // Simulamos una respuesta exitosa sin contenido (null)
      // Esto es común en operaciones DELETE - éxito sin cuerpo de respuesta
      req.flush(null);
    });

    // Prueba: Manejo de errores al eliminar recurso
    it('should handle DELETE error', () => {
      service.deleteResource('1').subscribe({
        next: () => fail('Should fail'),  // No debería tener éxito
        error: (err) => {
          expect(err).toBeTruthy();  // Debe recibir un error
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
      // Simulamos un error 500 al eliminar
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

});
// Importamos las herramientas necesarias para testing en Angular
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

// Importamos el servicio que vamos a probar
import { ResourcesServices } from './resources';
// Importamos la configuración del entorno para obtener las URLs de la API
import { environment } from '../../../environments/environment';

// Suite de pruebas para el ResourcesServices
// Este servicio maneja las operaciones CRUD para recursos (mesas, sillas, equipos, etc.)
describe('ResourcesServices', () => {
  let service: ResourcesServices; // Instancia del servicio que vamos a probar
  let httpMock: HttpTestingController; // Controlador para simular y verificar peticiones HTTP

  // URL base de la API que usará el servicio
  const apiUrl = environment.API_URL;

  // Datos de prueba (mock) que simularemos como respuesta de la API
  const mockResource = {
    id: 1,
    name: 'Mesa',
    description: 'Mesa grande',
    quantity: 5,
    status: true
  };

  // Configuración que se ejecuta ANTES de cada prueba individual
  beforeEach(() => {
    // Configuramos el módulo de testing de Angular
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule], // Módulo especial para probar HTTP sin necesidad de servidor real
      providers: [ResourcesServices], // Proveemos el servicio que vamos a probar
    });

    // Obtenemos la instancia del servicio desde el TestBed
    service = TestBed.inject(ResourcesServices);
    // Obtenemos el controlador HTTP para simular peticiones
    httpMock = TestBed.inject(HttpTestingController);

    // Simulamos que hay un token en el localStorage (necesario para autenticación)
    localStorage.setItem('token', 'mock-token');
  });

  // Limpieza que se ejecuta DESPUÉS de cada prueba
  afterEach(() => {
    httpMock.verify(); // Verificamos que no hayan peticiones HTTP pendientes o no manejadas
    localStorage.clear(); // Limpiamos el localStorage para evitar contaminación entre pruebas
  });

  // PRUEBA BÁSICA: Verificar que el servicio se crea correctamente
  it('should be created', () => {
    expect(service).toBeTruthy(); // Confirmamos que la instancia del servicio existe
  });

  // ==========================================
  // PRUEBAS PARA getResources() - OBTENER TODOS LOS RECURSOS
  // ==========================================
  describe('getResources()', () => {
    // Prueba: Obtener todos los recursos exitosamente
    it('should GET all resources', () => {
      // Nos suscribimos al método y verificamos la respuesta
      service.getResources().subscribe((res) => {
        // Cuando la petición sea exitosa, recibiremos el array con el recurso mock
        expect(res).toEqual([mockResource]);
      });

      // El HttpTestingController intercepta la petición HTTP real
      // y nos permite verificar que se hizo a la URL correcta
      const req = httpMock.expectOne(`${apiUrl}/api/resources`);
      
      // Verificamos que sea una petición GET
      expect(req.request.method).toBe('GET');
      
      // Simulamos una respuesta exitosa del servidor con nuestros datos mock
      req.flush([mockResource]);
    });

    // Prueba: Manejo de errores al obtener recursos
    it('should handle GET resources error', () => {
      // Nos suscribimos y esperamos que falle (por eso usamos el bloque error)
      service.getResources().subscribe({
        next: () => fail('Should fail'), // Si llega al next, la prueba falla
        error: (err: unknown) => {
          // Verificamos que recibimos un error
          expect(err).toBeTruthy();
        }
      });

      // Interceptamos la petición
      const req = httpMock.expectOne(`${apiUrl}/api/resources`);
      
      // Simulamos un error del servidor (status 500)
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  // ==========================================
  // PRUEBAS PARA getResource(id) - OBTENER UN RECURSO ESPECÍFICO
  // ==========================================
  describe('getResource(id)', () => {
    // Prueba: Obtener un recurso específico por ID exitosamente
    it('should GET one resource by id', () => {
      service.getResource('1').subscribe((res) => {
        // Verificamos que recibimos el recurso mock correcto
        expect(res).toEqual(mockResource);
      });

      // Interceptamos la petición a la URL específica del recurso con ID 1
      const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
      expect(req.request.method).toBe('GET'); // Verificamos que sea GET
      req.flush(mockResource); // Simulamos respuesta exitosa
    });

    // Prueba: Manejo de errores al obtener un recurso específico
    it('should handle GET one resource error', () => {
      service.getResource('1').subscribe({
        next: () => fail('Should fail'), // Esperamos que falle
        error: (err) => {
          expect(err).toBeTruthy(); // Verificamos que recibimos un error
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
      // Simulamos un error 404 (recurso no encontrado)
      req.flush('Error', { status: 404, statusText: 'Not Found' });
    });
  });

  // ==========================================
  // PRUEBAS PARA createResource() - CREAR NUEVO RECURSO
  // ==========================================
  describe('createResource()', () => {
    // Prueba: Crear un nuevo recurso exitosamente
    it('should POST a new resource', () => {
      service.createResource(mockResource).subscribe((res) => {
        // Verificamos que recibimos el recurso creado
        expect(res).toEqual(mockResource);
      });

      // Interceptamos la petición POST
      const req = httpMock.expectOne(`${apiUrl}/api/resources`);
      
      // Verificamos que sea una petición POST
      expect(req.request.method).toBe('POST');
      // Verificamos que el cuerpo de la petición contenga nuestros datos
      expect(req.request.body).toEqual(mockResource);

      // Simulamos respuesta exitosa del servidor
      req.flush(mockResource);
    });

    // Prueba: Manejo de errores al crear recurso
    it('should handle POST error', () => {
      service.createResource(mockResource).subscribe({
        next: () => fail('Should fail'), // Esperamos que falle
        error: (err) => {
          expect(err).toBeTruthy(); // Verificamos que recibimos un error
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/api/resources`);
      // Simulamos un error 400 (Bad Request - datos inválidos)
      req.flush('Error', { status: 400, statusText: 'Bad Request' });
    });
  });

  // ==========================================
  // PRUEBAS PARA updateResource() - ACTUALIZAR RECURSO EXISTENTE
  // ==========================================
  describe('updateResource()', () => {
    // Prueba: Actualizar un recurso existente exitosamente
    it('should PUT update a resource', () => {
      service.updateResource('1', mockResource).subscribe((res) => {
        // Verificamos que recibimos el recurso actualizado
        expect(res).toEqual(mockResource);
      });

      // Interceptamos la petición PUT
      const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
      
      // Verificamos que sea una petición PUT
      expect(req.request.method).toBe('PUT');
      // Verificamos que el cuerpo de la petición contenga los datos a actualizar
      expect(req.request.body).toEqual(mockResource);

      // Simulamos respuesta exitosa del servidor
      req.flush(mockResource);
    });

    // Prueba: Manejo de errores al actualizar recurso
    it('should handle PUT error', () => {
      service.updateResource('1', mockResource).subscribe({
        next: () => fail('Should fail'), // Esperamos que falle
        error: (err) => {
          expect(err).toBeTruthy(); // Verificamos que recibimos un error
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
      // Simulamos un error 500 (Error interno del servidor)
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  // ==========================================
  // PRUEBAS PARA deleteResource() - ELIMINAR RECURSO
  // ==========================================
  describe('deleteResource()', () => {
    // Prueba: Eliminar un recurso exitosamente
    it('should DELETE a resource', () => {
      service.deleteResource('1').subscribe((res) => {
        // En una eliminación exitosa, normalmente no recibimos datos de vuelta
        expect(res).toBeUndefined();
      });

      // Interceptamos la petición DELETE
      const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
      
      // Verificamos que sea una petición DELETE
      expect(req.request.method).toBe('DELETE');
      
      // Simulamos una respuesta exitosa sin contenido (null)
      req.flush(null);
    });

    // Prueba: Manejo de errores al eliminar recurso
    it('should handle DELETE error', () => {
      service.deleteResource('1').subscribe({
        next: () => fail('Should fail'), // Esperamos que falle
        error: (err) => {
          expect(err).toBeTruthy(); // Verificamos que recibimos un error
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/api/resources/1`);
      // Simulamos un error 500 (Error interno del servidor)
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

});
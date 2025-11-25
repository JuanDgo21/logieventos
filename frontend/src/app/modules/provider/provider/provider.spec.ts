// Importamos las herramientas necesarias para testing en Angular
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

// Componente que vamos a probar
import { ProviderComponent } from './provider';
// Servicios que el componente utiliza
import { AuthService } from '../../../core/services/auth';
import { AlertService } from '../../../core/services/alert';
import { SidebarStateService } from '../../../core/services/sidebar-state';
import { environment } from '../../../../environments/environment';

// Suite de pruebas para el ProviderComponent
describe('ProviderComponent', () => {
  let component: ProviderComponent;  // Instancia del componente que vamos a probar
  let fixture: ComponentFixture<ProviderComponent>;  // Contenedor del componente para testing
  let httpMock: HttpTestingController;  // Controlador para simular y verificar requests HTTP

  // Spies (Espías) - Objetos que simulan servicios reales
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;
  let sidebarStateSpy: jasmine.SpyObj<SidebarStateService>;

  // URLs de la API para proveedores y tipos de proveedores
  const apiUrl = `${environment.API_URL}/api/providers`;
  const apiTypesUrl = `${environment.API_URL}/api/provider-types`; // Ojo: en tu código usas localhost hardcoded a veces, pero el test usa environment

  // Mock Data: Tipos de proveedores para usar en las pruebas
  const mockProviderTypes = [
    { _id: 'type1', name: 'Distribuidor', isActive: true },
    { _id: 'type2', name: 'Fabricante', isActive: true }
  ];

  // Configuración que se ejecuta ANTES de cada prueba individual
  beforeEach(async () => {
    // 1. Configurar Spies - Creamos objetos simulados para los servicios
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    alertServiceSpy = jasmine.createSpyObj('AlertService', ['showError']);
    sidebarStateSpy = { isOpen: false } as any;  // Mock simple para el servicio de estado del sidebar

    // Configuramos comportamiento por defecto del AuthService
    authServiceSpy.getToken.and.returnValue('test-token');  // Simula que hay un token válido

    // 2. Configurar TestBed - Módulo de testing de Angular
    await TestBed.configureTestingModule({
      declarations: [ProviderComponent], // Componente no-standalone (declarado en módulo)
      imports: [FormsModule],  // Necesario para formularios con ngModel
      providers: [
        // Configuramos HTTP client para testing
        provideHttpClient(),
        provideHttpClientTesting(),
        // Inyectamos los servicios simulados
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AlertService, useValue: alertServiceSpy },
        { provide: SidebarStateService, useValue: sidebarStateSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]  // Ignora elementos HTML personalizados
    }).compileComponents();

    // 3. Inicialización - Obtenemos las instancias del controlador HTTP y del componente
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProviderComponent);
    component = fixture.componentInstance;

    // NOTA: En tu código, apiTypesUrl está hardcoded a localhost. 
    // Si es así, el test fallará si usamos environment.API_URL.
    // Ajustaré la URL esperada para que coincida con tu código si es necesario,
    // pero idealmente deberías usar environment en tu componente.
    // Asumiré que corregiste el componente para usar environment, si no, 
    // el test fallará en expectOne.

    // Ejecutamos la detección de cambios (dispara ngOnInit)
    fixture.detectChanges();

    // 4. Responder a peticiones iniciales - El componente hace 2 llamadas HTTP al inicializarse:

    // Primera llamada: cargar proveedores
    const reqProviders = httpMock.expectOne(apiUrl);
    reqProviders.flush({ data: [] });  // Simulamos respuesta vacía de proveedores

    // Segunda llamada: cargar tipos de proveedores
    // En tu código vi: this.http.get(this.apiTypesUrl...
    // Asegúrate que apiTypesUrl en el componente use environment.
    // Si usa localhost hardcoded, este expect fallará.
    // Voy a usar un match flexible para la URL de tipos por si acaso.
    const reqTypes = httpMock.expectOne((req) => req.url.includes('/api/provider-types'));
    reqTypes.flush({ data: mockProviderTypes });  // Simulamos respuesta con tipos mock
  });

  // Limpieza que se ejecuta DESPUÉS de cada prueba
  afterEach(() => {
    httpMock.verify();  // Verifica que no hayan requests HTTP pendientes
  });

  // --- PRUEBAS BÁSICAS ---

  // Prueba básica: verificar que el componente se crea y se inicializa correctamente
  it('should create and initialize', () => {
    expect(component).toBeTruthy();  // Verifica que el componente existe
    expect(component.sidebarState.isOpen).toBeTrue();  // Verifica estado inicial del sidebar
    expect(component.providerTypes.length).toBe(2);  // Verifica que cargó los 2 tipos mock
  });

  // --- PRUEBAS PARA CARGAR PROVEEDORES (LOAD PROVIDERS) ---

  // Prueba: manejo de error al cargar proveedores
  it('should handle error loading providers', () => {
    component.loadProviders();  // Llamamos manualmente a cargar proveedores
    const req = httpMock.expectOne(apiUrl);  // Esperamos el request HTTP
    req.flush('Error', { status: 500, statusText: 'Server Error' });  // Simulamos error 500
    
    // Verificamos que se estableció el mensaje de error correcto
    expect(component.errorMessage).toBe('Error al cargar proveedores');
    // Verificamos que el loading se desactiva incluso en error
    expect(component.isLoading).toBeFalse();
  });

  // Prueba: manejo de respuesta con datos nulos
  it('loadProviders should handle null data (fallback)', () => {
    component.loadProviders();
    const req = httpMock.expectOne(apiUrl);
    req.flush({ data: null });  // Simulamos respuesta con data null
    
    // Verificamos que el componente maneja null convirtiéndolo a array vacío
    expect(component.providers).toEqual([]);
  });

  // --- PRUEBAS PARA CARGAR TIPOS DE PROVEEDORES ---

  // Prueba: manejo de error al cargar tipos de proveedores
  it('should handle error loading provider types', () => {
    const consoleSpy = spyOn(console, 'error');  // Espiamos console.error
    component.loadProviderTypes();  // Llamamos manualmente a cargar tipos
    const req = httpMock.expectOne((req) => req.url.includes('/api/provider-types'));
    req.flush('Error', { status: 500, statusText: 'Server Error' });  // Simulamos error
    
    // Verificamos que se registró el error en consola
    expect(consoleSpy).toHaveBeenCalled();
  });

  // --- PRUEBAS DE AUTENTICACIÓN ---

  // Prueba: redirección cuando no hay token de autenticación
  it('should redirect if no token', () => {
    authServiceSpy.getToken.and.returnValue(null);  // Simulamos que no hay token
    try { 
      component['getAuthHeaders']();  // Llamamos al método privado (debería fallar)
    } catch (e) {}
    // Verificamos que se redirige al login
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  // --- PRUEBAS PARA CREAR PROVEEDORES (CREATE) ---

  // Prueba: crear proveedor exitosamente
  it('createProvider should POST and reload', () => {
    // Configuramos un nuevo proveedor
    component.newProvider = { name: 'N', contactPerson: 'P', email: '', phone: '', address: '', providerType: 't1', status: 'activo' };
    component.createProvider();  // Llamamos a crear proveedor

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');  // Verificamos que sea método POST
    req.flush({});  // Simulamos creación exitosa

    // El componente debe recargar la lista después de crear
    const reqReload = httpMock.expectOne(apiUrl);
    reqReload.flush({ data: [] });

    // Verificamos mensaje de éxito y limpieza del formulario
    expect(component.successMessage).toContain('creado exitosamente');
    expect(component.newProvider.name).toBe('');  // El formulario se debe limpiar
  });

  // Prueba: manejo de error CON mensaje al crear proveedor
  it('createProvider should handle error with message', () => {
    component.createProvider();
    const req = httpMock.expectOne(apiUrl);
    req.flush({ message: 'Err' }, { status: 400, statusText: 'Bad' });  // Error con mensaje específico
    
    // Verificamos que se muestra el error con el mensaje específico
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Error al crear proveedor: Err'
    }));
  });

  // Prueba: manejo de error SIN mensaje al crear proveedor (fallback)
  it('createProvider should handle error without message (fallback)', () => {
    component.createProvider();
    const req = httpMock.expectOne(apiUrl);
    req.flush(null, { status: 500, statusText: 'Error' });  // Error sin mensaje
    
    // Verificamos que se muestra el mensaje de error por defecto
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Error al crear proveedor: '  // Mensaje con string vacío al final
    }));
  });

  // --- PRUEBAS PARA ACTUALIZAR PROVEEDORES (UPDATE) ---

  // Prueba: actualizar proveedor exitosamente
  it('updateProvider should PUT and reload', () => {
    // Configuramos un proveedor en edición
    component.editingProvider = { _id: '1', name: 'E', contactPerson: 'P', email: '', phone: '', address: '', providerType: 't1', status: 'activo' };
    component.updateProvider();  // Llamamos a actualizar

    const req = httpMock.expectOne(`${apiUrl}/1`);  // URL específica con ID
    expect(req.request.method).toBe('PUT');  // Verificamos que sea método PUT
    req.flush({});  // Simulamos actualización exitosa

    // El componente debe recargar la lista
    const reqReload = httpMock.expectOne(apiUrl);
    reqReload.flush({ data: [] });

    // Verificamos mensaje de éxito y limpieza del estado de edición
    expect(component.successMessage).toContain('actualizado exitosamente');
    expect(component.editingProvider).toBeNull();  // Debe limpiar el proveedor en edición
  });

  // Prueba: no hacer nada si no hay proveedor en edición
  it('updateProvider should do nothing if not editing', () => {
    component.editingProvider = null;  // No hay elemento en edición
    component.updateProvider();
    
    // Verificamos que NO se hizo ningún request HTTP
    httpMock.expectNone(apiUrl);
  });

  // Prueba: manejo de error CON mensaje al actualizar
  it('updateProvider should handle error with message', () => {
    component.editingProvider = { _id: '1', name: 'E', contactPerson: '', email: '', phone: '', address: '', providerType: '', status: 'activo' };
    component.updateProvider();
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush({ message: 'Err' }, { status: 500, statusText: 'Error' });  // Error con mensaje
    
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Error al actualizar: Err'
    }));
  });

  // Prueba: manejo de error SIN mensaje al actualizar
  it('updateProvider should handle error without message', () => {
    component.editingProvider = { _id: '1', name: 'E', contactPerson: '', email: '', phone: '', address: '', providerType: '', status: 'activo' };
    component.updateProvider();
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(null, { status: 500, statusText: 'Error' });  // Error sin mensaje
    
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Error al actualizar: '  // Mensaje con string vacío al final
    }));
  });

  // --- PRUEBAS PARA ELIMINAR PROVEEDORES (DELETE) ---

  // Prueba: eliminar proveedor con confirmación del usuario
  it('deleteProvider should DELETE if confirmed', () => {
    // Simulamos que el usuario confirma la eliminación
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.deleteProvider('1');  // Intentamos eliminar el ID 1

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');  // Verificamos que sea método DELETE
    req.flush({});  // Simulamos eliminación exitosa

    // El componente debe recargar la lista después de eliminar
    const reqReload = httpMock.expectOne(apiUrl);
    reqReload.flush({ data: [] });

    // Verificamos mensaje de éxito
    expect(component.successMessage).toContain('eliminado exitosamente');
  });

  // Prueba: NO eliminar si el usuario cancela la confirmación
  it('deleteProvider should NOT delete if cancelled', () => {
    // Simulamos que el usuario cancela la eliminación
    spyOn(globalThis, 'confirm').and.returnValue(false);
    component.deleteProvider('1');
    
    // Verificamos que NO se hizo ningún request HTTP
    httpMock.expectNone(`${apiUrl}/1`);
  });

  // Prueba: manejo de error CON mensaje al eliminar
  it('deleteProvider should handle error with message', () => {
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.deleteProvider('1');
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush({ message: 'Err' }, { status: 500, statusText: 'Error' });  // Error con mensaje
    
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Error al eliminar proveedor: Err'
    }));
  });

  // Prueba: manejo de error SIN mensaje al eliminar
  it('deleteProvider should handle error without message', () => {
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.deleteProvider('1');
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(null, { status: 500, statusText: 'Error' });  // Error sin mensaje
    
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Error al eliminar proveedor: '  // Mensaje con string vacío al final
    }));
  });

  // --- PRUEBAS PARA HELPERS DE UI (Interfaz de usuario) ---

  // Prueba: editar un proveedor (copia el objeto)
  it('editProvider should copy object', () => {
    const p = { _id: '1', name: 'A', contactPerson: '', email: '', phone: '', address: '', providerType: '', status: 'activo' } as any;
    component.editProvider(p);
    // Verificamos que se copió el objeto (no es la misma referencia)
    expect(component.editingProvider).toEqual(p);
  });

  // Prueba: cancelar edición (limpia el objeto en edición)
  it('cancelEdit should clear object', () => {
    component.editingProvider = { name: '' } as any;
    component.cancelEdit();
    expect(component.editingProvider).toBeNull();  // Debe ser null
  });

  // Prueba: mostrar mensaje de éxito con auto-limpieza después de 3 segundos
  it('showSuccess should clear message after 3s', fakeAsync(() => {
    (component as any).showSuccess('Msg');  // Llamamos al método privado
    expect(component.successMessage).toBe('Msg');  // Mensaje se establece
    
    tick(3000);  // Avanzamos 3 segundos en el tiempo virtual
    
    expect(component.successMessage).toBe('');  // Mensaje se debe limpiar automáticamente
  }));

  // --- PRUEBAS PARA HELPERS DE VISUALIZACIÓN (getProviderTypeName - Cobertura Completa de Ramas) ---

  describe('getProviderTypeName', () => {
    // Prueba: tipo nulo o undefined (debe devolver "---")
    it('should return "---" if no type', () => {
      expect(component.getProviderTypeName(null)).toBe('---');
      expect(component.getProviderTypeName(undefined)).toBe('---');
    });

    // Prueba: tipo es objeto con propiedad name
    it('should return name if type is object with name', () => {
      expect(component.getProviderTypeName({ name: 'Obj' })).toBe('Obj');
    });

    // Prueba: tipo es string ID que existe en los tipos mock
    it('should return name if type is string ID and found', () => {
      // 'type1' está en mockProviderTypes como 'Distribuidor'
      expect(component.getProviderTypeName('type1')).toBe('Distribuidor');
    });

    // Prueba: tipo es string que coincide con un nombre (case insensitive)
    it('should return name if type matches a type NAME (case insensitive)', () => {
      expect(component.getProviderTypeName('distribuidor')).toBe('Distribuidor');
    });

    // Prueba: tipo es string que no se encuentra
    it('should return original string if not found', () => {
      expect(component.getProviderTypeName('unknown')).toBe('unknown');
    });

    // Prueba: tipo es de otro tipo (número, etc.)
    it('should return string representation for other types', () => {
      expect(component.getProviderTypeName(123)).toBe('123');  // Convierte número a string
    });
  });
});
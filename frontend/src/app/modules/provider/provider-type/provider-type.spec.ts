// Importamos las herramientas necesarias para testing en Angular
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

// Componente que vamos a probar y su interfaz
import { ProviderTypeComponent, ProviderType } from './provider-type';
// Servicios que el componente utiliza
import { AuthService } from '../../../core/services/auth';
import { AlertService } from '../../../core/services/alert';
import { SidebarStateService } from '../../../core/services/sidebar-state';
import { environment } from '../../../../environments/environment';

// Suite de pruebas para el ProviderTypeComponent
describe('ProviderTypeComponent', () => {
  let component: ProviderTypeComponent;  // Instancia del componente que vamos a probar
  let fixture: ComponentFixture<ProviderTypeComponent>;  // Contenedor del componente para testing
  let httpMock: HttpTestingController;  // Controlador para simular y verificar requests HTTP
  
  // Spies (Espías) - Objetos que simulan servicios reales
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;
  let sidebarStateSpy: jasmine.SpyObj<SidebarStateService>;

  // URL de la API para tipos de proveedores
  const apiUrl = `${environment.API_URL}/api/provider-types`;

  // Configuración que se ejecuta ANTES de cada prueba individual
  beforeEach(async () => {
    // 1. Mocks - Creamos objetos simulados para los servicios
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    alertServiceSpy = jasmine.createSpyObj('AlertService', ['showError']);
    sidebarStateSpy = { isOpen: false } as any;  // Mock simple para el servicio de estado del sidebar

    // Configuramos comportamiento por defecto del AuthService
    authServiceSpy.getToken.and.returnValue('test-token');  // Simula que hay un token válido

    // 2. Configuración del Módulo - Módulo de testing de Angular
    await TestBed.configureTestingModule({
      declarations: [ProviderTypeComponent], // Componente no standalone (declarado en módulo)
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
    fixture = TestBed.createComponent(ProviderTypeComponent);
    component = fixture.componentInstance;

    // Ejecutamos la detección de cambios (dispara ngOnInit -> loadProviderTypes)
    fixture.detectChanges();

    // 4. Limpiar petición inicial - El componente hace una llamada HTTP al inicializarse
    const req = httpMock.expectOne(apiUrl);
    req.flush({ data: [] }); // Empezamos vacíos - simulamos respuesta sin tipos de proveedor
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
  });

  // Prueba: manejo de error al cargar tipos de proveedor
  it('should handle error loading types', () => {
    // Forzamos recarga manual de tipos
    component.loadProviderTypes();
    const req = httpMock.expectOne(apiUrl);  // Esperamos el request HTTP
    req.flush('Error', { status: 500, statusText: 'Server Error' });  // Simulamos error 500
    
    // Verificamos que se estableció el mensaje de error correcto
    expect(component.errorMessage).toBe('Error al cargar tipos de proveedor');
    // Verificamos que el loading se desactiva incluso en error
    expect(component.isLoading).toBeFalse();
  });

  // Prueba: manejo de respuesta con datos nulos
  it('loadProviderTypes should handle null data response (fallback)', () => {
    component.loadProviderTypes();
    const req = httpMock.expectOne(apiUrl);
    req.flush({ data: null });  // Simulamos respuesta con data null
    
    // Verificamos que el componente maneja null convirtiéndolo a array vacío
    expect(component.providerTypes).toEqual([]);
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

  // --- PRUEBAS PARA CREAR TIPOS DE PROVEEDOR (CREATE) ---

  // Prueba: crear tipo de proveedor exitosamente
  it('createProviderType should POST and reload', () => {
    // Configuramos un nuevo tipo de proveedor
    component.newProviderType = { name: 'New', description: 'D', isActive: true };
    component.createProviderType();  // Llamamos a crear tipo

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');  // Verificamos que sea método POST
    req.flush({});  // Simulamos creación exitosa

    // El componente debe recargar la lista después de crear (reload automático)
    const reqReload = httpMock.expectOne(apiUrl);
    reqReload.flush({ data: [] });

    // Verificamos mensaje de éxito y limpieza del formulario
    expect(component.successMessage).toContain('creado exitosamente');
    expect(component.newProviderType.name).toBe(''); // Reset check - el formulario se debe limpiar
  });

  // Prueba: manejo de error CON mensaje al crear tipo de proveedor
  it('createProviderType should handle error with message', () => {
    component.createProviderType();
    const req = httpMock.expectOne(apiUrl);
    req.flush({ message: 'Duplicado' }, { status: 400, statusText: 'Bad Request' });  // Error con mensaje específico
    
    // Verificamos que se muestra el error con el mensaje específico del servidor
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Duplicado'  // Mensaje específico del error
    }));
  });

  // Prueba: manejo de error SIN mensaje al crear tipo de proveedor (fallback)
  it('createProviderType should handle error without message (fallback)', () => {
    component.createProviderType();
    const req = httpMock.expectOne(apiUrl);
    req.flush(null, { status: 500, statusText: 'Server Error' });  // Error sin mensaje
    
    // Verificamos que se muestra el mensaje de error por defecto
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Error al crear tipo de proveedor'  // Mensaje por defecto
    }));
  });

  // --- PRUEBAS PARA ACTUALIZAR TIPOS DE PROVEEDOR (UPDATE) ---

  // Prueba: actualizar tipo de proveedor exitosamente
  it('updateProviderType should PUT and reload', () => {
    // Configuramos un tipo de proveedor en edición
    component.editingProviderType = { _id: '1', name: 'Edit', isActive: true };
    component.updateProviderType();  // Llamamos a actualizar

    const req = httpMock.expectOne(`${apiUrl}/1`);  // URL específica con ID
    expect(req.request.method).toBe('PUT');  // Verificamos que sea método PUT
    req.flush({});  // Simulamos actualización exitosa

    // El componente debe recargar la lista
    const reqReload = httpMock.expectOne(apiUrl);
    reqReload.flush({ data: [] });

    // Verificamos mensaje de éxito y limpieza del estado de edición
    expect(component.successMessage).toContain('actualizado exitosamente');
    expect(component.editingProviderType).toBeNull();  // Debe limpiar el tipo en edición
  });

  // Prueba: no hacer nada si el tipo en edición no tiene ID
  it('updateProviderType should do nothing if no ID', () => {
    // Caso donde editingProviderType existe pero no tiene _id
    component.editingProviderType = { name: 'No ID', isActive: true };
    component.updateProviderType();
    httpMock.expectNone(apiUrl);  // No debe hacer request HTTP
  });

  // Prueba: no hacer nada si no hay tipo en edición
  it('updateProviderType should do nothing if null', () => {
    component.editingProviderType = null;  // No hay elemento en edición
    component.updateProviderType();
    httpMock.expectNone(apiUrl);  // No debe hacer request HTTP
  });

  // Prueba: manejo de error CON mensaje al actualizar
  it('updateProviderType should handle error with message', () => {
    component.editingProviderType = { _id: '1', name: 'E', isActive: true };
    component.updateProviderType();
    
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush({ message: 'Fail' }, { status: 500, statusText: 'Error' });  // Error con mensaje

    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Fail'  // Mensaje específico del error
    }));
  });

  // Prueba: manejo de error SIN mensaje al actualizar (fallback)
  it('updateProviderType should handle error without message (fallback)', () => {
    component.editingProviderType = { _id: '1', name: 'E', isActive: true };
    component.updateProviderType();
    
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(null, { status: 500, statusText: 'Error' });  // Error sin mensaje

    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Error al actualizar tipo de proveedor'  // Mensaje por defecto
    }));
  });

  // --- PRUEBAS PARA ELIMINAR TIPOS DE PROVEEDOR (DELETE) ---

  // Prueba: eliminar tipo de proveedor con confirmación del usuario
  it('deleteProviderType should DELETE if confirmed', () => {
    // Simulamos que el usuario confirma la eliminación
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.deleteProviderType('1');  // Intentamos eliminar el ID 1

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
  it('deleteProviderType should NOT delete if cancelled', () => {
    // Simulamos que el usuario cancela la eliminación
    spyOn(globalThis, 'confirm').and.returnValue(false);
    component.deleteProviderType('1');
    httpMock.expectNone(`${apiUrl}/1`);  // No debe hacer request HTTP
  });

  // Prueba: NO eliminar si no se proporciona ID
  it('deleteProviderType should NOT delete if no ID', () => {
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.deleteProviderType('');  // ID vacío
    httpMock.expectNone(`${apiUrl}/`);  // No debe hacer request HTTP
  });

  // Prueba: manejo de error SIN mensaje al eliminar (fallback)
  it('deleteProviderType should handle error without message (fallback)', () => {
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.deleteProviderType('1');

    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(null, { status: 500, statusText: 'Error' });  // Error sin mensaje

    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Error al eliminar tipo de proveedor'  // Mensaje por defecto
    }));
  });

  // Prueba: manejo de error CON mensaje al eliminar
  it('deleteProviderType should handle error with message', () => {
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.deleteProviderType('1');

    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush({ message: 'In use' }, { status: 500, statusText: 'Error' });  // Error con mensaje específico

    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'In use'  // Mensaje específico del error
    }));
  });

  // --- PRUEBAS PARA CAMBIAR ESTADO (TOGGLE STATUS) ---

  // Prueba: no hacer nada si el item no tiene ID
  it('toggleStatus should do nothing if no ID', () => {
    component.toggleStatus({ name: 'No ID', isActive: true });  // Item sin _id
    httpMock.expectNone(`${apiUrl}/undefined`);  // No debe hacer request HTTP
  });

  // Prueba: cambiar estado de activo a inactivo exitosamente
  it('toggleStatus should PUT inverted status and reload', () => {
    const item: ProviderType = { _id: '1', name: 'T', isActive: true };
    component.toggleStatus(item);  // Cambiamos estado (de activo a inactivo)

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');  // Verificamos que sea método PUT
    expect(req.request.body).toEqual({ ...item, isActive: false }); // Invertido - debe enviar false
    req.flush({});  // Simulamos cambio exitoso

    // El componente debe recargar la lista
    httpMock.expectOne(apiUrl).flush({ data: [] });
    
    // Verificamos mensaje de desactivación
    expect(component.successMessage).toContain('desactivado exitosamente');
  });

  // Prueba: cambiar estado de inactivo a activo exitosamente
  it('toggleStatus should show "activado" message', () => {
    const item: ProviderType = { _id: '1', name: 'T', isActive: false };
    component.toggleStatus(item);  // Cambiamos estado (de inactivo a activo)

    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush({});  // Simulamos cambio exitoso

    httpMock.expectOne(apiUrl).flush({ data: [] });
    
    // Verificamos mensaje de activación
    expect(component.successMessage).toContain('activado exitosamente');
  });

  // Prueba: manejo de error SIN mensaje al cambiar estado (fallback)
  it('toggleStatus should handle error without message (fallback)', () => {
    const item: ProviderType = { _id: '1', name: 'T', isActive: true };
    component.toggleStatus(item);

    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(null, { status: 500, statusText: 'Error' });  // Error sin mensaje

    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Error al cambiar estado'  // Mensaje por defecto
    }));
  });

  // Prueba: manejo de error CON mensaje al cambiar estado
  it('toggleStatus should handle error with message', () => {
    const item: ProviderType = { _id: '1', name: 'T', isActive: true };
    component.toggleStatus(item);

    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush({ message: 'Fail toggle' }, { status: 500, statusText: 'Error' });  // Error con mensaje

    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Fail toggle'  // Mensaje específico del error
    }));
  });

  // --- PRUEBAS PARA HELPERS DE UI (Interfaz de usuario) ---

  // Prueba: editar un tipo de proveedor (copia el objeto)
  it('editProviderType should copy object', () => {
    const item = { _id: '1', name: 'A', isActive: true };
    component.editProviderType(item);
    // Verificamos que se copió el objeto (no es la misma referencia)
    expect(component.editingProviderType).toEqual(item);
    expect(component.editingProviderType).not.toBe(item);  // Debe ser una copia, no la misma referencia
  });

  // Prueba: cancelar edición (limpia el objeto en edición)
  it('cancelEdit should clear object', () => {
    component.editingProviderType = { name: '', isActive: true };
    component.cancelEdit();
    expect(component.editingProviderType).toBeNull();  // Debe ser null
  });

  // Prueba: mostrar mensaje de éxito con auto-limpieza después de 3 segundos
  it('showSuccess should clear message after 3s', fakeAsync(() => {
    (component as any).showSuccess('Msg');  // Llamamos al método privado
    expect(component.successMessage).toBe('Msg');  // Mensaje se establece
    
    tick(3000);  // Avanzamos 3 segundos en el tiempo virtual
    
    expect(component.successMessage).toBe('');  // Mensaje se debe limpiar automáticamente
  }));

  // Prueba: texto para estado activo (constante)
  it('getActiveStatusText should return constant', () => {
    expect(component.getActiveStatusText()).toBe('Activo');  // Texto fijo para estado activo
  });

  // Prueba: texto para estado inactivo (constante)
  it('getInactiveStatusText should return constant', () => {
    expect(component.getInactiveStatusText()).toBe('Inactivo');  // Texto fijo para estado inactivo
  });

  // --- PRUEBAS PARA VALIDACIÓN (isValidProviderType) ---

  // Prueba: validación de longitud del nombre
  it('isValidProviderType should validate name length', () => {
    // Caso 1: Nombre muy corto (2 caracteres) - debe ser inválido
    expect(component.isValidProviderType({ name: 'No', isActive: true })).toBeFalse();
    
    // Caso 2: Límite inferior (3 caracteres) - debe ser válido
    expect(component.isValidProviderType({ name: 'Yes', isActive: true })).toBeTrue();
    
    // Caso 3: Nombre válido - debe ser válido
    expect(component.isValidProviderType({ name: 'Valid Name', isActive: true })).toBeTrue();

    // Caso 4: Límite superior (50 caracteres) - debe ser válido
    const longName50 = 'a'.repeat(50);  // Crear string de exactamente 50 caracteres
    expect(component.isValidProviderType({ name: longName50, isActive: true })).toBeTrue();

    // Caso 5: Nombre muy largo (51 caracteres) - debe ser inválido
    const longName51 = 'a'.repeat(51);  // Crear string de 51 caracteres
    expect(component.isValidProviderType({ name: longName51, isActive: true })).toBeFalse();
  });
});
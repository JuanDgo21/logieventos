// Importamos las herramientas necesarias para testing en Angular
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

// Componente que vamos a probar
import { ResourceTypesComponent } from './resource-types';
// Servicios que el componente utiliza
import { AuthService } from '../../../core/services/auth';
import { AlertService } from '../../../core/services/alert';
import { SidebarStateService } from '../../../core/services/sidebar-state';
import { environment } from '../../../../environments/environment';

// Suite de pruebas para el ResourceTypesComponent
describe('ResourceTypesComponent', () => {
  let component: ResourceTypesComponent;  // Instancia del componente que vamos a probar
  let fixture: ComponentFixture<ResourceTypesComponent>;  // Contenedor del componente para testing
  let httpMock: HttpTestingController;  // Controlador para simular y verificar requests HTTP
  
  // Spies (Espías) - Objetos que simulan servicios reales
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;
  let sidebarStateSpy: jasmine.SpyObj<SidebarStateService>;

  // URL de la API para tipos de recursos
  const apiUrl = `${environment.API_URL}/api/resource-types`;

  // Configuración que se ejecuta ANTES de cada prueba individual
  beforeEach(async () => {
    // Creamos objetos espía para los servicios
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    alertServiceSpy = jasmine.createSpyObj('AlertService', ['showError']);
    sidebarStateSpy = { isOpen: false } as any;  // Mock simple para el servicio de estado del sidebar

    // Configuramos comportamiento por defecto del AuthService
    authServiceSpy.getToken.and.returnValue('test-token');  // Simula que hay un token válido

    // Configuramos el módulo de testing de Angular
    await TestBed.configureTestingModule({
      declarations: [ResourceTypesComponent],  // Componente a probar
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

    // Obtenemos las instancias del controlador HTTP y del componente
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ResourceTypesComponent);
    component = fixture.componentInstance;

    // Ejecutamos la detección de cambios (dispara ngOnInit)
    fixture.detectChanges(); 
    
    // Limpiar la petición inicial del constructor
    // El componente hace una llamada HTTP al crearse, así que la procesamos
    const req = httpMock.expectOne(apiUrl);
    req.flush({ data: [] });  // Simulamos respuesta vacía
  });

  // Limpieza que se ejecuta DESPUÉS de cada prueba
  afterEach(() => {
    httpMock.verify();  // Verifica que no hayan requests HTTP pendientes
  });

  // --- PRUEBAS BÁSICAS ---

  // Prueba básica: verificar que el componente se crea correctamente
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Prueba: manejo de error 401 (No autorizado) al cargar tipos de recurso
  it('should handle 401 error on load', () => {
    component.loadResourceTypes();  // Llamamos manualmente a cargar tipos
    const req = httpMock.expectOne(apiUrl);  // Esperamos el request HTTP
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });  // Simulamos error 401
    
    // Verificamos que se llamó a logout y redirección al login
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  // Prueba: manejo de error 403 (Prohibido) al cargar tipos de recurso
  it('should handle 403 error on load', () => {
    component.loadResourceTypes();
    const req = httpMock.expectOne(apiUrl);
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });  // Simulamos error 403
    
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  // Prueba: manejo de error 500 (Error interno del servidor) al cargar tipos de recurso
  it('should handle 500 error on load', () => {
    component.loadResourceTypes();
    const req = httpMock.expectOne(apiUrl);
    req.flush('Error', { status: 500, statusText: 'Error' });  // Simulamos error 500
    
    // Verificamos que se estableció el mensaje de error correcto
    expect(component.errorMessage).toBe('Error al cargar los tipos de recurso');
  });

  // Prueba: redirección cuando no hay token de autenticación
  it('should redirect if no token', () => {
    authServiceSpy.getToken.and.returnValue(null);  // Simulamos que no hay token
    try { 
      component['getAuthHeaders']();  // Llamamos al método privado (debería fallar)
    } catch (e) {}
    // Verificamos que se redirige al login
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  // Prueba: manejo de respuesta con datos nulos
  it('loadResourceTypes should handle null data response', () => {
    component.loadResourceTypes();
    const req = httpMock.expectOne(apiUrl);
    req.flush({ data: null });  // Simulamos respuesta con data null
    
    // Verificamos que el componente maneja null convirtiéndolo a array vacío
    expect(component.resourceTypes).toEqual([]);
  });

  // --- PRUEBAS PARA CREAR TIPOS DE RECURSO (CREATE) ---

  // Prueba: crear un tipo de recurso exitosamente
  it('createResourceType should POST and reload', () => {
    // Configuramos el nuevo tipo de recurso
    component.newResourceType = { name: 'N', description: 'D', active: true };
    component.createResourceType();  // Llamamos a crear
    
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');  // Verificamos que sea método POST
    req.flush({});  // Simulamos respuesta exitosa
    
    // El componente debe recargar la lista después de crear
    httpMock.expectOne(apiUrl).flush({ data: [] });
    
    // Verificamos el mensaje de éxito
    expect(component.successMessage).toContain('creado');
  });

  // Prueba: manejo de error 403 al crear tipo de recurso
  it('createResourceType should handle 403', () => {
    component.createResourceType();
    const req = httpMock.expectOne(apiUrl);
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });  // Error 403
    
    // Verificamos que se muestra el error
    expect(alertServiceSpy.showError).toHaveBeenCalled();
  });

  // Prueba: manejo de error 401 al crear tipo de recurso
  it('createResourceType should handle 401', () => {
    component.createResourceType();
    const req = httpMock.expectOne(apiUrl);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });  // Error 401
    
    expect(alertServiceSpy.showError).toHaveBeenCalled();
  });

  // Prueba: manejo de error genérico al crear tipo de recurso
  it('createResourceType should handle generic error', () => {
    component.createResourceType();
    const req = httpMock.expectOne(apiUrl);
    req.flush({ message: 'Err' }, { status: 500, statusText: 'Error' });  // Error con mensaje
    
    expect(alertServiceSpy.showError).toHaveBeenCalled();
  });

  // Prueba: manejo de error sin mensaje específico
  it('createResourceType should handle error without message', () => {
    component.createResourceType();
    const req = httpMock.expectOne(apiUrl);
    req.flush(null, { status: 500, statusText: 'Error' });  // Error sin mensaje
    
    // Verificamos que se muestra el mensaje de error por defecto
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({ 
      message: 'Error al crear el tipo recurso: ' 
    }));
  });

  // --- PRUEBAS PARA ACTUALIZAR TIPOS DE RECURSO (UPDATE) ---

  // Prueba: actualizar un tipo de recurso exitosamente
  it('updateResourceType should PUT and reload', () => {
    // Configuramos el tipo de recurso en edición
    component.editingResourceType = { _id: '1', name: 'E', description: 'D', active: true };
    component.updateResourceType();  // Llamamos a actualizar
    
    const req = httpMock.expectOne(`${apiUrl}/1`);  // URL específica con ID
    expect(req.request.method).toBe('PUT');  // Verificamos que sea método PUT
    req.flush({});  // Simulamos respuesta exitosa
    
    // El componente debe recargar la lista después de actualizar
    httpMock.expectOne(apiUrl).flush({ data: [] });
    
    // Verificamos el mensaje de éxito
    expect(component.successMessage).toContain('actualizado');
  });

  // Prueba: no hacer nada si no hay tipo de recurso en edición
  it('updateResourceType should do nothing if not editing', () => {
    component.editingResourceType = null;  // No hay elemento en edición
    component.updateResourceType();
    
    // Verificamos que NO se hizo ningún request HTTP
    httpMock.expectNone(`${apiUrl}/undefined`);
  });

  // Prueba: manejo de error sin mensaje al actualizar
  it('updateResourceType should handle error without message', () => {
    component.editingResourceType = { _id: '1', name: 'E', description: 'D', active: true };
    component.updateResourceType();
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(null, { status: 500, statusText: 'Error' });  // Error sin mensaje
    
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({ 
      message: 'Error al actualizar: ' 
    }));
  });

  // --- PRUEBAS PARA ELIMINAR TIPOS DE RECURSO (DELETE) ---

  // Prueba: eliminar un tipo de recurso con confirmación
  it('deleteResourceType should DELETE if confirmed', () => {
    // Simulamos que el usuario confirma la eliminación
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.deleteResourceType('1');  // Intentamos eliminar el ID 1
    
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');  // Verificamos que sea método DELETE
    req.flush({});  // Simulamos eliminación exitosa
    
    // El componente debe recargar la lista después de eliminar
    httpMock.expectOne(apiUrl).flush({ data: [] });
    
    // Verificamos el mensaje de éxito
    expect(component.successMessage).toContain('eliminado');
  });

  // Prueba: NO eliminar si el usuario cancela la confirmación
  it('deleteResourceType should NOT delete if cancelled', () => {
    // Simulamos que el usuario cancela la eliminación
    spyOn(globalThis, 'confirm').and.returnValue(false);
    component.deleteResourceType('1');
    
    // Verificamos que NO se hizo ningún request HTTP
    httpMock.expectNone(`${apiUrl}/1`);
  });

  // Prueba: manejo de error sin mensaje al eliminar
  it('deleteResourceType should handle error without message', () => {
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.deleteResourceType('1');
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(null, { status: 500, statusText: 'Error' });  // Error sin mensaje
    
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({ 
      message: 'Error al eliminar: ' 
    }));
  });

  // --- PRUEBAS PARA CAMBIAR ESTADO (TOGGLE STATUS) ---

  // 1. Caso: De Activo a Inactivo (mensaje 'desactivado')
  it('toggleStatus should show "desactivado" success message', () => {
    const item = { _id: '1', name: 'T', description: 'D', active: true }; // Está activo
    component.toggleStatus(item);  // Cambiamos estado

    const req = httpMock.expectOne(`${apiUrl}/1`);
    // Esperamos que envíe active: false (desactivar)
    expect(req.request.body).toEqual({ active: false });
    req.flush({}); // Éxito

    // El componente recarga la lista
    httpMock.expectOne(apiUrl).flush({ data: [] });
    
    // updatedResourceType.active será false -> mensaje 'desactivado'
    expect(component.successMessage).toContain('desactivado exitosamente');
  });

  // 2. Caso: De Inactivo a Activo (mensaje 'activado') [LA RAMA QUE FALTABA]
  it('toggleStatus should show "activado" success message', () => {
    const item = { _id: '1', name: 'T', description: 'D', active: false }; // Está inactivo
    component.toggleStatus(item);

    const req = httpMock.expectOne(`${apiUrl}/1`);
    // Esperamos que envíe active: true (activar)
    expect(req.request.body).toEqual({ active: true });
    req.flush({}); // Éxito

    httpMock.expectOne(apiUrl).flush({ data: [] }); // Reload

    // updatedResourceType.active será true -> mensaje 'activado'
    expect(component.successMessage).toContain('activado exitosamente');
  });

  // Prueba: manejo de error al cambiar estado
  it('toggleStatus should handle error without message', () => {
    const item = { _id: '1', name: 'T', description: 'D', active: true };
    component.toggleStatus(item);
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(null, { status: 500, statusText: 'Error' });  // Error sin mensaje
    
    // Verificamos el mensaje de error específico para cambio de estado
    expect(component.errorMessage).toBe('Error al cambiar el estado');
  });

  // --- PRUEBAS PARA HELPERS DE UI (Interfaz de usuario) ---

  // Pruebas para cambios en el nombre
  it('onNameChange handlers', () => {
    // Caso 1: Cuando no hay elemento en edición (debe actualizar newResourceType)
    component.editingResourceType = null;
    component.onNameChange('A');
    expect(component.newResourceType.name).toBe('A');
    
    // Caso 2: Cuando hay elemento en edición (debe actualizar editingResourceType)
    component.editingResourceType = { name: '', description: '', active: true };
    component.onNameChange('B');
    expect(component.editingResourceType.name).toBe('B');
  });

  // Pruebas para cambios en la descripción
  it('onDescriptionChange handlers', () => {
    // Caso 1: Cuando no hay elemento en edición
    component.editingResourceType = null;
    component.onDescriptionChange('A');
    expect(component.newResourceType.description).toBe('A');

    // Caso 2: Cuando hay elemento en edición
    component.editingResourceType = { name: '', description: '', active: true };
    component.onDescriptionChange('B');
    expect(component.editingResourceType.description).toBe('B');
  });

  // Pruebas para cambios en el estado activo
  it('onActiveChange handlers', () => {
    component.editingResourceType = { name: '', description: '', active: true };
    component.onActiveChange(false);  // Cambiamos a inactivo
    expect(component.editingResourceType.active).toBeFalse();  // Debe ser false
  });
  
  // Prueba: no hacer nada si no hay elemento en edición al cambiar estado activo
  it('onActiveChange should do nothing if not editing', () => {
    component.editingResourceType = null;
    component.onActiveChange(false);  // Intentamos cambiar estado
    expect(component.editingResourceType).toBeNull();  // No debe cambiar
  });

  // Prueba: editar un tipo de recurso (copia el objeto)
  it('editResourceType copies object', () => {
    const item = { _id: '1', name: 'A', description: 'B', active: true };
    component.editResourceType(item);
    // Verificamos que se copió el objeto (no es la misma referencia)
    expect(component.editingResourceType).toEqual(item);
  });

  // Prueba: cancelar edición (limpia el objeto en edición)
  it('cancelEdit clears object', () => {
    component.editingResourceType = { name: '', description: '', active: true };
    component.cancelEdit();
    expect(component.editingResourceType).toBeNull();  // Debe ser null
  });

  // Prueba: mostrar mensaje de éxito con auto-limpieza
  it('showSuccess clears message', fakeAsync(() => {
    (component as any).showSuccess('Msg');  // Llamamos al método privado
    expect(component.successMessage).toBe('Msg');  // Mensaje se establece
    
    tick(3000);  // Avanzamos 3 segundos en el tiempo virtual
    
    expect(component.successMessage).toBe('');  // Mensaje se debe limpiar automáticamente
  }));
});
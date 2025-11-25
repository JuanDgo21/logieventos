// Importamos las herramientas necesarias para testing en Angular
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

// Componente que vamos a probar
import { ResourcesComponent } from './resources';
// Servicios que el componente utiliza
import { AuthService } from '../../../core/services/auth';
import { AlertService } from '../../../core/services/alert';
import { SidebarStateService } from '../../../core/services/sidebar-state';
import { environment } from '../../../../environments/environment';

// Suite de pruebas para el ResourcesComponent
describe('ResourcesComponent', () => {
  let component: ResourcesComponent;  // Instancia del componente que vamos a probar
  let fixture: ComponentFixture<ResourcesComponent>;  // Contenedor del componente para testing
  let httpMock: HttpTestingController;  // Controlador para simular y verificar requests HTTP
  
  // Spies (Espías) - Objetos que simulan servicios reales
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;
  let sidebarStateSpy: jasmine.SpyObj<SidebarStateService>;

  // URLs de la API para recursos y tipos de recursos
  const apiUrl = `${environment.API_URL}/api/resources`;
  const apiTypesUrl = `${environment.API_URL}/api/resource-types/active`;

  // Mock data: tipos de recursos para usar en las pruebas
  const mockTypes = [
    { _id: 't1', name: 'Muebles', description: 'DescMuebles', active: true },
    { _id: 't2', name: 'Electrónica', active: true }  // Sin descripción para probar casos edge
  ];

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
      declarations: [ResourcesComponent],  // Componente a probar
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
    fixture = TestBed.createComponent(ResourcesComponent);
    component = fixture.componentInstance;

    // Ejecutamos la detección de cambios (dispara ngOnInit)
    fixture.detectChanges(); 

    // El componente hace 2 llamadas HTTP al inicializarse, así que las procesamos:

    // 1. Request para cargar recursos
    const reqResources = httpMock.expectOne(apiUrl);
    reqResources.flush([]);  // Simulamos respuesta vacía de recursos

    // 2. Request para cargar tipos de recursos activos
    const reqTypes = httpMock.expectOne(apiTypesUrl);
    reqTypes.flush({ data: mockTypes });  // Simulamos respuesta con tipos mock
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

  // --- PRUEBAS PARA CARGAR RECURSOS (LOAD RESOURCES) - Manejo de Errores ---

  // Prueba: manejo de error 401 (No autorizado) al cargar recursos
  it('should handle 401 on loadResources', () => {
    component.loadResources();  // Llamamos manualmente a cargar recursos
    const req = httpMock.expectOne(apiUrl);  // Esperamos el request HTTP
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });  // Simulamos error 401
    
    // Verificamos que se llamó a logout y redirección al login
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  // Prueba: manejo de error 403 (Prohibido) al cargar recursos
  it('should handle 403 on loadResources', () => {
    component.loadResources();
    const req = httpMock.expectOne(apiUrl);
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });  // Simulamos error 403
    
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  // Prueba: manejo de error genérico al cargar recursos
  it('should handle generic error on loadResources', () => {
    component.loadResources();
    const req = httpMock.expectOne(apiUrl);
    req.flush('Error', { status: 500, statusText: 'Error' });  // Simulamos error 500
    
    // Verificamos que se estableció el mensaje de error correcto
    expect(component.errorMessage).toBe('Error al cargar los recursos');
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

  // --- PRUEBAS PARA EXTRACCIÓN DE RECURSOS (Diferentes formatos de respuesta) ---

  // Prueba: extraer recursos cuando la respuesta es un array directo
  it('should extract from array', () => {
    component.loadResources();
    const req = httpMock.expectOne(apiUrl);
    req.flush([]);  // Respuesta: array vacío
    expect(component.resources).toEqual([]);  // Debe extraer el array directamente
  });

  // Prueba: extraer recursos cuando la respuesta es { data: array }
  it('should extract from { data: ... }', () => {
    component.loadResources();
    const req = httpMock.expectOne(apiUrl);
    req.flush({ data: [] });  // Respuesta: objeto con propiedad data
    expect(component.resources).toEqual([]);  // Debe extraer de data
  });

  // Prueba: extraer recursos cuando la respuesta es { resources: array }
  it('should extract from { resources: ... }', () => {
    component.loadResources();
    const req = httpMock.expectOne(apiUrl);
    req.flush({ resources: [] });  // Respuesta: objeto con propiedad resources
    expect(component.resources).toEqual([]);  // Debe extraer de resources
  });

  // Prueba: manejo de formato de respuesta desconocido
  it('should return empty array for unknown format', () => {
    component.loadResources();
    const req = httpMock.expectOne(apiUrl);
    req.flush({ unknown: [] });  // Respuesta: formato desconocido
    expect(component.resources).toEqual([]);  // Debe devolver array vacío por defecto
  });

  // --- PRUEBAS PARA CARGAR TIPOS DE RECURSOS ---

  // Prueba: manejo de error al cargar tipos de recursos activos
  it('should handle error loading types', () => {
    component.loadActiveResourceTypes();  // Llamamos manualmente a cargar tipos
    const req = httpMock.expectOne(apiTypesUrl);
    req.flush('Error', { status: 500, statusText: 'Error' });  // Simulamos error
    
    // Verificamos el mensaje de error específico para tipos
    expect(component.errorMessage).toBe('Error al cargar tipos de recursos activos');
  });

  // --- PRUEBAS PARA CREAR RECURSOS (CREATE) - Cobertura de ramas 401 vs 403 ---

  // Prueba: crear recurso exitosamente
  it('createResource should POST and reload', () => {
    component.createResource();  // Llamamos a crear recurso
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');  // Verificamos que sea método POST
    req.flush({});  // Simulamos creación exitosa
    
    // El componente debe recargar la lista después de crear
    httpMock.expectOne(apiUrl).flush([]);
    
    // Verificamos que el loading se desactiva
    expect(component.isLoading).toBeFalse();
  });

  // Prueba: manejo de error 401 al crear recurso (Sesión expirada)
  it('createResource should handle 401 (Session expired)', () => {
    component.createResource();
    const req = httpMock.expectOne(apiUrl);
    req.flush('Auth', { status: 401, statusText: 'Unauthorized' });  // Error 401
    
    // Verificamos el mensaje exacto de la rama 401 (sesión expirada)
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({ 
      message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.' 
    }));
  });

  // Prueba: manejo de error 403 al crear recurso (Permisos insuficientes)
  it('createResource should handle 403 (Permission denied)', () => {
    component.createResource();
    const req = httpMock.expectOne(apiUrl);
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });  // Error 403
    
    // Verificamos el mensaje exacto de la rama 403 (sin permisos)
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({ 
      message: 'No tienes permisos suficientes para esta acción.' 
    }));
  });

  // Prueba: manejo de error genérico con mensaje específico
  it('createResource should handle generic error with message', () => {
    component.createResource();
    const req = httpMock.expectOne(apiUrl);
    req.flush({ message: 'Err' }, { status: 500, statusText: 'Error' });  // Error con mensaje
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({ type: 'create' }));
  });
  
  // Prueba: manejo de error sin mensaje específico
  it('createResource should handle error without message', () => {
    component.createResource();
    const req = httpMock.expectOne(apiUrl);
    req.flush(null, { status: 500, statusText: 'Error' });  // Error sin mensaje
    
    // Verificamos que se muestra el mensaje de error por defecto
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({ 
      message: 'Error al crear el recurso: ' 
    }));
  });

  // --- PRUEBAS PARA ACTUALIZAR RECURSOS (UPDATE) - Cobertura de rama || '' ---

  // Prueba: actualizar recurso exitosamente
  it('updateResource should PUT and reload', () => {
    // Configuramos un recurso en edición
    component.editingResource = { _id: '1', name: 'E', description: '', quantity: 0, cost: 0, resourceType: '', status: '' };
    component.updateResource();  // Llamamos a actualizar
    
    const req = httpMock.expectOne(`${apiUrl}/1`);  // URL específica con ID
    req.flush({});  // Simulamos actualización exitosa
    
    // El componente debe recargar la lista
    httpMock.expectOne(apiUrl).flush([]);
    
    // Verificamos que se limpia el recurso en edición
    expect(component.editingResource).toBeNull();
  });

  // Prueba: no hacer nada si no hay recurso en edición
  it('updateResource should do nothing if not editing', () => {
    component.editingResource = null;  // No hay elemento en edición
    component.updateResource();
    
    // Verificamos que NO se hizo ningún request HTTP
    httpMock.expectNone(apiUrl);
  });

  // Prueba: manejo de error CON mensaje al actualizar
  it('updateResource should handle error WITH message', () => {
    component.editingResource = { _id: '1', name: 'E', description: '', quantity: 0, cost: 0, resourceType: '', status: '' };
    component.updateResource();
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush({ message: 'Fail' }, { status: 500, statusText: 'Error' });  // Error con mensaje
    expect(alertServiceSpy.showError).toHaveBeenCalled();
  });

  // Prueba: manejo de error SIN mensaje al actualizar (Fallback)
  it('updateResource should handle error WITHOUT message (Fallback)', () => {
    component.editingResource = { _id: '1', name: 'E', description: '', quantity: 0, cost: 0, resourceType: '', status: '' };
    component.updateResource();
    const req = httpMock.expectOne(`${apiUrl}/1`);
    
    // Simulamos error nulo para activar el || '' (fallback a string vacío)
    req.flush(null, { status: 500, statusText: 'Error' });
    
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({ 
      message: 'Error al actualizar: '  // Mensaje con string vacío al final
    }));
  });

  // --- PRUEBAS PARA ELIMINAR RECURSOS (DELETE) ---

  // Prueba: eliminar recurso con confirmación del usuario
  it('deleteResource should DELETE if confirmed', () => {
    // Simulamos que el usuario confirma la eliminación
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.deleteResource('1');  // Intentamos eliminar el ID 1
    
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush({});  // Simulamos eliminación exitosa
    
    // El componente debe recargar la lista después de eliminar
    httpMock.expectOne(apiUrl).flush([]);
  });

  // Prueba: NO eliminar si el usuario cancela la confirmación
  it('deleteResource should not delete if cancelled', () => {
    // Simulamos que el usuario cancela la eliminación
    spyOn(globalThis, 'confirm').and.returnValue(false);
    component.deleteResource('1');
    
    // Verificamos que NO se hizo ningún request HTTP
    httpMock.expectNone(`${apiUrl}/1`);
  });

  // Prueba: manejo de error sin mensaje al eliminar
  it('deleteResource should handle error without message', () => {
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.deleteResource('1');
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(null, { status: 500, statusText: 'Error' });  // Error sin mensaje
    
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({ 
      message: 'Error al eliminar: ' 
    }));
  });

  // --- PRUEBAS PARA HELPERS DE UI (Interfaz de usuario) - Separados para cobertura de ELSE ---

  // 1. Pruebas para onNameChange (cambiar nombre)
  it('onNameChange should update newResource when NOT editing (ELSE path)', () => {
    component.editingResource = null; // Forzamos else (no hay edición)
    component.onNameChange('New');
    expect(component.newResource.name).toBe('New');  // Debe actualizar nuevo recurso
  });

  it('onNameChange should update editingResource when editing (IF path)', () => {
    component.editingResource = { name: '', description: '', quantity: 0, cost: 0, resourceType: '', status: '' };
    component.onNameChange('Edit');
    expect(component.editingResource.name).toBe('Edit');  // Debe actualizar recurso en edición
  });

  // 2. Pruebas para onDescriptionChange (cambiar descripción)
  it('onDescriptionChange should update newResource when NOT editing (ELSE path)', () => {
    component.editingResource = null;
    component.onDescriptionChange('NewD');
    expect(component.newResource.description).toBe('NewD');
  });

  it('onDescriptionChange should update editingResource when editing (IF path)', () => {
    component.editingResource = { name: '', description: '', quantity: 0, cost: 0, resourceType: '', status: '' };
    component.onDescriptionChange('EditD');
    expect(component.editingResource.description).toBe('EditD');
  });

  // 3. Pruebas para onQuantityChange (cambiar cantidad)
  it('onQuantityChange should update newResource when NOT editing (ELSE path)', () => {
    component.editingResource = null;
    component.onQuantityChange('5');
    expect(component.newResource.quantity).toBe(5);  // Debe convertir string a número
  });

  it('onQuantityChange should update editingResource when editing (IF path)', () => {
    component.editingResource = { name: '', description: '', quantity: 0, cost: 0, resourceType: '', status: '' };
    component.onQuantityChange('10');
    expect(component.editingResource.quantity).toBe(10);
  });

  // 4. Pruebas para onCostChange (cambiar costo)
  it('onCostChange should update newResource when NOT editing (ELSE path)', () => {
    component.editingResource = null;
    component.onCostChange('50.5');
    expect(component.newResource.cost).toBe(50.5);  // Debe convertir string a número decimal
  });

  it('onCostChange should update editingResource when editing (IF path)', () => {
    component.editingResource = { name: '', description: '', quantity: 0, cost: 0, resourceType: '', status: '' };
    component.onCostChange('100');
    expect(component.editingResource.cost).toBe(100);
  });

  // 5. Pruebas para onFieldChange (cambiar campo genérico)
  it('onFieldChange should update newResource when NOT editing (ELSE path)', () => {
    component.editingResource = null;
    component.onFieldChange('status', 'en_uso');
    expect(component.newResource.status).toBe('en_uso');  // Debe actualizar campo específico
  });

  it('onFieldChange should update editingResource when editing (IF path)', () => {
    component.editingResource = { name: '', description: '', quantity: 0, cost: 0, resourceType: '', status: '' };
    component.onFieldChange('resourceType', 't1');
    expect(component.editingResource.resourceType).toBe('t1');
  });

  // --- Otros Helpers ---

  // Prueba: editar un recurso (copia el objeto)
  it('editResource should copy object', () => {
    const res = { name: 'R', description: '', quantity: 0, cost: 0, resourceType: '', status: '' };
    component.editResource(res);
    // Verificamos que se copió el objeto (no es la misma referencia)
    expect(component.editingResource).toEqual(res);
  });

  // Prueba: cancelar edición (limpia el objeto en edición)
  it('cancelEdit should clear object', () => {
    component.editingResource = { name: '', description: '', quantity: 0, cost: 0, resourceType: '', status: '' };
    component.cancelEdit();
    expect(component.editingResource).toBeNull();  // Debe ser null
  });

  // --- PRUEBAS PARA HELPERS DE VISUALIZACIÓN (DISPLAY HELPERS) ---

  describe('Display Helpers', () => {
    // Prueba: obtener nombre del tipo de recurso en diferentes casos
    it('getResourceTypeName handles various cases', () => {
      // Caso 1: resourceType es string ID existente
      expect(component.getResourceTypeName({ resourceType: 't1' } as any)).toBe('Muebles');
      
      // Caso 2: resourceType es string ID no existente
      expect(component.getResourceTypeName({ resourceType: 'tx' } as any)).toBe('Desconocido');
      
      // Caso 3: resourceType es objeto con nombre
      expect(component.getResourceTypeName({ resourceType: { name: 'Obj' } } as any)).toBe('Obj');
      
      // Caso 4: resourceType es objeto con nombre vacío
      expect(component.getResourceTypeName({ resourceType: { name: '' } } as any)).toBe('Desconocido');
      
      // Caso 5: resourceType es null
      expect(component.getResourceTypeName({ resourceType: null } as any)).toBe('Sin tipo');
    });

    // Prueba: obtener descripción del tipo de recurso en diferentes casos
    it('getResourceDescription handles various cases', () => {
      // Caso 1: resourceType es null
      expect(component.getResourceDescription({ resourceType: null } as any)).toBeNull();
      
      // Caso 2: resourceType es string ID existente
      expect(component.getResourceDescription({ resourceType: 't1' } as any)).toBe('DescMuebles');
      
      // Caso 3: resourceType es string ID no existente
      expect(component.getResourceDescription({ resourceType: 'tx' } as any)).toBeNull();
      
      // Caso 4: resourceType es objeto con descripción
      expect(component.getResourceDescription({ resourceType: { description: 'D' } } as any)).toBe('D');
      
      // Caso 5: resourceType es objeto con descripción vacía (rama faltante)
      expect(component.getResourceDescription({ resourceType: { description: '' } } as any)).toBeNull();
    });

    // Prueba: obtener etiqueta del estado
    it('getStatusLabel handles cases', () => {
      // Caso 1: estado conocido
      expect(component.getStatusLabel('disponible')).toBe('Disponible');
      
      // Caso 2: estado desconocido (debe devolver el mismo valor)
      expect(component.getStatusLabel('unknown')).toBe('unknown');
    });
  });
});
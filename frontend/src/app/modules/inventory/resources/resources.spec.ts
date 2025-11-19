import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { ResourcesComponent } from './resources';
import { AuthService } from '../../../core/services/auth';
import { AlertService } from '../../../core/services/alert';
import { SidebarStateService } from '../../../core/services/sidebar-state';
import { environment } from '../../../../environments/environment';

describe('ResourcesComponent', () => {
  let component: ResourcesComponent;
  let fixture: ComponentFixture<ResourcesComponent>;
  let httpMock: HttpTestingController;
  
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;
  let sidebarStateSpy: jasmine.SpyObj<SidebarStateService>;

  const apiUrl = `${environment.API_URL}/api/resources`;
  const apiTypesUrl = `${environment.API_URL}/api/resource-types/active`;

  const mockTypes = [
    { _id: 't1', name: 'Muebles', description: 'DescMuebles', active: true },
    { _id: 't2', name: 'Electrónica', active: true }
  ];

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    alertServiceSpy = jasmine.createSpyObj('AlertService', ['showError']);
    sidebarStateSpy = { isOpen: false } as any;

    authServiceSpy.getToken.and.returnValue('test-token');

    await TestBed.configureTestingModule({
      declarations: [ResourcesComponent],
      imports: [FormsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: AlertService, useValue: alertServiceSpy },
        { provide: SidebarStateService, useValue: sidebarStateSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ResourcesComponent);
    component = fixture.componentInstance;

    fixture.detectChanges(); 

    const reqResources = httpMock.expectOne(apiUrl);
    reqResources.flush([]);

    const reqTypes = httpMock.expectOne(apiTypesUrl);
    reqTypes.flush({ data: mockTypes });
  });

  afterEach(() => {
    httpMock.verify();
  });

  // --- PRUEBAS BÁSICAS ---

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- LOAD RESOURCES (Errores de Carga) ---

  it('should handle 401 on loadResources', () => {
    component.loadResources();
    const req = httpMock.expectOne(apiUrl);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle 403 on loadResources', () => {
    component.loadResources();
    const req = httpMock.expectOne(apiUrl);
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle generic error on loadResources', () => {
    component.loadResources();
    const req = httpMock.expectOne(apiUrl);
    req.flush('Error', { status: 500, statusText: 'Error' });
    expect(component.errorMessage).toBe('Error al cargar los recursos');
  });

  it('should redirect if no token', () => {
    authServiceSpy.getToken.and.returnValue(null);
    try { component['getAuthHeaders'](); } catch (e) {}
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  // --- EXTRACT RESOURCES ---

  it('should extract from array', () => {
    component.loadResources();
    const req = httpMock.expectOne(apiUrl);
    req.flush([]);
    expect(component.resources).toEqual([]);
  });

  it('should extract from { data: ... }', () => {
    component.loadResources();
    const req = httpMock.expectOne(apiUrl);
    req.flush({ data: [] });
    expect(component.resources).toEqual([]);
  });

  it('should extract from { resources: ... }', () => {
    component.loadResources();
    const req = httpMock.expectOne(apiUrl);
    req.flush({ resources: [] });
    expect(component.resources).toEqual([]);
  });

  it('should return empty array for unknown format', () => {
    component.loadResources();
    const req = httpMock.expectOne(apiUrl);
    req.flush({ unknown: [] });
    expect(component.resources).toEqual([]);
  });

  // --- LOAD TYPES ---

  it('should handle error loading types', () => {
    component.loadActiveResourceTypes();
    const req = httpMock.expectOne(apiTypesUrl);
    req.flush('Error', { status: 500, statusText: 'Error' });
    expect(component.errorMessage).toBe('Error al cargar tipos de recursos activos');
  });

  // --- CREATE (Cobertura de ramas 401 vs 403) ---

  it('createResource should POST and reload', () => {
    component.createResource();
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush({});
    httpMock.expectOne(apiUrl).flush([]);
    expect(component.isLoading).toBeFalse();
  });

  it('createResource should handle 401 (Session expired)', () => {
    component.createResource();
    const req = httpMock.expectOne(apiUrl);
    req.flush('Auth', { status: 401, statusText: 'Unauthorized' });
    
    // Verificamos el mensaje exacto de la rama 401
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({ 
      message: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.' 
    }));
  });

  it('createResource should handle 403 (Permission denied)', () => {
    component.createResource();
    const req = httpMock.expectOne(apiUrl);
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    
    // Verificamos el mensaje exacto de la rama 403
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({ 
      message: 'No tienes permisos suficientes para esta acción.' 
    }));
  });

  it('createResource should handle generic error with message', () => {
    component.createResource();
    const req = httpMock.expectOne(apiUrl);
    req.flush({ message: 'Err' }, { status: 500, statusText: 'Error' });
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({ type: 'create' }));
  });
  
  it('createResource should handle error without message', () => {
    component.createResource();
    const req = httpMock.expectOne(apiUrl);
    req.flush(null, { status: 500, statusText: 'Error' });
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({ message: 'Error al crear el recurso: ' }));
  });

  // --- UPDATE (Cobertura de rama || '') ---

  it('updateResource should PUT and reload', () => {
    component.editingResource = { _id: '1', name: 'E', description: '', quantity: 0, cost: 0, resourceType: '', status: '' };
    component.updateResource();
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush({});
    httpMock.expectOne(apiUrl).flush([]);
    expect(component.editingResource).toBeNull();
  });

  it('updateResource should do nothing if not editing', () => {
    component.editingResource = null;
    component.updateResource();
    httpMock.expectNone(apiUrl);
  });

  it('updateResource should handle error WITH message', () => {
    component.editingResource = { _id: '1', name: 'E', description: '', quantity: 0, cost: 0, resourceType: '', status: '' };
    component.updateResource();
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush({ message: 'Fail' }, { status: 500, statusText: 'Error' });
    expect(alertServiceSpy.showError).toHaveBeenCalled();
  });

  it('updateResource should handle error WITHOUT message (Fallback)', () => {
    component.editingResource = { _id: '1', name: 'E', description: '', quantity: 0, cost: 0, resourceType: '', status: '' };
    component.updateResource();
    const req = httpMock.expectOne(`${apiUrl}/1`);
    
    // Simulamos error nulo para activar el || ''
    req.flush(null, { status: 500, statusText: 'Error' });
    
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({ 
      message: 'Error al actualizar: ' 
    }));
  });

  // --- DELETE ---

  it('deleteResource should DELETE if confirmed', () => {
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.deleteResource('1');
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush({});
    httpMock.expectOne(apiUrl).flush([]);
  });

  it('deleteResource should not delete if cancelled', () => {
    spyOn(globalThis, 'confirm').and.returnValue(false);
    component.deleteResource('1');
    httpMock.expectNone(`${apiUrl}/1`);
  });

  it('deleteResource should handle error without message', () => {
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.deleteResource('1');
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(null, { status: 500, statusText: 'Error' });
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({ message: 'Error al eliminar: ' }));
  });

  // --- UI HELPERS (Separados para cobertura de ELSE) ---

  // 1. onNameChange
  it('onNameChange should update newResource when NOT editing (ELSE path)', () => {
    component.editingResource = null; // Forzamos else
    component.onNameChange('New');
    expect(component.newResource.name).toBe('New');
  });

  it('onNameChange should update editingResource when editing (IF path)', () => {
    component.editingResource = { name: '', description: '', quantity: 0, cost: 0, resourceType: '', status: '' };
    component.onNameChange('Edit');
    expect(component.editingResource.name).toBe('Edit');
  });

  // 2. onDescriptionChange
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

  // 3. onQuantityChange
  it('onQuantityChange should update newResource when NOT editing (ELSE path)', () => {
    component.editingResource = null;
    component.onQuantityChange('5');
    expect(component.newResource.quantity).toBe(5);
  });

  it('onQuantityChange should update editingResource when editing (IF path)', () => {
    component.editingResource = { name: '', description: '', quantity: 0, cost: 0, resourceType: '', status: '' };
    component.onQuantityChange('10');
    expect(component.editingResource.quantity).toBe(10);
  });

  // 4. onCostChange
  it('onCostChange should update newResource when NOT editing (ELSE path)', () => {
    component.editingResource = null;
    component.onCostChange('50.5');
    expect(component.newResource.cost).toBe(50.5);
  });

  it('onCostChange should update editingResource when editing (IF path)', () => {
    component.editingResource = { name: '', description: '', quantity: 0, cost: 0, resourceType: '', status: '' };
    component.onCostChange('100');
    expect(component.editingResource.cost).toBe(100);
  });

  // 5. onFieldChange
  it('onFieldChange should update newResource when NOT editing (ELSE path)', () => {
    component.editingResource = null;
    component.onFieldChange('status', 'en_uso');
    expect(component.newResource.status).toBe('en_uso');
  });

  it('onFieldChange should update editingResource when editing (IF path)', () => {
    component.editingResource = { name: '', description: '', quantity: 0, cost: 0, resourceType: '', status: '' };
    component.onFieldChange('resourceType', 't1');
    expect(component.editingResource.resourceType).toBe('t1');
  });

  // --- Otros Helpers ---

  it('editResource should copy object', () => {
    const res = { name: 'R', description: '', quantity: 0, cost: 0, resourceType: '', status: '' };
    component.editResource(res);
    expect(component.editingResource).toEqual(res);
  });

  it('cancelEdit should clear object', () => {
    component.editingResource = { name: '', description: '', quantity: 0, cost: 0, resourceType: '', status: '' };
    component.cancelEdit();
    expect(component.editingResource).toBeNull();
  });

  // --- DISPLAY HELPERS ---

  describe('Display Helpers', () => {
    it('getResourceTypeName handles various cases', () => {
      expect(component.getResourceTypeName({ resourceType: 't1' } as any)).toBe('Muebles');
      expect(component.getResourceTypeName({ resourceType: 'tx' } as any)).toBe('Desconocido');
      expect(component.getResourceTypeName({ resourceType: { name: 'Obj' } } as any)).toBe('Obj');
      expect(component.getResourceTypeName({ resourceType: { name: '' } } as any)).toBe('Desconocido');
      expect(component.getResourceTypeName({ resourceType: null } as any)).toBe('Sin tipo');
    });

    it('getResourceDescription handles various cases', () => {
      expect(component.getResourceDescription({ resourceType: null } as any)).toBeNull();
      expect(component.getResourceDescription({ resourceType: 't1' } as any)).toBe('DescMuebles');
      expect(component.getResourceDescription({ resourceType: 'tx' } as any)).toBeNull();
      expect(component.getResourceDescription({ resourceType: { description: 'D' } } as any)).toBe('D');
      // Prueba explícita para objeto sin descripción (rama faltante)
      expect(component.getResourceDescription({ resourceType: { description: '' } } as any)).toBeNull();
    });

    it('getStatusLabel handles cases', () => {
      expect(component.getStatusLabel('disponible')).toBe('Disponible');
      expect(component.getStatusLabel('unknown')).toBe('unknown');
    });
  });
});
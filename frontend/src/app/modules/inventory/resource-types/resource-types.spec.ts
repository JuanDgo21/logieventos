import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { ResourceTypesComponent } from './resource-types';
import { AuthService } from '../../../core/services/auth';
import { AlertService } from '../../../core/services/alert';
import { SidebarStateService } from '../../../core/services/sidebar-state';
import { environment } from '../../../../environments/environment';

describe('ResourceTypesComponent', () => {
  let component: ResourceTypesComponent;
  let fixture: ComponentFixture<ResourceTypesComponent>;
  let httpMock: HttpTestingController;
  
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;
  let sidebarStateSpy: jasmine.SpyObj<SidebarStateService>;

  const apiUrl = `${environment.API_URL}/api/resource-types`;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    alertServiceSpy = jasmine.createSpyObj('AlertService', ['showError']);
    sidebarStateSpy = { isOpen: false } as any;

    authServiceSpy.getToken.and.returnValue('test-token');

    await TestBed.configureTestingModule({
      declarations: [ResourceTypesComponent],
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
    fixture = TestBed.createComponent(ResourceTypesComponent);
    component = fixture.componentInstance;

    fixture.detectChanges(); 
    
    // Limpiar la petición inicial del constructor
    const req = httpMock.expectOne(apiUrl);
    req.flush({ data: [] });
  });

  afterEach(() => {
    httpMock.verify();
  });

  // --- PRUEBAS BÁSICAS ---

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle 401 error on load', () => {
    component.loadResourceTypes();
    const req = httpMock.expectOne(apiUrl);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle 403 error on load', () => {
    component.loadResourceTypes();
    const req = httpMock.expectOne(apiUrl);
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should handle 500 error on load', () => {
    component.loadResourceTypes();
    const req = httpMock.expectOne(apiUrl);
    req.flush('Error', { status: 500, statusText: 'Error' });
    expect(component.errorMessage).toBe('Error al cargar los tipos de recurso');
  });

  it('should redirect if no token', () => {
    authServiceSpy.getToken.and.returnValue(null);
    try { component['getAuthHeaders'](); } catch (e) {}
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('loadResourceTypes should handle null data response', () => {
    component.loadResourceTypes();
    const req = httpMock.expectOne(apiUrl);
    req.flush({ data: null });
    expect(component.resourceTypes).toEqual([]);
  });

  // --- CREATE ---

  it('createResourceType should POST and reload', () => {
    component.newResourceType = { name: 'N', description: 'D', active: true };
    component.createResourceType();
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush({});
    httpMock.expectOne(apiUrl).flush({ data: [] });
    expect(component.successMessage).toContain('creado');
  });

  it('createResourceType should handle 403', () => {
    component.createResourceType();
    const req = httpMock.expectOne(apiUrl);
    req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    expect(alertServiceSpy.showError).toHaveBeenCalled();
  });

  it('createResourceType should handle 401', () => {
    component.createResourceType();
    const req = httpMock.expectOne(apiUrl);
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(alertServiceSpy.showError).toHaveBeenCalled();
  });

  it('createResourceType should handle generic error', () => {
    component.createResourceType();
    const req = httpMock.expectOne(apiUrl);
    req.flush({ message: 'Err' }, { status: 500, statusText: 'Error' });
    expect(alertServiceSpy.showError).toHaveBeenCalled();
  });

  it('createResourceType should handle error without message', () => {
    component.createResourceType();
    const req = httpMock.expectOne(apiUrl);
    req.flush(null, { status: 500, statusText: 'Error' });
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({ message: 'Error al crear el tipo recurso: ' }));
  });

  // --- UPDATE ---

  it('updateResourceType should PUT and reload', () => {
    component.editingResourceType = { _id: '1', name: 'E', description: 'D', active: true };
    component.updateResourceType();
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
    httpMock.expectOne(apiUrl).flush({ data: [] });
    expect(component.successMessage).toContain('actualizado');
  });

  it('updateResourceType should do nothing if not editing', () => {
    component.editingResourceType = null;
    component.updateResourceType();
    httpMock.expectNone(`${apiUrl}/undefined`);
  });

  it('updateResourceType should handle error without message', () => {
    component.editingResourceType = { _id: '1', name: 'E', description: 'D', active: true };
    component.updateResourceType();
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(null, { status: 500, statusText: 'Error' });
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({ message: 'Error al actualizar: ' }));
  });

  // --- DELETE ---

  it('deleteResourceType should DELETE if confirmed', () => {
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.deleteResourceType('1');
    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
    httpMock.expectOne(apiUrl).flush({ data: [] });
    expect(component.successMessage).toContain('eliminado');
  });

  it('deleteResourceType should NOT delete if cancelled', () => {
    spyOn(globalThis, 'confirm').and.returnValue(false);
    component.deleteResourceType('1');
    httpMock.expectNone(`${apiUrl}/1`);
  });

  it('deleteResourceType should handle error without message', () => {
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.deleteResourceType('1');
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(null, { status: 500, statusText: 'Error' });
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({ message: 'Error al eliminar: ' }));
  });

  // --- TOGGLE STATUS (AQUÍ ESTÁ LA CLAVE) ---

  // 1. Caso: De Activo a Inactivo (mensaje 'desactivado')
  it('toggleStatus should show "desactivado" success message', () => {
    const item = { _id: '1', name: 'T', description: 'D', active: true }; // Está activo
    component.toggleStatus(item);

    const req = httpMock.expectOne(`${apiUrl}/1`);
    // Esperamos que envíe active: false
    expect(req.request.body).toEqual({ active: false });
    req.flush({}); // Éxito

    httpMock.expectOne(apiUrl).flush({ data: [] }); // Reload
    
    // updatedResourceType.active será false -> 'desactivado'
    expect(component.successMessage).toContain('desactivado exitosamente');
  });

  // 2. Caso: De Inactivo a Activo (mensaje 'activado') [LA RAMA QUE FALTABA]
  it('toggleStatus should show "activado" success message', () => {
    const item = { _id: '1', name: 'T', description: 'D', active: false }; // Está inactivo
    component.toggleStatus(item);

    const req = httpMock.expectOne(`${apiUrl}/1`);
    // Esperamos que envíe active: true
    expect(req.request.body).toEqual({ active: true });
    req.flush({}); // Éxito

    httpMock.expectOne(apiUrl).flush({ data: [] }); // Reload

    // updatedResourceType.active será true -> 'activado'
    expect(component.successMessage).toContain('activado exitosamente');
  });

  it('toggleStatus should handle error without message', () => {
    const item = { _id: '1', name: 'T', description: 'D', active: true };
    component.toggleStatus(item);
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(null, { status: 500, statusText: 'Error' });
    expect(component.errorMessage).toBe('Error al cambiar el estado');
  });

  // --- UI HELPERS ---

  it('onNameChange handlers', () => {
    component.editingResourceType = null;
    component.onNameChange('A');
    expect(component.newResourceType.name).toBe('A');
    
    component.editingResourceType = { name: '', description: '', active: true };
    component.onNameChange('B');
    expect(component.editingResourceType.name).toBe('B');
  });

  it('onDescriptionChange handlers', () => {
    component.editingResourceType = null;
    component.onDescriptionChange('A');
    expect(component.newResourceType.description).toBe('A');

    component.editingResourceType = { name: '', description: '', active: true };
    component.onDescriptionChange('B');
    expect(component.editingResourceType.description).toBe('B');
  });

  it('onActiveChange handlers', () => {
    component.editingResourceType = { name: '', description: '', active: true };
    component.onActiveChange(false);
    expect(component.editingResourceType.active).toBeFalse();
  });
  
  it('onActiveChange should do nothing if not editing', () => {
    component.editingResourceType = null;
    component.onActiveChange(false);
    expect(component.editingResourceType).toBeNull();
  });

  it('editResourceType copies object', () => {
    const item = { _id: '1', name: 'A', description: 'B', active: true };
    component.editResourceType(item);
    expect(component.editingResourceType).toEqual(item);
  });

  it('cancelEdit clears object', () => {
    component.editingResourceType = { name: '', description: '', active: true };
    component.cancelEdit();
    expect(component.editingResourceType).toBeNull();
  });

  it('showSuccess clears message', fakeAsync(() => {
    (component as any).showSuccess('Msg');
    expect(component.successMessage).toBe('Msg');
    tick(3000);
    expect(component.successMessage).toBe('');
  }));
});
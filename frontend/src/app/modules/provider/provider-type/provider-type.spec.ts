import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { ProviderTypeComponent, ProviderType } from './provider-type';
import { AuthService } from '../../../core/services/auth';
import { AlertService } from '../../../core/services/alert';
import { SidebarStateService } from '../../../core/services/sidebar-state';
import { environment } from '../../../../environments/environment';

describe('ProviderTypeComponent', () => {
  let component: ProviderTypeComponent;
  let fixture: ComponentFixture<ProviderTypeComponent>;
  let httpMock: HttpTestingController;
  
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;
  let sidebarStateSpy: jasmine.SpyObj<SidebarStateService>;

  const apiUrl = `${environment.API_URL}/api/provider-types`;

  beforeEach(async () => {
    // 1. Mocks
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    alertServiceSpy = jasmine.createSpyObj('AlertService', ['showError']);
    sidebarStateSpy = { isOpen: false } as any;

    authServiceSpy.getToken.and.returnValue('test-token');

    // 2. Configuración del Módulo
    await TestBed.configureTestingModule({
      declarations: [ProviderTypeComponent], // Componente no standalone
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

    // 3. Inicialización
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProviderTypeComponent);
    component = fixture.componentInstance;

    fixture.detectChanges(); // Dispara ngOnInit -> loadProviderTypes

    // 4. Limpiar petición inicial
    const req = httpMock.expectOne(apiUrl);
    req.flush({ data: [] }); // Empezamos vacíos
  });

  afterEach(() => {
    httpMock.verify();
  });

  // --- PRUEBAS BÁSICAS ---

  it('should create and initialize', () => {
    expect(component).toBeTruthy();
    expect(component.sidebarState.isOpen).toBeTrue();
  });

  it('should handle error loading types', () => {
    // Forzamos recarga
    component.loadProviderTypes();
    const req = httpMock.expectOne(apiUrl);
    req.flush('Error', { status: 500, statusText: 'Server Error' });
    
    expect(component.errorMessage).toBe('Error al cargar tipos de proveedor');
    expect(component.isLoading).toBeFalse();
  });

  it('loadProviderTypes should handle null data response (fallback)', () => {
    component.loadProviderTypes();
    const req = httpMock.expectOne(apiUrl);
    req.flush({ data: null });
    expect(component.providerTypes).toEqual([]);
  });

  // --- AUTH ---

  it('should redirect if no token', () => {
    authServiceSpy.getToken.and.returnValue(null);
    try { component['getAuthHeaders'](); } catch (e) {}
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  // --- CREATE ---

  it('createProviderType should POST and reload', () => {
    component.newProviderType = { name: 'New', description: 'D', isActive: true };
    component.createProviderType();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush({});

    // Reload automático
    const reqReload = httpMock.expectOne(apiUrl);
    reqReload.flush({ data: [] });

    expect(component.successMessage).toContain('creado exitosamente');
    expect(component.newProviderType.name).toBe(''); // Reset check
  });

  it('createProviderType should handle error with message', () => {
    component.createProviderType();
    const req = httpMock.expectOne(apiUrl);
    req.flush({ message: 'Duplicado' }, { status: 400, statusText: 'Bad Request' });
    
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Duplicado'
    }));
  });

  it('createProviderType should handle error without message (fallback)', () => {
    component.createProviderType();
    const req = httpMock.expectOne(apiUrl);
    req.flush(null, { status: 500, statusText: 'Server Error' });
    
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Error al crear tipo de proveedor'
    }));
  });

  // --- UPDATE ---

  it('updateProviderType should PUT and reload', () => {
    component.editingProviderType = { _id: '1', name: 'Edit', isActive: true };
    component.updateProviderType();

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush({});

    const reqReload = httpMock.expectOne(apiUrl);
    reqReload.flush({ data: [] });

    expect(component.successMessage).toContain('actualizado exitosamente');
    expect(component.editingProviderType).toBeNull();
  });

  it('updateProviderType should do nothing if no ID', () => {
    // Caso donde editingProviderType existe pero no tiene _id
    component.editingProviderType = { name: 'No ID', isActive: true };
    component.updateProviderType();
    httpMock.expectNone(apiUrl);
  });

  it('updateProviderType should do nothing if null', () => {
    component.editingProviderType = null;
    component.updateProviderType();
    httpMock.expectNone(apiUrl);
  });

  it('updateProviderType should handle error with message', () => {
    component.editingProviderType = { _id: '1', name: 'E', isActive: true };
    component.updateProviderType();
    
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush({ message: 'Fail' }, { status: 500, statusText: 'Error' });

    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Fail'
    }));
  });

  it('updateProviderType should handle error without message (fallback)', () => {
    component.editingProviderType = { _id: '1', name: 'E', isActive: true };
    component.updateProviderType();
    
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(null, { status: 500, statusText: 'Error' });

    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Error al actualizar tipo de proveedor'
    }));
  });

  // --- DELETE ---

  it('deleteProviderType should DELETE if confirmed', () => {
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.deleteProviderType('1');

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});

    const reqReload = httpMock.expectOne(apiUrl);
    reqReload.flush({ data: [] });

    expect(component.successMessage).toContain('eliminado exitosamente');
  });

  it('deleteProviderType should NOT delete if cancelled', () => {
    spyOn(globalThis, 'confirm').and.returnValue(false);
    component.deleteProviderType('1');
    httpMock.expectNone(`${apiUrl}/1`);
  });

  it('deleteProviderType should NOT delete if no ID', () => {
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.deleteProviderType('');
    httpMock.expectNone(`${apiUrl}/`);
  });

  it('deleteProviderType should handle error without message (fallback)', () => {
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.deleteProviderType('1');

    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(null, { status: 500, statusText: 'Error' });

    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Error al eliminar tipo de proveedor'
    }));
  });

  it('deleteProviderType should handle error with message', () => {
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.deleteProviderType('1');

    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush({ message: 'In use' }, { status: 500, statusText: 'Error' });

    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'In use'
    }));
  });

  // --- TOGGLE STATUS ---

  it('toggleStatus should do nothing if no ID', () => {
    component.toggleStatus({ name: 'No ID', isActive: true });
    httpMock.expectNone(`${apiUrl}/undefined`);
  });

  it('toggleStatus should PUT inverted status and reload', () => {
    const item: ProviderType = { _id: '1', name: 'T', isActive: true };
    component.toggleStatus(item);

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ ...item, isActive: false }); // Invertido
    req.flush({});

    httpMock.expectOne(apiUrl).flush({ data: [] });
    expect(component.successMessage).toContain('desactivado exitosamente');
  });

  it('toggleStatus should show "activado" message', () => {
    const item: ProviderType = { _id: '1', name: 'T', isActive: false };
    component.toggleStatus(item);

    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush({});

    httpMock.expectOne(apiUrl).flush({ data: [] });
    expect(component.successMessage).toContain('activado exitosamente');
  });

  it('toggleStatus should handle error without message (fallback)', () => {
    const item: ProviderType = { _id: '1', name: 'T', isActive: true };
    component.toggleStatus(item);

    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(null, { status: 500, statusText: 'Error' });

    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Error al cambiar estado'
    }));
  });

  it('toggleStatus should handle error with message', () => {
    const item: ProviderType = { _id: '1', name: 'T', isActive: true };
    component.toggleStatus(item);

    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush({ message: 'Fail toggle' }, { status: 500, statusText: 'Error' });

    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Fail toggle'
    }));
  });

  // --- UI HELPERS ---

  it('editProviderType should copy object', () => {
    const item = { _id: '1', name: 'A', isActive: true };
    component.editProviderType(item);
    expect(component.editingProviderType).toEqual(item);
    expect(component.editingProviderType).not.toBe(item);
  });

  it('cancelEdit should clear object', () => {
    component.editingProviderType = { name: '', isActive: true };
    component.cancelEdit();
    expect(component.editingProviderType).toBeNull();
  });

  it('showSuccess should clear message after 3s', fakeAsync(() => {
    (component as any).showSuccess('Msg');
    expect(component.successMessage).toBe('Msg');
    tick(3000);
    expect(component.successMessage).toBe('');
  }));

  it('getActiveStatusText should return constant', () => {
    expect(component.getActiveStatusText()).toBe('Activo');
  });

  it('getInactiveStatusText should return constant', () => {
    expect(component.getInactiveStatusText()).toBe('Inactivo');
  });

  // --- VALIDATION HELPER (isValidProviderType) ---

  it('isValidProviderType should validate name length', () => {
    // Muy corto
    expect(component.isValidProviderType({ name: 'No', isActive: true })).toBeFalse();
    
    // Límite inferior (3)
    expect(component.isValidProviderType({ name: 'Yes', isActive: true })).toBeTrue();
    
    // Válido
    expect(component.isValidProviderType({ name: 'Valid Name', isActive: true })).toBeTrue();

    // Límite superior (50) - Creamos string de 50 chars
    const longName50 = 'a'.repeat(50);
    expect(component.isValidProviderType({ name: longName50, isActive: true })).toBeTrue();

    // Muy largo (51)
    const longName51 = 'a'.repeat(51);
    expect(component.isValidProviderType({ name: longName51, isActive: true })).toBeFalse();
  });

});
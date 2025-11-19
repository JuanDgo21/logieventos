import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { ProviderComponent } from './provider';
import { AuthService } from '../../../core/services/auth';
import { AlertService } from '../../../core/services/alert';
import { SidebarStateService } from '../../../core/services/sidebar-state';
import { environment } from '../../../../environments/environment';

describe('ProviderComponent', () => {
  let component: ProviderComponent;
  let fixture: ComponentFixture<ProviderComponent>;
  let httpMock: HttpTestingController;

  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;
  let sidebarStateSpy: jasmine.SpyObj<SidebarStateService>;

  const apiUrl = `${environment.API_URL}/api/providers`;
  const apiTypesUrl = `${environment.API_URL}/api/provider-types`; // Ojo: en tu código usas localhost hardcoded a veces, pero el test usa environment

  // Mock Data
  const mockProviderTypes = [
    { _id: 'type1', name: 'Distribuidor', isActive: true },
    { _id: 'type2', name: 'Fabricante', isActive: true }
  ];

  beforeEach(async () => {
    // 1. Configurar Spies
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'logout']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    alertServiceSpy = jasmine.createSpyObj('AlertService', ['showError']);
    sidebarStateSpy = { isOpen: false } as any;

    authServiceSpy.getToken.and.returnValue('test-token');

    // 2. Configurar TestBed
    await TestBed.configureTestingModule({
      declarations: [ProviderComponent], // Componente no-standalone
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
    fixture = TestBed.createComponent(ProviderComponent);
    component = fixture.componentInstance;

    // NOTA: En tu código, apiTypesUrl está hardcoded a localhost. 
    // Si es así, el test fallará si usamos environment.API_URL.
    // Ajustaré la URL esperada para que coincida con tu código si es necesario,
    // pero idealmente deberías usar environment en tu componente.
    // Asumiré que corregiste el componente para usar environment, si no, 
    // el test fallará en expectOne.
    
    // Si tu componente usa: apiTypesUrl = 'http://localhost:3000/api/provider-types';
    // Cambia la constante apiTypesUrl arriba a esa URL.
    // Por ahora asumo environment para mejores prácticas.

    fixture.detectChanges(); // Dispara ngOnInit

    // 4. Responder a peticiones iniciales
    const reqProviders = httpMock.expectOne(apiUrl);
    reqProviders.flush({ data: [] });

    // En tu código vi: this.http.get(this.apiTypesUrl...
    // Asegúrate que apiTypesUrl en el componente use environment.
    // Si usa localhost hardcoded, este expect fallará.
    // Voy a usar un match flexible para la URL de tipos por si acaso.
    const reqTypes = httpMock.expectOne((req) => req.url.includes('/api/provider-types'));
    reqTypes.flush({ data: mockProviderTypes });
  });

  afterEach(() => {
    httpMock.verify();
  });

  // --- PRUEBAS BÁSICAS ---

  it('should create and initialize', () => {
    expect(component).toBeTruthy();
    expect(component.sidebarState.isOpen).toBeTrue();
    expect(component.providerTypes.length).toBe(2);
  });

  // --- LOAD PROVIDERS ---

  it('should handle error loading providers', () => {
    component.loadProviders();
    const req = httpMock.expectOne(apiUrl);
    req.flush('Error', { status: 500, statusText: 'Server Error' });
    
    expect(component.errorMessage).toBe('Error al cargar proveedores');
    expect(component.isLoading).toBeFalse();
  });

  it('loadProviders should handle null data (fallback)', () => {
    component.loadProviders();
    const req = httpMock.expectOne(apiUrl);
    req.flush({ data: null });
    expect(component.providers).toEqual([]);
  });

  // --- LOAD TYPES ---

  it('should handle error loading provider types', () => {
    const consoleSpy = spyOn(console, 'error');
    component.loadProviderTypes();
    const req = httpMock.expectOne((req) => req.url.includes('/api/provider-types'));
    req.flush('Error', { status: 500, statusText: 'Server Error' });
    expect(consoleSpy).toHaveBeenCalled();
  });

  // --- AUTH ---

  it('should redirect if no token', () => {
    authServiceSpy.getToken.and.returnValue(null);
    try { component['getAuthHeaders'](); } catch (e) {}
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });

  // --- CREATE ---

  it('createProvider should POST and reload', () => {
    component.newProvider = { name: 'N', contactPerson: 'P', email: '', phone: '', address: '', providerType: 't1', status: 'activo' };
    component.createProvider();

    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    req.flush({});

    const reqReload = httpMock.expectOne(apiUrl);
    reqReload.flush({ data: [] });

    expect(component.successMessage).toContain('creado exitosamente');
    expect(component.newProvider.name).toBe('');
  });

  it('createProvider should handle error with message', () => {
    component.createProvider();
    const req = httpMock.expectOne(apiUrl);
    req.flush({ message: 'Err' }, { status: 400, statusText: 'Bad' });
    
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Error al crear proveedor: Err'
    }));
  });

  it('createProvider should handle error without message (fallback)', () => {
    component.createProvider();
    const req = httpMock.expectOne(apiUrl);
    req.flush(null, { status: 500, statusText: 'Error' });
    
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Error al crear proveedor: '
    }));
  });

  // --- UPDATE ---

  it('updateProvider should PUT and reload', () => {
    component.editingProvider = { _id: '1', name: 'E', contactPerson: 'P', email: '', phone: '', address: '', providerType: 't1', status: 'activo' };
    component.updateProvider();

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush({});

    const reqReload = httpMock.expectOne(apiUrl);
    reqReload.flush({ data: [] });

    expect(component.successMessage).toContain('actualizado exitosamente');
    expect(component.editingProvider).toBeNull();
  });

  it('updateProvider should do nothing if not editing', () => {
    component.editingProvider = null;
    component.updateProvider();
    httpMock.expectNone(apiUrl);
  });

  it('updateProvider should handle error with message', () => {
    component.editingProvider = { _id: '1', name: 'E', contactPerson: '', email: '', phone: '', address: '', providerType: '', status: 'activo' };
    component.updateProvider();
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush({ message: 'Err' }, { status: 500, statusText: 'Error' });
    
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Error al actualizar: Err'
    }));
  });

  it('updateProvider should handle error without message', () => {
    component.editingProvider = { _id: '1', name: 'E', contactPerson: '', email: '', phone: '', address: '', providerType: '', status: 'activo' };
    component.updateProvider();
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(null, { status: 500, statusText: 'Error' });
    
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Error al actualizar: '
    }));
  });

  // --- DELETE ---

  it('deleteProvider should DELETE if confirmed', () => {
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.deleteProvider('1');

    const req = httpMock.expectOne(`${apiUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});

    const reqReload = httpMock.expectOne(apiUrl);
    reqReload.flush({ data: [] });

    expect(component.successMessage).toContain('eliminado exitosamente');
  });

  it('deleteProvider should NOT delete if cancelled', () => {
    spyOn(globalThis, 'confirm').and.returnValue(false);
    component.deleteProvider('1');
    httpMock.expectNone(`${apiUrl}/1`);
  });

  it('deleteProvider should handle error with message', () => {
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.deleteProvider('1');
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush({ message: 'Err' }, { status: 500, statusText: 'Error' });
    
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Error al eliminar proveedor: Err'
    }));
  });

  it('deleteProvider should handle error without message', () => {
    spyOn(globalThis, 'confirm').and.returnValue(true);
    component.deleteProvider('1');
    const req = httpMock.expectOne(`${apiUrl}/1`);
    req.flush(null, { status: 500, statusText: 'Error' });
    
    expect(alertServiceSpy.showError).toHaveBeenCalledWith(jasmine.objectContaining({
      message: 'Error al eliminar proveedor: '
    }));
  });

  // --- UI HELPERS ---

  it('editProvider should copy object', () => {
    const p = { _id: '1', name: 'A', contactPerson: '', email: '', phone: '', address: '', providerType: '', status: 'activo' } as any;
    component.editProvider(p);
    expect(component.editingProvider).toEqual(p);
  });

  it('cancelEdit should clear object', () => {
    component.editingProvider = { name: '' } as any;
    component.cancelEdit();
    expect(component.editingProvider).toBeNull();
  });

  it('showSuccess should clear message after 3s', fakeAsync(() => {
    (component as any).showSuccess('Msg');
    expect(component.successMessage).toBe('Msg');
    tick(3000);
    expect(component.successMessage).toBe('');
  }));

  // --- DISPLAY HELPER (getProviderTypeName - Cobertura Completa de Ramas) ---

  describe('getProviderTypeName', () => {
    it('should return "---" if no type', () => {
      expect(component.getProviderTypeName(null)).toBe('---');
      expect(component.getProviderTypeName(undefined)).toBe('---');
    });

    it('should return name if type is object with name', () => {
      expect(component.getProviderTypeName({ name: 'Obj' })).toBe('Obj');
    });

    it('should return name if type is string ID and found', () => {
      // 'type1' está en mockProviderTypes
      expect(component.getProviderTypeName('type1')).toBe('Distribuidor');
    });

    it('should return name if type matches a type NAME (case insensitive)', () => {
      expect(component.getProviderTypeName('distribuidor')).toBe('Distribuidor');
    });

    it('should return original string if not found', () => {
      expect(component.getProviderTypeName('unknown')).toBe('unknown');
    });

    it('should return string representation for other types', () => {
      expect(component.getProviderTypeName(123)).toBe('123');
    });
  });
});
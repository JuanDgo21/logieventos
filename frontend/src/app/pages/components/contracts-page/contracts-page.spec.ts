import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ContractsPage } from './contracts-page';
import { ContractService } from '../../../core/services/contract';
import { AuthService } from '../../../core/services/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA, ElementRef } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

// Mock global para Bootstrap
declare const window: any;

describe('ContractsPage', () => {
  let component: ContractsPage;
  let fixture: ComponentFixture<ContractsPage>;
 
  // Spies
  let mockContractService: jasmine.SpyObj<ContractService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  
  // Mock para la instancia del modal
  const mockModalInstance = {
    show: jasmine.createSpy('show'),
    hide: jasmine.createSpy('hide')
  };

  // --- DATOS DE PRUEBA ESTRATÉGICOS ---
  const mockContracts: any[] = [
    { 
      _id: '1', 
      name: 'Contrato A', 
      startDate: '2024-01-01', 
      endDate: '2024-12-31',
      status: 'activo',
      createdAt: new Date('2024-01-01'),
      // CASO 1: Datos como OBJETOS (Populated) -> Cubre rama 'typeof === object'
      resources: [{ resource: { _id: 'r1', name: 'R1' }, quantity: 5 }],
      providers: [{ provider: { _id: 'pr1', name: 'P1' }, cost: 100, serviceDescription: 'S1' }],
      personnel: [{ person: { _id: 'p1', firstName: 'Juan' }, role: 'Dev', hours: 10 }]
    },
    { 
      _id: '2', 
      name: 'Contrato B',
      status: 'borrador',
      createdAt: new Date('2024-02-01'),
      // CASO 2: Datos como STRINGS (IDs) -> Cubre rama 'else' del ternario
      resources: [{ resource: 'r1', quantity: 2 }],
      providers: [{ provider: 'pr1', cost: 100, serviceDescription: 'S1' }],
      personnel: [{ person: 'p1', role: 'Dev', hours: 10 }]
    },
    {
      _id: '3',
      name: 'Contrato Vacio',
      status: 'borrador',
      // CASO 3: Datos NULOS -> Cubre rama '?? []' y '?? 0'
      createdAt: undefined,
      resources: null,
      providers: null,
      personnel: null
    }
  ];

  const mockPaginationResponse = { data: mockContracts, total: 10, page: 1, pages: 5 };
  const mockCounts = { borrador: 5, activo: 3, completado: 1, cancelado: 1 };
  
  // Listas disponibles
  const mockResources = [{ _id: 'r1', name: 'Recurso 1', availableQuantity: 10, status: 'disponible', selectedQuantity: 0 }];
  const mockPersonnel = [{ _id: 'p1', firstName: 'Juan', lastName: 'Perez', status: 'disponible', role: '', hours: 0 }];
  const mockProviders = [{ _id: 'pr1', name: 'Prov 1', status: 'activo', cost: 0, serviceDescription: '' }];

  beforeEach(async () => {
    // 1. Configurar Spies
    mockContractService = jasmine.createSpyObj('ContractService', [
      'getContractsPaginated', 'getCountByStatus', 'getResourcesByStatus',
      'getPersonnelByStatus', 'getProvidersByStatus', 'searchContractsByName',
      'deleteContract', 'createContract', 'updateContract'
    ]);
    mockAuthService = jasmine.createSpyObj('AuthService', ['hasRole', 'hasAnyRole', 'getUserRole']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    // 2. Retornos por defecto
    mockContractService.getContractsPaginated.and.returnValue(of(mockPaginationResponse as any));
    mockContractService.getCountByStatus.and.returnValue(of(mockCounts));
    mockContractService.getResourcesByStatus.and.returnValue(of(mockResources));
    mockContractService.getPersonnelByStatus.and.returnValue(of(mockPersonnel));
    mockContractService.getProvidersByStatus.and.returnValue(of(mockProviders));
    mockContractService.searchContractsByName.and.returnValue(of([]));
    mockContractService.createContract.and.returnValue(of({} as any));
    mockContractService.updateContract.and.returnValue(of({} as any));
    mockContractService.deleteContract.and.returnValue(of(void 0));

    mockAuthService.hasRole.and.returnValue(true);
    mockAuthService.hasAnyRole.and.returnValue(true);
    mockAuthService.getUserRole.and.returnValue('admin');

    // 3. Mock Bootstrap y DOM
    window.bootstrap = {
      Modal: jasmine.createSpy('Modal').and.returnValue(mockModalInstance)
    };
    window.bootstrap.Modal.getInstance = jasmine.createSpy('getInstance').and.returnValue(mockModalInstance);

    await TestBed.configureTestingModule({
      declarations: [ContractsPage],
      imports: [HttpClientTestingModule, FormsModule],
      providers: [
        { provide: ContractService, useValue: mockContractService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ContractsPage);
    component = fixture.componentInstance;
    
    // Simulamos los modales en el DOM para que document.getElementById no falle
    ['confirmDeleteModal', 'contractDetailsModal', 'editContractModal', 'createContractModal'].forEach(id => {
        if (!document.getElementById(id)) {
            const div = document.createElement('div');
            div.id = id;
            document.body.appendChild(div);
        }
    });

    fixture.detectChanges(); // ngOnInit
  });

  afterEach(() => {
    // Limpieza agresiva del DOM para evitar "fantasmas" visuales
    document.body.innerHTML = ''; 
    mockModalInstance.show.calls.reset();
    mockModalInstance.hide.calls.reset();
  });

  // --- INICIALIZACIÓN ---

  it('should create and load data', () => {
    expect(component).toBeTruthy();
    expect(mockContractService.getContractsPaginated).toHaveBeenCalled();
  });

  it('should handle error loading data', () => {
    mockContractService.getContractsPaginated.and.returnValue(throwError(() => new Error('Err')));
    component.loadData(1);
    expect(component.isLoading).toBeFalse();
  });

  it('should handle error loading counts', () => {
    mockContractService.getCountByStatus.and.returnValue(throwError(() => new Error('Err')));
    component.loadStatusCounts();
    expect(component.isLoading).toBeFalse();
  });

  // --- GETTERS Y HELPERS (Ramas Defensivas) ---

  it('lastContract should handle undefined createdAt (?? 0)', () => {
    // Contrato 3 no tiene fecha, Contrato 1 sí. Debe ganar el 1.
    // Esto prueba la rama 'latest.createdAt ?? 0'
    expect(component.lastContract?._id).toBe('2'); // El 2 es el más nuevo en mockContracts
  });

  it('lastContract should return null if list empty', () => {
    component.contracts = [];
    expect(component.lastContract).toBeNull();
  });

  it('loadStatusCounts should handle missing values (|| 0)', () => {
    mockContractService.getCountByStatus.and.returnValue(of({} as any));
    component.loadStatusCounts();
    expect(component.statusCounts.borrador).toBe(0);
  });

  it('duplicateKeyError should return true for correct message', () => {
    // Acceso a método privado
    expect((component as any).duplicateKeyError('Error: duplicate key value')).toBeTrue();
    expect((component as any).duplicateKeyError('Other error')).toBeFalse();
  });

  it('changePage should validate bounds', () => {
    component.totalPages = 5;
    component.changePage(0); // Menor a 1
    component.changePage(6); // Mayor a total
    expect(mockContractService.getContractsPaginated).toHaveBeenCalledTimes(1); // Solo la inicial
    component.changePage(2);
    expect(mockContractService.getContractsPaginated).toHaveBeenCalledTimes(2);
  });

  // --- EDICIÓN: CARGA DE DATOS MIXTOS (Objetos vs Strings) ---

  it('openEditModal should handle resources as OBJECTS (Case 1)', () => {
    // mockContracts[0] tiene objetos
    component.openEditModal(mockContracts[0]);
    expect(component.selectedResources.has('r1')).toBeTrue();
    expect(component.selectedProviders.has('pr1')).toBeTrue();
    expect(component.selectedPersonnel.has('p1')).toBeTrue();
  });

  it('openEditModal should handle resources as STRINGS (Case 2)', () => {
    // mockContracts[1] tiene strings
    component.openEditModal(mockContracts[1]);
    expect(component.selectedResources.has('r1')).toBeTrue();
    // El mock 1 solo tiene recursos como strings, no providers/personnel
  });

  it('openEditModal should handle null arrays (Case 3)', () => {
    // mockContracts[2] tiene nulls
    component.openEditModal(mockContracts[2]);
    expect(component.selectedResources.size).toBe(0);
  });

  // --- TOGGLES: MANEJO DE DATOS MIXTOS (Filtro de Eliminación) ---

  it('toggleResource should remove item correctly (Object vs String logic)', () => {
    // Simulamos estado mixto en el contrato en edición
    component.editContract.resources = [
        { resource: { _id: 'r1' }, quantity: 1 }, // Como Objeto
        { resource: 'r2', quantity: 1 }           // Como String
    ] as any;
    component.selectedResources.add('r1');
    component.selectedResources.add('r2');

    // Remover r1 (Objeto) -> Prueba rama 'typeof === object'
    component.toggleResource({ _id: 'r1' });
    expect(component.editContract.resources.length).toBe(1);
    
    // Remover r2 (String) -> Prueba rama 'else'
    component.toggleResource({ _id: 'r2' });
    expect(component.editContract.resources.length).toBe(0);
  });

  // --- VALIDACIONES CREATE CONTRACT ---

  it('createContract validation: Required fields', () => {
    component.newContract.name = '';
    component.createContract();
    expect(component.createErrorMessage).toContain('completa todos los campos');
  });

  it('createContract validation: Dates missing', () => {
    component.newContract.name = 'OK'; 
    component.newContract.clientName = 'OK';
    component.newContract.startDate = '';
    component.createContract();
    expect(component.createErrorMessage).toContain('fechas de inicio y fin');
  });

  it('createContract validation: End date before Start', () => {
    component.newContract.startDate = '2025-01-01';
    component.newContract.endDate = '2024-01-01';
    component.createContract();
    expect(component.createErrorMessage).toContain('no puede ser anterior');
  });

  it('createContract validation: Negative budget', () => {
    component.newContract.budget = -5;
    component.createContract();
    expect(component.createErrorMessage).toContain('no puede ser negativo');
  });

  it('createContract validation: Invalid Phone', () => {
    component.newContract.clientPhone = 'abc';
    component.createContract();
    expect(component.createErrorMessage).toContain('teléfono inválido');
  });

  it('createContract validation: Invalid Email', () => {
    component.newContract.clientEmail = 'bad';
    component.createContract();
    expect(component.createErrorMessage).toContain('Correo electrónico inválido');
  });

  it('createContract success', () => {
    // Setup válido
    component.newContract = {
        name: 'Valid', clientName: 'C', clientEmail: 'c@c.com', clientPhone: '1234567890',
        startDate: '2024-01-01', endDate: '2024-02-01', budget: 10, status: 'borrador',
        resources: [], providers: [], personnel: []
    };
    component.createContract();
    expect(mockContractService.createContract).toHaveBeenCalled();
    expect(mockSnackBar.open).toHaveBeenCalledWith(jasmine.stringMatching(/creado exitosamente/), anyArgs(), anyArgs());
  });

  // --- MANEJO DE ERRORES CREATE ---

  it('createContract error: Duplicate Key', () => {
    // Error específico
    const err = { error: { error: 'E11000 duplicate key error' } };
    mockContractService.createContract.and.returnValue(throwError(() => err));
    component.newContract.name = 'Valid'; component.newContract.clientName = 'Valid';
    
    component.createContract();
    expect(component.createErrorMessage).toContain('Ya existe un contrato');
  });

  it('createContract error: 403 Forbidden', () => {
    mockContractService.createContract.and.returnValue(throwError(() => ({ status: 403 })));
    component.newContract.name = 'Valid'; component.newContract.clientName = 'Valid';
    
    component.createContract();
    expect(component.createErrorMessage).toContain('No tienes permisos');
  });

  it('createContract error: Generic', () => {
    mockContractService.createContract.and.returnValue(throwError(() => ({ error: { message: 'Fail' } })));
    component.newContract.name = 'Valid'; component.newContract.clientName = 'Valid';
    
    component.createContract();
    expect(component.createErrorMessage).toBe('Fail');
  });

  // --- VALIDACIONES UPDATE CONTRACT ---

  it('updateContract validation: Phone', () => {
    component.openEditModal(mockContracts[0]);
    component.editContract.clientPhone = 'bad';
    component.updateContract();
    expect(component.editErrorMessage).toContain('teléfono inválido');
  });

  // --- BUSQUEDA ---
  
  it('search logic', fakeAsync(() => {
    component.searchInput = { nativeElement: { focus: () => {} } } as any;
    
    // Toggle ON
    component.showSearch = false;
    component.toggleSearch();
    expect(component.showSearch).toBeTrue();
    tick(101);

    // Search
    component.searchTerm = 'X';
    component.searchContracts();
    expect(mockContractService.searchContractsByName).toHaveBeenCalledWith('X');

    // Clear
    component.clearSearch();
    expect(component.searchTerm).toBe('');
  }));

  // --- DELETE ---

  it('delete logic', () => {
    component.deleteContract('1');
    expect(component.deleteId).toBe('1');
    
    component.confirmDelete();
    expect(mockContractService.deleteContract).toHaveBeenCalledWith('1');
  });

  // Helper
  function anyArgs(): any { return jasmine.any(Object); }
});
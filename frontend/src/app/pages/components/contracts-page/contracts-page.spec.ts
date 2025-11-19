// import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
// import { ContractsPage } from './contracts-page';
// import { ContractService } from '../../../core/services/contract';
// import { AuthService } from '../../../core/services/auth';
// import { MatSnackBar } from '@angular/material/snack-bar';
// import { of, throwError } from 'rxjs';
// import { NO_ERRORS_SCHEMA, ElementRef } from '@angular/core';
// import { HttpClientTestingModule } from '@angular/common/http/testing';
// import { FormsModule } from '@angular/forms'; // CORRECCIÓN: Import necesario para formularios

// // Mock global para Bootstrap
// declare const window: any;

// describe('ContractsPage', () => {
//   let component: ContractsPage;
//   let fixture: ComponentFixture<ContractsPage>;
  
//   // Spies
//   let mockContractService: jasmine.SpyObj<ContractService>;
//   let mockAuthService: jasmine.SpyObj<AuthService>;
//   let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
//   let bootstrapModalSpy: jasmine.SpyObj<any>;

//   // Datos de prueba
//   const mockContracts = [
//     { 
//       _id: '1', 
//       name: 'Contrato A', 
//       startDate: new Date('2024-01-01'), 
//       endDate: new Date('2024-12-31'),
//       status: 'activo',
//       createdAt: new Date('2024-01-01')
//     },
//     { 
//       _id: '2', 
//       name: 'Contrato B',
//       status: 'borrador',
//       createdAt: new Date('2024-02-01')
//     }
//   ];

//   const mockPaginationResponse = {
//     data: mockContracts,
//     total: 10,
//     page: 1,
//     pages: 5
//   };

//   const mockCounts = {
//     borrador: 5,
//     activo: 3,
//     completado: 1,
//     cancelado: 1
//   };

//   const mockResources = [{ _id: 'r1', name: 'Recurso 1', availableQuantity: 10, status: 'disponible' }];
//   const mockPersonnel = [{ _id: 'p1', firstName: 'Juan', lastName: 'Perez', status: 'disponible' }];
//   const mockProviders = [{ _id: 'pr1', name: 'Prov 1', status: 'activo' }];

//   beforeEach(async () => {
//     // Configurar Spies
//     mockContractService = jasmine.createSpyObj('ContractService', [
//       'getContractsPaginated',
//       'getCountByStatus',
//       'getResourcesByStatus',
//       'getPersonnelByStatus',
//       'getProvidersByStatus',
//       'searchContractsByName',
//       'deleteContract',
//       'createContract',
//       'updateContract'
//     ]);

//     mockAuthService = jasmine.createSpyObj('AuthService', ['hasRole', 'hasAnyRole', 'getUserRole']);
//     mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

//     // Configurar retornos por defecto (Happy Path)
//     mockContractService.getContractsPaginated.and.returnValue(of(mockPaginationResponse as any));
//     mockContractService.getCountByStatus.and.returnValue(of(mockCounts));
//     mockContractService.getResourcesByStatus.and.returnValue(of(mockResources));
//     mockContractService.getPersonnelByStatus.and.returnValue(of(mockPersonnel));
//     mockContractService.getProvidersByStatus.and.returnValue(of(mockProviders));
//     mockContractService.searchContractsByName.and.returnValue(of([]));

//     mockAuthService.hasRole.and.returnValue(true);
//     mockAuthService.hasAnyRole.and.returnValue(true);
//     mockAuthService.getUserRole.and.returnValue('admin');

//     // Mockear window.bootstrap
//     bootstrapModalSpy = jasmine.createSpyObj('Modal', ['show', 'hide']);
//     window.bootstrap = {
//       Modal: function() { return bootstrapModalSpy; },
//       ...window.bootstrap // Mantener otras propiedades si existieran
//     };
//     // Asegurar que getInstance también devuelva el spy
//     window.bootstrap.Modal.getInstance = () => bootstrapModalSpy;

//     await TestBed.configureTestingModule({
//       declarations: [ContractsPage],
//       imports: [
//         HttpClientTestingModule,
//         FormsModule // SOLUCIÓN AL ERROR NG0301
//       ],
//       providers: [
//         { provide: ContractService, useValue: mockContractService },
//         { provide: AuthService, useValue: mockAuthService },
//         { provide: MatSnackBar, useValue: mockSnackBar }
//       ],
//       schemas: [NO_ERRORS_SCHEMA] // Ignora componentes no declarados, pero FormsModule es necesario para ngForm
//     }).compileComponents();

//     fixture = TestBed.createComponent(ContractsPage);
//     component = fixture.componentInstance;
//     fixture.detectChanges(); // ngInit
//   });

//   afterEach(() => {
//     // Limpieza de modales simulados en el DOM
//     const modal = document.getElementById('confirmDeleteModal');
//     if (modal) modal.remove();

//     const details = document.getElementById('contractDetailsModal');
//     if (details) details.remove();
    
//     const edit = document.getElementById('editContractModal');
//     if (edit) edit.remove();
//   });

//   it('should create', () => {
//     expect(component).toBeTruthy();
//   });

//   // --- INITIALIZATION & DATA LOADING ---

//   it('should load data on init', () => {
//     expect(mockContractService.getContractsPaginated).toHaveBeenCalledWith(1, 2);
//     expect(mockContractService.getCountByStatus).toHaveBeenCalled();
//     expect(component.contracts.length).toBe(2);
//     expect(component.statusCounts.borrador).toBe(5);
//     expect(component.isLoading).toBeFalse();
//   });

//   it('should handle error loading data', () => {
//     mockContractService.getContractsPaginated.and.returnValue(throwError(() => new Error('Error')));
//     component.loadData(1);
//     expect(component.isLoading).toBeFalse();
//   });

//   it('should handle error loading status counts', () => {
//     mockContractService.getCountByStatus.and.returnValue(throwError(() => new Error('Error')));
//     component.loadStatusCounts();
//     expect(component.isLoading).toBeFalse();
//   });

//   it('should change page correctly', () => {
//     component.totalPages = 5;
//     component.changePage(2);
//     expect(mockContractService.getContractsPaginated).toHaveBeenCalledWith(2, 2);

//     mockContractService.getContractsPaginated.calls.reset();
//     component.changePage(6); // Página inválida
//     expect(mockContractService.getContractsPaginated).not.toHaveBeenCalled();
//   });

//   it('should calculate showing range', () => {
//     component.currentPage = 1;
//     component.limit = 2;
//     component.totalContracts = 10;
//     expect(component.showingFrom).toBe(1);
//     expect(component.showingTo).toBe(2);

//     component.currentPage = 2;
//     expect(component.showingFrom).toBe(3);
//     expect(component.showingTo).toBe(4);
//   });

//   it('should get last contract correctly', () => {
//     // mockContracts[1] es más reciente
//     expect(component.lastContract?._id).toBe('2');
//   });

//   // --- AUTH & ROLES ---

//   it('should check roles correctly', () => {
//     mockAuthService.hasRole.and.returnValue(true);
//     mockAuthService.hasAnyRole.and.returnValue(true);

//     expect(component.isAdmin()).toBeTrue();
//     expect(component.isCoordinator()).toBeTrue();
//     expect(component.isLeader()).toBeTrue();
//     expect(component.canEditOrCreate()).toBeTrue();
//     expect(component.canDelete()).toBeTrue();
//     expect(component.canOnlyView()).toBeTrue();

//     mockAuthService.getUserRole.and.returnValue('admin');
//     expect(component.isAdminOrCoordinator()).toBeTrue();
    
//     mockAuthService.getUserRole.and.returnValue('user');
//     expect(component.isAdminOrCoordinator()).toBeFalse();
//   });

//   // --- SEARCH LOGIC ---

//   it('should search contracts', () => {
//     const searchResults = [{ ...mockContracts[0], name: 'Search Result' }];
//     mockContractService.searchContractsByName.and.returnValue(of(searchResults as any));
    
//     component.searchTerm = 'Test';
//     component.searchContracts();

//     expect(component.isSearching).toBeFalse();
//     expect(component.searchResults).toEqual(searchResults as any);
//     expect(component.searchExecuted).toBeTrue();
//   });

//   it('should clear search if term is empty', () => {
//     spyOn(component, 'clearSearch');
//     component.searchTerm = '   '; // Espacios en blanco
//     component.searchContracts();
//     expect(component.clearSearch).toHaveBeenCalled();
//   });

//   it('should handle search error', () => {
//     mockContractService.searchContractsByName.and.returnValue(throwError(() => new Error('Error')));
//     component.searchTerm = 'Error';
//     component.searchContracts();
//     expect(component.isSearching).toBeFalse();
//   });

//   it('should clear search correctly', () => {
//     component.searchTerm = 'algo';
//     component.searchResults = [{} as any];
//     component.clearSearch();
//     expect(component.searchTerm).toBe('');
//     expect(component.searchResults.length).toBe(0);
//     expect(mockContractService.getContractsPaginated).toHaveBeenCalled();
//   });

//   it('should toggle search visibility and focus input', fakeAsync(() => {
//     const mockElementRef = { nativeElement: { focus: jasmine.createSpy('focus') } };
//     // Accedemos a la propiedad privada/protegida casteando a any para el test
//     (component as any).searchInput = mockElementRef as unknown as ElementRef;

//     component.showSearch = false;
//     component.toggleSearch();
    
//     expect(component.showSearch).toBeTrue();
//     tick(100); // Esperar el setTimeout
//     expect(mockElementRef.nativeElement.focus).toHaveBeenCalled();

//     // Toggle off
//     component.searchTerm = '';
//     component.toggleSearch();
//     expect(component.showSearch).toBeFalse();
//   }));

//   it('should handle onSearchClick', () => {
//     spyOn(component, 'searchContracts');
//     spyOn(component, 'toggleSearch');

//     component.showSearch = false;
//     component.onSearchClick();
//     expect(component.showSearch).toBeTrue();

//     component.showSearch = true;
//     component.searchTerm = 'term';
//     component.onSearchClick();
//     expect(component.searchContracts).toHaveBeenCalled();

//     component.searchTerm = '';
//     component.onSearchClick();
//     expect(component.toggleSearch).toHaveBeenCalled();
//   });

//   it('should handle onClickOutside', () => {
//     const mockEvent = { target: document.createElement('div') } as unknown as Event;
//     component.showSearch = true;
//     component.searchTerm = '';
    
//     spyOn(component, 'clearSearch');
    
//     component.onClickOutside(mockEvent);
    
//     expect(component.showSearch).toBeFalse();
//     expect(component.clearSearch).toHaveBeenCalled();
//   });

//   // --- CREATE CONTRACT ---

//   describe('createContract', () => {
//     beforeEach(() => {
//       component.newContract = {
//         name: 'New Contract',
//         clientName: 'Client',
//         clientEmail: 'client@test.com',
//         clientPhone: '1234567890',
//         startDate: '2024-01-01',
//         endDate: '2024-12-31',
//         budget: 1000,
//         status: 'borrador',
//         terms: 'Terms',
//         resources: [],
//         providers: [],
//         personnel: []
//       };
//     });

//     it('should create contract successfully', () => {
//       mockContractService.createContract.and.returnValue(of({} as any));
      
//       // Mockear el modal para que close funcione
//       const modalDiv = document.createElement('div');
//       modalDiv.id = 'createContractModal';
//       document.body.appendChild(modalDiv);

//       component.createContract();

//       expect(mockContractService.createContract).toHaveBeenCalled();
//       expect(mockSnackBar.open).toHaveBeenCalledWith('Contrato creado exitosamente', jasmine.any(String), jasmine.any(Object));
//       expect(bootstrapModalSpy.hide).toHaveBeenCalled();

//       modalDiv.remove();
//     });

//     it('should validate required fields', () => {
//       component.newContract.name = '';
//       component.createContract();
//       expect(component.createErrorMessage).toContain('completa todos los campos');
//     });

//     it('should validate dates', () => {
//       component.newContract.startDate = '2024-12-31';
//       component.newContract.endDate = '2024-01-01';
//       component.createContract();
//       expect(component.createErrorMessage).toContain('La fecha de fin no puede ser anterior');
//     });

//     it('should validate negative budget', () => {
//       component.newContract.budget = -100;
//       component.createContract();
//       expect(component.createErrorMessage).toContain('presupuesto no puede ser negativo');
//     });

//     it('should validate email', () => {
//       component.newContract.clientEmail = 'invalid-email';
//       component.createContract();
//       expect(component.createErrorMessage).toContain('Correo electrónico inválido');
//     });

//     it('should enforce permissions for non-draft status', () => {
//       spyOn(component, 'isAdminOrCoordinator').and.returnValue(false);
//       component.newContract.status = 'activo';
      
//       component.createContract();
      
//       expect(mockSnackBar.open).toHaveBeenCalledWith(jasmine.stringMatching(/Solo administradores/), jasmine.any(String), jasmine.any(Object));
//       expect(component.newContract.status).toBe('borrador');
//     });

//     it('should handle duplicate key error on create', () => {
//       mockContractService.createContract.and.returnValue(throwError(() => ({
//         error: { error: 'duplicate key error collection' }
//       })));
      
//       component.createContract();
      
//       expect(component.createErrorMessage).toContain('Ya existe un contrato con ese nombre');
//     });

//     it('should handle 403 error on create', () => {
//       mockContractService.createContract.and.returnValue(throwError(() => ({ status: 403 })));
//       component.createContract();
//       expect(component.createErrorMessage).toContain('No tienes permisos');
//     });

//     it('should handle generic error on create', () => {
//       mockContractService.createContract.and.returnValue(throwError(() => ({ error: { message: 'Generic Error' } })));
//       component.createContract();
//       expect(component.createErrorMessage).toBe('Generic Error');
//     });
//   });

//   // --- EDIT & UPDATE ---

//   describe('Edit & Update', () => {
//     beforeEach(() => {
//       const contractToEdit = { 
//         ...mockContracts[0], 
//         resources: [{ resource: 'r1', quantity: 5 }],
//         providers: [],
//         personnel: []
//       };
      
//       // Mock del modal de edición
//       const modalDiv = document.createElement('div');
//       modalDiv.id = 'editContractModal';
//       document.body.appendChild(modalDiv);

//       component.openEditModal(contractToEdit as any);
//     });

//     it('should open edit modal and load selections', () => {
//       expect(component.showEditModal).toBeTrue();
//       expect(component.selectedResources.has('r1')).toBeTrue();
//       expect(bootstrapModalSpy.show).toHaveBeenCalled();
//     });

//     it('should update contract successfully', () => {
//       mockContractService.updateContract.and.returnValue(of({} as any));
      
//       // Datos válidos
//       component.editContract.clientPhone = '1234567890';
//       component.editContract.clientEmail = 'test@test.com';
//       component.editContract.budget = 1000;

//       component.updateContract();

//       expect(mockContractService.updateContract).toHaveBeenCalled();
//       expect(mockSnackBar.open).toHaveBeenCalledWith('Contrato actualizado', jasmine.any(String), jasmine.any(Object));
//       expect(bootstrapModalSpy.hide).toHaveBeenCalled();
//     });

//     it('should validate edit form (invalid phone)', () => {
//       component.editContract.clientPhone = 'abc';
//       component.updateContract();
//       expect(component.editErrorMessage).toContain('teléfono inválido');
//       expect(mockContractService.updateContract).not.toHaveBeenCalled();
//     });

//     it('should validate edit form (budget exceeded)', () => {
//       component.editContract.budget = 100;
//       component.activeProviders = [{ _id: 'pr1', name: 'P1', cost: 200, serviceDescription: 'Desc', status: 'activo' }];
//       component.selectedProviders.add('pr1');
      
//       component.updateContract();
      
//       expect(component.editErrorMessage).toContain('excede el presupuesto');
//     });

//     it('should validate edit form (negative resource quantity)', () => {
//       const res = component.availableResources.find(r => r._id === 'r1');
//       if (res) res.selectedQuantity = -1;
      
//       component.updateContract();
      
//       expect(component.editErrorMessage).toContain('no puede ser negativa');
//     });

//     it('should handle duplicate key error on update', () => {
//       mockContractService.updateContract.and.returnValue(throwError(() => ({
//         error: { message: 'Ya existe un contrato con ese nombre' }
//       })));
      
//       component.editContract.clientPhone = '1234567890';
//       component.editContract.clientEmail = 'test@test.com';
      
//       component.updateContract();
      
//       expect(component.editErrorMessage).toContain('Ya existe un contrato con ese nombre');
//     });
//   });

//   // --- TOGGLES ---

//   it('should toggle resource selection', () => {
//     const res = mockResources[0];
    
//     // Select
//     component.toggleResource(res);
//     expect(component.selectedResources.has(res._id)).toBeTrue();
//     expect(component.editContract.resources.length).toBe(1);

//     // Deselect
//     component.toggleResource(res);
//     expect(component.selectedResources.has(res._id)).toBeFalse();
//     expect(component.editContract.resources.length).toBe(0);
//   });

//   it('should toggle person selection', () => {
//     const person = mockPersonnel[0];
    
//     component.togglePerson(person);
//     expect(component.selectedPersonnel.has(person._id)).toBeTrue();

//     component.togglePerson(person);
//     expect(component.selectedPersonnel.has(person._id)).toBeFalse();
//   });

//   it('should toggle provider selection', () => {
//     const provider = mockProviders[0];
    
//     component.toggleProvider(provider);
//     expect(component.selectedProviders.has(provider._id)).toBeTrue();

//     component.toggleProvider(provider);
//     expect(component.selectedProviders.has(provider._id)).toBeFalse();
//   });

//   it('should check isSelected helper', () => {
//     component.selectedResources.add('r1');
//     expect(component.isSelected({ _id: 'r1' }, 'resource')).toBeTrue();
//     expect(component.isSelectedForEdit('r1', 'resource')).toBeTrue();
//     expect(component.isSelected({ _id: 'x' }, 'resource')).toBeFalse();
//   });

//   // --- DELETE ---

//   it('should open confirm modal for delete', () => {
//     const modalDiv = document.createElement('div');
//     modalDiv.id = 'confirmDeleteModal';
//     document.body.appendChild(modalDiv);

//     component.deleteContract('123');
//     expect(component.deleteId).toBe('123');
//     expect(bootstrapModalSpy.show).toHaveBeenCalled();
//   });

//   it('should confirm delete successfully', () => {
//     component.deleteId = '123';
//     mockContractService.deleteContract.and.returnValue(of(void 0));
    
//     const modalDiv = document.createElement('div');
//     modalDiv.id = 'confirmDeleteModal';
//     document.body.appendChild(modalDiv);

//     component.confirmDelete();

//     expect(mockContractService.deleteContract).toHaveBeenCalledWith('123');
//     expect(mockSnackBar.open).toHaveBeenCalledWith('Contrato eliminado', jasmine.any(String), jasmine.any(Object));
//     expect(bootstrapModalSpy.hide).toHaveBeenCalled();
//   });

//   it('should handle delete error', () => {
//     component.deleteId = '123';
//     mockContractService.deleteContract.and.returnValue(throwError(() => new Error('Error')));
    
//     component.confirmDelete();

//     expect(mockSnackBar.open).toHaveBeenCalledWith('No se pudo eliminar el contrato', jasmine.any(String), jasmine.any(Object));
//   });

//   // --- DETAILS MODAL ---
  
//   it('should show details modal', () => {
//     const modalDiv = document.createElement('div');
//     modalDiv.id = 'contractDetailsModal';
//     document.body.appendChild(modalDiv);

//     component.showDetails(mockContracts[0] as any);
    
//     expect(component.selectedContract).toEqual(mockContracts[0] as any);
//     expect(bootstrapModalSpy.show).toHaveBeenCalled();
//   });

//   // --- VALIDATION HELPERS ---
  
//   it('should validate personnel correctly', () => {
//     component.availablePersonnel = [{ _id: 'p1', firstName: 'A', lastName: 'B', role: '', hours: -1, status: 'disponible' }];
//     component.selectedPersonnel.add('p1');
    
//     expect(component.validatePersonnel()).toBeFalse();
//     expect(component.editErrorMessage).toContain('no pueden ser negativas');
    
//     component.availablePersonnel[0].hours = 10;
//     expect(component.validatePersonnel()).toBeFalse();
    
//     component.availablePersonnel[0].role = 'Dev';
//     expect(component.validatePersonnel()).toBeTrue();
//   });
// });
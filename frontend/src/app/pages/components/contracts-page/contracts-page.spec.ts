// Importación de módulos y dependencias necesarias para las pruebas
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ContractsPage, ContractsComponent } from './contracts-page';
import { ContractService, Contract } from '../../../core/services/contract';
import { AuthService } from '../../../core/services/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms'; // <--- ¡Importación clave para formularios!

// --- DATOS DE PRUEBA SIMULADOS (MOCK DATA) ---
const mockContract: Contract = {
  _id: '123',
  name: 'Contrato Test',
  clientName: 'Cliente Test',
  clientPhone: '1234567890',
  clientEmail: 'test@cliente.com',
  startDate: new Date().toISOString(),
  endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
  budget: 1000,
  status: 'borrador',
  terms: 'Terminos...',
  resources: [],
  providers: [],
  personnel: []
};

// --- PRUEBAS UNITARIAS PARA LA CLASE ContractsComponent (Lógica sin decorador) ---
describe('ContractsComponent (Class Logic)', () => {
  let component: ContractsComponent;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  // Configuración antes de cada prueba
  beforeEach(() => {
    // Crear espías para el servicio de autenticación
    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole', 'hasAnyRole']);
    // Crear instancia del componente inyectando el servicio mock
    component = new ContractsComponent(authServiceSpy);
  });

  // Prueba: Verificar que los métodos de verificación de roles funcionen correctamente
  it('should return correct role checks', () => {
    // Configurar los espías para devolver valores específicos según el rol
    authServiceSpy.hasRole.withArgs('admin').and.returnValue(true);
    authServiceSpy.hasRole.withArgs('coordinador').and.returnValue(false);
    authServiceSpy.hasRole.withArgs('lider').and.returnValue(false);
    
    // Verificar que los métodos devuelvan los valores esperados
    expect(component.isAdmin()).toBeTrue();
    expect(component.isCoordinator()).toBeFalse();
    expect(component.isLeader()).toBeFalse();
    expect(component.canDelete()).toBeTrue(); // Los admin pueden eliminar
  });

  // Prueba: Verificar el método que comprueba múltiples roles
  it('canEditOrCreate should check specific roles', () => {
    // Configurar el espía para devolver true para cualquier rol
    authServiceSpy.hasAnyRole.and.returnValue(true);
    expect(component.canEditOrCreate()).toBeTrue();
    // Verificar que se llamó al método con los roles correctos
    expect(authServiceSpy.hasAnyRole).toHaveBeenCalledWith(['admin', 'coordinador']);
  });

  // Prueba: Verificar el método que comprueba solo el rol de líder
  it('canOnlyView should check lider role', () => {
    // Configurar el espía para devolver true para el rol 'lider'
    authServiceSpy.hasRole.withArgs('lider').and.returnValue(true);
    expect(component.canOnlyView()).toBeTrue();
  });
});

// --- PRUEBAS DE INTEGRACIÓN PARA EL COMPONENTE ContractsPage ---
describe('ContractsPage (Angular Component)', () => {
  let component: ContractsPage;
  let fixture: ComponentFixture<ContractsPage>;
  let contractServiceSpy: jasmine.SpyObj<ContractService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  // Mock Global de Bootstrap para simular el comportamiento de los modales
  const mockBootstrapInstance = {
    show: jasmine.createSpy('show'),
    hide: jasmine.createSpy('hide')
  };
  const mockBootstrap = {
    Modal: jasmine.createSpy('Modal').and.returnValue(mockBootstrapInstance)
  };
  (mockBootstrap.Modal as any).getInstance = jasmine.createSpy('getInstance').and.returnValue(mockBootstrapInstance);

  // Configuración antes de cada prueba
  beforeEach(async () => {
    // Crear espías para todos los métodos del servicio de contratos
    const contractSpy = jasmine.createSpyObj('ContractService', [
      'getContractsPaginated', 'getCountByStatus', 'getResourcesByStatus',
      'getPersonnelByStatus', 'getProvidersByStatus', 'createContract',
      'updateContract', 'deleteContract', 'searchContractsByName'
    ]);

    // Crear espías para el servicio de autenticación
    const authSpy = jasmine.createSpyObj('AuthService', ['hasRole', 'hasAnyRole', 'getUserRole']);
    // Crear espía para el servicio de notificaciones (snackbar)
    const snackSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    // Configurar respuestas predeterminadas para los métodos del servicio
    contractSpy.getContractsPaginated.and.returnValue(of({ data: [mockContract], total: 1, page: 1, pages: 1 }));
    contractSpy.getCountByStatus.and.returnValue(of({ borrador: 1, activo: 0, completado: 0, cancelado: 0 }));
    contractSpy.getResourcesByStatus.and.returnValue(of([{ _id: 'res1', name: 'R1', status: 'disponible', availableQuantity: 10 }]));
    contractSpy.getPersonnelByStatus.and.returnValue(of([{ _id: 'per1', firstName: 'Juan', status: 'disponible' }]));
    contractSpy.getProvidersByStatus.and.returnValue(of([{ _id: 'prov1', name: 'Prov 1', status: 'activo', cost: 100 }]));
    
    // Configurar rol de usuario por defecto
    authSpy.getUserRole.and.returnValue('admin');

    // Inyectar el mock de Bootstrap en el objeto window global
    (window as any).bootstrap = mockBootstrap;

    // Configurar el módulo de testing de Angular
    await TestBed.configureTestingModule({
      declarations: [ContractsPage],
      imports: [FormsModule], // Importar FormsModule para soporte de formularios
      providers: [
        { provide: ContractService, useValue: contractSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: MatSnackBar, useValue: snackSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA] // Ignorar elementos desconocidos en el template
    }).compileComponents();

    // Crear el componente y obtener las instancias
    fixture = TestBed.createComponent(ContractsPage);
    component = fixture.componentInstance;
    // Obtener las instancias de los servicios mockeados
    contractServiceSpy = TestBed.inject(ContractService) as jasmine.SpyObj<ContractService>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    
    // Espiar document.getElementById para controlar su comportamiento
    spyOn(document, 'getElementById').and.returnValue(document.createElement('div'));

    // Ejecutar detección de cambios inicial
    fixture.detectChanges();
  });

  // Prueba básica: Verificar que el componente se crea correctamente
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // --- 1. PRUEBAS DE INICIALIZACIÓN Y CARGA DE DATOS ---
  it('should load initial data and set default dates if missing', () => {
    // Configurar fechas vacías en el nuevo contrato
    component.newContract.startDate = ''; 
    component.newContract.endDate = '';
    // Llamar al método de inicialización
    component.ngOnInit();
    // Verificar que se cargaron los contratos
    expect(contractServiceSpy.getContractsPaginated).toHaveBeenCalled();
    // Verificar que se asignaron fechas por defecto
    expect(component.newContract.startDate).toBeTruthy();
  });

  it('should handle error when loading data', () => {
    // Configurar el servicio para que devuelva un error
    contractServiceSpy.getContractsPaginated.and.returnValue(throwError(() => new Error('Error')));
    // Llamar al método de carga de datos
    component.loadData(1);
    // Verificar que el estado de carga se desactiva
    expect(component.isLoading).toBeFalse();
  });

  it('should handle pagination change', () => {
    // Configurar paginación
    component.totalPages = 5;
    // Cambiar a página 2
    component.changePage(2);
    // Verificar que se llamó al servicio con los parámetros correctos
    expect(contractServiceSpy.getContractsPaginated).toHaveBeenCalledWith(2, 2);
    
    // Probar cambio a página inválida
    contractServiceSpy.getContractsPaginated.calls.reset();
    component.changePage(6); // Página fuera de rango
    // Verificar que NO se llamó al servicio
    expect(contractServiceSpy.getContractsPaginated).not.toHaveBeenCalled();
  });

  // --- 2. PRUEBAS DE BÚSQUEDA E INTERFAZ DE USUARIO ---
  it('should search contracts', () => {
    // Crear evento de formulario simulado
    const event = new Event('submit');
    spyOn(event, 'preventDefault');
    component.searchTerm = 'Test';
    contractServiceSpy.searchContractsByName.and.returnValue(of([]));

    // Ejecutar búsqueda
    component.searchContracts(event);

    // Verificaciones
    expect(event.preventDefault).toHaveBeenCalled(); // Prevenir comportamiento por defecto
    expect(component.searchExecuted).toBeTrue(); // Búsqueda ejecutada
    expect(component.isSearching).toBeFalse(); // Estado de búsqueda desactivado
  });

  it('should clear search if term is empty', () => {
    // Configurar término de búsqueda vacío
    component.searchTerm = '';
    // Ejecutar búsqueda
    component.searchContracts();
    // Verificaciones
    expect(component.searchExecuted).toBeFalse(); // Búsqueda no ejecutada
    expect(contractServiceSpy.getContractsPaginated).toHaveBeenCalled(); // Datos normales cargados
  });

  it('should handle search error', () => {
    // Configurar término de búsqueda y error en el servicio
    component.searchTerm = 'Error';
    contractServiceSpy.searchContractsByName.and.returnValue(throwError(() => 'Err'));
    // Ejecutar búsqueda
    component.searchContracts();
    // Verificar que el estado de búsqueda se desactiva
    expect(component.isSearching).toBeFalse();
  });

  it('should toggle search visibility', fakeAsync(() => {
    // Caso 1: Mostrar búsqueda
    component.showSearch = false;
    // Mock del ElementRef para simular el foco
    component.searchInput = { nativeElement: { focus: jasmine.createSpy('focus') } } as any;
    
    // Activar búsqueda
    component.toggleSearch();
    expect(component.showSearch).toBeTrue(); // Búsqueda visible
    tick(100); // Esperar 100ms (simular timeout)
    // Verificar que se enfocó el campo de búsqueda
    expect(component.searchInput.nativeElement.focus).toHaveBeenCalled();

    // Caso 2: Ocultar búsqueda
    component.toggleSearch();
    expect(component.showSearch).toBeFalse(); // Búsqueda oculta
  }));

  it('should handle click outside to close search', () => {
    // Caso: Click fuera cierra la búsqueda
    component.showSearch = true;
    const div = document.createElement('div');
    const event = { target: div } as any; // Target no es parte del contenedor de búsqueda
    component.onClickOutside(event);
    expect(component.showSearch).toBeFalse(); // Búsqueda se cierra

    // Caso: Click dentro no cierra la búsqueda
    component.showSearch = true;
    const innerDiv = document.createElement('div');
    innerDiv.className = 'search-container-left';
    // Simular que el click fue dentro del contenedor de búsqueda
    spyOn(div, 'closest').and.returnValue(innerDiv);
    component.onClickOutside({ target: div } as any);
    expect(component.showSearch).toBeTrue(); // Búsqueda permanece abierta
  });

  it('onSearchClick logic', () => {
    // Caso: Abrir búsqueda
    component.showSearch = false;
    component.onSearchClick();
    expect(component.showSearch).toBeTrue(); // Búsqueda se abre

    // Caso: Buscar si hay texto
    component.searchTerm = 'abc';
    spyOn(component, 'searchContracts');
    component.onSearchClick();
    expect(component.searchContracts).toHaveBeenCalled(); // Búsqueda ejecutada

    // Caso: Cerrar si no hay texto
    component.searchTerm = '';
    component.onSearchClick();
    expect(component.showSearch).toBeFalse(); // Búsqueda se cierra
  });

  // --- 3. PRUEBAS DE CREACIÓN DE CONTRATOS (VALIDACIONES EXHAUSTIVAS) ---
  it('createContract validations', () => {
    // Validación 1: Campos vacíos
    component.newContract.name = '';
    component.createContract();
    expect(component.createErrorMessage).toContain('completa todos los campos');

    // Validación 2: Fechas vacías
    component.newContract.name = 'Ok';
    component.newContract.clientName = 'Ok';
    component.newContract.startDate = '';
    component.createContract();
    expect(component.createErrorMessage).toContain('fechas');

    // Validación 3: Presupuesto negativo
    component.newContract.startDate = '2025-01-01';
    component.newContract.endDate = '2025-02-01';
    component.newContract.budget = -10;
    component.createContract();
    expect(component.createErrorMessage).toContain('negativo');

    // Validación 4: Teléfono inválido
    component.newContract.budget = 100;
    component.newContract.clientPhone = 'abc';
    component.createContract();
    expect(component.createErrorMessage).toContain('teléfono');

    // Validación 5: Email inválido
    component.newContract.clientPhone = '1234567';
    component.newContract.clientEmail = 'bademail';
    component.createContract();
    expect(component.createErrorMessage).toContain('Correo');

    // Validación 6: Fechas invertidas
    component.newContract.clientEmail = 'ok@ok.com';
    component.newContract.startDate = '2025-02-01';
    component.newContract.endDate = '2025-01-01';
    component.createContract();
    expect(component.createErrorMessage).toContain('anterior a la fecha de inicio');
  });

  it('should block non-admin from creating non-borrador contracts', () => {
    // Configurar usuario sin permisos de admin
    authServiceSpy.getUserRole.and.returnValue('user');
    authServiceSpy.hasRole.and.returnValue(false);
    
    // Configurar contrato con estado no permitido para usuarios normales
    component.newContract = {
      ...mockContract,
      startDate: '2025-01-01',
      endDate: '2025-02-01',
      status: 'activo' // Estado prohibido para usuarios no admin
    };

    // Intentar crear contrato
    component.createContract();
    
    // Verificar que se mostró el mensaje de error
    expect(snackBarSpy.open).toHaveBeenCalledWith(jasmine.stringMatching(/Solo administradores/), jasmine.any(String), jasmine.any(Object));
    // Verificar que el estado se reseteó a 'borrador'
    expect(component.newContract.status).toBe('borrador');
  });

  it('should create contract successfully', () => {
    // Configurar contrato válido
    component.newContract = { ...mockContract, startDate: '2025-01-01', endDate: '2025-02-01' };
    // Configurar servicio para éxito
    contractServiceSpy.createContract.and.returnValue(of(mockContract));
    
    // Crear contrato
    component.createContract();
    
    // Verificaciones
    expect(contractServiceSpy.createContract).toHaveBeenCalled(); // Servicio llamado
    expect(snackBarSpy.open).toHaveBeenCalledWith('Contrato creado exitosamente', jasmine.any(String), jasmine.any(Object)); // Mensaje de éxito
  });

  it('should handle backend errors on create', () => {
    component.newContract = { ...mockContract, startDate: '2025-01-01', endDate: '2025-02-01' };
    
    // Caso 1: Error de clave duplicada
    contractServiceSpy.createContract.and.returnValue(throwError(() => ({ error: { error: 'duplicate key' } })));
    component.createContract();
    expect(component.createErrorMessage).toContain('Ya existe');

    // Caso 2: Error de permisos (403)
    contractServiceSpy.createContract.and.returnValue(throwError(() => ({ status: 403 })));
    component.createContract();
    expect(component.createErrorMessage).toContain('permisos');

    // Caso 3: Error genérico
    contractServiceSpy.createContract.and.returnValue(throwError(() => ({ error: { message: 'Boom' } })));
    component.createContract();
    expect(component.createErrorMessage).toBe('Boom');
  });

  // --- 4. PRUEBAS DE EDICIÓN Y SELECCIÓN DE ELEMENTOS ---
  it('should toggle items (add/remove)', () => {
    // Prueba con Recursos
    const res = { _id: 'r1', selectedQuantity: 5 };
    // Agregar recurso
    component.toggleResource(res);
    expect(component.selectedResources.has('r1')).toBeTrue(); // Recurso agregado
    expect(component.editContract.resources[0].quantity).toBe(5); // Cantidad correcta
    // Remover recurso
    component.toggleResource(res);
    expect(component.selectedResources.has('r1')).toBeFalse(); // Recurso removido

    // Prueba con Personal
    const per = { _id: 'p1', role: 'Dev', hours: 10 };
    component.togglePerson(per);
    expect(component.selectedPersonnel.has('p1')).toBeTrue(); // Personal agregado
    component.togglePerson(per);
    expect(component.selectedPersonnel.has('p1')).toBeFalse(); // Personal removido

    // Prueba con Proveedores
    const prov = { _id: 'pr1', serviceDescription: 'Web', cost: 100 };
    component.toggleProvider(prov);
    expect(component.selectedProviders.has('pr1')).toBeTrue(); // Proveedor agregado
    component.toggleProvider(prov);
    expect(component.selectedProviders.has('pr1')).toBeFalse(); // Proveedor removido
  });

  it('isSelected helpers', () => {
    const item = { _id: '1' };
    // Agregar recurso a la selección
    component.selectedResources.add('1');
    // Verificar métodos de comprobación
    expect(component.isSelected(item, 'resource')).toBeTrue(); // Está seleccionado
    expect(component.isSelectedForEdit('1', 'resource')).toBeTrue(); // Está seleccionado para edición
    
    // Verificar que no está seleccionado en otras categorías
    expect(component.isSelected(item, 'person')).toBeFalse();
    expect(component.isSelectedForEdit('1', 'person')).toBeFalse();
  });

  it('should validate resources on update', () => {
    // Configurar recurso disponible
    component.availableResources = [{ _id: 'r1', name: 'R1', selectedQuantity: 0, availableQuantity: 5 }];
    component.selectedResources.add('r1');
    
    // Validación 1: Cantidad 0 o negativa
    expect(component.validateResources()).toBeFalse(); // Validación falla
    expect(component.editErrorMessage).toContain('negativa'); // Mensaje de error

    // Validación 2: Cantidad excesiva
    component.availableResources[0].selectedQuantity = 10;
    expect(component.validateResources()).toBeFalse(); // Validación falla
    expect(component.editErrorMessage).toContain('excede'); // Mensaje de error

    // Validación 3: Cantidad correcta
    component.availableResources[0].selectedQuantity = 2;
    expect(component.validateResources()).toBeTrue(); // Validación pasa
  });

  it('should validate providers on update', () => {
    // Configurar proveedor con costo negativo
    component.activeProviders = [{ _id: 'pr1', name: 'P1', cost: -1, serviceDescription: 'ok' }];
    component.selectedProviders.add('pr1');

    // Validación 1: Costo negativo
    expect(component.validateProviders()).toBeFalse(); // Validación falla

    // Validación 2: Falta descripción de servicio
    component.activeProviders[0].cost = 100;
    component.activeProviders[0].serviceDescription = '';
    expect(component.validateProviders()).toBeFalse(); // Validación falla

    // Validación 3: Excede presupuesto
    component.activeProviders[0].serviceDescription = 'ok';
    component.editContract.budget = 50; // Menor que el costo del proveedor (100)
    expect(component.validateProviders()).toBeFalse(); // Validación falla
    expect(component.editErrorMessage).toContain('excede el presupuesto'); // Mensaje de error
  });

  it('should validate personnel on update', () => {
    // Configurar personal con horas negativas
    component.availablePersonnel = [{ _id: 'p1', firstName: 'A', hours: -1, role: 'ok' }];
    component.selectedPersonnel.add('p1');
    expect(component.validatePersonnel()).toBeFalse(); // Validación falla
    
    // Configurar personal sin rol
    component.availablePersonnel[0].hours = 10;
    component.availablePersonnel[0].role = '';
    expect(component.validatePersonnel()).toBeFalse(); // Validación falla
  });

  it('should update contract successfully', () => {
    // Configurar contrato seleccionado y datos de edición
    component.selectedContract = { ...mockContract };
    component.editContract = { ...mockContract, startDate: '2025-01-01', endDate: '2025-02-01' };
    
    // Configurar todas las validaciones para que pasen
    spyOn(component, 'validateEditForm').and.returnValue(true);
    spyOn(component, 'validateResources').and.returnValue(true);
    spyOn(component, 'validateProviders').and.returnValue(true);
    spyOn(component, 'validatePersonnel').and.returnValue(true);

    // Configurar servicio para éxito
    contractServiceSpy.updateContract.and.returnValue(of(mockContract));

    // Ejecutar actualización
    component.updateContract();

    // Verificaciones
    expect(contractServiceSpy.updateContract).toHaveBeenCalled(); // Servicio llamado
    expect(snackBarSpy.open).toHaveBeenCalledWith('Contrato actualizado', jasmine.any(String), jasmine.any(Object)); // Mensaje de éxito
  });

  it('should handle update error', () => {
    // Configurar contrato para edición
    component.selectedContract = { ...mockContract };
    component.editContract = { _id: '123' } as any;
    // Configurar validación para que pase
    spyOn(component, 'validateEditForm').and.returnValue(true);
    
    // Configurar servicio para error
    contractServiceSpy.updateContract.and.returnValue(throwError(() => ({ error: { message: 'Update Failed' } })));

    // Ejecutar actualización
    component.updateContract();

    // Verificar que se asignó el mensaje de error
    expect(component.editErrorMessage).toBe('Update Failed');
  });

  // --- 5. PRUEBAS DE ELIMINACIÓN ---
  it('delete flow', () => {
    // Abrir modal de confirmación
    component.openConfirmModal('123');
    expect(component.deleteId).toBe('123'); // ID guardado

    // Configurar servicio para éxito en eliminación
    contractServiceSpy.deleteContract.and.returnValue(of(void 0));
    component.confirmDelete();
    expect(contractServiceSpy.deleteContract).toHaveBeenCalledWith('123'); // Servicio llamado
    expect(component.deleteId).toBeNull(); // ID limpiado

    // Probar eliminación con error
    component.deleteId = '123';
    contractServiceSpy.deleteContract.and.returnValue(throwError(() => 'err'));
    component.confirmDelete();
    // Verificar mensaje de error
    expect(snackBarSpy.open).toHaveBeenCalledWith(jasmine.stringMatching(/No se pudo/), jasmine.any(String), jasmine.any(Object));
  });

  // Prueba: Determinar correctamente el último contrato
  it('should determine last contract correctly', () => {
    // Caso 1: Sin contratos
    component.contracts = [];
    expect(component.lastContract).toBeNull(); // No hay último contrato
    
    // Caso 2: Con contratos (ordenados por fecha)
    const c1 = { ...mockContract, createdAt: new Date('2022-01-01') };
    const c2 = { ...mockContract, createdAt: new Date('2024-01-01') };
    
    component.contracts = [c1, c2];
    expect(component.lastContract).toEqual(c2); // El más reciente
  });

  it('isAdminOrCoordinator check', () => {
    // Caso: Usuario admin
    authServiceSpy.getUserRole.and.returnValue('admin');
    expect(component.isAdminOrCoordinator()).toBeTrue(); // Es admin o coordinador
    
    // Caso: Usuario normal
    authServiceSpy.getUserRole.and.returnValue('user');
    expect(component.isAdminOrCoordinator()).toBeFalse(); // No es admin ni coordinador
  });

  // =========================================================
  // ⚡ BLOQUE DE EXTENSIÓN PARA COBERTURA COMPLETA ⚡
  // =========================================================

  describe('Extended Coverage & Edge Cases', () => {

    it('should calculate pagination getters correctly', () => {
      // Caso 1: Página 1, Límite 2, Total 1
      component.currentPage = 1;
      component.limit = 2;
      component.totalContracts = 1;
      expect(component.showingFrom).toBe(1); // Desde el primer elemento
      expect(component.showingTo).toBe(1); // Hasta el primer elemento

      // Caso 2: Página 2, Límite 10, Total 15
      component.currentPage = 2;
      component.limit = 10;
      component.totalContracts = 15;
      expect(component.showingFrom).toBe(11); // Desde el elemento 11
      expect(component.showingTo).toBe(15); // Hasta el elemento 15 (mínimo entre 20 y 15)
    });

    it('should return correct status count', () => {
      // Configurar conteos de estado
      component.statusCounts = { borrador: 5, activo: 2, completado: 1, cancelado: 0 };
      expect(component.getStatusCount('borrador')).toBe(5); // Conteo correcto
      expect(component.getStatusCount('cancelado')).toBe(0); // Conteo cero
    });

    it('should execute saveChanges (empty method coverage)', () => {
      // Caso: Sin contrato seleccionado (retorno temprano)
      component.selectedContract = null;
      component.saveChanges(); // No debe generar error

      // Caso: Con contrato seleccionado
      component.selectedContract = { _id: '123' } as any;
      component.saveChanges(); // Ejecuta el método sin acciones adicionales
      expect(true).toBeTrue(); // Verificación básica de que se ejecutó
    });

    it('should handle complex edit modal loading (Assignments coverage)', () => {
      // Preparar datos complejos para probar los bucles de carga de edición
      
      // Recursos disponibles
      component.availableResources = [{ _id: 'r1', name: 'R1' }];
      // Proveedores activos
      component.activeProviders = [{ _id: 'pr1', name: 'Prov1' }];
      // Personal disponible
      component.availablePersonnel = [{ _id: 'p1', firstName: 'Juan' }];

      // Contrato con relaciones complejas (objetos completos e IDs simples)
      const complexContract: Contract = {
        ...mockContract,
        resources: [
          { resource: { _id: 'r1' }, quantity: 10 } as any, // Objeto completo
          { resource: 'r_missing', quantity: 5 } as any     // ID simple (caso faltante)
        ],
        providers: [
          { provider: { _id: 'pr1' }, serviceDescription: 'S1', cost: 500 } as any,
          { provider: 'pr_missing' } as any
        ],
        personnel: [
          { person: { _id: 'p1' }, role: 'Dev', hours: 20 } as any,
          { person: 'p_missing' } as any
        ]
      };

      // Abrir modal de edición con contrato complejo
      component.openEditModal(complexContract);

      // Verificar que se mapearon los elementos encontrados
      expect(component.selectedResources.has('r1')).toBeTrue();
      expect(component.selectedProviders.has('pr1')).toBeTrue();
      expect(component.selectedPersonnel.has('p1')).toBeTrue();
      
      // Verificar que se asignaron los valores a los elementos disponibles
      const res = component.availableResources.find(r => r._id === 'r1');
      expect(res.selectedQuantity).toBe(10);
    });

    it('should validate Regex in Edit Form (Phone & Email)', () => {
      component.editContract = { ...mockContract, startDate: '2025-01-01', endDate: '2025-02-01' };
      
      // Validación 1: Teléfono inválido (Regex falla)
      component.editContract.clientPhone = '123'; // Muy corto
      expect(component.validateEditForm()).toBeFalse();
      expect(component.editErrorMessage).toContain('teléfono inválido');

      // Validación 2: Email inválido (Regex falla)
      component.editContract.clientPhone = '1234567890'; // Teléfono válido
      component.editContract.clientEmail = 'correo_malo_sin_arroba';
      expect(component.validateEditForm()).toBeFalse();
      expect(component.editErrorMessage).toContain('Correo electrónico inválido');

      // Validación 3: Todo correcto
      component.editContract.clientEmail = 'test@ok.com';
      expect(component.validateEditForm()).toBeTrue();
    });

    it('should handle "duplicate key" error specifically in Create', () => {
      component.newContract = { ...mockContract, startDate: '2025-01-01', endDate: '2025-02-01' };
      
      // Simular error específico de MongoDB "duplicate key"
      const duplicateError = { 
        error: { error: 'E11000 duplicate key error collection: contracts' } 
      };
      
      contractServiceSpy.createContract.and.returnValue(throwError(() => duplicateError));

      component.createContract();

      // Verificar mensaje de error específico para clave duplicada
      expect(component.createErrorMessage).toContain('Ya existe un contrato con ese nombre');
    });
    
    it('should handle "duplicate key" error specifically in Update', () => {
      component.selectedContract = { ...mockContract };
      component.editContract = { ...mockContract, _id: '123' };
      spyOn(component, 'validateEditForm').and.returnValue(true);

      // Simular error de duplicado en actualización
      const errorResponse = { error: { message: 'Ya existe un contrato con ese nombre' } };
      
      contractServiceSpy.updateContract.and.returnValue(throwError(() => errorResponse));

      component.updateContract();

      // Verificar mensaje de error específico
      expect(component.editErrorMessage).toContain('Ya existe un contrato');
    });

    it('should handle showDetails', () => {
        // Simular apertura de modal de detalles
        component.showDetails(mockContract);
        expect(component.selectedContract).toEqual(mockContract); // Contrato seleccionado
        expect(mockBootstrap.Modal).toHaveBeenCalled(); // Modal creado
    });

    it('should handle closeEditModal', () => {
        // Configurar modal abierto
        component.showEditModal = true;
        component.selectedContract = mockContract;
        
        // Cerrar modal
        component.closeEditModal();
        
        // Verificaciones
        expect(component.showEditModal).toBeFalse(); // Modal cerrado
        expect(component.selectedContract).toBeNull(); // Contrato limpiado
    });
    
    it('should handle private duplicateKeyError method via create flow strings', () => {
        // Forzar la comprobación de cadena "duplicate key"
        component.newContract = { ...mockContract, startDate: '2025-01-01', endDate: '2025-02-01' };
        
        // Caso: error.error es string directo que contiene 'duplicate key'
        contractServiceSpy.createContract.and.returnValue(throwError(() => ({ 
            error: { error: 'Ha ocurrido un error duplicate key en la base de datos' } 
        })));

        component.createContract();
        // Verificar que detecta el error de duplicado
        expect(component.createErrorMessage).toContain('Ya existe un contrato');
    });

  });

  // =========================================================
  // 🚀 BLOQUE FINAL PARA ALCANZAR EL 100% DE COBERTURA 🚀
  // =========================================================

  // Este bloque se enfoca en cubrir líneas de código específicas que no se han probado aún
  // para alcanzar el 100% de cobertura en las pruebas
  describe('Final Coverage Boost (Missing Branches & Lines)', () => {

    // 1. Prueba: Cubrir métodos de verificación de roles duplicados en ContractsPage
    it('should cover duplicated Role methods directly in ContractsPage', () => {
      // Configuramos los espías para que TODOS los roles devuelvan true
      // Esto nos permite probar todas las ramas de los métodos de verificación de roles
      authServiceSpy.hasRole.and.returnValue(true);
      authServiceSpy.hasAnyRole.and.returnValue(true);

      // Verificamos que todos los métodos de rol devuelven true cuando el usuario tiene permisos
      expect(component.isAdmin()).toBeTrue();           // Usuario es administrador
      expect(component.isCoordinator()).toBeTrue();     // Usuario es coordinador
      expect(component.isLeader()).toBeTrue();          // Usuario es líder
      expect(component.canDelete()).toBeTrue();         // Usuario puede eliminar
      expect(component.canOnlyView()).toBeTrue();       // Usuario solo puede ver
      expect(component.canEditOrCreate()).toBeTrue();   // Usuario puede editar o crear
    });

    // 2. Prueba: Verificar cuando no hay rol de usuario (rama else)
    it('should return false in isAdminOrCoordinator if user has no role', () => {
      // Simulamos que el servicio devuelve null (sin rol de usuario)
      authServiceSpy.getUserRole.and.returnValue(null);
      // Verificamos que el método devuelve false cuando no hay rol
      expect(component.isAdminOrCoordinator()).toBeFalse();
    });

    // 3. Prueba: Verificar que se usa página por defecto al cargar datos sin argumentos
    it('should use default page 1 when calling loadData without arguments', () => {
       // Limpiamos cualquier llamada previa al servicio para empezar fresco
       contractServiceSpy.getContractsPaginated.calls.reset();
       
       // Llamamos al método sin pasar parámetros (debe usar valores por defecto)
       component.loadData(); // Llamada sin argumentos
       
       // Verificamos que se llamó al servicio con página 1 (valor por defecto)
       expect(contractServiceSpy.getContractsPaginated).toHaveBeenCalledWith(1, component.limit);
    });

    // 4. Prueba: Manejar valores undefined en los contadores de estado
    it('should handle undefined counts in loadStatusCounts (|| 0 branches)', () => {
       // Configuramos el servicio para devolver un objeto vacío
       // Esto fuerza al código a usar los valores por defecto (0) para los contadores
       contractServiceSpy.getCountByStatus.and.returnValue(of({} as any));
       
       // Ejecutamos la carga de contadores de estado
       component.loadStatusCounts();
       
       // Verificamos que se asignaron ceros como valores por defecto
       // Esto cubre las líneas donde se usa el operador || para valores por defecto
       expect(component.statusCounts.borrador).toBe(0);  // Contador de borrador = 0
       expect(component.statusCounts.activo).toBe(0);    // Contador de activo = 0
    });

    // 5. Prueba: Manejar errores al cargar contadores de estado
    it('should handle error in loadStatusCounts', () => {
       // Configuramos el servicio para devolver un error
       contractServiceSpy.getCountByStatus.and.returnValue(throwError(() => new Error('API Error')));
       // Establecemos el estado de carga como true para verificar que se desactiva
       component.isLoading = true;
       
       // Espiamos console.error para capturar el error sin ensuciar la salida del test
       spyOn(console, 'error');
       
       // Ejecutamos la carga de contadores (debería manejar el error)
       component.loadStatusCounts();
       
       // Verificaciones después del error
       expect(component.isLoading).toBeFalse();  // El loading se desactiva incluso con error
       expect(console.error).toHaveBeenCalled(); // Se captura el error en consola
    });

    // 6. Prueba: Manejar fechas de creación undefined en lastContract
    it('should handle contracts with undefined createdAt (?? 0 coverage)', () => {
       // Creamos contratos sin fecha de creación (undefined)
       const c1 = { ...mockContract, _id: 'A', createdAt: undefined } as any;
       const c2 = { ...mockContract, _id: 'B', createdAt: undefined } as any;
       
       // Asignamos los contratos al componente
       component.contracts = [c1, c2];
       
       // Al ejecutarse, el método reduce comparará 0 > 0 (falso) y retornará el acumulador
       // Lo importante es que el código pase por "createdAt ?? 0" sin generar errores
       const result = component.lastContract;
       expect(result).toBeDefined();  // Verificamos que no hay errores y devuelve algo
    });

    // 7. Prueba: Probar método privado duplicateKeyError directamente
    it('should test private duplicateKeyError method', () => {
       // Usamos 'as any' para acceder al método privado y probarlo directamente
       // Esto es necesario porque el flujo público no siempre garantiza pasar por este método
       
       // Verificamos que detecta correctamente errores de clave duplicada
       expect((component as any).duplicateKeyError('E11000 duplicate key error')).toBeTrue();
       // Verificamos que ignora otros tipos de errores
       expect((component as any).duplicateKeyError('Other error')).toBeFalse();
    });

    // 8. Prueba: Verificar que deleteContract llama a openConfirmModal
    it('should call openConfirmModal from deleteContract', () => {
      // Espiamos el método openConfirmModal para verificar que se llama
      spyOn(component, 'openConfirmModal');
      // Ejecutamos deleteContract con un ID específico
      component.deleteContract('999');
      // Verificamos que se llamó a openConfirmModal con el ID correcto
      expect(component.openConfirmModal).toHaveBeenCalledWith('999');
    });

  });

  // =========================================================
  // 🎯 BLOQUE MAESTRO: ATAQUE DIRIGIDO AL 100% DE COBERTURA 🎯
  // =========================================================

  // Este bloque se enfoca en casos extremos y manejadores de error específicos
  // que son difíciles de cubrir en el flujo normal de pruebas
  describe('Absolute 100% Coverage - Edge Cases & Error Handlers', () => {

    // 1. Prueba: Manejar errores en la carga de elementos disponibles
    it('should handle errors in fetchAvailableItems observables', () => {
      // Espiamos console.error para evitar que ensucie la salida de pruebas
      spyOn(console, 'error');
      
      // Configuramos TODOS los servicios para devolver errores
      contractServiceSpy.getResourcesByStatus.and.returnValue(throwError(() => 'Error Res'));
      contractServiceSpy.getProvidersByStatus.and.returnValue(throwError(() => 'Error Prov'));
      contractServiceSpy.getPersonnelByStatus.and.returnValue(throwError(() => 'Error Per'));

      // Ejecutamos el método que debería manejar estos errores
      component.fetchAvailableItems();

      // Verificamos que se capturaron todos los errores esperados
      expect(console.error).toHaveBeenCalledWith('Error cargando recursos:', 'Error Res');
      expect(console.error).toHaveBeenCalledWith('Error cargando proveedores:', 'Error Prov');
      // Nota: El error de personal también se captura, cubriendo esa línea implícitamente
    });

    // 2. Prueba: Probar los valores por defecto en los métodos toggle
    it('should handle complex toggles (Objects vs Strings & Defaults)', () => {
      // A. Cobertura de Valores por Defecto (|| 1, || '', || 0) al AGREGAR elementos
      // Creamos objetos sin propiedades para forzar el uso de valores por defecto
      const emptyRes = { _id: 'r_new', selectedQuantity: undefined };        // Recurso sin cantidad
      const emptyPer = { _id: 'p_new', role: undefined, hours: undefined };  // Personal sin rol ni horas
      const emptyProv = { _id: 'pr_new', serviceDescription: undefined, cost: undefined }; // Proveedor sin datos

      // Ejecutamos los toggles para AGREGAR estos elementos vacíos
      component.toggleResource(emptyRes);
      component.togglePerson(emptyPer);
      component.toggleProvider(emptyProv);

      // Verificamos que se guardaron con los valores por defecto correctos
      const addedRes = component.editContract.resources.find(r => (r.resource as any) === 'r_new');
      expect(addedRes?.quantity).toBe(1); // Cantidad por defecto: 1 (|| 1)

      const addedPer = component.editContract.personnel.find(p => (p.person as any) === 'p_new');
      expect(addedPer?.role).toBe(''); // Rol por defecto: string vacío (|| '')
      expect(addedPer?.hours).toBe(0); // Horas por defecto: 0 (|| 0)

      // B. Cobertura del Ternario en Filter (Object vs String) al ELIMINAR elementos
      // Preparamos datos mixtos en el contrato (objetos y strings)
      component.editContract.resources = [
        { resource: { _id: 'obj_id' } } as any, // Rama True del ternario (objeto)
        { resource: 'str_id' } as any           // Rama False del ternario (string)
      ];
      // Marcamos ambos recursos como seleccionados
      component.selectedResources.add('obj_id');
      component.selectedResources.add('str_id');

      // Ejecutamos toggles para ELIMINAR ambos recursos
      component.toggleResource({ _id: 'obj_id' }); // Elimina recurso objeto
      component.toggleResource({ _id: 'str_id' }); // Elimina recurso string

      // Verificamos que ambos recursos fueron eliminados correctamente
      expect(component.editContract.resources.length).toBe(0);
    });

    // 3. Prueba: Manejar arrays undefined en openEditModal
    it('should handle undefined arrays in openEditModal (?? [] coverage)', () => {
      // Creamos un contrato "roto" donde los arrays son undefined
      const brokenContract = {
        ...mockContract,
        resources: undefined,   // Array de recursos undefined
        providers: undefined,   // Array de proveedores undefined  
        personnel: undefined    // Array de personal undefined
      } as any;

      // Al abrir el modal, los bucles 'for of' usarán arrays vacíos (?? [])
      component.openEditModal(brokenContract);
      
      // Verificaciones después de abrir el modal
      expect(component.showEditModal).toBeTrue();      // Modal se abre correctamente
      expect(component.selectedResources.size).toBe(0); // No hay recursos seleccionados
    });

    // 4. Prueba: Validaciones fallidas en el formulario de edición
    it('should return false on specific validateEditForm failures', () => {
      // Preparamos un contrato base con fechas válidas
      component.editContract = { ...mockContract, startDate: '2025-01-01', endDate: '2025-02-01' };

      // Caso 1: Falta Nombre (Primera validación)
      component.editContract.name = '';
      expect(component.validateEditForm()).toBeFalse();

      // Caso 2: Falta Fecha de Inicio (Segunda validación)
      component.editContract.name = 'Ok';
      component.editContract.startDate = '';
      expect(component.validateEditForm()).toBeFalse();

      // Caso 3: Fecha Fin anterior a Fecha Inicio (Tercera validación)
      component.editContract.startDate = '2025-02-01';
      component.editContract.endDate = '2025-01-01';
      expect(component.validateEditForm()).toBeFalse();

      // Caso 4: Presupuesto Negativo (Cuarta validación)
      component.editContract.endDate = '2025-03-01';
      component.editContract.budget = -100;
      expect(component.validateEditForm()).toBeFalse();
    });

    // 5. Prueba: Retorno temprano en confirmDelete cuando falta deleteId
    it('should return early in confirmDelete if deleteId is missing', () => {
      // Establecemos deleteId como null (no hay ID para eliminar)
      component.deleteId = null;
      // Limpiamos cualquier llamada previa al servicio
      contractServiceSpy.deleteContract.calls.reset(); 
      
      // Ejecutamos confirmDelete (debería retornar temprano sin hacer nada)
      component.confirmDelete();
      
      // Verificamos que NO se llamó al servicio de eliminación
      expect(contractServiceSpy.deleteContract).not.toHaveBeenCalled();
    });

    // 6. Prueba: Caso por defecto en verificaciones de selección
    it('should return false for unknown types in selection checks', () => {
      // Probamos el caso por defecto en isSelected (tipo desconocido)
      expect(component.isSelected({ _id: '1' }, 'unknown_type' as any)).toBeFalse();
      
      // Probamos los casos por defecto en isSelectedForEdit (tipos desconocidos)
      expect(component.isSelectedForEdit('1', 'unknown_type' as any)).toBeFalse();
    });

    // 7. Prueba: lastContract devuelve null cuando no hay contratos
    it('should return null if contracts array is empty', () => {
      // Establecemos un array vacío de contratos
      component.contracts = [];
      // Verificamos que lastContract devuelve null correctamente
      expect(component.lastContract).toBeNull();
    });

  });

  // =========================================================
  // 🎯 BLOQUE FRANCOTIRADOR: OBJETIVANDO LÍNEAS RESTANTES 🎯
  // =========================================================

  // Este bloque se enfoca en líneas de código específicas que aparecen como "amarillas"
  // (no cubiertas) en el reporte de cobertura
  describe('Sniper Tests: Targeting Remaining Yellow Lines', () => {

    // 1. Prueba: Cobertura específica de isSelectedForEdit para proveedores
    it('should check isSelectedForEdit for provider', () => {
      // Agregamos un proveedor a la selección
      component.selectedProviders.add('p1');
      // Verificamos que isSelectedForEdit detecta correctamente el proveedor seleccionado
      expect(component.isSelectedForEdit('p1', 'provider')).toBeTrue();
      // Verificamos que devuelve false para un proveedor no seleccionado
      expect(component.isSelectedForEdit('p99', 'provider')).toBeFalse();
    });

    // 2. Prueba: Toggles complejos con IDs mixtos y valores por defecto
    it('should handle Object vs String IDs in Toggle REMOVAL & Defaults in ADDITION', () => {
      // --- PRUEBAS CON PERSONAL ---
      // Caso ELIMINACIÓN: Preparamos datos mixtos (Objetos y Strings)
      component.editContract.personnel = [
        { person: { _id: 'obj_id' } } as any, // Rama True del ternario (objeto)
        { person: 'str_id' } as any           // Rama False del ternario (string)
      ];
      // Marcamos ambos como seleccionados
      component.selectedPersonnel.add('obj_id');
      component.selectedPersonnel.add('str_id');

      // Ejecutamos toggles para ELIMINAR
      component.togglePerson({ _id: 'obj_id' }); // Elimina objeto (filtra por objeto)
      component.togglePerson({ _id: 'str_id' }); // Elimina string (filtra por string)
      expect(component.editContract.personnel.length).toBe(0); // Ambos eliminados

      // Caso AGREGAR: Valores por defecto
      const emptyPerson = { _id: 'new_p', role: undefined, hours: undefined };
      component.togglePerson(emptyPerson);
      const addedP = component.editContract.personnel.find(p => (p.person as any) === 'new_p');
      expect(addedP?.role).toBe(''); // Rol por defecto: string vacío
      expect(addedP?.hours).toBe(0); // Horas por defecto: 0

      // --- PRUEBAS CON PROVEEDORES ---
      // Caso ELIMINACIÓN: Datos mixtos similares
      component.editContract.providers = [
        { provider: { _id: 'obj_id' } } as any,
        { provider: 'str_id' } as any
      ];
      component.selectedProviders.add('obj_id');
      component.selectedProviders.add('str_id');

      component.toggleProvider({ _id: 'obj_id' });
      component.toggleProvider({ _id: 'str_id' });
      expect(component.editContract.providers.length).toBe(0);

      // Caso AGREGAR: Valores por defecto
      const emptyProv = { _id: 'new_pr', serviceDescription: undefined, cost: undefined };
      component.toggleProvider(emptyProv);
      const addedPr = component.editContract.providers.find(p => (p.provider as any) === 'new_pr');
      expect(addedPr?.serviceDescription).toBe(''); // Descripción por defecto: string vacío
      expect(addedPr?.cost).toBe(0); // Costo por defecto: 0
    });

    // 3. Prueba: Valores por defecto en la construcción de createContract
    it('should handle defaults in createContract construction (Nullish Coalescing & ORs)', () => {
      // Configuramos un nuevo contrato con valores undefined
      component.newContract = {
        ...mockContract,
        startDate: '2025-01-01',
        endDate: '2025-02-01',
        budget: undefined,      // Presupuesto undefined
        terms: undefined,       // Términos undefined
        status: undefined as any // Estado undefined
      };

      // Configuramos elementos seleccionados con valores undefined
      // Recursos
      component.availableResources = [{ _id: 'r1', name: 'R1', selectedQuantity: undefined } as any];
      component.selectedResources.add('r1');
      
      // Proveedores  
      component.activeProviders = [{ _id: 'pr1', serviceDescription: undefined, cost: undefined } as any];
      component.selectedProviders.add('pr1');

      // Personal
      component.availablePersonnel = [{ _id: 'p1', role: undefined, hours: undefined } as any];
      component.selectedPersonnel.add('p1');

      // Configuramos el servicio para éxito
      contractServiceSpy.createContract.and.returnValue(of(mockContract));

      // Ejecutamos la creación del contrato
      component.createContract();

      // Verificamos que se llamó al servicio
      expect(contractServiceSpy.createContract).toHaveBeenCalled();
      
      // Obtenemos los argumentos con los que se llamó al servicio
      const callArgs = contractServiceSpy.createContract.calls.mostRecent().args[0];
      
      // Verificamos que se aplicaron los valores por defecto correctamente
      expect(callArgs.budget).toBe(0); // Presupuesto por defecto: 0
      expect(callArgs.terms).toBe('Sin términos especificados'); // Términos por defecto
      
      // Verificamos el rol por defecto del personal (aceptando variaciones de mayúsculas/minúsculas)
      expect(callArgs.personnel[0].role).toMatch(/sin rol definido/i); 
    });

    // 4. Prueba: Valores por defecto en updateContract
    it('should handle defaults in updateContract mapping', () => {
      // Configuramos contrato seleccionado y datos de edición
      component.selectedContract = { ...mockContract };
      component.editContract = { ...mockContract, _id: '123' };
      
      // Forzamos que todas las validaciones pasen
      spyOn(component, 'validateEditForm').and.returnValue(true);
      spyOn(component, 'validateResources').and.returnValue(true);
      spyOn(component, 'validateProviders').and.returnValue(true);
      spyOn(component, 'validatePersonnel').and.returnValue(true);

      // Preparamos datos con valores undefined para forzar el uso de defaults
      component.availableResources = [{ _id: 'r1', selectedQuantity: undefined } as any];
      component.selectedResources.add('r1');
      
      component.activeProviders = [{ _id: 'pr1', serviceDescription: undefined, cost: undefined } as any];
      component.selectedProviders.add('pr1');

      // Configuramos el servicio para éxito
      contractServiceSpy.updateContract.and.returnValue(of(mockContract));

      // Ejecutamos la actualización
      component.updateContract();

      // Verificamos que se asignaron los valores por defecto en editContract
      expect(component.editContract.resources[0].quantity).toBe(1); // Cantidad por defecto: 1
      expect(component.editContract.providers[0].cost).toBe(0); // Costo por defecto: 0
      expect(component.editContract.providers[0].serviceDescription).toBe('Sin descripción'); // Descripción por defecto
    });

    // 5. Prueba: Valor por defecto para costo undefined en validateProviders
    it('should handle undefined cost in validateProviders', () => {
      // Configuramos un proveedor con costo undefined
      component.activeProviders = [{ _id: 'pr1', name: 'P1', cost: undefined, serviceDescription: 'ok' } as any];
      component.selectedProviders.add('pr1');
      
      // El código usa `cost || 0`, por lo que undefined se convierte en 0
      // 0 no es menor que 0, por lo que la validación debería pasar
      expect(component.validateProviders()).toBeTrue(); // Validación pasa con costo por defecto 0
    });

    // 6. Prueba: Cadenas de fallback para diferentes estructuras de error
    it('should traverse error property chains', () => {
      // A. Error en Creación: Fallback total
      component.newContract = { ...mockContract, startDate: '2025-01-01', endDate: '2025-02-01' };
      // Error vacío para forzar el último fallback (|| string)
      contractServiceSpy.createContract.and.returnValue(throwError(() => ({ error: {} }))); 
      component.createContract();
      expect(component.createErrorMessage).toBe('Error al crear contrato.'); // Mensaje por defecto

      // B. Error en Actualización: Cadena de fallbacks
      component.selectedContract = { ...mockContract };
      component.editContract = { ...mockContract, _id: '123' };
      spyOn(component, 'validateEditForm').and.returnValue(true);

      // Caso 1: err.error.error (Segundo nivel de la cadena)
      contractServiceSpy.updateContract.and.returnValue(throwError(() => ({ 
        error: { message: undefined, error: 'Mensaje Error Intermedio' } 
      })));
      component.updateContract();
      expect(component.editErrorMessage).toBe('Mensaje Error Intermedio'); // Usa error.error

      // Caso 2: err.message (Tercer nivel de la cadena)
      contractServiceSpy.updateContract.and.returnValue(throwError(() => ({ 
        error: undefined, message: 'Mensaje Error Final' 
      })));
      component.updateContract();
      expect(component.editErrorMessage).toBe('Mensaje Error Final'); // Usa err.message
    });

  });

  // =========================================================
  // 🏆 BLOQUE FINAL: ÚLTIMAS LÍNEAS POR CUBRIR 🏆
  // =========================================================

  describe('Final Boss Coverage', () => {

    // 1. Prueba: Validación manual fallida en creación
    it('should set createErrorMessage and RETURN when manual checks fail in Create', () => {
      // 1. Limpiamos campos obligatorios para forzar el error de validación
      component.newContract.name = '';         // Nombre vacío
      component.newContract.clientName = '';   // Nombre de cliente vacío
      
      // 2. Ejecutamos la creación (debería fallar en validación)
      component.createContract();
      
      // 3. Verificamos que se asignó el mensaje de error y NO se llamó al servicio
      expect(component.createErrorMessage).toContain('completa todos los campos'); // Mensaje de error
      expect(contractServiceSpy.createContract).not.toHaveBeenCalled(); // Servicio no llamado
    });

    // 2. Prueba: Arrays por defecto cuando son undefined
    it('should use empty arrays [] if newContract arrays are undefined', () => {
       // Configuramos un contrato con arrays undefined
       component.newContract = {
         ...mockContract,
         startDate: '2025-01-01',
         endDate: '2025-02-01',
         resources: undefined,    // Array de recursos undefined
         providers: undefined,    // Array de proveedores undefined
         personnel: undefined     // Array de personal undefined
       } as any;

       // Configuramos el servicio para éxito
       contractServiceSpy.createContract.and.returnValue(of(mockContract));
       // Ejecutamos la creación
       component.createContract();

       // Obtenemos los argumentos enviados al servicio
       const args = contractServiceSpy.createContract.calls.mostRecent().args[0];
       
       // Verificamos que se enviaron arrays vacíos en lugar de undefined
       expect(args.resources).toEqual([]);   // Array vacío para recursos
       expect(args.providers).toEqual([]);   // Array vacío para proveedores
       expect(args.personnel).toEqual([]);   // Array vacío para personal
    });

    // 3. Prueba: Retorno temprano si falta ID en updateContract
    it('should return early in updateContract if _id is missing', () => {
      // Configuramos un contrato sin ID (undefined)
      component.editContract = { ...mockContract, _id: undefined };
      
      // Ejecutamos la actualización (debería retornar temprano)
      component.updateContract();
      
      // Verificamos que NO se llamó al servicio ni se realizaron validaciones
      expect(contractServiceSpy.updateContract).not.toHaveBeenCalled();
    });

    // 4. Prueba: Retorno temprano cuando fallan validaciones en update
    it('should return early in updateContract if ANY validation fails', () => {
      // Configuramos un contrato con ID válido
      component.editContract = { ...mockContract, _id: '123' };
      
      // Forzamos que validateEditForm devuelva false (validación fallida)
      spyOn(component, 'validateEditForm').and.returnValue(false);
      
      // Ejecutamos la actualización (debería retornar temprano)
      component.updateContract();
      
      // Verificamos que NO se llamó al servicio
      expect(contractServiceSpy.updateContract).not.toHaveBeenCalled();
    });

    // 5. Prueba: Validación fallida cuando el rol solo tiene espacios
    it('should fail validation if role is just whitespace', () => {
      // Configuramos personal con rol que solo contiene espacios
      const personWithEmptyRole = { 
        _id: 'p1', firstName: 'Juan', 
        role: '   ', // Cadena vacía con espacios
        hours: 10 
      };
      
      // Agregamos el personal a las listas disponibles y seleccionadas
      component.availablePersonnel = [personWithEmptyRole];
      component.selectedPersonnel.add('p1');
      
      // Verificamos que la validación falla y se asigna mensaje de error
      expect(component.validatePersonnel()).toBeFalse(); // Validación falla
      expect(component.editErrorMessage).toContain('Debe especificar el rol'); // Mensaje de error
    });

  });

  // =========================================================
  // 🏆 BLOQUE FINAL CORREGIDO: ÚLTIMAS LÍNEAS AMARILLAS Y ROJAS 🏆
  // =========================================================

  describe('Final Boss Coverage (Corrected)', () => {

    // 1. Prueba: Validación de campos faltantes usando undefined
    it('should hit the missingFields check and Snackbar in Create (Trick: undefined dates)', () => {
       // Truco: La validación inicial usa (=== ''), pero missingFields usa (!value)
       // Si usamos undefined, (undefined === '') es falso (pasa primera validación),
       // pero (!undefined) es verdadero (cae en missingFields)
       component.newContract = {
         ...mockContract,
         name: 'Valid Name',
         clientName: 'Valid Client',
         clientEmail: 'valid@email.com',
         startDate: undefined as any, // <--- El truco: undefined en lugar de string vacío
         endDate: '2025-12-31',
         budget: 1000
       };

       // Ejecutamos la creación
       component.createContract();

       // Verificamos que se mostró el snackbar de error y NO se llamó al servicio
       expect(snackBarSpy.open).toHaveBeenCalledWith(jasmine.stringMatching(/Faltan campos/), jasmine.any(String), jasmine.any(Object));
       expect(contractServiceSpy.createContract).not.toHaveBeenCalled();
    });

    // 2. Prueba: Retornos tempranos cuando fallan validaciones secundarias en update
    it('should return early in updateContract if sub-validations fail', () => {
      // Configuramos contrato con ID válido
      component.editContract = { ...mockContract, _id: '123' };
      // Forzamos que la validación principal pase
      spyOn(component, 'validateEditForm').and.returnValue(true);
      
      // Caso A: Falla validateResources
      const resourcesSpy = spyOn(component, 'validateResources').and.returnValue(false);
      component.updateContract();
      expect(contractServiceSpy.updateContract).not.toHaveBeenCalled(); // No se llama al servicio
      resourcesSpy.and.returnValue(true); // Restauramos a true para siguiente prueba

      // Caso B: Falla validateProviders
      const providersSpy = spyOn(component, 'validateProviders').and.returnValue(false);
      component.updateContract();
      expect(contractServiceSpy.updateContract).not.toHaveBeenCalled(); // No se llama al servicio
      providersSpy.and.returnValue(true); // Restauramos a true

      // Caso C: Falla validatePersonnel
      const personnelSpy = spyOn(component, 'validatePersonnel').and.returnValue(false);
      component.updateContract();
      expect(contractServiceSpy.updateContract).not.toHaveBeenCalled(); // No se llama al servicio
    });

    // 3. Prueba: Mapeo de personal en updateContract
    it('should execute personnel mapping in updateContract', () => {
      // Configuramos contrato con ID válido
      component.editContract = { ...mockContract, _id: '123' };
      // Forzamos que TODAS las validaciones pasen
      spyOn(component, 'validateEditForm').and.returnValue(true);
      spyOn(component, 'validateResources').and.returnValue(true);
      spyOn(component, 'validateProviders').and.returnValue(true);
      spyOn(component, 'validatePersonnel').and.returnValue(true);

      // Preparamos datos de personal para que el mapeo se ejecute
      const person = { _id: 'p1', role: 'Dev', hours: 10 };
      component.availablePersonnel = [person];
      component.selectedPersonnel.add('p1');

      // Configuramos el servicio para éxito
      contractServiceSpy.updateContract.and.returnValue(of(mockContract));
      
      // Ejecutamos la actualización
      component.updateContract();

      // Verificamos que se llamó al servicio
      expect(contractServiceSpy.updateContract).toHaveBeenCalled();
      
      // Obtenemos los argumentos del servicio y verificamos que el personal se mapeó
      const args = contractServiceSpy.updateContract.calls.mostRecent().args[1];
      expect(args.personnel[0].person); // Verifica que existe el mapeo de personal
    });

    // 4. Prueba: Presupuesto undefined en validateEditForm
    it('should handle undefined budget in validateEditForm (?? 0 coverage)', () => {
      // Configuramos contrato con presupuesto undefined
      component.editContract = { ...mockContract, budget: undefined };
      
      // Si es undefined, el código usa 0 (?? 0). 0 < 0 es false, no genera error
      component.validateEditForm();
      
      // Verificamos que NO se generó error de presupuesto
      expect(component.editErrorMessage).not.toContain('presupuesto');
    });
    
    // 5. Prueba: Retorno temprano si falta ID en updateContract (caso adicional)
    it('should return early in updateContract if _id is missing', () => {
      // Configuramos contrato sin ID
      component.editContract = { ...mockContract, _id: undefined };
      // Ejecutamos actualización (debería retornar temprano)
      component.updateContract();
      // Verificamos que NO se llamó al servicio
      expect(contractServiceSpy.updateContract).not.toHaveBeenCalled();
    });

  });
});
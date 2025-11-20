// Importamos las herramientas necesarias para testing en Angular
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms'; // Necesario para [(ngModel)] - two-way data binding
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'; // Para modales de Bootstrap
import { BehaviorSubject, of, throwError } from 'rxjs'; // Para crear observables y simular respuestas
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'; // Para ignorar elementos personalizados en tests

// Componente que vamos a probar
import { PersonnelListComponent } from './personnel-list';

// Servicios que el componente utiliza
import { PersonnelService } from '../../../core/services/personnel';
import { AuthService } from '../../../core/services/auth';

// Interfaces y Componentes relacionados
import { Personnel } from '../../../shared/interfaces/personnel';
import { PersonnelType } from '../../../shared/interfaces/personnel-type';
import { PersonnelFormComponent } from '../personnel-form/personnel-form';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal';

// La función 'describe' agrupa todas las pruebas relacionadas con el PersonnelListComponent
describe('PersonnelListComponent', () => {
  let component: PersonnelListComponent;  // Instancia del componente que vamos a probar
  let fixture: ComponentFixture<PersonnelListComponent>;  // Contenedor del componente para testing
  
  // Spies (Espías) - Objetos que simulan servicios reales
  let personnelServiceSpy: jasmine.SpyObj<PersonnelService>;
  let modalServiceSpy: jasmine.SpyObj<NgbModal>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  // Subjects para simular los streams de datos observables del servicio
  let personnelListSubject: BehaviorSubject<Personnel[]>;
  let personnelTypesSubject: BehaviorSubject<PersonnelType[]>;

  // ==========================================
  // DATOS DE PRUEBA SIMULADOS (MOCKS)
  // ==========================================

  // Mock de tipos de personal (categorías)
  const mockTypes: PersonnelType[] = [
    { _id: 't1', name: 'Chef', isActive: true, createdBy: 'admin', createdAt: '', updatedAt_: '' },
    { _id: 't2', name: 'Mesero', isActive: true, createdBy: 'admin', createdAt: '', updatedAt_: '' }
  ];

  // Mock de lista de personal (empleados)
  const mockPersonnelList: Personnel[] = [
    {
      _id: 'p1',
      firstName: 'Juan',
      lastName: 'Perez',
      email: 'juan@test.com',
      personnelType: 't1', // Chef
      status: 'disponible',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'p2',
      firstName: 'Ana',
      lastName: 'Gomez',
      email: 'ana@test.com',
      personnelType: 't2', // Mesero
      status: 'inactivo',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'p3',
      firstName: 'Pedro',
      lastName: 'Ramirez',
      email: 'pedro@test.com',
      personnelType: 't1',
      status: 'vacaciones',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // 'beforeEach' se ejecuta ANTES de cada prueba individual
  beforeEach(async () => {
    // Creamos objetos espía para los servicios
    const pSpy = jasmine.createSpyObj('PersonnelService', [
      'getAllPersonnel', 
      'getAllPersonnelTypes', 
      'updatePersonnel', 
      'deletePersonnel'
    ]);
    const mSpy = jasmine.createSpyObj('NgbModal', ['open']);
    const aSpy = jasmine.createSpyObj('AuthService', ['hasAnyRole', 'hasRole']);

    // Inicializamos los BehaviorSubjects con datos mock
    personnelListSubject = new BehaviorSubject<Personnel[]>(mockPersonnelList);
    personnelTypesSubject = new BehaviorSubject<PersonnelType[]>(mockTypes);

    // Configuramos las propiedades observables del servicio usando Object.defineProperty
    Object.defineProperty(pSpy, 'personnelList$', { get: () => personnelListSubject.asObservable() });
    Object.defineProperty(pSpy, 'personnelTypes$', { get: () => personnelTypesSubject.asObservable() });

    // Configuramos el módulo de testing de Angular
    await TestBed.configureTestingModule({
      declarations: [PersonnelListComponent],  // Componente a probar
      imports: [FormsModule],  // Necesario para ngModel en el template
      providers: [
        // Inyectamos los servicios simulados
        { provide: PersonnelService, useValue: pSpy },
        { provide: NgbModal, useValue: mSpy },
        { provide: AuthService, useValue: aSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]  // Ignora elementos HTML personalizados no reconocidos
    })
    .compileComponents();

    // Obtenemos las instancias de los servicios simulados
    personnelServiceSpy = TestBed.inject(PersonnelService) as jasmine.SpyObj<PersonnelService>;
    modalServiceSpy = TestBed.inject(NgbModal) as jasmine.SpyObj<NgbModal>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Configuración por defecto para los métodos de los servicios
    personnelServiceSpy.getAllPersonnel.and.returnValue(of(mockPersonnelList));
    personnelServiceSpy.getAllPersonnelTypes.and.returnValue(of(mockTypes));
    authServiceSpy.hasAnyRole.and.returnValue(true);  // Simula que el usuario tiene permisos

    // Creamos una instancia del componente
    fixture = TestBed.createComponent(PersonnelListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Ejecuta ngOnInit - inicialización del componente
  });

  // PRUEBA BÁSICA: Verifica que el componente se crea exitosamente
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // =================================================
  // 1. PRUEBAS DE INICIALIZACIÓN
  // =================================================
  describe('Initialization', () => {
    it('should load data and types on init', () => {
      // Verifica que durante la inicialización se cargan los datos correctamente
      expect(personnelServiceSpy.getAllPersonnel).toHaveBeenCalled();
      expect(personnelServiceSpy.getAllPersonnelTypes).toHaveBeenCalled();
      expect(component.personnelList.length).toBe(3);  // 3 empleados en mock
      expect(component.personnelTypes.length).toBe(2); // 2 tipos en mock
      expect(component.isLoading).toBeFalse();  // El loading debe desactivarse al terminar
    });

    it('should handle error when loading personnel', () => {
      // Verifica el manejo de errores al cargar la lista de personal
      personnelServiceSpy.getAllPersonnel.and.returnValue(throwError(() => new Error('Error')));
      component.loadData();  // Llamamos manualmente al método
      expect(component.alertMessage).toBe('Error al cargar el personal');
      expect(component.alertType).toBe('danger');  // Tipo de alerta para errores
    });

    it('should handle error when loading types', () => {
      // Verifica el manejo de errores al cargar los tipos de personal
      personnelServiceSpy.getAllPersonnelTypes.and.returnValue(throwError(() => new Error('Error')));
      component.loadData();
      expect(component.alertMessage).toBe('Error al cargar las categorías');
      expect(component.alertType).toBe('danger');
    });
  });

  // =================================================
  // 2. PRUEBAS DE FILTRADO
  // =================================================
  describe('Filtering Logic', () => {
    it('should filter by search term (name)', () => {
      // Verifica que filtra correctamente por nombre
      component.searchTerm = 'Ana';
      component.filterData();
      expect(component.filteredList.length).toBe(1);  // Solo debe encontrar a Ana
      expect(component.filteredList[0].firstName).toBe('Ana');
    });

    it('should filter by search term (email)', () => {
      // Verifica que filtra correctamente por email
      component.searchTerm = 'pedro@test.com';
      component.filterData();
      expect(component.filteredList.length).toBe(1);
      expect(component.filteredList[0].email).toBe('pedro@test.com');
    });

    it('should filter by status', () => {
      // Verifica que filtra correctamente por estado
      component.statusFilter = 'inactivo';
      component.filterData();
      expect(component.filteredList.length).toBe(1);
      expect(component.filteredList[0].status).toBe('inactivo');
    });

    it('should filter by type', () => {
      // Verifica que filtra correctamente por tipo de personal
      component.typeFilter = 't2';
      component.filterData();
      expect(component.filteredList.length).toBe(1);
      expect(component.filteredList[0].personnelType).toBe('t2');  // Mesero
    });

    it('should combine filters', () => {
      // Verifica que funciona correctamente con múltiples filtros aplicados
      component.searchTerm = 'Juan';
      component.statusFilter = 'disponible';
      component.typeFilter = 't1';
      component.filterData();
      expect(component.filteredList.length).toBe(1);
      expect(component.filteredList[0].firstName).toBe('Juan');
    });

    it('should return empty if no matches', () => {
      // Verifica que devuelve lista vacía cuando no hay coincidencias
      component.searchTerm = 'Xyz';
      component.filterData();
      expect(component.filteredList.length).toBe(0);
    });

    it('resetFilters should clear filters and reload list', () => {
      // Verifica que resetFilters limpia todos los filtros
      component.searchTerm = 'Algo';
      component.statusFilter = 'inactivo';
      component.typeFilter = 't1';
      component.resetFilters();
      expect(component.searchTerm).toBe('');
      expect(component.statusFilter).toBe('all');  // Valor por defecto
      expect(component.typeFilter).toBe('all');    // Valor por defecto
      expect(component.filteredList.length).toBe(3);  // Todos los elementos sin filtrar
    });
  });

  // =================================================
  // 3. PRUEBAS DE MODALES (Create/Edit)
  // =================================================
  describe('Modal Interactions (Create/Edit)', () => {
    let mockModalRef: any;

    // Configuración común para pruebas de modales
    beforeEach(() => {
      mockModalRef = {
        componentInstance: {},  // Instancia del componente modal
        result: Promise.resolve('saved')  // Simula que el modal se cerró con 'saved'
      };
      modalServiceSpy.open.and.returnValue(mockModalRef);
    });

    it('should open modal for Create and reload data on success', fakeAsync(() => {
      // Verifica la apertura del modal para crear nuevo personal
      mockModalRef.result = Promise.resolve('saved');
      component.openPersonnelForm();  // Sin parámetros = crear nuevo
      tick();  // Avanza el tiempo virtual para resolver la promesa
      
      expect(modalServiceSpy.open).toHaveBeenCalledWith(PersonnelFormComponent, { size: 'lg' });
      expect(mockModalRef.componentInstance.personnel).toBeUndefined();  // No debe tener datos de personal
      expect(personnelServiceSpy.getAllPersonnel).toHaveBeenCalled();  // Debe recargar datos
      expect(component.alertMessage).toContain('creado');  // Mensaje de éxito
    }));

    it('should open modal for Edit and pass personnel data', fakeAsync(() => {
      // Verifica la apertura del modal para editar personal existente
      const personToEdit = mockPersonnelList[0];
      component.openPersonnelForm(personToEdit);  // Con parámetro = editar
      tick();
      
      expect(mockModalRef.componentInstance.personnel).toEqual(personToEdit);  // Debe pasar los datos
      expect(component.alertMessage).toContain('actualizado');  // Mensaje de actualización
    }));

    it('should do nothing if modal is dismissed', fakeAsync(() => {
      // Verifica que no hace nada cuando el modal se cancela
      mockModalRef.result = Promise.resolve('dismissed');
      personnelServiceSpy.getAllPersonnel.calls.reset();  // Reiniciamos el contador de llamadas
      component.openPersonnelForm();
      tick();
      
      expect(personnelServiceSpy.getAllPersonnel).not.toHaveBeenCalled();  // No debe recargar datos
    }));

    // [COVERAGE FIX] Cubre el bloque .catch() del modal
    it('should handle modal rejection (catch block)', fakeAsync(() => {
      // Verifica que maneja correctamente el rechazo de la promesa del modal
      mockModalRef.result = Promise.reject('error');
      component.openPersonnelForm();
      tick();
      
      // Simplemente verificamos que no explotó y que se llamó al servicio para abrir el modal
      expect(modalServiceSpy.open).toHaveBeenCalled();
    }));
  });

  // =================================================
  // 4. PRUEBAS DE ACCIONES (Delete/Status)
  // =================================================
  describe('Actions (Delete/Status)', () => {
    
    it('should toggle status from "disponible" to "inactivo"', () => {
      // Verifica el cambio de estado de "disponible" a "inactivo"
      const person = mockPersonnelList[0]; // status: disponible
      personnelServiceSpy.updatePersonnel.and.returnValue(of({ ...person, status: 'inactivo' }));
      
      component.toggleStatus(person);
      
      // Verifica que se llamó al servicio con los parámetros correctos
      expect(personnelServiceSpy.updatePersonnel).toHaveBeenCalledWith(
        person._id, 
        jasmine.objectContaining({ status: 'inactivo' })  // El nuevo estado
      );
      expect(component.alertMessage).toBe('Estado actualizado');
    });

    // [COVERAGE FIX] Cubre la rama "else" del ternario (status !== 'disponible')
    it('should toggle status from "inactivo" to "disponible"', () => {
      // Verifica el cambio de estado de "inactivo" a "disponible"
      const person = mockPersonnelList[1]; // status: inactivo
      personnelServiceSpy.updatePersonnel.and.returnValue(of({ ...person, status: 'disponible' }));
      
      component.toggleStatus(person);
      
      expect(personnelServiceSpy.updatePersonnel).toHaveBeenCalledWith(
        person._id, 
        jasmine.objectContaining({ status: 'disponible' })
      );
      expect(component.alertMessage).toBe('Estado actualizado');
    });

    it('should handle error when toggling status', () => {
      // Verifica el manejo de errores al cambiar estado
      const person = mockPersonnelList[0];
      personnelServiceSpy.updatePersonnel.and.returnValue(throwError(() => new Error('Fail')));
      component.toggleStatus(person);
      expect(component.alertMessage).toBe('Error al actualizar estado');
    });

    it('should delete personnel after confirmation', fakeAsync(() => {
      // Verifica la eliminación de personal después de confirmación
      const mockConfirmRef = {
        componentInstance: { title: '', message: '', confirmText: '', confirmClass: '' },
        result: Promise.resolve(true)  // Usuario confirma la eliminación
      };
      modalServiceSpy.open.and.returnValue(mockConfirmRef as any);
      personnelServiceSpy.deletePersonnel.and.returnValue(of(void 0));
      
      component.confirmDelete('p1');
      tick();  // Procesa la promesa de confirmación
      
      expect(modalServiceSpy.open).toHaveBeenCalledWith(ConfirmModalComponent);
      expect(personnelServiceSpy.deletePersonnel).toHaveBeenCalledWith('p1');
      expect(component.alertMessage).toBe('Personal eliminado');
    }));

    it('should NOT delete if user cancels confirmation', fakeAsync(() => {
      // Verifica que NO elimina cuando el usuario cancela
      const mockConfirmRef = {
        componentInstance: {},
        result: Promise.resolve(false)  // Usuario cancela la eliminación
      };
      modalServiceSpy.open.and.returnValue(mockConfirmRef as any);
      
      component.confirmDelete('p1');
      tick();
      
      expect(personnelServiceSpy.deletePersonnel).not.toHaveBeenCalled();  // No debe eliminar
    }));

    // [COVERAGE FIX] Cubre el bloque .catch() de confirmDelete
    it('should handle confirmation modal rejection (catch block)', fakeAsync(() => {
      // Verifica el manejo de errores en el modal de confirmación
      const mockConfirmRef = {
        componentInstance: {},
        result: Promise.reject('error')  // El modal falla/rechaza
      };
      modalServiceSpy.open.and.returnValue(mockConfirmRef as any);
      
      component.confirmDelete('p1');
      tick();
      
      expect(personnelServiceSpy.deletePersonnel).not.toHaveBeenCalled();  // No debe eliminar
    }));

    it('should handle error when deleting', fakeAsync(() => {
      // Verifica el manejo de errores durante la eliminación
      const mockConfirmRef = {
        componentInstance: {},
        result: Promise.resolve(true)  // Usuario confirma
      };
      modalServiceSpy.open.and.returnValue(mockConfirmRef as any);
      personnelServiceSpy.deletePersonnel.and.returnValue(throwError(() => new Error('Fail')));
      
      component.confirmDelete('p1');
      tick();
      
      expect(component.alertMessage).toBe('Error al eliminar');
    }));
  });

  // =================================================
  // 5. PRUEBAS DE HELPERS Y PERMISOS
  // =================================================
  describe('Helpers & Permissions', () => {
    it('getStatusLabel should return correct label', () => {
      // Verifica que traduce correctamente los estados a etiquetas legibles
      expect(component.getStatusLabel('disponible')).toBe('Disponible');
      expect(component.getStatusLabel('unknown')).toBe('Desconocido');  // Estado por defecto
    });

    it('getTypeName should return correct name', () => {
      // Verifica que obtiene el nombre del tipo a partir del ID
      expect(component.getTypeName('t1')).toBe('Chef');
      expect(component.getTypeName('invalid')).toBe('Sin categoría');  // Tipo por defecto
    });

    it('permissions should delegate to authService', () => {
      // Verifica que los métodos de permisos delegan correctamente al servicio de autenticación
      component.canCreate();
      expect(authServiceSpy.hasAnyRole).toHaveBeenCalledWith(['admin', 'coordinador']);
      
      component.canDelete();
      expect(authServiceSpy.hasRole).toHaveBeenCalledWith('admin');

      component.canEdit(mockPersonnelList[0]);
      expect(authServiceSpy.hasAnyRole).toHaveBeenCalledWith(['admin', 'coordinador']);

      component.canToggleStatus();
      expect(authServiceSpy.hasAnyRole).toHaveBeenCalledWith(['admin', 'coordinador']);
    });
  });

  // =================================================
  // 6. LÓGICA DE ALERTAS
  // =================================================
  describe('Alert Logic', () => {
    it('should clear alert message after 5 seconds', fakeAsync(() => {
      // Verifica que las alertas se auto-limpián después de 5 segundos
      (component as any).showAlert('Test', 'success');
      expect(component.alertMessage).toBe('Test');
      tick(5000);  // Avanza 5 segundos en el tiempo virtual
      expect(component.alertMessage).toBe('');  // El mensaje debe haberse limpiado
    }));
  });
});
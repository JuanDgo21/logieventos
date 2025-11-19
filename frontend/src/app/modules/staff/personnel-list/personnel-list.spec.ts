import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms'; // Necesario para [(ngModel)]
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'; // SOLUCIÓN PARA NG0304

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

// Bloque principal de pruebas para el componente PersonnelListComponent
describe('PersonnelListComponent', () => {
  // Variables fundamentales para las pruebas
  let component: PersonnelListComponent; // Instancia del componente a probar
  let fixture: ComponentFixture<PersonnelListComponent>; // Entorno de prueba del componente

  // Objetos simulados (spies) que nos permiten controlar y verificar el comportamiento de los servicios
  let personnelServiceSpy: jasmine.SpyObj<PersonnelService>; // Servicio para gestionar personal
  let modalServiceSpy: jasmine.SpyObj<NgbModal>; // Servicio para abrir modales
  let authServiceSpy: jasmine.SpyObj<AuthService>; // Servicio de autenticación y permisos

  // Subjects para simular streams de datos reactivos (Observables)
  let personnelListSubject: BehaviorSubject<Personnel[]>; // Stream para lista de personal
  let personnelTypesSubject: BehaviorSubject<PersonnelType[]>; // Stream para tipos de personal

  // Datos de prueba simulados - representan tipos de personal disponibles
  const mockTypes: PersonnelType[] = [
    { _id: 't1', name: 'Chef', isActive: true, createdBy: 'admin', createdAt: '', updatedAt_: '' },
    { _id: 't2', name: 'Mesero', isActive: true, createdBy: 'admin', createdAt: '', updatedAt_: '' }
  ];

  // Datos de prueba simulados - representan personas del personal
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

  // Configuración que se ejecuta antes de cada prueba individual
  beforeEach(async () => {
    // 1. Crear objetos simulados (spies) para los servicios
    const pSpy = jasmine.createSpyObj('PersonnelService', [
      'getAllPersonnel', 
      'getAllPersonnelTypes', 
      'updatePersonnel', 
      'deletePersonnel'
    ]);
    const mSpy = jasmine.createSpyObj('NgbModal', ['open']);
    const aSpy = jasmine.createSpyObj('AuthService', ['hasAnyRole', 'hasRole']);

    // 2. Configurar Subjects para simular los Observables públicos del servicio
    // BehaviorSubject mantiene el último valor emitido y lo envía a nuevos suscriptores
    personnelListSubject = new BehaviorSubject<Personnel[]>(mockPersonnelList);
    personnelTypesSubject = new BehaviorSubject<PersonnelType[]>(mockTypes);

    // Asignar los observables al spy usando getters - esto simula las propiedades $ del servicio real
    Object.defineProperty(pSpy, 'personnelList$', { get: () => personnelListSubject.asObservable() });
    Object.defineProperty(pSpy, 'personnelTypes$', { get: () => personnelTypesSubject.asObservable() });

    // Configurar el módulo de testing de Angular con todas las dependencias necesarias
    await TestBed.configureTestingModule({
      declarations: [PersonnelListComponent], // Componente bajo prueba
      imports: [FormsModule], // Importante para los filtros del HTML que usan [(ngModel)]
      providers: [
        // Proporcionar los servicios simulados en lugar de los reales
        { provide: PersonnelService, useValue: pSpy },
        { provide: NgbModal, useValue: mSpy },
        { provide: AuthService, useValue: aSpy }
      ],
      // SOLUCIÓN AL ERROR NG0304: Ignorar elementos HTML personalizados no reconocidos
      schemas: [CUSTOM_ELEMENTS_SCHEMA] 
    })
    .compileComponents(); // Compilar el componente y su template

    // Obtener las instancias de los servicios simulados después de configurar el módulo
    personnelServiceSpy = TestBed.inject(PersonnelService) as jasmine.SpyObj<PersonnelService>;
    modalServiceSpy = TestBed.inject(NgbModal) as jasmine.SpyObj<NgbModal>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Configurar comportamiento por defecto de los servicios
    personnelServiceSpy.getAllPersonnel.and.returnValue(of(mockPersonnelList));
    personnelServiceSpy.getAllPersonnelTypes.and.returnValue(of(mockTypes));
    authServiceSpy.hasAnyRole.and.returnValue(true); // Permisos por defecto: tiene acceso

    // Crear el componente dentro del entorno de prueba
    fixture = TestBed.createComponent(PersonnelListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Dispara ngOnInit -> loadData -> subscribe a los Observables
  });

  // Prueba básica: verificar que el componente se crea exitosamente
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // =================================================
  // 1. PRUEBAS DE INICIALIZACIÓN Y CARGA DE DATOS
  // =================================================
  describe('Initialization', () => {
    // Prueba: el componente debe cargar datos y tipos al inicializarse
    it('should load data and types on init', () => {
      // Verificar que se llamaron a los métodos de carga
      expect(personnelServiceSpy.getAllPersonnel).toHaveBeenCalled();
      expect(personnelServiceSpy.getAllPersonnelTypes).toHaveBeenCalled();
      // Verificar que los datos se cargaron correctamente
      expect(component.personnelList.length).toBe(3);
      expect(component.personnelTypes.length).toBe(2);
      // Verificar que el indicador de carga se desactiva
      expect(component.isLoading).toBeFalse();
    });

    // Prueba: manejo de error al cargar la lista de personal
    it('should handle error when loading personnel', () => {
      // Configurar el servicio para devolver un error al cargar personal
      personnelServiceSpy.getAllPersonnel.and.returnValue(throwError(() => new Error('Error')));
      // Ejecutar la carga de datos (que fallará)
      component.loadData(); 
      // Verificar que se muestra el mensaje de error correcto
      expect(component.alertMessage).toBe('Error al cargar el personal');
      expect(component.alertType).toBe('danger');
    });

    // Prueba: manejo de error al cargar los tipos de personal
    it('should handle error when loading types', () => {
      // Configurar el servicio para devolver un error al cargar tipos
      personnelServiceSpy.getAllPersonnelTypes.and.returnValue(throwError(() => new Error('Error')));
      // Ejecutar la carga de datos (que fallará)
      component.loadData();
      // Verificar que se muestra el mensaje de error correcto
      expect(component.alertMessage).toBe('Error al cargar las categorías');
      expect(component.alertType).toBe('danger');
    });
  });

  // =================================================
  // 2. PRUEBAS DE FILTRADO DE DATOS
  // =================================================
  describe('Filtering Logic', () => {
    // Prueba: filtrar por término de búsqueda en nombre
    it('should filter by search term (name)', () => {
      // Establecer término de búsqueda
      component.searchTerm = 'Ana';
      // Aplicar filtros
      component.filterData();
      // Verificar que solo se encontró 1 usuario
      expect(component.filteredList.length).toBe(1);
      // Verificar que es el usuario correcto
      expect(component.filteredList[0].firstName).toBe('Ana');
    });

    // Prueba: filtrar por término de búsqueda en email
    it('should filter by search term (email)', () => {
      // Establecer término de búsqueda por email
      component.searchTerm = 'pedro@test.com';
      // Aplicar filtros
      component.filterData();
      // Verificar que solo se encontró 1 usuario
      expect(component.filteredList.length).toBe(1);
      // Verificar que es el usuario correcto
      expect(component.filteredList[0].email).toBe('pedro@test.com');
    });

    // Prueba: filtrar por estado
    it('should filter by status', () => {
      // Establecer filtro de estado
      component.statusFilter = 'inactivo';
      // Aplicar filtros
      component.filterData();
      // Verificar que solo se encontró 1 usuario inactivo
      expect(component.filteredList.length).toBe(1);
      // Verificar que tiene el estado correcto
      expect(component.filteredList[0].status).toBe('inactivo');
    });

    // Prueba: filtrar por tipo de personal
    it('should filter by type', () => {
      // Establecer filtro por tipo (Mesero)
      component.typeFilter = 't2';
      // Aplicar filtros
      component.filterData();
      // Verificar que solo se encontró 1 usuario de tipo Mesero
      expect(component.filteredList.length).toBe(1);
      // Verificar que tiene el tipo correcto
      expect(component.filteredList[0].personnelType).toBe('t2');
    });

    // Prueba: combinar múltiples filtros (AND lógico)
    it('should combine filters', () => {
      // Configurar múltiples filtros que deberían coincidir con Juan
      component.searchTerm = 'Juan'; // Busca por nombre
      component.statusFilter = 'disponible'; // Filtra por estado disponible
      component.typeFilter = 't1'; // Filtra por tipo Chef
      // Aplicar filtros
      component.filterData();
      // Verificar que solo se encontró 1 usuario que cumple todas las condiciones
      expect(component.filteredList.length).toBe(1);
      // Verificar que es el usuario correcto
      expect(component.filteredList[0].firstName).toBe('Juan');
    });

    // Prueba: cuando no hay coincidencias debe devolver lista vacía
    it('should return empty if no matches', () => {
      // Configurar término de búsqueda que no existe
      component.searchTerm = 'Xyz';
      // Aplicar filtros
      component.filterData();
      // Verificar que no se encontraron usuarios
      expect(component.filteredList.length).toBe(0);
    });

    // Prueba: reinicio de filtros debe limpiar todos los filtros
    it('resetFilters should clear filters and reload list', () => {
      // Establecer filtros con valores específicos
      component.searchTerm = 'Algo';
      component.statusFilter = 'inactivo';
      component.typeFilter = 't1';
      
      // Ejecutar reinicio de filtros
      component.resetFilters();

      // Verificar que los filtros volvieron a sus valores por defecto
      expect(component.searchTerm).toBe('');
      expect(component.statusFilter).toBe('all');
      expect(component.typeFilter).toBe('all');
      // Verificar que se muestran todos los usuarios nuevamente
      expect(component.filteredList.length).toBe(3); 
    });
  });

  // =================================================
  // 3. PRUEBAS DE INTERACCIONES CON MODALES (Crear/Editar)
  // =================================================
  describe('Modal Interactions (Create/Edit)', () => {
    let mockModalRef: any;

    // Configuración que se ejecuta antes de cada prueba en este bloque
    beforeEach(() => {
      // Simular referencia de modal con comportamiento por defecto exitoso
      mockModalRef = {
        componentInstance: {}, // Instancia del componente del modal
        result: Promise.resolve('saved') // Comportamiento por defecto: guardado exitoso
      };
      // Configurar el servicio de modales para devolver nuestro modal simulado
      modalServiceSpy.open.and.returnValue(mockModalRef);
    });

    // Prueba: abrir modal para crear y recargar datos en caso de éxito
    it('should open modal for Create and reload data on success', fakeAsync(() => {
      // Configurar el modal para resolver con 'saved' (éxito)
      mockModalRef.result = Promise.resolve('saved');
      
      // Abrir formulario en modo creación (sin pasar datos)
      component.openPersonnelForm();
      tick(); // Avanzar el tiempo para resolver la promesa

      // Verificar que se abrió el modal correcto con la configuración adecuada
      expect(modalServiceSpy.open).toHaveBeenCalledWith(PersonnelFormComponent, { size: 'lg' });
      // Verificar que no se pasó datos de personal (modo creación)
      expect(mockModalRef.componentInstance.personnel).toBeUndefined();
      // Verificar que se recargaron los datos después del guardado exitoso
      expect(personnelServiceSpy.getAllPersonnel).toHaveBeenCalled();
      // Verificar que se muestra mensaje de éxito para creación
      expect(component.alertMessage).toContain('creado');
    }));

    // Prueba: abrir modal para editar y pasar datos existentes
    it('should open modal for Edit and pass personnel data', fakeAsync(() => {
      // Seleccionar persona a editar
      const personToEdit = mockPersonnelList[0];
      // Abrir formulario en modo edición (pasando datos)
      component.openPersonnelForm(personToEdit);
      tick(); // Avanzar el tiempo

      // Verificar que se pasaron los datos correctos al modal
      expect(mockModalRef.componentInstance.personnel).toEqual(personToEdit);
      // Verificar que se muestra mensaje de éxito para actualización
      expect(component.alertMessage).toContain('actualizado');
    }));

    // Prueba: no hacer nada si el modal es cancelado o descartado
    it('should do nothing if modal is dismissed or result is not saved', fakeAsync(() => {
      // Configurar el modal para resolver con 'dismissed' (cancelado)
      mockModalRef.result = Promise.resolve('dismissed');
      
      // Resetear contador de llamadas para verificar que NO se llama de nuevo
      personnelServiceSpy.getAllPersonnel.calls.reset();
      
      // Abrir formulario
      component.openPersonnelForm();
      tick(); // Avanzar el tiempo

      // Verificar que NO se recargaron los datos (porque se canceló)
      expect(personnelServiceSpy.getAllPersonnel).not.toHaveBeenCalled();
    }));
  });

  // =================================================
  // 4. PRUEBAS DE ACCIONES (Eliminar y Cambiar Estado)
  // =================================================
  describe('Actions (Delete/Status)', () => {
    
    // Prueba: cambiar estado exitosamente
    it('should toggle status successfully', () => {
      const person = mockPersonnelList[0]; // Estado inicial: disponible
      // Configurar servicio para actualizar exitosamente
      personnelServiceSpy.updatePersonnel.and.returnValue(of({ ...person, status: 'inactivo' }));

      // Ejecutar cambio de estado
      component.toggleStatus(person);

      // Verificar que se llamó al servicio con los parámetros correctos
      expect(personnelServiceSpy.updatePersonnel).toHaveBeenCalledWith(
        person._id, 
        jasmine.objectContaining({ status: 'inactivo' }) // Se cambia a inactivo
      );
      // Verificar que se muestra mensaje de éxito
      expect(component.alertMessage).toBe('Estado actualizado');
    });

    // Prueba: manejo de error al cambiar estado
    it('should handle error when toggling status', () => {
      const person = mockPersonnelList[0];
      // Configurar servicio para devolver error
      personnelServiceSpy.updatePersonnel.and.returnValue(throwError(() => new Error('Fail')));

      // Ejecutar cambio de estado (que fallará)
      component.toggleStatus(person);

      // Verificar que se muestra mensaje de error
      expect(component.alertMessage).toBe('Error al actualizar estado');
    });

    // Prueba: eliminar personal después de confirmación
    it('should delete personnel after confirmation', fakeAsync(() => {
      // Simular modal de confirmación que el usuario acepta
      const mockConfirmRef = {
        componentInstance: { title: '', message: '', confirmText: '', confirmClass: '' },
        result: Promise.resolve(true) // Usuario confirma la eliminación
      };
      modalServiceSpy.open.and.returnValue(mockConfirmRef as any);
      // Configurar servicio para eliminar exitosamente
      personnelServiceSpy.deletePersonnel.and.returnValue(of(void 0));

      // Ejecutar confirmación de eliminación
      component.confirmDelete('p1');
      tick(); // Avanzar el tiempo para resolver la promesa

      // Verificar que se abrió el modal de confirmación
      expect(modalServiceSpy.open).toHaveBeenCalledWith(ConfirmModalComponent);
      // Verificar que se llamó al servicio de eliminación con el ID correcto
      expect(personnelServiceSpy.deletePersonnel).toHaveBeenCalledWith('p1');
      // Verificar que se muestra mensaje de éxito
      expect(component.alertMessage).toBe('Personal eliminado');
    }));

    // Prueba: NO eliminar si el usuario cancela la confirmación
    it('should NOT delete if user cancels confirmation', fakeAsync(() => {
      // Simular modal de confirmación que el usuario cancela
      const mockConfirmRef = {
        componentInstance: {},
        result: Promise.resolve(false) // Usuario cancela
      };
      modalServiceSpy.open.and.returnValue(mockConfirmRef as any);

      // Ejecutar confirmación de eliminación
      component.confirmDelete('p1');
      tick(); // Avanzar el tiempo

      // Verificar que NO se llamó al servicio de eliminación
      expect(personnelServiceSpy.deletePersonnel).not.toHaveBeenCalled();
    }));

    // Prueba: manejo de error al eliminar
    it('should handle error when deleting', fakeAsync(() => {
      // Simular modal de confirmación que el usuario acepta
      const mockConfirmRef = {
        componentInstance: {},
        result: Promise.resolve(true)
      };
      modalServiceSpy.open.and.returnValue(mockConfirmRef as any);
      // Configurar servicio para devolver error al eliminar
      personnelServiceSpy.deletePersonnel.and.returnValue(throwError(() => new Error('Fail')));

      // Ejecutar eliminación (que fallará)
      component.confirmDelete('p1');
      tick(); // Avanzar el tiempo

      // Verificar que se muestra mensaje de error
      expect(component.alertMessage).toBe('Error al eliminar');
    }));
  });

  // =================================================
  // 5. PRUEBAS DE FUNCIONES AUXILIARES Y PERMISOS
  // =================================================
  describe('Helpers & Permissions', () => {
    // Prueba: obtener etiqueta correcta para cada estado
    it('getStatusLabel should return correct label', () => {
      // Verificar que devuelve la etiqueta correcta para estado conocido
      expect(component.getStatusLabel('disponible')).toBe('Disponible');
      // Verificar que devuelve "Desconocido" para estado no reconocido
      expect(component.getStatusLabel('unknown')).toBe('Desconocido');
    });

    // Prueba: obtener nombre correcto para cada tipo
    it('getTypeName should return correct name', () => {
      // Verificar que devuelve el nombre correcto para tipo conocido
      expect(component.getTypeName('t1')).toBe('Chef');
      // Verificar que devuelve "Sin categoría" para tipo no encontrado
      expect(component.getTypeName('invalid')).toBe('Sin categoría');
    });

    // Prueba: permisos delegan correctamente al servicio de autenticación
    it('permissions should delegate to authService', () => {
      // Verificar que canCreate llama al servicio con los roles correctos
      component.canCreate();
      expect(authServiceSpy.hasAnyRole).toHaveBeenCalledWith(['admin', 'coordinador']);
      
      // Verificar que canDelete llama al servicio con el rol correcto
      component.canDelete();
      expect(authServiceSpy.hasRole).toHaveBeenCalledWith('admin');
    });
  });

  // =================================================
  // 6. PRUEBAS DE LÓGICA DE ALERTAS Y TIMEOUT
  // =================================================
  describe('Alert Logic', () => {
    // Prueba: el mensaje de alerta debe limpiarse después de 5 segundos
    it('should clear alert message after 5 seconds', fakeAsync(() => {
      // Mostrar alerta de prueba
      (component as any).showAlert('Test', 'success');
      // Verificar que el mensaje se estableció correctamente
      expect(component.alertMessage).toBe('Test');
      // Avanzar el tiempo 5 segundos (simula que pasó el tiempo)
      tick(5000);
      // Verificar que el mensaje se limpió automáticamente
      expect(component.alertMessage).toBe('');
    }));
  });
});
// Importamos las herramientas necesarias para testing en Angular
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DashboardStaffComponent } from './dashboard-staff';
import { AuthService } from '../../../core/services/auth';
import { PersonnelService } from '../../../core/services/personnel';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BehaviorSubject, of } from 'rxjs';  // BehaviorSubject permite crear observables con estado, 'of' crea observables simples
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Personnel } from '../../../shared/interfaces/personnel';
import { PersonnelType } from '../../../shared/interfaces/personnel-type';

// La función 'describe' agrupa todas las pruebas relacionadas con el DashboardStaffComponent
describe('DashboardStaffComponent', () => {
  let component: DashboardStaffComponent;  // Instancia del componente que vamos a probar
  let fixture: ComponentFixture<DashboardStaffComponent>;  // Contenedor del componente para testing

  // Spies (Espías) - Objetos que simulan servicios reales
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let personnelServiceSpy: jasmine.SpyObj<PersonnelService>;
  let modalServiceSpy: jasmine.SpyObj<NgbModal>;

  // Subjects para simular los streams del servicio (flujos de datos observables)
  let personnelListSubject: BehaviorSubject<Personnel[]>;
  let personnelTypesSubject: BehaviorSubject<PersonnelType[]>;

  // Mocks de Datos para Cobertura Total - Datos falsos que usaremos en las pruebas
  const mockTypes: PersonnelType[] = [
    { _id: 'type1', name: 'Desarrollo', isActive: true, createdBy: 'admin', createdAt: '', updatedAt_: '' },
    { _id: 'type2', name: 'Ventas', isActive: true, createdBy: 'admin', createdAt: '', updatedAt_: '' },
    { _id: 'type3', name: 'EmptyDept', isActive: true, createdBy: 'admin', createdAt: '', updatedAt_: '' } // Departamento sin empleados (Para cubrir el if dentro del loop)
  ];

  // Fechas para probar diferentes escenarios
  const today = new Date();
  const oldDate = new Date('2020-01-01');

  // Datos mock de personal con diferentes características para cubrir todos los casos
  const mockPersonnel: any[] = [
    { 
      _id: '1', 
      firstName: 'Juan', 
      lastName: 'Perez', 
      email: 'juan@test.com', 
      personnelType: 'type1', 
      status: 'disponible', 
      createdAt: today // New Hire - Para probar contrataciones recientes
    },
    { 
      _id: '2', 
      firstName: 'Maria', 
      lastName: 'Gomez', 
      email: 'maria@test.com', 
      personnelType: { _id: 'type2', name: 'Ventas' }, // Populated Object - Para probar objeto poblado
      status: 'vacaciones', 
      createdAt: oldDate // Old Hire - Para probar empleados antiguos
    },
    { 
      _id: '3', 
      firstName: 'SinFecha', 
      lastName: 'Test', 
      email: 'test@test.com', 
      personnelType: 'type1', 
      status: 'inactivo', 
      createdAt: null // Fecha nula - Para probar manejo de valores nulos
    }
  ];

  // 'beforeEach' se ejecuta ANTES de cada prueba individual
  beforeEach(async () => {
    // Inicializamos los BehaviorSubjects con arrays vacíos
    personnelListSubject = new BehaviorSubject<Personnel[]>([]);
    personnelTypesSubject = new BehaviorSubject<PersonnelType[]>([]);

    // CORRECCIÓN PRINCIPAL: Agregamos 'getCurrentUserData' al spy para evitar errores
    const authSpy = jasmine.createSpyObj('AuthService', ['getUserRole', 'getCurrentUserData']);
    
    // Creamos el spy para el servicio de personal con sus métodos y propiedades observables
    const personnelSpy = jasmine.createSpyObj('PersonnelService', ['getAllPersonnel', 'getAllPersonnelTypes']);
    personnelSpy.personnelList$ = personnelListSubject.asObservable();  // Convertimos el Subject a Observable
    personnelSpy.personnelTypes$ = personnelTypesSubject.asObservable();
    personnelSpy.getAllPersonnel.and.returnValue(of([]));  // Configuramos retorno por defecto
    personnelSpy.getAllPersonnelTypes.and.returnValue(of([]));

    const modalSpy = jasmine.createSpyObj('NgbModal', ['open']);  // Spy para el servicio de modales

    // Configuramos el módulo de testing de Angular
    await TestBed.configureTestingModule({
      declarations: [DashboardStaffComponent],  // Componente a probar
      providers: [
        // Proporcionamos los servicios simulados
        { provide: AuthService, useValue: authSpy },
        { provide: PersonnelService, useValue: personnelSpy },
        { provide: NgbModal, useValue: modalSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]  // Ignora elementos HTML desconocidos
    })
    .compileComponents();

    // Obtenemos las instancias de los servicios simulados del TestBed
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    personnelServiceSpy = TestBed.inject(PersonnelService) as jasmine.SpyObj<PersonnelService>;
    modalServiceSpy = TestBed.inject(NgbModal) as jasmine.SpyObj<NgbModal>;

    // Configuración de retornos por defecto para evitar errores en el HTML
    authServiceSpy.getCurrentUserData.and.returnValue({ id: '1', email: 'test@test.com', role: 'admin' });
    authServiceSpy.getUserRole.and.returnValue('admin');

    // Creamos una instancia del componente dentro del fixture
    fixture = TestBed.createComponent(DashboardStaffComponent);
    component = fixture.componentInstance;  // Obtenemos la instancia real del componente
    fixture.detectChanges();  // Forzamos la detección de cambios (ngOnInit se ejecuta aquí)
  });

  // PRUEBA BÁSICA: Verifica que el componente se crea exitosamente
  it('should create', () => {
    expect(component).toBeTruthy();  // Comprueba que el componente existe
  });

  // GRUPO DE PRUEBAS PARA LA CARGA DE DATOS Y CÁLCULO DE ESTADÍSTICAS
  describe('loadData & Stats Calculation', () => {
    it('should calculate stats correctly covering all date and status branches', () => {
      // Enviamos datos mock a través de los Subjects para simular respuestas del servicio
      personnelTypesSubject.next(mockTypes);
      personnelListSubject.next(mockPersonnel);
      
      // Verificamos que calcula correctamente el total de empleados
      expect(component.stats.totalEmployees).toBe(3);  // 3 empleados en mockPersonnel
      
      // Verificamos empleados activos: solo Juan ('disponible'). Maria ('vacaciones') y SinFecha ('inactivo') no cuentan
      expect(component.stats.activeEmployees).toBe(1);
      
      // Verificamos empleados de vacaciones: Maria
      expect(component.stats.onVacation).toBe(1);
      
      // Verificamos nuevas contrataciones: Solo Juan. Maria es antigua, SinFecha es null.
      expect(component.stats.newHires).toBe(1);
    });

    it('should calculate department distribution and ignore empty departments', () => {
      // Este test cubre el "if (typeCounts[type._id])" dentro del loop - departamentos con empleados
      personnelTypesSubject.next(mockTypes);
      personnelListSubject.next(mockPersonnel);

      // type1 (Desarrollo) tiene 2 empleados (Juan y SinFecha)
      const devIndex = component.departmentDistribution.labels.indexOf('Desarrollo');
      expect(devIndex).toBeGreaterThan(-1);  // Verifica que existe el departamento
      expect(component.departmentDistribution.data[devIndex]).toBe(2);  // Verifica que tiene 2 empleados

      // type3 (EmptyDept) no tiene empleados, no debe estar en los labels
      const emptyIndex = component.departmentDistribution.labels.indexOf('EmptyDept');
      expect(emptyIndex).toBe(-1);  // -1 significa que no se encontró
    });

    it('should return early in calculateDepartmentDistribution if data is missing', () => {
      // COBERTURA: Cubre "if (!this.personnelTypes.length || !this.personnelList.length) return;"
      
      // Caso 1: Sin tipos de personal
      component.personnelTypes = [];
      component.personnelList = mockPersonnel as Personnel[];
      component.calculateDepartmentDistribution();
      expect(component.departmentDistribution.labels.length).toBe(0);  // No debe calcular distribución

      // Caso 2: Sin lista de personal
      component.personnelTypes = mockTypes;
      component.personnelList = [];
      component.calculateDepartmentDistribution();
      expect(component.departmentDistribution.labels.length).toBe(0);  // No debe calcular distribución
    });
  });

  // GRUPO DE PRUEBAS PARA MÉTODOS AUXILIARES (HELPERS)
  describe('Helper Methods Coverage', () => {
    it('calculatePercentage should return 0 if total is 0', () => {
      // COBERTURA: Cubre el "if (total === 0) return 0" - evita división por cero
      component.departmentDistribution.total = 0;
      expect(component.calculatePercentage(10)).toBe(0);  // Cualquier porcentaje de 0 es 0
    });

    it('calculatePercentage should return correct calculation', () => {
      // Verifica cálculo normal de porcentaje
      component.departmentDistribution.total = 100;
      expect(component.calculatePercentage(50)).toBe(50);  // 50 es el 50% de 100
    });

    it('getTypeName should return name or fallback', () => {
      // Configuramos los tipos disponibles
      component.personnelTypes = mockTypes;
      
      // Verifica que encuentra un tipo existente
      expect(component.getTypeName('type1')).toBe('Desarrollo');
      
      // COBERTURA: Cubre el ternario "type ? ... : 'Sin categoría'" - cuando no encuentra el tipo
      expect(component.getTypeName('unknown_id')).toBe('Sin categoría');
    });

    it('getGradient should return fallback for unknown keys', () => {
      // COBERTURA: Cubre "|| 'linear-gradient...'" al final del método - caso por defecto
      const result = component.getGradient('unknown_key');
      expect(result).toContain('#6a11cb');  // Verifica que contiene el color del gradiente por defecto
    });

    it('getColor should return fallback for unknown keys', () => {
      // COBERTURA: Cubre "|| '#6a11cb'" al final del método - caso por defecto
      expect(component.getColor('bg-unknown')).toBe('#6a11cb');  // Color por defecto para clases desconocidas
      expect(component.getColor('bg-success')).toBe('#38ef7d');  // Color específico para clase conocida
    });
  });

  // GRUPO DE PRUEBAS PARA INTERACCIONES Y ACCIONES RÁPIDAS
  describe('Interactions and Quick Actions', () => {
    it('should execute "Agregar Empleado" action', () => {
      // Verifica que la acción "Agregar Empleado" llama al método correcto
      spyOn(component, 'openAddPersonnelModal');  // Espiamos el método
      const action = component.quickActions.find(a => a.title === 'Agregar Empleado');
      action?.action();  // Ejecutamos la acción
      expect(component.openAddPersonnelModal).toHaveBeenCalled();
    });

    it('should execute "Gestionar Vacaciones" action', () => {
      // Verifica que la acción "Gestionar Vacaciones" muestra la alerta correcta
      spyOn(component, 'showAlert');
      const action = component.quickActions.find(a => a.title === 'Gestionar Vacaciones');
      action?.action();
      expect(component.showAlert).toHaveBeenCalledWith('Gestionar vacaciones');
    });

    it('should execute "Generar Reporte" action', () => {
      // Verifica que la acción "Generar Reporte" muestra la alerta correcta
      spyOn(component, 'showAlert');
      const action = component.quickActions.find(a => a.title === 'Generar Reporte');
      action?.action();
      expect(component.showAlert).toHaveBeenCalledWith('Generar reporte');
    });

    it('showAlert should trigger window alert', () => {
      // Verifica que showAlert funciona correctamente
      spyOn(window, 'alert');  // Espiamos window.alert
      component.showAlert('Test');
      expect(window.alert).toHaveBeenCalledWith('Acción: Test (simulada)');
    });
  });

  // GRUPO DE PRUEBAS PARA INTERACCIONES CON MODALES
  describe('Modal Interactions (openAddPersonnelModal)', () => {
    it('should reload data if modal is closed with "saved"', fakeAsync(() => {
      // fakeAsync permite trabajar con promesas de manera síncrona en pruebas
      
      // Creamos un modal simulado que resuelve con "saved"
      const mockModalRef = {
        componentInstance: { personnelTypes: [] },  // Propiedades que el componente espera
        result: Promise.resolve('saved')  // Simula que el modal se cerró con "saved"
      };
      modalServiceSpy.open.and.returnValue(mockModalRef as any);
      spyOn(component, 'loadData');  // Espiamos loadData

      component.openAddPersonnelModal();
      tick(); // Procesa la promesa de manera síncrona (avanza el tiempo virtual)

      expect(component.loadData).toHaveBeenCalled();  // Debe recargar los datos
    }));

    it('should NOT reload data if modal is dismissed', fakeAsync(() => {
      // Verifica que NO recarga datos cuando el modal se descarta
      const mockModalRef = {
        componentInstance: { personnelTypes: [] },
        result: Promise.resolve('dismissed')  // Simula que el modal fue descartado
      };
      modalServiceSpy.open.and.returnValue(mockModalRef as any);
      spyOn(component, 'loadData');

      component.openAddPersonnelModal();
      tick();

      expect(component.loadData).not.toHaveBeenCalled();  // No debe recargar datos
    }));

    it('should handle rejection (catch block) without error', fakeAsync(() => {
      // Verifica que maneja correctamente el rechazo de promesas (errores)
      const mockModalRef = {
        componentInstance: { personnelTypes: [] },
        result: Promise.reject('error')  // Simula un error en el modal
      };
      modalServiceSpy.open.and.returnValue(mockModalRef as any);
      spyOn(component, 'loadData');

      // Esto simplemente verifica que no explote el test debido al rechazo de la promesa
      component.openAddPersonnelModal();
      tick();

      expect(component.loadData).not.toHaveBeenCalled();  // No debe recargar datos
    }));
  });
});
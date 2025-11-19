import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';

// Componente que vamos a probar
import { PersonnelFormComponent } from './personnel-form';

// Servicios que el componente utiliza
import { PersonnelService } from '../../../core/services/personnel';
import { AuthService } from '../../../core/services/auth';

// Interfaces que definen la estructura de datos
import { Personnel } from '../../../shared/interfaces/personnel';
import { PersonnelType } from '../../../shared/interfaces/personnel-type';

// Bloque principal de pruebas para el componente PersonnelFormComponent
describe('PersonnelFormComponent', () => {
  // Variables fundamentales para las pruebas
  let component: PersonnelFormComponent; // Instancia del componente a probar
  let fixture: ComponentFixture<PersonnelFormComponent>; // Entorno de prueba del componente

  // Objetos simulados (spies) que nos permiten controlar y verificar el comportamiento de los servicios
  let activeModalSpy: jasmine.SpyObj<NgbActiveModal>; // Modal que se cierra o descarta
  let personnelServiceSpy: jasmine.SpyObj<PersonnelService>; // Servicio para crear/actualizar personal
  let authServiceSpy: jasmine.SpyObj<AuthService>; // Servicio de autenticación

  // Datos de prueba simulados - representan tipos de personal
  const mockPersonnelType: PersonnelType = {
    _id: 'type1',
    name: 'Cocinero',
    description: 'Cocina',
    isActive: true,
    createdBy: 'admin',
    createdAt: '2023-01-01',
    updatedAt_: '2023-01-01'
  };

  // Datos de prueba simulados - representan una persona del personal
  const mockPersonnel: Personnel = {
    _id: 'p1',
    firstName: 'Juan',
    lastName: 'Perez',
    email: 'juan@test.com',
    phone: '1234567890',
    personnelType: 'type1',
    status: 'disponible',
    skills: ['Cocina'],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Configuración que se ejecuta antes de cada prueba individual
  beforeEach(async () => {
    // Crear objetos simulados (spies) para los servicios
    // Estos spies nos permiten "espiar" las llamadas a los métodos y controlar sus respuestas
    const modalSpy = jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']);
    const pServiceSpy = jasmine.createSpyObj('PersonnelService', ['createPersonnel', 'updatePersonnel']);
    const aServiceSpy = jasmine.createSpyObj('AuthService', ['getUserId']);

    // Configurar el módulo de testing de Angular con todas las dependencias necesarias
    await TestBed.configureTestingModule({
      declarations: [PersonnelFormComponent], // Componente bajo prueba
      imports: [ReactiveFormsModule, FormsModule], // Módulos necesarios para formularios
      providers: [
        // Proporcionar los servicios simulados en lugar de los reales
        { provide: NgbActiveModal, useValue: modalSpy },
        { provide: PersonnelService, useValue: pServiceSpy },
        { provide: AuthService, useValue: aServiceSpy }
      ]
    })
    .compileComponents(); // Compilar el componente y su template

    // Obtener las instancias de los servicios simulados después de configurar el módulo
    activeModalSpy = TestBed.inject(NgbActiveModal) as jasmine.SpyObj<NgbActiveModal>;
    personnelServiceSpy = TestBed.inject(PersonnelService) as jasmine.SpyObj<PersonnelService>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Configurar comportamiento por defecto del servicio de autenticación
    authServiceSpy.getUserId.and.returnValue('user123');

    // Crear el componente dentro del entorno de prueba
    fixture = TestBed.createComponent(PersonnelFormComponent);
    component = fixture.componentInstance;
    
    // Configurar datos iniciales que el componente necesita
    component.personnelTypes = [mockPersonnelType];
  });

  // Prueba básica: verificar que el componente se crea exitosamente
  it('should create', () => {
    fixture.detectChanges(); // Disparar detección de cambios inicial
    expect(component).toBeTruthy(); // Verificar que el componente existe
  });

  // =================================================
  // BLOQUE 1: PRUEBAS DE INICIALIZACIÓN
  // =================================================
  describe('Initialization', () => {
    
    // Prueba: el formulario debe inicializarse vacío en modo "Crear"
    it('should initialize form empty in Create Mode', () => {
      fixture.detectChanges(); // Disparar ngOnInit()
      // Verificar que el campo firstName está vacío (modo creación)
      expect(component.personnelForm.get('firstName')?.value).toBe('');
    });

    // Prueba: el formulario debe cargar datos existentes en modo "Editar"
    it('should initialize form with values in Edit Mode', () => {
      // Configurar el componente con datos existentes (modo edición)
      component.personnel = mockPersonnel;
      fixture.detectChanges(); // Disparar ngOnInit()
      // Verificar que el campo firstName contiene el valor del personal mock
      expect(component.personnelForm.get('firstName')?.value).toBe(mockPersonnel.firstName);
    });

    // Prueba: manejo de campos opcionales cuando vienen como undefined
    it('should handle undefined phone and skills using default values', () => {
      // Crear datos incompletos (campos opcionales sin definir)
      const incompletePersonnel: Personnel = {
        ...mockPersonnel, // Copiar todos los campos existentes
        phone: undefined, // Campo opcional sin valor
        skills: undefined // Campo opcional sin valor
      };
      
      // Configurar el componente con datos incompletos
      component.personnel = incompletePersonnel;
      fixture.detectChanges(); // Disparar ngOnInit()

      // Verificar que los campos undefined se inicializan con valores por defecto
      expect(component.personnelForm.get('phone')?.value).toBe(''); // String vacío para teléfono
      expect(component.personnelForm.get('skills')?.value).toEqual([]); // Array vacío para habilidades
    });

    // Prueba: cuando personnelType viene como objeto completo (populado)
    it('should handle personnelType as populated object', () => {
      // Crear datos donde personnelType es un objeto completo, no solo el ID
      const populatedPersonnel = { 
        ...mockPersonnel, 
        personnelType: mockPersonnelType // Objeto completo en lugar de solo string ID
      };
      component.personnel = populatedPersonnel as any; // Type assertion para evitar errores de tipo
      fixture.detectChanges(); // Disparar ngOnInit()

      // Verificar que se extrae correctamente el nombre del tipo
      expect(component.currentTypeName).toBe('Cocinero');
    });

    // Prueba: cuando el ID de personnelType no existe en la lista de tipos
    it('should set "Sin categoría" if personnelType ID is not found', () => {
      // Configurar con un ID que no existe en personnelTypes
      component.personnel = { ...mockPersonnel, personnelType: 'id-no-existente' };
      fixture.detectChanges(); // Disparar ngOnInit()
      // Verificar que se usa el texto "Sin categoría" como valor por defecto
      expect(component.currentTypeName).toBe('Sin categoría');
    });
  });

  // =================================================
  // BLOQUE 2: PRUEBAS DE LÓGICA DE INTERFAZ DE USUARIO
  // =================================================
  describe('UI Logic', () => {
    // Configuración que se ejecuta antes de cada prueba en este bloque
    beforeEach(() => fixture.detectChanges());

    // Prueba: cambio de tipo de personal actualiza el nombre correctamente
    it('onTypeChange should update name correctly', () => {
      // Simular evento de cambio en el select con un ID válido
      const event = { target: { value: 'type1' } };
      component.onTypeChange(event);
      // Verificar que el nombre se actualiza según el tipo seleccionado
      expect(component.currentTypeName).toBe('Cocinero');
    });

    // Prueba: cuando se selecciona un ID de tipo que no existe
    it('onTypeChange should set "Sin categoría" if ID not found', () => {
      // Simular evento de cambio con un ID que no existe
      const event = { target: { value: '999' } };
      component.onTypeChange(event);
      // Verificar que se establece "Sin categoría" para IDs no encontrados
      expect(component.currentTypeName).toBe('Sin categoría');
    });

    // Grupo de pruebas para el manejo de habilidades (skills)
    // Prueba: agregar una habilidad válida y única
    it('addSkill should add valid unique skill', () => {
      // Configurar nueva habilidad a agregar
      component.newSkill = 'Limpieza';
      component.addSkill();
      // Verificar que la habilidad se agregó al formulario
      expect(component.personnelForm.get('skills')?.value).toContain('Limpieza');
      // Verificar que el campo newSkill se limpia después de agregar
      expect(component.newSkill).toBe('');
    });

    // Prueba: no agregar habilidades vacías o con solo espacios
    it('addSkill should ignore empty or whitespace skill', () => {
      // Configurar habilidad con solo espacios en blanco
      component.newSkill = '   ';
      component.addSkill();
      // Verificar que no se agregó ninguna habilidad (array permanece vacío)
      expect(component.personnelForm.get('skills')?.value.length).toBe(0);
    });

    // Prueba: no agregar habilidades duplicadas
    it('addSkill should ignore duplicate skill', () => {
      // Configurar habilidades existentes
      component.personnelForm.patchValue({ skills: ['Cocina'] });
      // Intentar agregar la misma habilidad otra vez
      component.newSkill = 'Cocina';
      component.addSkill();
      // Verificar que no se duplicó la habilidad (sigue habiendo solo una)
      expect(component.personnelForm.get('skills')?.value.length).toBe(1);
    });

    // Prueba: eliminar una habilidad específica
    it('removeSkill should filter out the skill', () => {
      // Configurar múltiples habilidades
      component.personnelForm.patchValue({ skills: ['A', 'B'] });
      // Eliminar una habilidad específica
      component.removeSkill('A');
      // Verificar que solo queda la habilidad 'B'
      expect(component.personnelForm.get('skills')?.value).toEqual(['B']);
    });
  });

  // =================================================
  // BLOQUE 3: PRUEBAS DE GUARDADO (Casos de éxito y error)
  // =================================================
  describe('savePersonnel', () => {
    
    // Prueba: no guardar cuando el formulario es inválido
    it('should NOT call service and mark controls as touched if form is invalid', () => {
      fixture.detectChanges();
      // Intentar guardar con formulario vacío (inválido)
      component.savePersonnel();

      // Verificar que NO se llamó a los servicios de guardado
      expect(personnelServiceSpy.createPersonnel).not.toHaveBeenCalled();
      expect(personnelServiceSpy.updatePersonnel).not.toHaveBeenCalled();
      // Verificar que los campos requeridos se marcaron como "touched" para mostrar errores
      expect(component.personnelForm.controls['firstName'].touched).toBeTrue();
    });

    // Prueba CORREGIDA: guardar exitosamente en modo "Crear"
    it('should call createPersonnel in Create Mode', () => {
      fixture.detectChanges();
      // Configurar el servicio para devolver una respuesta exitosa
      personnelServiceSpy.createPersonnel.and.returnValue(of({} as Personnel));

      // Llenar el formulario con datos válidos
      component.personnelForm.patchValue({
        firstName: 'A', lastName: 'B', email: 'a@b.com', personnelType: 'type1', status: 'disponible'
      });

      // Ejecutar el guardado
      component.savePersonnel();

      // NOTA IMPORTANTE SOBRE EL COMPORTAMIENTO DE isSaving:
      // - isSaving se establece en true al inicio de savePersonnel()
      // - Como usamos 'of()' que es síncrono, la respuesta llega inmediatamente
      // - En el bloque 'next' del Observable, isSaving se establece en false
      // - Por lo tanto, al llegar a esta línea, isSaving ya es false
      expect(component.isSaving).toBeFalse(); 
      
      // Verificar que se llamó al servicio de creación
      expect(personnelServiceSpy.createPersonnel).toHaveBeenCalled();
      // Verificar que el modal se cerró con el mensaje 'saved'
      expect(activeModalSpy.close).toHaveBeenCalledWith('saved');
    });

    // Prueba: guardar exitosamente en modo "Editar"
    it('should call updatePersonnel in Edit Mode', () => {
      // Configurar el componente en modo edición
      component.personnel = mockPersonnel;
      fixture.detectChanges();
      // Configurar el servicio para devolver respuesta exitosa
      personnelServiceSpy.updatePersonnel.and.returnValue(of({} as Personnel));

      // Hacer un cambio válido en el formulario
      component.personnelForm.patchValue({ firstName: 'Updated' });

      // Ejecutar el guardado
      component.savePersonnel();

      // Verificar que isSaving volvió a false (mismo comportamiento síncrono)
      expect(component.isSaving).toBeFalse();
      // Verificar que se llamó al servicio de actualización
      expect(personnelServiceSpy.updatePersonnel).toHaveBeenCalled();
      // Verificar que el modal se cerró con el mensaje 'saved'
      expect(activeModalSpy.close).toHaveBeenCalledWith('saved');
    });

    // Prueba: manejo de error al crear personal
    it('should handle error when creating personnel', () => {
      fixture.detectChanges();
      // Configurar el servicio para devolver un error
      personnelServiceSpy.createPersonnel.and.returnValue(throwError(() => new Error('API Error')));
      // Espiar console.error para evitar ruido en consola y verificar que se llama
      spyOn(console, 'error');

      // Llenar el formulario con datos válidos
      component.personnelForm.patchValue({
        firstName: 'A', lastName: 'B', email: 'a@b.com', personnelType: 'type1', status: 'disponible'
      });

      // Ejecutar el guardado (que fallará)
      component.savePersonnel();

      // Verificar que sí se intentó llamar al servicio
      expect(personnelServiceSpy.createPersonnel).toHaveBeenCalled();
      // Verificar que isSaving se estableció en false después del error
      expect(component.isSaving).toBeFalse();
      // Verificar que se registró el error en consola
      expect(console.error).toHaveBeenCalledWith('Error creating personnel:', jasmine.any(Error));
      // Verificar que el modal NO se cerró (porque hubo error)
      expect(activeModalSpy.close).not.toHaveBeenCalled();
    });

    // Prueba: manejo de error al actualizar personal
    it('should handle error when updating personnel', () => {
      // Configurar el componente en modo edición
      component.personnel = mockPersonnel;
      fixture.detectChanges();
      // Configurar el servicio para devolver un error
      personnelServiceSpy.updatePersonnel.and.returnValue(throwError(() => new Error('Update Fail')));
      // Espiar console.error
      spyOn(console, 'error');

      // Hacer un cambio válido
      component.personnelForm.patchValue({ firstName: 'Valido' });

      // Ejecutar el guardado (que fallará)
      component.savePersonnel();

      // Verificar que sí se intentó llamar al servicio
      expect(personnelServiceSpy.updatePersonnel).toHaveBeenCalled();
      // Verificar que isSaving se estableció en false después del error
      expect(component.isSaving).toBeFalse();
      // Verificar que se registró el error en consola
      expect(console.error).toHaveBeenCalledWith('Error updating personnel:', jasmine.any(Error));
      // Verificar que el modal NO se cerró (porque hubo error)
      expect(activeModalSpy.close).not.toHaveBeenCalled();
    });
  });
}); 
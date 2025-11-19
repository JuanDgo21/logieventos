import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { of, throwError } from 'rxjs';

// Componente que vamos a probar
import { PersonnelTypeFormComponent } from './personnel-type-form';

// Servicios que el componente utiliza
import { PersonnelService } from '../../../core/services/personnel';
import { AuthService } from '../../../core/services/auth';

// Interfaces que definen la estructura de datos
import { PersonnelType } from '../../../shared/interfaces/personnel-type';

// Bloque principal de pruebas para el componente PersonnelTypeFormComponent
describe('PersonnelTypeFormComponent', () => {
  // Variables fundamentales para las pruebas
  let component: PersonnelTypeFormComponent; // Instancia del componente a probar
  let fixture: ComponentFixture<PersonnelTypeFormComponent>; // Entorno de prueba del componente

  // Objetos simulados (spies) que nos permiten controlar y verificar el comportamiento de los servicios
  let mockActiveModal: jasmine.SpyObj<NgbActiveModal>; // Modal que se cierra o descarta
  let mockPersonnelService: jasmine.SpyObj<PersonnelService>; // Servicio para crear/actualizar tipos de personal
  let mockAuthService: jasmine.SpyObj<AuthService>; // Servicio de autenticación

  // Datos de prueba simulados - representan un tipo de personal
  const mockPersonnelType: PersonnelType = {
    _id: '111',
    name: 'Tipo Prueba',
    description: 'Descripción Prueba',
    isActive: true,
    createdBy: 'user1',
    createdAt: '2024-01-01',
    updatedAt_: '2024-01-01'
  };

  // Configuración que se ejecuta antes de cada prueba individual
  beforeEach(async () => {
    // Crear objetos simulados (spies) para los servicios
    // Estos spies nos permiten "espiar" las llamadas a los métodos y controlar sus respuestas
    mockActiveModal = jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']);
    mockPersonnelService = jasmine.createSpyObj('PersonnelService', ['createPersonnelType', 'updatePersonnelType']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['getUserId']);

    // Configurar el módulo de testing de Angular con todas las dependencias necesarias
    await TestBed.configureTestingModule({
      declarations: [PersonnelTypeFormComponent], // Componente bajo prueba
      imports: [ReactiveFormsModule], // Módulo necesario para formularios reactivos
      providers: [
        // Proporcionar los servicios simulados en lugar de los reales
        { provide: NgbActiveModal, useValue: mockActiveModal },
        { provide: PersonnelService, useValue: mockPersonnelService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    })
    .compileComponents(); // Compilar el componente y su template

    // Crear el componente dentro del entorno de prueba
    fixture = TestBed.createComponent(PersonnelTypeFormComponent);
    component = fixture.componentInstance;
    // Disparar detección de cambios inicial que ejecuta ngOnInit()
    fixture.detectChanges();
  });

  // Prueba básica: verificar que el componente se crea exitosamente
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // =================================================
  // PRUEBAS DE INICIALIZACIÓN (ngOnInit)
  // =================================================

  // Prueba: el formulario debe inicializarse con valores por defecto en modo "Crear"
  it('should initialize form with default values when no type is provided (Create Mode)', () => {
    // Verificar que el formulario tiene los valores por defecto esperados
    // En modo creación, no se proporciona un tipo existente, por lo que los campos deben estar vacíos
    expect(component.typeForm.value).toEqual({
      name: '',           // Campo requerido, vacío por defecto
      description: '',    // Campo opcional, vacío por defecto  
      isActive: true      // Checkbox activado por defecto
    });
  });

  // Prueba: el formulario debe cargar datos existentes en modo "Editar"
  it('should initialize form with type values when type is provided (Edit Mode)', () => {
    // Configurar el componente con datos existentes (modo edición)
    component.type = mockPersonnelType;
    // Ejecutar manualmente ngOnInit() para forzar la inicialización con los datos
    component.ngOnInit(); 

    // Verificar que el formulario contiene los valores del tipo de personal mock
    expect(component.typeForm.value).toEqual({
      name: mockPersonnelType.name,           // Debe cargar el nombre existente
      description: mockPersonnelType.description, // Debe cargar la descripción existente
      isActive: mockPersonnelType.isActive    // Debe cargar el estado activo/inactivo
    });
  });

  // Prueba: manejo de descripciones nulas o undefined (caso borde)
  it('should handle null/undefined description in ngOnInit (Covering || "" branch)', () => {
    // Crear un tipo de personal sin descripción (undefined)
    // Esto prueba el caso donde la descripción podría no estar definida
    const typeWithNoDesc = { 
      ...mockPersonnelType,  // Copiar todas las propiedades existentes
      description: undefined // Sobrescribir descripción como undefined
    } as unknown as PersonnelType; // Type assertion para evitar errores de TypeScript

    // Configurar el componente con el tipo sin descripción
    component.type = typeWithNoDesc;
    // Ejecutar la inicialización
    component.ngOnInit();

    // Verificar que la descripción se inicializa como string vacío en lugar de undefined
    // Esto prueba que el componente maneja correctamente valores undefined usando el operador ||
    expect(component.typeForm.get('description')?.value).toBe('');
  });

  // =================================================
  // PRUEBAS DE GUARDADO (saveType)
  // =================================================
  describe('saveType', () => {
    // Prueba: no debe proceder con el guardado si el formulario es inválido
    it('should not proceed if form is invalid', () => {
      // Establecer valores inválidos en el formulario (nombre vacío - campo requerido)
      component.typeForm.setValue({
        name: '', // INVÁLIDO: campo requerido está vacío
        description: '',
        isActive: true
      });

      // Intentar guardar (debería fallar por validación)
      component.saveType();

      // Verificar que el estado de guardado no se activa
      expect(component.isSaving).toBeFalse();
      // Verificar que NO se consulta el ID de usuario (porque no se llegó a esa parte del código)
      expect(mockAuthService.getUserId).not.toHaveBeenCalled();
      // El modal NO debe cerrarse porque el formulario es inválido
    });

    // Prueba: debe descartar el modal si no hay usuario autenticado
    it('should dismiss modal if no user is authenticated', () => {
      // Establecer valores válidos en el formulario
      component.typeForm.setValue({
        name: 'Valid Name', // Campo requerido con valor válido
        description: 'Desc',
        isActive: true
      });
      // Configurar el servicio de autenticación para devolver null (usuario no autenticado)
      mockAuthService.getUserId.and.returnValue(null);

      // Intentar guardar
      component.saveType();

      // Verificar que el modal se descarta (no se cierra con éxito)
      expect(mockActiveModal.dismiss).toHaveBeenCalled();
      // Verificar que el estado de guardado se mantiene en false
      expect(component.isSaving).toBeFalse();
    });

    // =================================================
    // ESCENARIOS DE CREACIÓN (CREATE)
    // =================================================

    // Prueba: crear un nuevo tipo exitosamente (camino feliz)
    it('should call createPersonnelType when creating a new type (Happy Path)', () => {
      // Establecer valores válidos para el nuevo tipo
      const formValue = { name: 'New Type', description: 'New Desc', isActive: true };
      component.typeForm.setValue(formValue);
      // Configurar usuario autenticado
      mockAuthService.getUserId.and.returnValue('user123');
      
      // Configurar el servicio para devolver una respuesta exitosa síncrona
      // of() crea un Observable que emite inmediatamente el valor
      mockPersonnelService.createPersonnelType.and.returnValue(of({ ...mockPersonnelType, ...formValue }));

      // Ejecutar el guardado
      component.saveType();

      // VERIFICACIONES:
      // 1. Verificar que se llamó al servicio de creación con los parámetros correctos
      expect(mockPersonnelService.createPersonnelType).toHaveBeenCalledWith(jasmine.objectContaining({
        name: 'New Type',
        createdBy: 'user123' // Debe incluir el ID del usuario que crea
      }));
      // 2. NOTA IMPORTANTE SOBRE isSaving:
      // - isSaving se establece en true al inicio de saveType()
      // - Como el Observable 'of()' es síncrono, la respuesta llega inmediatamente
      // - En el bloque 'next' del Observable, isSaving se establece en false
      // - Por lo tanto, al llegar a esta línea, isSaving ya debe ser false
      expect(component.isSaving).toBeFalse();
      // 3. Verificar que el modal se cierra con el mensaje 'saved'
      expect(mockActiveModal.close).toHaveBeenCalledWith('saved');
    });

    // Prueba: manejo de error al crear un nuevo tipo
    it('should handle error when createPersonnelType fails', () => {
      // Establecer valores válidos en el formulario
      component.typeForm.setValue({ name: 'Test', description: 'Test', isActive: true });
      // Configurar usuario autenticado
      mockAuthService.getUserId.and.returnValue('user123');
      
      // Configurar el servicio para devolver un error
      // throwError() crea un Observable que emite un error inmediatamente
      mockPersonnelService.createPersonnelType.and.returnValue(throwError(() => new Error('API Error')));

      // Ejecutar el guardado (que fallará)
      component.saveType();

      // VERIFICACIONES:
      // 1. Verificar que SÍ se intentó llamar al servicio (aunque falló)
      expect(mockPersonnelService.createPersonnelType).toHaveBeenCalled();
      // 2. Verificar que isSaving se restablece a false después del error
      expect(component.isSaving).toBeFalse();
      // 3. Verificar que el modal NO se cierra (porque hubo error)
      expect(mockActiveModal.close).not.toHaveBeenCalled();
    });

    // =================================================
    // ESCENARIOS DE ACTUALIZACIÓN (UPDATE)
    // =================================================

    // Prueba: actualizar un tipo existente exitosamente (camino feliz)
    it('should call updatePersonnelType when editing an existing type (Happy Path)', () => {
      // Configurar el componente en modo edición con datos existentes
      component.type = mockPersonnelType;
      // Ejecutar ngOnInit() para cargar los datos existentes en el formulario
      component.ngOnInit();
      // Modificar un valor en el formulario (simulando edición del usuario)
      component.typeForm.patchValue({ name: 'Updated Name' });
      
      // Configurar usuario autenticado
      mockAuthService.getUserId.and.returnValue('user123');
      // Configurar el servicio para devolver respuesta exitosa
      mockPersonnelService.updatePersonnelType.and.returnValue(of(mockPersonnelType));

      // Ejecutar el guardado
      component.saveType();

      // VERIFICACIONES:
      // 1. Verificar que se llamó al servicio de actualización con los parámetros correctos
      expect(mockPersonnelService.updatePersonnelType).toHaveBeenCalledWith(
        mockPersonnelType._id, // ID del tipo a actualizar
        jasmine.objectContaining({
          _id: mockPersonnelType._id, // El ID debe incluirse en el cuerpo
          name: 'Updated Name',       // El nuevo nombre
          updatedBy: 'user123'        // El usuario que realiza la actualización
        })
      );
      // 2. Verificar que isSaving se restablece a false (caso síncrono)
      expect(component.isSaving).toBeFalse();
      // 3. Verificar que el modal se cierra con el mensaje 'saved'
      expect(mockActiveModal.close).toHaveBeenCalledWith('saved');
    });

    // Prueba: manejo de error al actualizar un tipo existente
    it('should handle error when updatePersonnelType fails (Covering error block)', () => {
      // Configurar el componente en modo edición
      component.type = mockPersonnelType;
      // Ejecutar ngOnInit() para cargar los datos existentes
      component.ngOnInit();
      
      // Configurar usuario autenticado
      mockAuthService.getUserId.and.returnValue('user123');
      
      // Configurar el servicio para devolver un error ESPECÍFICO en actualización
      // Esto cubre el bloque de código que maneja errores en actualización
      mockPersonnelService.updatePersonnelType.and.returnValue(throwError(() => new Error('Update Failed')));

      // Ejecutar el guardado (que fallará)
      component.saveType();

      // VERIFICACIONES:
      // 1. Verificar que SÍ se intentó llamar al servicio de actualización
      expect(mockPersonnelService.updatePersonnelType).toHaveBeenCalled();
      // 2. Verificar que isSaving se restablece a false en el bloque de error
      expect(component.isSaving).toBeFalse();
      // 3. Verificar que el modal NO se cierra (porque hubo error)
      expect(mockActiveModal.close).not.toHaveBeenCalled();
    });
  });
});
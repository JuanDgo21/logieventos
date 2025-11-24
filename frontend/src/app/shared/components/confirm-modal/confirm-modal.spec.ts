import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'; // Import necesario
import { ConfirmModalComponent } from './confirm-modal';

describe('ConfirmModalComponent', () => {
  let component: ConfirmModalComponent;
  let fixture: ComponentFixture<ConfirmModalComponent>;
  let activeModalSpy: jasmine.SpyObj<NgbActiveModal>;

  beforeEach(async () => {
    // 1. Creamos un mock (spy) de NgbActiveModal con los métodos que usa el componente
    activeModalSpy = jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']);

    await TestBed.configureTestingModule({
      // 2. Al ser standalone: false, el componente va en declarations
      declarations: [ConfirmModalComponent],
      // 3. Proveemos el mock en lugar del servicio real
      providers: [
        { provide: NgbActiveModal, useValue: activeModalSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should match default input values', () => {
    // Validamos que los @Input tengan sus valores por defecto
    expect(component.title).toBe('Confirmar acción');
    expect(component.message).toBe('¿Estás seguro de que deseas realizar esta acción?');
    expect(component.confirmText).toBe('Confirmar');
    expect(component.cancelText).toBe('Cancelar');
    expect(component.confirmClass).toBe('btn-primary');
    expect(component.showCloseButton).toBeTrue();
  });

  it('should call activeModal.close(true) when confirm() is called', () => {
    // Ejecutamos el método del componente
    component.confirm();

    // Verificamos que se haya llamado al método del servicio inyectado con el argumento correcto
    expect(activeModalSpy.close).toHaveBeenCalledWith(true);
  });

  it('should call activeModal.dismiss() when dismiss() is called', () => {
    // Ejecutamos el método del componente
    component.dismiss();

    // Verificamos que se haya llamado al método dismiss del servicio
    expect(activeModalSpy.dismiss).toHaveBeenCalled();
  });
});
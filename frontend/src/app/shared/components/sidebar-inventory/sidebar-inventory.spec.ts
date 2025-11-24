import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SidebarInventoryComponent } from './sidebar-inventory';
import { SidebarStateService } from '../../../core/services/sidebar-state';

describe('SidebarInventoryComponent', () => {
  let component: SidebarInventoryComponent;
  let fixture: ComponentFixture<SidebarInventoryComponent>;
  
  // Spies y Mocks
  let routerSpy: jasmine.SpyObj<Router>;
  let mockSidebarState: { isOpen: boolean };

  beforeEach(async () => {
    // 1. Mock del Router: Solo nos interesa saber si se llamó a navigate
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // 2. Mock del SidebarState: Un objeto simple es suficiente aquí
    // Inicializamos en false para verificar que el constructor lo cambie a true
    mockSidebarState = { isOpen: false };

    await TestBed.configureTestingModule({
      // Componente NO standalone va en declarations
      declarations: [SidebarInventoryComponent],
      // Proveemos los mocks en lugar de los servicios reales
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: SidebarStateService, useValue: mockSidebarState }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidebarInventoryComponent);
    component = fixture.componentInstance;
    
    // detectChanges dispara el ciclo de vida, incluyendo la ejecución del constructor 
    // (aunque el constructor técnico de JS se ejecuta al hacer createComponent)
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set sidebarState.isOpen to true on initialization', () => {
    // El constructor del componente tiene la línea:
    // this.sidebarState.isOpen = true;
    
    // Verificamos que nuestro mock haya sido modificado
    expect(mockSidebarState.isOpen).toBeTrue();
  });

  it('should navigate to the correct route when navigateTo is called', () => {
    const testRoute = 'dashboard';
    const expectedUrl = ['/dashboard'];

    // Ejecutamos el método del componente
    component.navigateTo(testRoute);

    // Verificamos que el router haya sido llamado con los argumentos correctos
    // Nota: El componente agrega una barra '/' al inicio: `/${route}`
    expect(routerSpy.navigate).toHaveBeenCalledWith(expectedUrl);
  });
});
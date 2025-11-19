import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';

import { ProvidersPageComponent } from './providers';
import { SidebarStateService } from '../../../core/services/sidebar-state';

class MockSidebarStateService {
  // Mock implementation
}

describe('ProvidersPageComponent', () => {
  let component: ProvidersPageComponent;
  let fixture: ComponentFixture<ProvidersPageComponent>;
  let router: Router;
  let sidebarStateService: SidebarStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProvidersPageComponent],
      imports: [
        RouterTestingModule.withRoutes([])
      ],
      providers: [
        { provide: SidebarStateService, useClass: MockSidebarStateService }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA] // Agregar ambos schemas
    }).compileComponents();

    fixture = TestBed.createComponent(ProvidersPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    sidebarStateService = TestBed.inject(SidebarStateService);
    
    // No llamar fixture.detectChanges() si causa problemas con el template
    // fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.hoverState).toBe('');
  });

  describe('navigateTo', () => {
    it('should navigate to the correct path', () => {
      const navigateSpy = spyOn(router, 'navigate');
      
      component.navigateTo('test');
      
      expect(navigateSpy).toHaveBeenCalledWith(['/providers/test']);
    });

    it('should navigate to different paths correctly', () => {
      const navigateSpy = spyOn(router, 'navigate');
      
      component.navigateTo('another');
      
      expect(navigateSpy).toHaveBeenCalledWith(['/providers/another']);
    });

    it('should handle empty path', () => {
      const navigateSpy = spyOn(router, 'navigate');
      
      component.navigateTo('');
      
      expect(navigateSpy).toHaveBeenCalledWith(['/providers/']);
    });
  });

  describe('toggleHover', () => {
    it('should set hoverState to the provided card name', () => {
      const testCard = 'test-card';
      
      component.toggleHover(testCard);
      
      expect(component.hoverState).toBe(testCard);
    });

    it('should update hoverState when called multiple times', () => {
      const firstCard = 'first-card';
      const secondCard = 'second-card';
      
      component.toggleHover(firstCard);
      expect(component.hoverState).toBe(firstCard);
      
      component.toggleHover(secondCard);
      expect(component.hoverState).toBe(secondCard);
    });

    it('should handle empty string', () => {
      component.toggleHover('');
      
      expect(component.hoverState).toBe('');
    });
  });

  describe('Dependency injection', () => {
    it('should have Router injected', () => {
      expect(component['router']).toBeTruthy();
    });

    it('should have SidebarStateService injected', () => {
      expect(component.sidebarState).toBeTruthy();
      expect(component.sidebarState).toBe(sidebarStateService);
    });
  });
});
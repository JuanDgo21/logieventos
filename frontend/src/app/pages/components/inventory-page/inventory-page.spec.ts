import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';

import { InventoryPageComponent } from './inventory-page';
import { SidebarStateService } from '../../../core/services/sidebar-state';

class MockSidebarStateService {
  isCollapsed = false;
}

describe('InventoryPageComponent', () => {
  let component: InventoryPageComponent;
  let fixture: ComponentFixture<InventoryPageComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InventoryPageComponent],
      imports: [RouterTestingModule.withRoutes([])],
      providers: [
        { provide: SidebarStateService, useClass: MockSidebarStateService }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryPageComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    
    // No usar fixture.detectChanges() si causa problemas con elementos del template
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty hoverState', () => {
    expect(component.hoverState).toBe('');
  });

  it('should navigate to inventory path', () => {
    const navigateSpy = spyOn(router, 'navigate');
    
    component.navigateTo('products');
    
    expect(navigateSpy).toHaveBeenCalledWith(['/inventory/products']);
  });

  it('should update hoverState on toggleHover', () => {
    component.toggleHover('test-card');
    expect(component.hoverState).toBe('test-card');
  });

  it('should have dependencies injected', () => {
    expect(component['router']).toBeTruthy();
    expect(component.sidebarState).toBeTruthy();
  });
});
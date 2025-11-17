import { TestBed } from '@angular/core/testing';
import { SidebarStateService } from './sidebar-state';

describe('SidebarStateService', () => {
  let service: SidebarStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SidebarStateService]
    });

    service = TestBed.inject(SidebarStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have isOpen = true by default', () => {
    expect(service.isOpen).toBeTrue();
  });

  it('should toggle isOpen value', () => {
    const initialState = service.isOpen;

    service.toggle();

    expect(service.isOpen).toBe(!initialState);
  });

  it('should toggle back to initial value after two toggles', () => {
    const initialState = service.isOpen;

    service.toggle(); // 1
    service.toggle(); // 2

    expect(service.isOpen).toBe(initialState);
  });
});

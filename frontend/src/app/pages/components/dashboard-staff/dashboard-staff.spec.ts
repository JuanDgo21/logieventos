import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardStaffComponent } from './dashboard-staff';

describe('DashboardStaffComponent', () => {
  let component: DashboardStaffComponent;
  let fixture: ComponentFixture<DashboardStaffComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardStaffComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardStaffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonnelTypeFormComponent } from './personnel-type-form';

describe('PersonnelTypeFormComponent', () => {
  let component: PersonnelTypeFormComponent;
  let fixture: ComponentFixture<PersonnelTypeFormComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonnelTypeFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PersonnelTypeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

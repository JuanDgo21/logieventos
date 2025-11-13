import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonnelTypeListComponent } from './personnel-type-list';

describe('PersonnelTypeListComponent', () => {
  let component: PersonnelTypeListComponent;
  let fixture: ComponentFixture<PersonnelTypeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonnelTypeListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PersonnelTypeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

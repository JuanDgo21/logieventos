import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProviderTypeComponent } from './provider-type';

describe('ProviderTypeComponent', () => {
  let component: ProviderTypeComponent;
  let fixture: ComponentFixture<ProviderTypeComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProviderTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProviderTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertModalComponent, AlertData } from './alert-modal';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

describe('AlertModalComponent', () => {
  let component: AlertModalComponent;
  let fixture: ComponentFixture<AlertModalComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AlertModalComponent>>;

  const mockData: AlertData = {
    title: 'Título de Prueba',
    message: 'Mensaje de Prueba',
    type: 'create',
    showReload: true,
    userRole: 'admin'
  };

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [AlertModalComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AlertModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct background colors', () => {
    const cases: { type: any, expected: string }[] = [
      { type: 'create', expected: 'bg-orange-500' },
      { type: 'update', expected: 'bg-blue-500' },
      { type: 'delete', expected: 'bg-red-500' },
      { type: 'auth', expected: 'bg-purple-500' },
      { type: 'unknown', expected: 'bg-gray-500' }
    ];

    cases.forEach(c => {
      component.data = { ...mockData, type: c.type };
      expect(component.bgColor).toBe(c.expected);
    });
  });

  it('should close the dialog', () => {
    component.close();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

});

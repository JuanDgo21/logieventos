import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from './alert';
import { AuthService } from './auth';
import { AlertModalComponent } from '../../shared/components/alert-modal/alert-modal';

describe('AlertService', () => {
  let service: AlertService;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    authSpy = jasmine.createSpyObj('AuthService', ['isTokenExpired']);

    TestBed.configureTestingModule({
      providers: [
        AlertService,
        { provide: MatDialog, useValue: dialogSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    });

    service = TestBed.inject(AlertService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ---------------------------------------------------------
  // showError()
  // ---------------------------------------------------------

  it('should call MatDialog.open with correct data (token NOT expired)', () => {
    authSpy.isTokenExpired.and.returnValue(false);

    service.showError({
      type: 'create',
      message: 'Hubo un error'
    });

    expect(dialogSpy.open).toHaveBeenCalledWith(AlertModalComponent, {
      width: '500px',
      disableClose: true,
      data: {
        title: 'Error al crear',
        message: 'Hubo un error',
        type: 'create',
        showReload: false
      }
    });
  });

  it('should call MatDialog.open with showReload = true when token expired', () => {
    authSpy.isTokenExpired.and.returnValue(true);

    service.showError({
      type: 'auth',
      message: 'Token expirado'
    });

    expect(dialogSpy.open).toHaveBeenCalledWith(AlertModalComponent, {
      width: '500px',
      disableClose: true,
      data: {
        title: 'Error de autenticación',
        message: 'Token expirado',
        type: 'auth',
        showReload: true
      }
    });
  });

  it('should use custom title if provided', () => {
    authSpy.isTokenExpired.and.returnValue(false);

    service.showError({
      type: 'update',
      message: 'Error actualizando',
      title: 'Título personalizado'
    });

    expect(dialogSpy.open).toHaveBeenCalledWith(AlertModalComponent, {
      width: '500px',
      disableClose: true,
      data: {
        title: 'Título personalizado',
        message: 'Error actualizando',
        type: 'update',
        showReload: false
      }
    });
  });

  // ---------------------------------------------------------
  // getDefaultTitle()
  // ---------------------------------------------------------

  it('should return default title based on type', () => {
    const getDefaultTitle = (service as any).getDefaultTitle.bind(service);

    expect(getDefaultTitle('create')).toBe('Error al crear');
    expect(getDefaultTitle('update')).toBe('Error al actualizar');
    expect(getDefaultTitle('delete')).toBe('Error al eliminar');
    expect(getDefaultTitle('auth')).toBe('Error de autenticación');
    expect(getDefaultTitle('random')).toBe('Error');
  });
});

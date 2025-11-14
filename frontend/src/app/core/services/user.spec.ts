import { TestBed } from '@angular/core/testing';
import { UserService } from './user';
import { ApiService } from './api';
import { of, throwError } from 'rxjs';
import { User } from '../../shared/interfaces/user';
import { apiRouters } from '../constants/apiRouters';
import * as jwtDecodeModule from 'jwt-decode';

describe('UserService', () => {
  let service: UserService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  const mockUser: User = {
    _id: '123',
    document: 123456789,
    fullname: 'Juan Pérez',
    username: 'juan',
    email: 'juan@example.com',
    role: 'admin',
    active: true
  };

  beforeEach(() => {
    // Crear spy del ApiService
    apiSpy = jasmine.createSpyObj('ApiService', ['getOb', 'postOb', 'putOb', 'deleteOb']);

    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });

    // Por defecto evitar que el constructor cargue usuario inicial (localStorage null)
    spyOn(localStorage, 'getItem').and.returnValue(null);

    service = TestBed.inject(UserService);
  });

  // ------------------------------
  // Helper: set jwtDecode mock and localStorage token
  // ------------------------------
  function mockTokenAndDecode(id = '123', role = 'admin') {
    (localStorage.getItem as jasmine.Spy).and.returnValue('fake.token');
    spyOn(jwtDecodeModule, 'jwtDecode').and.returnValue({ id, role } as any);
  }

  // ============================
  // getAllUsers - success & error
  // ============================
  it('getAllUsers: should return array of users', (done) => {
    apiSpy.getOb.and.returnValue(of([mockUser]));

    service.getAllUsers().subscribe(users => {
      expect(users).toEqual([mockUser]);
      expect(apiSpy.getOb).toHaveBeenCalledWith(apiRouters.USERS.BASE);
      done();
    });
  });

  it('getAllUsers: should propagate mapped error message when API fails', (done) => {
    apiSpy.getOb.and.returnValue(throwError(() => new Error('server')));

    service.getAllUsers().subscribe({
      next: () => fail('should have failed'),
      error: (err) => {
        expect(err).toBeTruthy();
        expect(err.message).toContain('No se pudieron obtener los usuarios');
        done();
      }
    });
  });

  // ============================
  // getUserById - success, invalid format, api error
  // ============================
  it('getUserById: should return user when API returns {success, data}', (done) => {
    apiSpy.getOb.and.returnValue(of({ success: true, data: mockUser }));

    service.getUserById('123').subscribe(user => {
      expect(user).toEqual(mockUser);
      expect(apiSpy.getOb).toHaveBeenCalledWith(apiRouters.USERS.BY_ID('123'));
      done();
    });
  });

  it('getUserById: should throw "Formato de respuesta inválido" when response shape is wrong', (done) => {
    apiSpy.getOb.and.returnValue(of({}));

    service.getUserById('123').subscribe({
      next: () => fail('should throw'),
      error: err => {
        expect(err).toBeTruthy();
        expect(err.message).toContain('No se pudo obtener el usuario');
        done();
      }
    });
  });

  it('getUserById: should propagate API errors', (done) => {
    apiSpy.getOb.and.returnValue(throwError(() => new Error('boom')));

    service.getUserById('123').subscribe({
      next: () => fail('should error'),
      error: err => {
        expect(err).toBeTruthy();
        done();
      }
    });
  });

  // ============================
  // createUser - success & error
  // ============================
  it('createUser: should create user and return it', (done) => {
    const newUser: Omit<User, '_id'> = {
      document: 987,
      fullname: 'Nuevo',
      username: 'nuevo',
      email: 'nuevo@example.com',
      role: 'lider',
      active: true
    };

    apiSpy.postOb.and.returnValue(of({ ...newUser, _id: '999' } as any));

    service.createUser(newUser).subscribe(res => {
      expect(res._id).toBe('999');
      expect(apiSpy.postOb).toHaveBeenCalledWith(apiRouters.USERS.BASE, newUser);
      done();
    });
  });

  it('createUser: should throw custom error when API fails', (done) => {
    apiSpy.postOb.and.returnValue(throwError(() => new Error('server fail')));

    service.createUser({} as any).subscribe({
      next: () => fail('should error'),
      error: err => {
        expect(err.message).toContain('No se pudo crear el usuario');
        done();
      }
    });
  });

  // ============================
  // updateUser - various response types & error parsing
  // ============================
  it('updateUser: should parse JSON string response', (done) => {
    const stringResp = JSON.stringify({ ok: true });
    apiSpy.putOb.and.returnValue(of(stringResp));

    service.updateUser('123', { fullname: 'X' }).subscribe(res => {
      expect(res).toEqual({ ok: true }); // parsed
      done();
    });
  });

  it('updateUser: should return raw string if it is not JSON', (done) => {
    const notJson = 'plain text';
    apiSpy.putOb.and.returnValue(of(notJson));

    service.updateUser('123', { fullname: 'X' }).subscribe(res => {
      expect(res).toBe(notJson);
      done();
    });
  });

  it('updateUser: if API errors with error.error.text JSON it should return parsed object', (done) => {
    const err = { error: { text: JSON.stringify({ parsed: true }) } };
    apiSpy.putOb.and.returnValue(throwError(() => err));

    service.updateUser('123', { fullname: 'X' }).subscribe({
      next: parsed => {
        expect(parsed).toEqual({ parsed: true });
        done();
      },
      error: () => fail('should have returned parsed object')
    });
  });

  it('updateUser: if API errors with error.error.text non-JSON it should propagate error', (done) => {
    const err = { error: { text: 'not json' } };
    apiSpy.putOb.and.returnValue(throwError(() => err));

    service.updateUser('123', { fullname: 'X' }).subscribe({
      next: () => fail('should error'),
      error: e => {
        expect(e).toBeTruthy();
        done();
      }
    });
  });

  // ============================
  // deleteUser - success & error; also clearUserData when deleting current user
  // ============================
  it('deleteUser: should call delete and return void', (done) => {
    apiSpy.deleteOb.and.returnValue(of(void 0));
    apiSpy.getOb.and.returnValue(of({ success: true, data: mockUser })); // safe for other calls

    service.deleteUser('123').subscribe(res => {
      expect(res).toBeUndefined();
      expect(apiSpy.deleteOb).toHaveBeenCalledWith(apiRouters.USERS.BY_ID('123'));
      done();
    });
  });

  it('deleteUser: if deleting current user should clear currentUserSubject', (done) => {
    // make getCurrentUserId return '123'
    mockTokenAndDecode('123', 'admin');
    // api get for BY_ID used by loadInitialUser/refreshUserData etc
    apiSpy.deleteOb.and.returnValue(of(void 0));
    apiSpy.getOb.and.returnValue(of({ success: true, data: mockUser }));

    // call loadInitialUser manually to set current user
    (service as any).loadInitialUser();

    // confirm subject is set
    service.currentUser$.subscribe(uBefore => {
      // then delete current
      apiSpy.deleteOb.calls.reset();
      service.deleteUser('123').subscribe(() => {
        service.currentUser$.subscribe(uAfter => {
          expect(uAfter).toBeNull();
          done();
        });
      });
    });
  });

  it('deleteUser: should propagate API delete error', (done) => {
    apiSpy.deleteOb.and.returnValue(throwError(() => new Error('del fail')));

    service.deleteUser('123').subscribe({
      next: () => fail('should error'),
      error: err => {
        expect(err.message).toContain('No se pudo eliminar el usuario');
        done();
      }
    });
  });

  // ============================
  // getProfile - no token & success & api error
  // ============================
  it('getProfile: should throw if no token', (done) => {
    // ensure no token
    (localStorage.getItem as jasmine.Spy).and.returnValue(null);

    service.getProfile().subscribe({
      next: () => fail('should fail'),
      error: err => {
        expect(err).toBeTruthy();
        expect(err.message).toContain('Usuario no autenticado');
        done();
      }
    });
  });

  it('getProfile: should return user when token exists and api returns object', (done) => {
    mockTokenAndDecode('123', 'admin');
    apiSpy.getOb.and.returnValue(of(mockUser)); // service handles raw user as response

    service.getProfile().subscribe(user => {
      expect(user).toEqual(mockUser);
      done();
    });
  });

  it('getProfile: should return user when api returns {success,data}', (done) => {
    mockTokenAndDecode('123', 'admin');
    apiSpy.getOb.and.returnValue(of({ success: true, data: mockUser }));

    service.getProfile().subscribe(user => {
      expect(user).toEqual(mockUser);
      done();
    });
  });

  // ============================
  // changePassword - no token & success
  // ============================
  it('changePassword: should throw if no token', (done) => {
    (localStorage.getItem as jasmine.Spy).and.returnValue(null);

    service.changePassword('a', 'b').subscribe({
      next: () => fail('should fail'),
      error: err => {
        expect(err).toBeTruthy();
        done();
      }
    });
  });

  it('changePassword: should call api when token exists', (done) => {
    mockTokenAndDecode('123', 'admin');
    apiSpy.postOb.and.returnValue(of({ success: true }));

    service.changePassword('old', 'new').subscribe(res => {
      expect(res).toEqual({ success: true });
      expect(apiSpy.postOb).toHaveBeenCalledWith(`${apiRouters.USERS.BASE}/change-password`, { oldPassword: 'old', newPassword: 'new' });
      done();
    });
  });

  // ============================
  // checkCurrentUserRole / hasRole
  // ============================
  it('checkCurrentUserRole: returns false when no token', () => {
    (localStorage.getItem as jasmine.Spy).and.returnValue(null);
    expect(service.checkCurrentUserRole('admin')).toBeFalse();
  });

  it('checkCurrentUserRole: returns true when role matches', () => {
    mockTokenAndDecode('123', 'admin');
    expect(service.checkCurrentUserRole('admin')).toBeTrue();
    expect(service.checkCurrentUserRole('lider')).toBeFalse();
  });

  it('hasRole delegates to checkCurrentUserRole', () => {
    spyOn(service, 'checkCurrentUserRole').and.returnValue(true);
    expect(service.hasRole('admin')).toBeTrue();
    expect(service.checkCurrentUserRole).toHaveBeenCalledWith('admin' as any);
  });

  // ============================
  // clearUserData & refreshUserData
  // ============================
  it('clearUserData: should set currentUser$ to null', (done) => {
    (service as any).currentUserSubject.next(mockUser);
    service.clearUserData();
    service.currentUser$.subscribe(u => {
      expect(u).toBeNull();
      done();
    });
  });

  it('refreshUserData: should call getUserById when token present and set currentUserSubject', (done) => {
    mockTokenAndDecode('123', 'admin');
    apiSpy.getOb.and.returnValue(of({ success: true, data: mockUser }));

    service.refreshUserData();

    // wait a tick for subscribe next to set subject
    setTimeout(() => {
      service.currentUser$.subscribe(u => {
        expect(u).toEqual(mockUser);
        done();
      });
    }, 0);
  });

});

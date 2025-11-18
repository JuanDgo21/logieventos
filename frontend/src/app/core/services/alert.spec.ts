// frontend\src\app\core\services\alert.spec.ts
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { AlertService } from './alert';
import { AuthService } from './auth';
import { AlertModalComponent } from '../../shared/components/alert-modal/alert-modal';

// Suite de pruebas para el servicio AlertService
// Describe agrupa todas las pruebas relacionadas con este servicio
describe('AlertService', () => {
  // Declaración de variables que usaremos en las pruebas
  let service: AlertService; // Instancia del servicio que vamos a probar
  let dialogSpy: jasmine.SpyObj<MatDialog>; // Objeto espía para simular el diálogo
  let authSpy: jasmine.SpyObj<AuthService>; // Objeto espía para simular el servicio de autenticación

  // beforeEach se ejecuta ANTES de cada prueba individual
  // Configura el entorno de prueba limpio para cada test
  beforeEach(() => {
    // Creamos objetos espía (mocks) para las dependencias del servicio
    // jasmine.createSpyObj crea objetos falsos con métodos espía
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']); // Espía para el diálogo, solo espiamos el método 'open'
    authSpy = jasmine.createSpyObj('AuthService', ['isTokenExpired']); // Espía para auth, solo espiamos 'isTokenExpired'

    // Configuramos el módulo de testing de Angular
    TestBed.configureTestingModule({
      providers: [
        AlertService, // Proveemos el servicio real que queremos probar
        { provide: MatDialog, useValue: dialogSpy }, // Reemplazamos MatDialog real por nuestro espía
        { provide: AuthService, useValue: authSpy } // Reemplazamos AuthService real por nuestro espía
      ]
    });

    // Obtenemos una instancia del servicio desde el TestBed
    // TestBed.inject() es la forma moderna de obtener servicios en pruebas
    service = TestBed.inject(AlertService);
  });

  // PRUEBA BÁSICA: Verificar que el servicio se crea correctamente
  it('should be created', () => {
    // expect(service).toBeTruthy() verifica que el servicio existe y no es null/undefined
    expect(service).toBeTruthy();
  });

  // =========================================================
  // PRUEBAS PARA EL MÉTODO showError()
  // =========================================================

  // Prueba 1: Comportamiento normal cuando el token NO está expirado
  it('should call MatDialog.open with correct data (token NOT expired)', () => {
    // Configuramos el espía para que simule que el token NO está expirado
    authSpy.isTokenExpired.and.returnValue(false);

    // Ejecutamos el método que queremos probar
    service.showError({
      type: 'create', // Tipo de error: creación
      message: 'Hubo un error' // Mensaje de error personalizado
    });

    // VERIFICACIÓN: Comprobamos que se llamó al método open del diálogo con los parámetros correctos
    expect(dialogSpy.open).toHaveBeenCalledWith(AlertModalComponent, {
      width: '500px', // Ancho del diálogo
      disableClose: true, // No permite cerrar haciendo clic fuera del diálogo
      data: { // Datos que se pasan al componente del diálogo
        title: 'Error al crear', // Título automático basado en el tipo
        message: 'Hubo un error', // Mensaje que pasamos
        type: 'create', // Tipo de error
        showReload: false // NO mostrar botón de recarga (token no expirado)
      }
    });
  });

  // Prueba 2: Comportamiento cuando el token SÍ está expirado
  it('should call MatDialog.open with showReload = true when token expired', () => {
    // Configuramos el espía para que simule que el token SÍ está expirado
    authSpy.isTokenExpired.and.returnValue(true);

    // Ejecutamos el método con un error de autenticación
    service.showError({
      type: 'auth', // Tipo de error: autenticación
      message: 'Token expirado' // Mensaje específico
    });

    // VERIFICACIÓN: Comprobamos que showReload sea TRUE cuando el token expira
    expect(dialogSpy.open).toHaveBeenCalledWith(AlertModalComponent, {
      width: '500px',
      disableClose: true,
      data: {
        title: 'Error de autenticación',
        message: 'Token expirado',
        type: 'auth',
        showReload: true // IMPORTANTE: Muestra botón de recarga cuando el token expira
      }
    });
  });

  // Prueba 3: Comportamiento cuando se proporciona un título personalizado
  it('should use custom title if provided', () => {
    authSpy.isTokenExpired.and.returnValue(false);

    // Ejecutamos el método con un título personalizado
    service.showError({
      type: 'update',
      message: 'Error actualizando',
      title: 'Título personalizado' // Título personalizado (sobrescribe el automático)
    });

    // VERIFICACIÓN: Comprobamos que usa el título personalizado en lugar del automático
    expect(dialogSpy.open).toHaveBeenCalledWith(AlertModalComponent, {
      width: '500px',
      disableClose: true,
      data: {
        title: 'Título personalizado', // Usa el título personalizado
        message: 'Error actualizando',
        type: 'update',
        showReload: false
      }
    });
  });

  // =========================================================
  // PRUEBAS PARA EL MÉTODO PRIVADO getDefaultTitle()
  // =========================================================

  // Prueba para el método privado getDefaultTitle
  // Nota: En TypeScript normalmente no podemos acceder a métodos privados
  // pero en pruebas a veces se hace mediante "any" para evitar las restricciones
  it('should return default title based on type', () => {
    // Accedemos al método privado getDefaultTitle
    // "(service as any)" es un truco para evitar las restricciones de TypeScript
    const getDefaultTitle = (service as any).getDefaultTitle.bind(service);

    // Probamos varios casos para verificar que devuelve los títulos correctos
    expect(getDefaultTitle('create')).toBe('Error al crear');
    expect(getDefaultTitle('update')).toBe('Error al actualizar');
    expect(getDefaultTitle('delete')).toBe('Error al eliminar');
    expect(getDefaultTitle('auth')).toBe('Error de autenticación');
    expect(getDefaultTitle('random')).toBe('Error'); // Caso por defecto para tipos desconocidos
  });
});
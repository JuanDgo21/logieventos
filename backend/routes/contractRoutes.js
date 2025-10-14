// Importación de dependencias necesarias
const express = require('express');
const router = express.Router();

// Importación del controlador de contratos y middlewares de autenticación
const contractController = require('../controllers/contractControllers');
const { authJwt, role } = require('../middlewares');

/*
 * RUTAS CON ACCESO RESTRINGIDO
 * Estas rutas requieren autenticación y roles específicos
 */

// Obtener todos los contratos (accesible para admin, coordinador y líder)
router.get('/', 
  [authJwt.verifyToken, role.checkRole(['admin', 'coordinador', 'lider'])],  // Middlewares: token válido + rol requerido
  contractController.getAllContracts  // Controlador que maneja la lógica
);

router.get('/count-by-status', 
  [authJwt.verifyToken, role.checkRole(['admin', 'coordinador', 'lider'])], 
  contractController.getCountByStatus
);

router.get('/search', 
  [authJwt.verifyToken, role.checkRole(['admin', 'coordinador', 'lider'])], 
  contractController.searchContractsByName
);

// Obtener un contrato específico por ID (accesible para admin, coordinador y líder)
router.get('/:id', 
  [authJwt.verifyToken, role.checkRole(['admin', 'coordinador', 'lider'])], 
  contractController.getContractById
);

// Generar reporte de un contrato (accesible para admin, coordinador y líder)
router.get('/:id/report', 
  [authJwt.verifyToken, role.checkRole(['admin', 'coordinador', 'lider'])], 
  contractController.generateContractReport
);



/*
 * RUTAS CON MAYOR RESTRICCIÓN
 * Estas rutas tienen permisos más estrictos
 */

// Crear nuevo contrato (solo admin y coordinador)
router.post('/', 
  [authJwt.verifyToken, role.checkRole(['admin', 'coordinador'])],  // Roles con permiso para crear
  contractController.createContract
);

// Actualizar contrato existente (solo admin y coordinador)
router.put('/:id', 
  [authJwt.verifyToken, role.checkRole(['admin', 'coordinador'])], 
  contractController.updateContract
);

// Eliminar contrato (solo admin)
router.delete('/:id', 
  [authJwt.verifyToken, role.isAdmin],  // Middleware especial que verifica solo rol admin
  contractController.deleteContract
);

// Exportar el router configurado
module.exports = router;
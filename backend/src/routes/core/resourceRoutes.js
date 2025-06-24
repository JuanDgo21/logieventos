const express = require('express');
const router = express.Router();
const resourceController = require('../../controllers/core/resourceController');
const { authenticate, authorize } = require('../../middlewares/auth');

// Middleware de autenticación (global para todas las rutas)
router.use(authenticate);

// 🔥 Corrige los nombres de las funciones del controlador para que coincidan
router.get('/', authorize(['admin', 'coordinador', 'lider']), resourceController.getAllRecursos); // ✔️ Cambiado a getAllRecursos
router.get('/available', authorize(['admin', 'coordinador', 'lider']), resourceController.getRecursosDisponibles); // ✔️ Cambiado a getRecursosDisponibles
router.get('/:id', authorize(['admin', 'coordinador', 'lider']), resourceController.getRecursoById); // ✔️ Cambiado a getRecursoById
router.post('/', authorize(['admin', 'coordinador']), resourceController.createRecurso); // ✔️ Cambiado a createRecurso
router.put('/:id', authorize(['admin', 'coordinador']), resourceController.updateRecurso); // ✔️ Cambiado a updateRecurso
router.delete('/:id', authorize(['admin']), resourceController.deleteRecurso); // ✔️ Cambiado a deleteRecurso

// 🔥 Si no existen estas funciones, comenta las rutas o impleméntalas:
// router.post('/:id/assign', authorize(['admin', 'coordinador']), resourceController.assignToEvent); // ❌ Falta implementar
// router.post('/:id/release', authorize(['admin', 'coordinador']), resourceController.releaseFromEvent); // ❌ Falta implementar
// router.get('/type/:typeId', authorize(['admin', 'coordinador', 'lider']), resourceController.getResourcesByType); // ❌ Falta implementar

module.exports = router;
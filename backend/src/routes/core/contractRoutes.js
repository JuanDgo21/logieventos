const express = require('express');
const router = express.Router();
const contractController = require('../../controllers/core/contractController');
const { verifyToken } = require('../../middlewares/authJwt');
const { checkRole } = require('../../middlewares/role');

// Rutas principales
router.post('/', 
  verifyToken, 
  checkRole(['admin', 'coordinador']), 
  contractController.createContract
);

router.get('/', 
  verifyToken, 
  contractController.getAllContracts
);

router.get('/:id', 
  verifyToken, 
  contractController.getContractById
);

router.put('/:id', 
  verifyToken, 
  checkRole(['admin', 'coordinador']), 
  contractController.updateContract
);

router.delete('/:id', 
  verifyToken, 
  checkRole(['admin']), 
  contractController.deleteContract
);

// Ruta especial para firma
router.post('/:id/sign', 
  verifyToken, 
  contractController.addSignature
);

module.exports = router;
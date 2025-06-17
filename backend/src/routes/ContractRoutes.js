const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const { verifyToken, checkRole } = require('../middlewares/authJwt');

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
const Contract = require('../../models/contract');
const { verifyToken, checkRole } = require('../../middlewares/authJwt');

// Crear nuevo contrato
exports.createContract = async (req, res) => {
    try {
        const { clientname, clientemail, clientphone } = req.body;
        
        // Validacion basica
        if (!clientname || !clientemail || !clientphone) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, email y telefono del cliente son obligatorios'
            });
        }

        // Verificar unicidad de nombre y email
        const existingContract = await Contract.findOne({
            $or: [
                { clientname: clientname },
                { clientemail: clientemail }
            ]
        });

        if (existingContract) {
            const conflictField = existingContract.clientname === clientname ? 'clientname' : 'clientemail';
            return res.status(409).json({
                success: false,
                message: `Ya existe un contrato con ese ${conflictField}`
            });
        }

        const newContract = new Contract({
            ...req.body,
            createdBy: req.userId
        });

        const savedContract = await newContract.save();

        res.status(201).json({
            success: true,
            message: 'Contrato creado exitosamente',
            contract: savedContract
        });

    } catch (error) {
        console.error('Error al crear contrato:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear contrato',
            error: error.message
        });
    }
};

// Obtener todos los contratos
exports.getAllContracts = async (req, res) => {
    try {
        const { startDate, endDate, clientname } = req.query;
        const filter = {};

        // Filtros opcionales
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (clientname) {
        filter.clientname = new RegExp(clientname, 'i');
    }

    const contracts = await Contract.find(filter)
        .sort({ date: -1 });

    res.status(200).json({
        success: true,
        count: contracts.length,
        data: contracts
    });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener contratos',
            error: error.message
        });
    }
};

// Obtener contrato por ID
exports.getContractById = async (req, res) => {
    try {
        const contract = await Contract.findById(req.params.id);

        if (!contract) {
            return res.status(404).json({
                success: false,
                message: 'Contrato no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: contract
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener contrato',
            error: error.message
        });
    }
};

// Actualizar contrato
exports.updateContract = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Verificar unicidad de nombre y email
        if (updates.clientname || updates.clientemail) {
            const exisiting = await Contract.findOne({
                $and: [
                    { _id: { $ne: id } },
                    { $or: 
                        [{ clientname: updates.clientname },
                        { clientemail: updates.clientemail }] }
                ]
            });

            if (exisiting) {
                const conflictField = exisiting.name === updates.clientname ? 'clientname' : 'clientemail';
                return res.status(409).json({
                    success: false,
                    message: `Ya existe un contrato con ese ${conflictField}`
                });
            }
        }

        const updatedContract = await Contract.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!updatedContract) {
            return res.status(404).json({
                success: false,
                message: 'Contrato no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Contrato actualizado exitosamente',
            contract: updatedContract
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al actualizar contrato',
            error: error.message
        });
    }
};

// Eliminar contrato
exports.deleteContract = async (req, res) => {
    try {
        const deletedContract = await Contract.findByIdAndDelete(req.params.id);

        if (!deletedContract) {
            return res.status(404).json({
                success: false,
                message: 'Contrato no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Contrato eliminado exitosamente'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al eliminar contrato',
            error: error.message
        });
    }
};

// Endpoint Registrar Firma
exports.addSignature = async (req, res) => {
    try {
        const { Signature } = req.body;

        if (!Signature) {
            return res.status(400).json({
                success: false,
                message: 'Firma es requerida'
            });
        }

        const updatedContract = await Contract.findByIdAndUpdate(
            req.params.id,
            { sign: Signature },
            { new: true, runValidators: true }
        );

        if (!updatedContract) {
            return res.status(404).json({
                success: false,
                message: 'Contrato no encontrado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Firma agregada exitosamente',
            contract: updatedContract
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al agregar firma',
            error: error.message
        });
    }
};
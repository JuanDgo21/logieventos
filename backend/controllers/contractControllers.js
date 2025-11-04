// Importación de modelos necesarios para las operaciones con contratos
const Contract = require('../models/Contract');
const Event = require('../models/Event');
const Resource = require('../models/Resource');
const Provider = require('../models/Provider');
const Personnel = require('../models/Personnel');

// Controlador para obtener todos los contratos
exports.getAllContracts = async (req, res) => {
  try {
    // Obtener parámetros de paginación (page y limit), con valores por defecto
    // parseInt ya es una forma de sanitización, así que esto está bien.
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    // Obtener total de contratos (para saber cuántas páginas hay)
    const total = await Contract.countDocuments();

    // Buscar todos los contratos y poblar las relaciones con datos específicos
    const contracts = await Contract.find()
      .sort({ createdAt: -1 })  // Ordenar por fecha de creación descendente
      // .populate('event', 'name startDate endDate')  // Datos básicos del evento
      .skip(skip)
      .limit(limit)
      .populate('resources.resource', 'name description')  // Datos de recursos
      .populate('providers.provider', 'name contactPerson')  // Datos de proveedores
      .populate('personnel.person', 'firstName lastName');  // Datos del personal

    // Respuesta exitosa con los contratos encontrados
    res.status(200).json({
      success: true,
      data: contracts,
      total,         // Total de contratos
      page,          // Página actual
      pages: Math.ceil(total / limit) // Total de páginas
    });
  } catch (error) {
    // Manejo de errores
    res.status(500).json({
      success: false,
      message: 'Error al obtener contratos',
      error: error.message
    });
  }
};

// Controlador para obtener un contrato por su ID
exports.getContractById = async (req, res) => {
  try {
    // ✅ CORRECCIÓN: Forzamos el ID a string para prevenir inyecciones
    const contract = await Contract.findById(String(req.params.id))
      // .populate('event', 'name description startDate endDate location')
      .populate('resources.resource', 'name description quantity cost')
      .populate('providers.provider', 'name contactPerson email phone')
      .populate('personnel.person', 'firstName lastName email phone');

    // Si no se encuentra el contrato
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato no encontrado'
      });
    }

    // Respuesta exitosa con el contrato encontrado
    res.status(200).json({
      success: true,
      data: contract
    });
  } catch (error) {
    // Manejo de errores
    res.status(500).json({
      success: false,
      message: 'Error al obtener contrato',
      error: error.message
    });
  }
};

exports.searchContractsByName = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El parámetro de búsqueda "name" es requerido'
      });
    }

    const contracts = await Contract.find({
      // ✅ CORRECCIÓN: Forzamos 'name' a string antes de usarlo en $regex
      name: { $regex: String(name), $options: 'i' }
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('resources.resource', 'name description quantity cost')
    .populate('providers.provider', 'name contactPerson email phone')
    .populate('personnel.person', 'firstName lastName email phone');

    res.status(200).json({
      success: true,
      data: contracts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al buscar contratos',
      error: error.message
    });
  }
};

// Obtener el conteo de contratos por estado
exports.getCountByStatus = async (req, res) => {
  try {
    let counts;

    try {
      // Esta consulta es segura, no usa input del usuario
      counts = await Contract.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]);
    } catch (aggError) {
      console.error("❌ Error durante el aggregate:", aggError);
      return res.status(500).json({
        success: false,
        message: "Fallo en la etapa de agrupamiento (aggregate)",
        error: aggError.message
      });
    }

    console.log('✅ Conteo por estado:', counts);

    const result = counts.reduce((acc, item) => {
      acc[item._id || 'desconocido'] = item.count;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error("❌ Error general:", error);
    res.status(500).json({
      success: false,
      message: "Error general al contar contratos por estado",
      error: error.message
    });
  }
};



// Controlador para crear un nuevo contrato (solo Admin y Coordinador)
exports.createContract = async (req, res) => {
  try {
    console.log('[createContract] Request body:', req.body);
    console.log('[createContract] User ID:', req.userId);
    console.log('[createContract] User Role:', req.userRole);
    // Extraer datos del cuerpo de la solicitud
    const {
      name,
      clientName,
      clientPhone,
      clientEmail,
      startDate,
      endDate,
      budget,
      status,
      terms,
      resources,
      providers,
      personnel
    } = req.body;

    // ... (Validaciones de rol omitidas) ...

    // Validar que los recursos referenciados existan
    if (resources && resources.length > 0) {
      for (const item of resources) {
        // ✅ CORRECCIÓN: Forzamos el ID a string
        const resourceExists = await Resource.findById(String(item.resource));
        if (!resourceExists) {
          return res.status(404).json({
            success: false,
            message: `El recurso con ID ${item.resource} no existe`
          });
        }
      }
    }

    // Validar que los proveedores referenciados existan
    if (providers && providers.length > 0) {
      for (const item of providers) {
        // ✅ CORRECCIÓN: Forzamos el ID a string
        const providerExists = await Provider.findById(String(item.provider));
        if (!providerExists) {
          return res.status(404).json({
            success: false,
            message: `El proveedor con ID ${item.provider} no existe`
          });
        }
      }
    }

    // Validar que el personal referenciado exista
    if (personnel && personnel.length > 0) {
      for (const item of personnel) {
        // ✅ CORRECCIÓN: Forzamos el ID a string
        const personExists = await Personnel.findById(String(item.person));
        if (!personExists) {
          return res.status(404).json({
            success: false,
            message: `El personal con ID ${item.person} no existe`
          });
        }
      }
    }

    // Crear nueva instancia de contrato con los datos recibidos
    // Esto es seguro, Mongoose sanitiza contra el Schema
    const contract = new Contract({
      name,
      clientName,
      clientPhone,
      clientEmail,
      startDate,
      endDate,
      budget,
      status,
      terms,
      resources,
      providers,
      personnel,
      createdBy: req.userId  // Registrar quién creó el contrato
    });

    // Guardar el contrato en la base de datos
    const savedContract = await contract.save();

    // Respuesta exitosa
    res.status(201).json({
      success: true,
      message: 'Contrato creado exitosamente',
      data: savedContract
    });
  } catch (error) {
    // Manejo de errores
    res.status(500).json({
      success: false,
      message: 'Error al crear contrato',
      error: error.message
    });
  }
};

// Controlador para actualizar un contrato existente
exports.updateContract = async (req, res) => {
  try {
    // Extraer datos del cuerpo de la solicitud
    const {
      name,
      clientName,
      clientPhone,
      clientEmail,
      startDate,
      endDate,
      budget,
      status,
      terms,
      resources,
      providers,
      personnel
    } = req.body;

    // Objeto para almacenar solo los campos que se van a actualizar
    const updateData = {};

    // Asignar valores solo si vienen en la solicitud
    if (name) updateData.name = name;
    if (clientName) updateData.clientName = clientName;
    if (clientPhone) updateData.clientPhone = clientPhone;
    if (clientEmail) updateData.clientEmail = clientEmail;
    if (startDate) updateData.startDate = startDate;
    if (endDate) updateData.endDate = endDate;
    if (budget) updateData.budget = budget;
    if (status) updateData.status = status;
    if (terms) updateData.terms = terms;
    if (resources && resources.length > 0) {
      updateData.resources = resources;
    }
    if (providers && providers.length > 0) {
      updateData.providers = providers;
    }
    if (personnel && personnel.length > 0) {
      updateData.personnel = personnel;
    }


    // Validar recursos referenciados (si se están actualizando)
    if (resources && resources.length > 0) {
      for (const item of resources) {
        // ✅ CORRECCIÓN: Forzamos el ID a string
        const resourceExists = await Resource.findById(String(item.resource));
        if (!resourceExists) {
          return res.status(404).json({
            success: false,
            message: `El recurso con ID ${item.resource} no existe`
          });
        }
      }
    }

    // Validar proveedores referenciados (si se están actualizando)
    if (providers && providers.length > 0) {
      for (const item of providers) {
        // ✅ CORRECCIÓN: Forzamos el ID a string
        const providerExists = await Provider.findById(String(item.provider));
        if (!providerExists) {
          return res.status(404).json({
            success: false,
            message: `El proveedor con ID ${item.provider} no existe`
          });
        }
      }
    }

    // Validar personal referenciado (si se está actualizando)
    if (personnel && personnel.length > 0) {
      for (const item of personnel) {
        // ✅ CORRECCIÓN: Forzamos el ID a string
        const personExists = await Personnel.findById(String(item.person));
        if (!personExists) {
          return res.status(404).json({
            success: false,
            message: `El personal con ID ${item.person} no existe`
          });
        }
      }
    }

    // Buscar y actualizar el contrato
    // ✅ CORRECCIÓN: Forzamos el ID a string
    const updatedContract = await Contract.findByIdAndUpdate(
      String(req.params.id),
      updateData,
      { new: true, runValidators: true }  // Opciones: devolver el documento actualizado y correr validadores
    )
      // .populate('event', 'name')
      .populate('resources.resource', 'name')
      .populate('providers.provider', 'name')
      .populate('personnel.person', 'firstName lastName');

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de fin no puede ser anterior a la fecha de inicio'
      });
    }


    // Si no se encuentra el contrato
    if (!updatedContract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato no encontrado'
      });
    }

    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Contrato actualizado exitosamente',
      data: updatedContract
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un contrato con ese nombre.'
      });
    }
    // Manejo de errores
    res.status(500).json({
      success: false,
      message: 'Error al actualizar contrato',
      error: error.message
    });
  }
};

// Controlador para eliminar un contrato (solo Admin)
exports.deleteContract = async (req, res) => {
  try {
    // Buscar y eliminar el contrato por ID
    // ✅ CORRECCIÓN: Forzamos el ID a string
    const deletedContract = await Contract.findByIdAndDelete(String(req.params.id));
    
    // Si no se encuentra el contrato
    if (!deletedContract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato no encontrado'
      });
    }
    
    // Respuesta exitosa
    res.status(200).json({
      success: true,
      message: 'Contrato eliminado correctamente'
    });
  } catch (error) {
    // Manejo de errores
    res.status(500).json({
      success: false,
      message: 'Error al eliminar contrato',
      error: error.message
    });
  }
};

// Controlador para generar un reporte detallado de un contrato
exports.generateContractReport = async (req, res) => {
  try {
    // Buscar contrato por ID y poblar todas las relaciones con datos completos
    // ✅ CORRECCIÓN: Forzamos el ID a string
    const contract = await Contract.findById(String(req.params.id))
      // .populate('event', 'name description startDate endDate location')
      .populate('resources.resource', 'name description quantity cost')
      .populate('providers.provider', 'name contactPerson email phone serviceDescription cost')
      .populate('personnel.person', 'firstName lastName email phone role hours')
      .populate('createdBy', 'username fullName');

    // Si no se encuentra el contrato
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contrato no encontrado'
      });
    }

    // Calcular total de costos de recursos
    let resourcesTotal = 0;
    if (contract.resources && contract.resources.length > 0) {
      resourcesTotal = contract.resources.reduce((sum, item) => {
        // Verificación adicional de que item.resource no es null
        return sum + (item.resource ? (item.resource.cost * item.quantity) : 0);
      }, 0);
    }

    // Calcular total de costos de proveedores
    let providersTotal = 0;
    if (contract.providers && contract.providers.length > 0) {
      providersTotal = contract.providers.reduce((sum, item) => {
        return sum + (item.cost || 0);
      }, 0);
    }

    // Calcular total de costos de personal (asumiendo $50 por hora)
    let personnelTotal = 0;
    if (contract.personnel && contract.personnel.length > 0) {
      personnelTotal = contract.personnel.reduce((sum, item) => {
        // Verificación adicional de que item.person no es null
        return sum + (item.person ? (item.hours || 0) * 50 : 0);
      }, 0);
    }

    // Estructurar el reporte con todos los datos calculados
    const report = {
      contractDetails: {
        clientName: contract.clientName,
        clientPhone: contract.clientPhone,
        clientEmail: contract.clientEmail,
        startDate: contract.startDate,
        endDate: contract.endDate,
        status: contract.status,
        terms: contract.terms,
        createdBy: contract.createdBy,
        createdAt: contract.createdAt
      },
      eventDetails: contract.event,
      resources: {
        items: contract.resources,
        total: resourcesTotal
      },
      providers: {
        items: contract.providers,
        total: providersTotal
      },
      personnel: {
        items: contract.personnel,
        total: personnelTotal
      },
      grandTotal: resourcesTotal + providersTotal + personnelTotal  // Total general
    };

    // Respuesta exitosa con el reporte generado
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    // Manejo de errores
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte',
      error: error.message
    });
  }
};
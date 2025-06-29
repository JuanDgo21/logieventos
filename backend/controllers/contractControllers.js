// Importación de modelos necesarios para las operaciones con contratos
const Contract = require('../models/Contract');
const Event = require('../models/Event');
const Resource = require('../models/Resource');
const Provider = require('../models/Provider');
const Personnel = require('../models/Personnel');

// Controlador para obtener todos los contratos
exports.getAllContracts = async (req, res) => {
  try {
    // Buscar todos los contratos y poblar las relaciones con datos específicos
    const contracts = await Contract.find()
      .populate('event', 'name startDate endDate')  // Datos básicos del evento
      .populate('resources.resource', 'name description')  // Datos de recursos
      .populate('providers.provider', 'name contactPerson')  // Datos de proveedores
      .populate('personnel.person', 'firstName lastName');  // Datos del personal

    // Respuesta exitosa con los contratos encontrados
    res.status(200).json({
      success: true,
      data: contracts
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
    // Buscar contrato por ID y poblar relaciones con más datos que en getAll
    const contract = await Contract.findById(req.params.id)
      .populate('event', 'name description startDate endDate location')
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

// Controlador para crear un nuevo contrato (solo Admin y Coordinador)
exports.createContract = async (req, res) => {
  try {
    // Extraer datos del cuerpo de la solicitud
    const {
      event,
      clientName,
      clientContact,
      clientEmail,
      startDate,
      endDate,
      totalAmount,
      terms,
      resources,
      providers,
      personnel
    } = req.body;

    // Validación especial para coordinadores (no pueden crear contratos > $10,000)
    if (req.userRole === 'coordinador' && totalAmount > 10000) {
      return res.status(403).json({
        success: false,
        message: 'Coordinadores no pueden crear contratos > $10,000'
      });
    }

    // Verificar que el evento exista
    const eventExists = await Event.findById(event);
    if (!eventExists) {
      return res.status(404).json({
        success: false,
        message: 'El evento especificado no existe'
      });
    }

    // Validar que los recursos referenciados existan
    if (resources && resources.length > 0) {
      for (const item of resources) {
        const resourceExists = await Resource.findById(item.resource);
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
        const providerExists = await Provider.findById(item.provider);
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
        const personExists = await Personnel.findById(item.person);
        if (!personExists) {
          return res.status(404).json({
            success: false,
            message: `El personal con ID ${item.person} no existe`
          });
        }
      }
    }

    // Crear nueva instancia de contrato con los datos recibidos
    const contract = new Contract({
      event,
      clientName,
      clientContact,
      clientEmail,
      startDate,
      endDate,
      totalAmount,
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
      clientName,
      clientContact,
      clientEmail,
      startDate,
      endDate,
      totalAmount,
      status,
      terms,
      resources,
      providers,
      personnel
    } = req.body;

    // Objeto para almacenar solo los campos que se van a actualizar
    const updateData = {};

    // Asignar valores solo si vienen en la solicitud
    if (clientName) updateData.clientName = clientName;
    if (clientContact) updateData.clientContact = clientContact;
    if (clientEmail) updateData.clientEmail = clientEmail;
    if (startDate) updateData.startDate = startDate;
    if (endDate) updateData.endDate = endDate;
    if (totalAmount) updateData.totalAmount = totalAmount;
    if (status) updateData.status = status;
    if (terms) updateData.terms = terms;
    if (resources) updateData.resources = resources;
    if (providers) updateData.providers = providers;
    if (personnel) updateData.personnel = personnel;

    // Validar recursos referenciados (si se están actualizando)
    if (resources && resources.length > 0) {
      for (const item of resources) {
        const resourceExists = await Resource.findById(item.resource);
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
        const providerExists = await Provider.findById(item.provider);
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
        const personExists = await Personnel.findById(item.person);
        if (!personExists) {
          return res.status(404).json({
            success: false,
            message: `El personal con ID ${item.person} no existe`
          });
        }
      }
    }

    // Buscar y actualizar el contrato
    const updatedContract = await Contract.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }  // Opciones: devolver el documento actualizado y correr validadores
    )
      .populate('event', 'name')
      .populate('resources.resource', 'name')
      .populate('providers.provider', 'name')
      .populate('personnel.person', 'firstName lastName');

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
    const deletedContract = await Contract.findByIdAndDelete(req.params.id);
    
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
    const contract = await Contract.findById(req.params.id)
      .populate('event', 'name description startDate endDate location')
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
        return sum + (item.resource.cost * item.quantity);
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
        return sum + (item.hours || 0) * 50;
      }, 0);
    }

    // Estructurar el reporte con todos los datos calculados
    const report = {
      contractDetails: {
        clientName: contract.clientName,
        clientContact: contract.clientContact,
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